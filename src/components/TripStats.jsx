import { format, parseISO, differenceInDays } from 'date-fns';
import { nightsCount } from '../utils/climateUtils';
import { calcTripWeatherScore } from '../utils/climateOptimiser';

export default function TripStats({ stops, climateDb }) {
  if (!stops || stops.length === 0) return null;

  const firstStop = stops[0];
  const lastStop = stops[stops.length - 1];

  const totalDays = differenceInDays(
    parseISO(lastStop.departureDate),
    parseISO(firstStop.arrivalDate)
  );

  const formatDate = (d) => {
    try { return format(parseISO(d), 'd MMM'); } catch { return d; }
  };

  const startYear = format(parseISO(firstStop.arrivalDate), 'yyyy');
  const endYear = format(parseISO(lastStop.departureDate), 'yyyy');
  const yearSuffix = startYear === endYear ? ` ${endYear}` : ` ${endYear}`;
  const dateRange = `${formatDate(firstStop.arrivalDate)} – ${formatDate(lastStop.departureDate)}${yearSuffix}`;

  const countries = [...new Set(stops.map(s => s.countryName))];

  const nightsPerCountry = stops.reduce((acc, stop) => {
    const country = stop.countryName;
    const nights = nightsCount(stop.arrivalDate, stop.departureDate);
    acc[country] = (acc[country] || 0) + nights;
    return acc;
  }, {});

  // Climate fit row
  let climateRow = null;
  if (climateDb) {
    const { score, counts } = calcTripWeatherScore(stops, climateDb);
    const dotColor = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
    const countParts = [
      counts.excellent > 0 && `${counts.excellent}✅`,
      counts.good > 0 && `${counts.good}🟢`,
      counts.fair > 0 && `${counts.fair}🟡`,
      counts.poor > 0 && `${counts.poor}🔴`,
    ].filter(Boolean);

    climateRow = (
      <div style={{ color: '#374151', marginTop: 1 }}>
        <span style={{ color: '#6b7280' }}>Climate fit: </span>
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
            marginRight: 3,
            verticalAlign: 'middle',
          }}
        />
        <strong style={{ color: dotColor }}>{score}%</strong>
        {countParts.length > 0 && (
          <span style={{ color: '#9ca3af', marginLeft: 6 }}>
            · {countParts.join('  ')}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        padding: '10px 14px',
        fontSize: 12,
        lineHeight: 1.7,
      }}
    >
      <div style={{ color: '#374151' }}>
        <strong>{totalDays} days</strong>
        <span style={{ color: '#bdbdbd', margin: '0 6px' }}>•</span>
        <span style={{ color: '#6b7280' }}>{dateRange}</span>
      </div>

      <div style={{ color: '#374151', marginTop: 1 }}>
        <strong>{countries.length} {countries.length === 1 ? 'country' : 'countries'}:</strong>{' '}
        <span style={{ color: '#6b7280' }}>{countries.join(' · ')}</span>
      </div>

      <div style={{ color: '#6b7280', marginTop: 1 }}>
        {Object.entries(nightsPerCountry).map(([country, nights], i) => (
          <span key={country}>
            {i > 0 && <span style={{ margin: '0 5px', color: '#bdbdbd' }}>·</span>}
            <span style={{ color: '#374151' }}>{country}</span> {nights}n
          </span>
        ))}
      </div>

      {climateRow}
    </div>
  );
}
