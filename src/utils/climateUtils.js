/**
 * Get climate data for a city and month (1-12).
 * Returns the monthly record or null if not found.
 */
export function getClimateData(climateDb, cityName, month) {
  const city = climateDb[cityName];
  if (!city) return null;
  return city.monthly.find(m => m.month === month) || null;
}

/**
 * Get the month number from an ISO date string "YYYY-MM-DD"
 */
export function monthFromDate(isoDate) {
  if (!isoDate) return null;
  return parseInt(isoDate.split('-')[1], 10);
}

export const RATING_CONFIG = {
  excellent: {
    label: 'Excellent',
    color: '#1d4ed8',
    bg: '#dbeafe',
    emoji: '✅',
  },
  good: {
    label: 'Good',
    color: '#15803d',
    bg: '#dcfce7',
    emoji: '🟢',
  },
  fair: {
    label: 'Fair',
    color: '#92400e',
    bg: '#fef3c7',
    emoji: '🟡',
  },
  poor: {
    label: 'Avoid',
    color: '#991b1b',
    bg: '#fee2e2',
    emoji: '🔴',
  },
};

export function getRatingConfig(rating) {
  return RATING_CONFIG[rating] || RATING_CONFIG.fair;
}

/**
 * Generate a consistent color for a country name.
 */
const COUNTRY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // purple
];

const colorCache = {};

export function getCountryColor(countryName) {
  if (!colorCache[countryName]) {
    let hash = 0;
    for (let i = 0; i < countryName.length; i++) {
      hash = (hash * 31 + countryName.charCodeAt(i)) & 0xffffffff;
    }
    colorCache[countryName] = COUNTRY_COLORS[Math.abs(hash) % COUNTRY_COLORS.length];
  }
  return colorCache[countryName];
}

/**
 * Get all days a stop covers (inclusive of arrival, exclusive of departure).
 * Returns array of "YYYY-MM-DD" strings.
 */
export function getStopDays(stop) {
  const days = [];
  const arrival = new Date(stop.arrivalDate + 'T00:00:00');
  const departure = new Date(stop.departureDate + 'T00:00:00');
  const current = new Date(arrival);
  while (current < departure) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/**
 * Build a map of date -> stop for calendar rendering.
 */
export function buildDayMap(stops) {
  const map = {};
  for (const stop of stops) {
    const days = getStopDays(stop);
    for (const day of days) {
      map[day] = stop;
    }
  }
  return map;
}

/**
 * Compute number of nights between arrival and departure.
 */
export function nightsCount(arrivalDate, departureDate) {
  const a = new Date(arrivalDate + 'T00:00:00');
  const d = new Date(departureDate + 'T00:00:00');
  return Math.round((d - a) / (1000 * 60 * 60 * 24));
}
