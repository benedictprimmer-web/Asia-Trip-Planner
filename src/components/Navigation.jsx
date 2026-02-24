export default function Navigation({ currentPage, onNavigate, trips, selectedTripId, onSelectTrip, onNewTrip, onRenameTrip }) {
  const selectedTrip = trips.find(t => t.id === selectedTripId);

  return (
    <nav
      style={{
        height: 52,
        background: '#1e3a5f',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* App title */}
      <div style={{ color: '#fff', fontWeight: 800, fontSize: 17, marginRight: 8, whiteSpace: 'nowrap' }}>
        🌏 Asia Travel
      </div>

      {/* Trip selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 12 }}>
        <select
          value={selectedTripId || ''}
          onChange={(e) => onSelectTrip(e.target.value ? Number(e.target.value) : null)}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
            maxWidth: 180,
          }}
        >
          <option value="" style={{ background: '#1e3a5f' }}>— Select trip —</option>
          {trips.map(t => (
            <option key={t.id} value={t.id} style={{ background: '#1e3a5f' }}>
              {t.name}
            </option>
          ))}
        </select>

        <button
          onClick={onNewTrip}
          title="New trip"
          style={{
            padding: '4px 8px',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          + New
        </button>

        {selectedTrip && (
          <button
            onClick={() => onRenameTrip(selectedTrip)}
            title="Rename trip"
            style={{
              padding: '4px 8px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            ✏️
          </button>
        )}
      </div>

      {/* Page tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { key: 'planner', label: '🗺️ Planner' },
          { key: 'calendar', label: '📅 Calendar' },
          { key: 'climate', label: '🌤️ Climate' },
          { key: 'optimise', label: '🌡️ Optimise' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => onNavigate(tab.key)}
            style={{
              padding: '5px 14px',
              border: 'none',
              borderRadius: 6,
              background: currentPage === tab.key ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: currentPage === tab.key ? '#fff' : 'rgba(255,255,255,0.65)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: currentPage === tab.key ? 700 : 400,
              transition: 'background 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
