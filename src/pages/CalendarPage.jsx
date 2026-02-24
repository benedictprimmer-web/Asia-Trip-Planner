import TripCalendar from '../components/TripCalendar';

export default function CalendarPage({ trip, stops }) {
  if (!trip) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: 14,
        }}
      >
        Select a trip to view the calendar.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#111827' }}>
        {trip.name}
      </h1>
      <p style={{ margin: '0 0 28px', color: '#6b7280', fontSize: 14 }}>
        Days colored by country · hover a cell for city name
      </p>
      <TripCalendar stops={stops} />
    </div>
  );
}
