import { getClimateData, monthFromDate, getRatingConfig } from '../utils/climateUtils';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ClimateIndicator({ cityName, arrivalDate, climateDb }) {
  if (!climateDb || !cityName || !arrivalDate) return null;

  const month = monthFromDate(arrivalDate);
  if (!month) return null;

  const data = getClimateData(climateDb, cityName, month);
  if (!data) return null;

  const config = getRatingConfig(data.rating);

  // Compute best months hint for fair/poor ratings
  let betterHint = null;
  if (data.rating === 'fair' || data.rating === 'poor') {
    const cityData = climateDb[cityName]?.monthly || [];
    const bestMonths = cityData
      .filter(m => m.rating === 'excellent' || m.rating === 'good')
      .map(m => m.month)
      .slice(0, 6);

    if (bestMonths.length > 0) {
      betterHint = (
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
          💡 Better: {bestMonths.map(m => MONTH_ABBR[m - 1]).join(' · ')}
        </div>
      );
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          🌡 {data.low}–{data.high}°C
        </span>
        <span
          title={data.desc}
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 12,
            background: config.bg,
            color: config.color,
            cursor: 'default',
            whiteSpace: 'nowrap',
          }}
        >
          {config.emoji} {config.label}
        </span>
        <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }} title={data.desc}>
          {data.desc}
        </span>
      </div>
      {betterHint}
    </div>
  );
}
