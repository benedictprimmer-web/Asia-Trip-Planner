import { differenceInDays, addDays, parseISO } from 'date-fns';
import { getStopDays, nightsCount } from './climateUtils';

/**
 * Convert a rating string to a numeric score.
 * excellent=4, good=3, fair=2, poor=1, null/unknown=2
 */
export function scoreRating(rating) {
  switch (rating) {
    case 'excellent': return 4;
    case 'good': return 3;
    case 'fair': return 2;
    case 'poor': return 1;
    default: return 2;
  }
}

/**
 * Calculate overall trip weather score weighted by nights per stop.
 * Uses worst-month rating for multi-month stops.
 * Returns { score: 0-100, counts: { excellent, good, fair, poor } }
 */
export function calcTripWeatherScore(stops, climateDb) {
  if (!stops || stops.length === 0 || !climateDb) {
    return { score: 0, counts: { excellent: 0, good: 0, fair: 0, poor: 0 } };
  }

  let totalNights = 0;
  let weightedScore = 0;
  const counts = { excellent: 0, good: 0, fair: 0, poor: 0 };

  for (const stop of stops) {
    const nights = nightsCount(stop.arrivalDate, stop.departureDate);
    const days = getStopDays(stop);
    const months = [...new Set(days.map(d => parseInt(d.split('-')[1], 10)))];
    const cityData = climateDb[stop.cityName]?.monthly || [];

    let worstScore = 4;
    let worstRating = 'excellent';

    for (const month of months) {
      const monthData = cityData.find(m => m.month === month);
      if (monthData) {
        const s = scoreRating(monthData.rating);
        if (s < worstScore) {
          worstScore = s;
          worstRating = monthData.rating;
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(counts, worstRating)) {
      counts[worstRating]++;
    }

    weightedScore += worstScore * nights;
    totalNights += nights;
  }

  if (totalNights === 0) return { score: 0, counts };

  // Convert 1–4 scale to 0–100
  const avgScore = weightedScore / totalNights;
  const score = Math.round(((avgScore - 1) / 3) * 100);
  return { score, counts };
}

/**
 * Get verdict details for a single stop.
 * Returns { plannedMonths, worstRating, bestMonths, monthRecords }
 */
export function getStopVerdict(stop, climateDb) {
  const days = getStopDays(stop);
  const plannedMonths = [...new Set(days.map(d => parseInt(d.split('-')[1], 10)))];
  const cityData = climateDb[stop.cityName]?.monthly || [];

  let worstScore = 5;
  let worstRating = 'excellent';

  for (const month of plannedMonths) {
    const monthData = cityData.find(m => m.month === month);
    if (monthData) {
      const s = scoreRating(monthData.rating);
      if (s < worstScore) {
        worstScore = s;
        worstRating = monthData.rating;
      }
    }
  }

  const bestMonths = cityData
    .filter(m => m.rating === 'excellent' || m.rating === 'good')
    .map(m => m.month);

  const monthRecords = plannedMonths
    .map(month => cityData.find(m => m.month === month) || null)
    .filter(Boolean);

  return { plannedMonths, worstRating, bestMonths, monthRecords };
}

/**
 * Simulate starting the trip in each of 12 months and score each option.
 * Returns Array<{ startMonth: 1-12, score: 0-100, perStop: Array<{ cityName, simulatedMonth, rating }> }>
 */
export function calcBestWindowScores(stops, climateDb) {
  if (!stops || stops.length === 0 || !climateDb) return [];

  const firstArrival = parseISO(stops[0].arrivalDate);
  const results = [];

  for (let startMonth = 1; startMonth <= 12; startMonth++) {
    const simulatedStart = new Date(firstArrival.getFullYear(), startMonth - 1, 1);
    const offset = differenceInDays(simulatedStart, firstArrival);

    let totalNights = 0;
    let weightedScore = 0;
    const perStop = [];

    for (const stop of stops) {
      const nights = nightsCount(stop.arrivalDate, stop.departureDate);
      const simulatedArrival = addDays(parseISO(stop.arrivalDate), offset);
      const simulatedMonth = simulatedArrival.getMonth() + 1;

      const cityData = climateDb[stop.cityName]?.monthly || [];
      const monthData = cityData.find(m => m.month === simulatedMonth);
      const rating = monthData?.rating || null;

      perStop.push({ cityName: stop.cityName, simulatedMonth, rating });

      weightedScore += scoreRating(rating) * nights;
      totalNights += nights;
    }

    const avgScore = totalNights > 0 ? weightedScore / totalNights : 1;
    const score = Math.round(((avgScore - 1) / 3) * 100);
    results.push({ startMonth, score, perStop });
  }

  return results;
}

/**
 * Derive a crowd/cost context hint from a monthly climate record.
 * Returns { crowdLevel: 'peak'|'shoulder'|'quiet', crowdLabel: string } or null.
 * Priority: rainfall >= 200 always overrides to 'quiet'.
 */
export function getSeasonContext(monthRecord) {
  if (!monthRecord) return null;
  const { season, rainfall } = monthRecord;
  if (rainfall >= 200) return { crowdLevel: 'quiet', crowdLabel: '🟢 Quieter · cheaper' };
  if (season === 'dry' || season === 'winter') return { crowdLevel: 'peak', crowdLabel: '🔴 Busy · pricier' };
  if (season === 'wet' || season === 'rainy' || season === 'monsoon') return { crowdLevel: 'quiet', crowdLabel: '🟢 Quieter · cheaper' };
  return { crowdLevel: 'shoulder', crowdLabel: '🟡 Shoulder season' };
}
