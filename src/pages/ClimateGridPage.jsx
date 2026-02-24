import { getStopDays, monthFromDate } from '../utils/climateUtils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CELL_COLORS = {
  excellent: '#4caf50',
  good: '#26a69a',
  fair: '#ff9800',
  poor: '#f44336',
};

export default function ClimateGridPage({ stops, climateDb }) {
  if (!stops || stops.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          color: '#9ca3af',
          fontSize: 14,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌤️</div>
          <div>Add stops to your trip to see the climate grid</div>
        </div>
      </div>
    );
  }

  if (!climateDb) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9ca3af' }}>
        Loading climate data...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
        Climate Grid
      </h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>
        Month-by-month climate ratings for each stop. Highlighted months = your planned visit window.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6b7280',
                  borderBottom: '2px solid #e5e7eb',
                  minWidth: 180,
                  whiteSpace: 'nowrap',
                }}
              >
                City
              </th>
              {MONTHS.map(month => (
                <th
                  key={month}
                  style={{
                    padding: '8px 4px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#6b7280',
                    borderBottom: '2px solid #e5e7eb',
                    textAlign: 'center',
                    minWidth: 40,
                  }}
                >
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stops.map((stop, index) => {
              const monthlyData = climateDb[stop.cityName]?.monthly || [];

              const days = getStopDays(stop);
              const plannedMonths = new Set(days.map(d => monthFromDate(d)));

              return (
                <tr key={stop.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>
                      {index + 1}. {stop.cityName}
                    </span>
                    <span style={{ marginLeft: 6, fontSize: 11, color: '#9ca3af' }}>
                      {stop.countryName}
                    </span>
                  </td>

                  {MONTHS.map((month, monthIdx) => {
                    const monthNum = monthIdx + 1;
                    const monthData = monthlyData.find(m => m.month === monthNum);
                    const rating = monthData?.rating;
                    const isPlanned = plannedMonths.has(monthNum);

                    const bgColor = rating ? (CELL_COLORS[rating] || '#e5e7eb') : '#e5e7eb';

                    const tooltipParts = [];
                    if (monthData) {
                      tooltipParts.push(`${stop.cityName} — ${month}`);
                      tooltipParts.push(`${monthData.high}° / ${monthData.low}°C`);
                      if (monthData.desc) tooltipParts.push(monthData.desc);
                    } else {
                      tooltipParts.push(`${stop.cityName} — ${month}: No data`);
                    }

                    return (
                      <td
                        key={monthNum}
                        title={tooltipParts.join('\n')}
                        style={{ padding: 3, textAlign: 'center' }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 26,
                            borderRadius: 4,
                            background: bgColor,
                            margin: '0 auto',
                            boxShadow: isPlanned ? 'inset 0 0 0 2px white' : 'none',
                            outline: isPlanned ? '2px solid #1d4ed8' : 'none',
                            outlineOffset: 1,
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, alignItems: 'center' }}>
        {[
          { label: 'Excellent', color: '#4caf50' },
          { label: 'Good', color: '#26a69a' },
          { label: 'Fair', color: '#ff9800' },
          { label: 'Poor / Avoid', color: '#f44336' },
          { label: 'No data', color: '#e5e7eb' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 16, height: 16, borderRadius: 3, background: item.color, flexShrink: 0 }} />
            <span style={{ color: '#6b7280' }}>{item.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 3,
              background: '#4caf50',
              flexShrink: 0,
              outline: '2px solid #1d4ed8',
              outlineOffset: 1,
              boxShadow: 'inset 0 0 0 2px white',
            }}
          />
          <span style={{ color: '#6b7280' }}>Planned visit month</span>
        </div>
      </div>
    </div>
  );
}
