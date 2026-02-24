import { useMemo } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, format, parseISO, isBefore, isAfter,
  addMonths, isSameMonth,
} from 'date-fns';
import { buildDayMap, getCountryColor } from '../utils/climateUtils';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function CalendarMonth({ year, month, dayMap, tripStart, tripEnd }) {
  const firstDay = new Date(year, month - 1, 1);
  const gridStart = startOfWeek(startOfMonth(firstDay), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(firstDay), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const monthLabel = format(firstDay, 'MMMM yyyy');

  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
        {monthLabel}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#9ca3af', padding: '4px 0' }}>
            {d}
          </div>
        ))}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, firstDay);
          const stop = dayMap[dateStr];
          const inTrip = tripStart && tripEnd
            ? !isBefore(day, tripStart) && !isAfter(day, tripEnd)
            : false;

          const bg = stop
            ? getCountryColor(stop.countryName)
            : isCurrentMonth && inTrip
            ? '#f3f4f6'
            : 'transparent';

          const textColor = stop ? '#fff' : isCurrentMonth ? '#111827' : '#d1d5db';

          return (
            <div
              key={dateStr}
              title={stop ? `${stop.cityName}, ${stop.countryName}` : ''}
              style={{
                textAlign: 'center',
                padding: '6px 2px',
                borderRadius: 6,
                background: bg,
                color: textColor,
                fontSize: 13,
                fontWeight: stop ? 600 : 400,
                cursor: stop ? 'default' : 'default',
                transition: 'opacity 0.1s',
                opacity: isCurrentMonth ? 1 : 0.3,
              }}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TripCalendar({ stops }) {
  const dayMap = useMemo(() => buildDayMap(stops), [stops]);

  const { months, tripStart, tripEnd } = useMemo(() => {
    if (stops.length === 0) return { months: [], tripStart: null, tripEnd: null };

    const sorted = [...stops].sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate));
    const firstDate = parseISO(sorted[0].arrivalDate);
    const lastDate = parseISO(sorted[sorted.length - 1].departureDate);

    const result = [];
    let cur = startOfMonth(firstDate);
    const end = startOfMonth(lastDate);

    while (!isAfter(cur, end)) {
      result.push({ year: cur.getFullYear(), month: cur.getMonth() + 1 });
      cur = addMonths(cur, 1);
    }

    return { months: result, tripStart: firstDate, tripEnd: lastDate };
  }, [stops]);

  // Build country legend
  const countries = useMemo(() => {
    const seen = new Map();
    for (const stop of stops) {
      if (!seen.has(stop.countryName)) {
        seen.set(stop.countryName, getCountryColor(stop.countryName));
      }
    }
    return [...seen.entries()];
  }, [stops]);

  if (stops.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#9ca3af', padding: '80px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>No itinerary yet</div>
        <div style={{ marginTop: 8 }}>Add stops in the Planner to see your calendar</div>
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      {countries.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          {countries.map(([country, color]) => (
            <div key={country} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: color }} />
              <span style={{ fontSize: 13, color: '#374151' }}>{country}</span>
            </div>
          ))}
        </div>
      )}

      {/* Month grids */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
        {months.map(({ year, month }) => (
          <CalendarMonth
            key={`${year}-${month}`}
            year={year}
            month={month}
            dayMap={dayMap}
            tripStart={tripStart}
            tripEnd={tripEnd}
          />
        ))}
      </div>
    </div>
  );
}
