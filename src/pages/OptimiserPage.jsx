import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { getStopVerdict, calcBestWindowScores, calcTripWeatherScore, getSeasonContext } from '../utils/climateOptimiser';
import { RATING_CONFIG } from '../utils/climateUtils';
import { updateStop } from '../db/index';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const RATING_ORDER = { excellent: 4, good: 3, fair: 2, poor: 1 };

function ScoreBadge({ score }) {
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
  const bg = score >= 75 ? '#dcfce7' : score >= 50 ? '#fef3c7' : '#fee2e2';
  const emoji = score >= 75 ? '🟢' : score >= 50 ? '🟡' : '🔴';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 12,
        background: bg,
        color,
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {emoji} {score}%
    </span>
  );
}

function RatingBadge({ rating }) {
  const config = RATING_CONFIG[rating] || RATING_CONFIG.fair;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        borderRadius: 10,
        background: config.bg,
        color: config.color,
        fontWeight: 600,
        fontSize: 11,
        whiteSpace: 'nowrap',
      }}
    >
      {config.emoji} {config.label}
    </span>
  );
}

function MonthPills({ months, planned }) {
  if (!months || months.length === 0) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>;
  const plannedSet = new Set(planned || []);
  const allPlanned = months.every(m => plannedSet.has(m));
  if (allPlanned) {
    return <span style={{ fontSize: 12, color: '#16a34a' }}>✅ Great timing</span>;
  }
  return (
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {months.slice(0, 6).map(m => (
        <span
          key={m}
          style={{
            padding: '1px 6px',
            borderRadius: 8,
            background: '#d1fae5',
            color: '#065f46',
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          {MONTH_ABBR[m - 1]}
        </span>
      ))}
    </span>
  );
}

function CrowdBadge({ monthRecord }) {
  const ctx = getSeasonContext(monthRecord);
  if (!ctx) return null;
  const styleMap = {
    peak:     { background: '#fee2e2', color: '#991b1b' },
    shoulder: { background: '#fef9c3', color: '#854d0e' },
    quiet:    { background: '#dcfce7', color: '#14532d' },
  };
  const s = styleMap[ctx.crowdLevel];
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', borderRadius: 10,
      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', background: s.background, color: s.color,
    }}>
      {ctx.crowdLabel}
    </span>
  );
}

function formatPlannedMonths(months) {
  if (!months || months.length === 0) return '—';
  const abbrs = months.map(m => MONTH_ABBR[m - 1]);
  if (abbrs.length === 1) return abbrs[0];
  return `${abbrs[0]}–${abbrs[abbrs.length - 1]}`;
}

export default function OptimiserPage({ stops, climateDb }) {
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [notesMap, setNotesMap] = useState(() => {
    const initial = {};
    for (const stop of (stops || [])) initial[stop.id] = stop.notes || '';
    return initial;
  });

  async function handleNotesSave(stopId) {
    await updateStop(stopId, { notes: notesMap[stopId] ?? '' });
  }

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
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌡️</div>
          <div>Add stops to your trip to use the optimiser</div>
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

  const { score: tripScore } = calcTripWeatherScore(stops, climateDb);
  const verdicts = stops.map(stop => ({ stop, ...getStopVerdict(stop, climateDb) }));
  const windowScores = calcBestWindowScores(stops, climateDb);
  const bestScore = windowScores.length > 0 ? Math.max(...windowScores.map(w => w.score)) : 0;

  const currentStartMonth = stops[0]?.arrivalDate
    ? parseISO(stops[0].arrivalDate).getMonth() + 1
    : null;

  function toggleMonth(month) {
    setExpandedMonth(prev => (prev === month ? null : month));
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24, maxWidth: 860, margin: '0 auto', width: '100%' }}>

      {/* ── Section 1: Current Plan Analysis ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
            Current Plan
          </h2>
          <ScoreBadge score={tripScore} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={thStyle}>#</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>City</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Country</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Months</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Rating</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Best months</th>
              </tr>
            </thead>
            <tbody>
              {verdicts.map(({ stop, plannedMonths, worstRating, bestMonths, monthRecords }, i) => {
                const worstRecord = monthRecords.reduce((worst, rec) => {
                  if (!worst) return rec;
                  return (RATING_ORDER[rec.rating] || 2) < (RATING_ORDER[worst.rating] || 2) ? rec : worst;
                }, null);

                return (
                  <tr key={stop.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ ...tdStyle, color: '#9ca3af', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{stop.cityName}</td>
                    <td style={{ ...tdStyle, color: '#6b7280' }}>{stop.countryName}</td>
                    <td style={{ ...tdStyle, color: '#374151' }}>{formatPlannedMonths(plannedMonths)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                        <RatingBadge rating={worstRating} />
                        <CrowdBadge monthRecord={worstRecord} />
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <MonthPills months={bestMonths} planned={plannedMonths} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Research Notes ── */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
            Research Notes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stops.map((stop, i) => (
              <div key={stop.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#e5e7eb', color: '#374151', fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{stop.cityName}</span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>{stop.countryName}</span>
                </div>
                <textarea
                  value={notesMap[stop.id] ?? ''}
                  placeholder="Add your research notes... (e.g. cherry blossom late March, book flights early)"
                  rows={2}
                  onChange={(e) => setNotesMap(prev => ({ ...prev, [stop.id]: e.target.value }))}
                  onBlur={() => handleNotesSave(stop.id)}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                    border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#374151',
                    lineHeight: 1.5, resize: 'vertical', background: '#fafafa',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 2: Best Window Finder ── */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
          Best Time to Go
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>
          Keeping your stop order and durations, we simulate starting in each month.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {windowScores.map(({ startMonth, score, perStop }) => {
            const isCurrent = startMonth === currentStartMonth;
            const isBest = score === bestScore;
            const barColor = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
            const isExpanded = expandedMonth === startMonth;

            return (
              <div key={startMonth}>
                <div
                  onClick={() => toggleMonth(startMonth)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isExpanded ? '#f9fafb' : 'transparent',
                    border: '1px solid',
                    borderColor: isExpanded ? '#e5e7eb' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  {/* Month label */}
                  <span
                    style={{
                      width: 32,
                      fontSize: 13,
                      fontWeight: isCurrent ? 700 : 400,
                      color: isCurrent ? '#1d4ed8' : '#374151',
                      flexShrink: 0,
                    }}
                  >
                    {MONTH_ABBR[startMonth - 1]}
                  </span>

                  {/* Bar */}
                  <div
                    style={{
                      flex: 1,
                      height: 18,
                      background: '#f3f4f6',
                      borderRadius: 4,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: `${score}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: 4,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>

                  {/* Score */}
                  <span
                    style={{
                      width: 38,
                      textAlign: 'right',
                      fontSize: 13,
                      fontWeight: 600,
                      color: barColor,
                      flexShrink: 0,
                    }}
                  >
                    {score}%
                  </span>

                  {/* Badges */}
                  <div style={{ width: 110, display: 'flex', gap: 4, flexShrink: 0, justifyContent: 'flex-end' }}>
                    {isBest && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '1px 6px',
                          background: '#fef3c7',
                          color: '#92400e',
                          borderRadius: 8,
                          fontWeight: 600,
                        }}
                      >
                        ⭐ Best
                      </span>
                    )}
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '1px 6px',
                          background: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: 8,
                          fontWeight: 600,
                        }}
                      >
                        ← Current
                      </span>
                    )}
                  </div>

                  {/* Expand toggle */}
                  <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {/* Per-stop breakdown */}
                {isExpanded && (
                  <div
                    style={{
                      margin: '2px 0 6px 42px',
                      padding: '10px 14px',
                      background: '#f9fafb',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {perStop.map(({ cityName, simulatedMonth, rating }, idx) => {
                      const monthRecord = climateDb[cityName]?.monthly?.find(m => m.month === simulatedMonth) ?? null;
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                            paddingBottom: idx < perStop.length - 1 ? 6 : 0,
                            borderBottom: idx < perStop.length - 1 ? '1px solid #f3f4f6' : 'none',
                          }}
                        >
                          {/* Top line */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                            <span style={{ fontWeight: 600, color: '#111827', minWidth: 100 }}>
                              {cityName}
                            </span>
                            <span style={{ color: '#9ca3af' }}>→</span>
                            <span style={{ color: '#6b7280', minWidth: 60 }}>
                              {MONTH_ABBR[simulatedMonth - 1]} (simulated)
                            </span>
                            <span style={{ color: '#9ca3af' }}>→</span>
                            <RatingBadge rating={rating || 'fair'} />
                          </div>
                          {/* Detail line */}
                          {monthRecord && (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 8, fontSize: 11,
                              color: '#6b7280', paddingLeft: 110, flexWrap: 'wrap',
                            }}>
                              <span>🌡 {monthRecord.low}–{monthRecord.high}°C</span>
                              <span>🌧 {monthRecord.rainfall}mm</span>
                              <span>{monthRecord.desc}</span>
                              <CrowdBadge monthRecord={monthRecord} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '8px 10px',
  fontSize: 11,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

const tdStyle = {
  padding: '10px 10px',
  verticalAlign: 'middle',
};
