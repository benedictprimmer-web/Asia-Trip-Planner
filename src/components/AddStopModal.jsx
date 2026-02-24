import { useState, useEffect, useMemo } from 'react';
import { addDays, format, parseISO } from 'date-fns';

export default function AddStopModal({ climateDb, existingStops, initialCity, editStop, onSave, onClose }) {
  const cities = useMemo(() => Object.keys(climateDb || {}).sort(), [climateDb]);

  const getDefaultArrival = () => {
    if (editStop) return editStop.arrivalDate;
    if (existingStops && existingStops.length > 0) {
      return existingStops[existingStops.length - 1].departureDate;
    }
    return format(new Date(), 'yyyy-MM-dd');
  };

  const [search, setSearch] = useState(editStop?.cityName || initialCity || '');
  const [selectedCity, setSelectedCity] = useState(editStop?.cityName || initialCity || '');
  const [arrivalDate, setArrivalDate] = useState(getDefaultArrival());
  const [nights, setNights] = useState(() => {
    if (editStop) {
      const a = parseISO(editStop.arrivalDate);
      const d = parseISO(editStop.departureDate);
      return Math.round((d - a) / (1000 * 60 * 60 * 24));
    }
    return 7;
  });
  const [notes, setNotes] = useState(editStop?.notes || '');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredCities = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return cities.filter(c => {
      return (
        c.toLowerCase().includes(q) ||
        climateDb[c]?.country?.toLowerCase().includes(q)
      );
    }).slice(0, 10);
  }, [search, cities, climateDb]);

  useEffect(() => {
    if (initialCity && !editStop) {
      setSelectedCity(initialCity);
      setSearch(initialCity);
    }
  }, [initialCity, editStop]);

  const departureDate = useMemo(() => {
    if (!arrivalDate) return '';
    try {
      return format(addDays(parseISO(arrivalDate), nights), 'yyyy-MM-dd');
    } catch {
      return '';
    }
  }, [arrivalDate, nights]);

  const cityData = climateDb?.[selectedCity];

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    setSearch(city);
    setShowDropdown(false);
  };

  const handleSave = () => {
    if (!selectedCity || !arrivalDate || !departureDate) return;
    if (!cityData) return;
    onSave({
      cityName: selectedCity,
      countryName: cityData.country,
      lat: cityData.lat,
      lng: cityData.lng,
      arrivalDate,
      departureDate,
      notes,
    });
  };

  const isValid = selectedCity && cityData && arrivalDate && departureDate && nights > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
            {editStop ? 'Edit Stop' : 'Add Stop'}
          </h2>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#6b7280' }}
          >
            ✕
          </button>
        </div>

        {/* City search */}
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <label style={labelStyle}>City</label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
              if (selectedCity && e.target.value !== selectedCity) {
                setSelectedCity('');
              }
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search Asian cities..."
            style={inputStyle}
          />
          {showDropdown && filteredCities.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                zIndex: 100,
                maxHeight: 220,
                overflowY: 'auto',
              }}
            >
              {filteredCities.map(city => (
                <div
                  key={city}
                  onClick={() => handleSelectCity(city)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: selectedCity === city ? '#eff6ff' : '#fff',
                  }}
                  onMouseEnter={e => { if (selectedCity !== city) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { if (selectedCity !== city) e.currentTarget.style.background = '#fff'; }}
                >
                  <span style={{ fontWeight: 500, color: '#111827' }}>{city}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{climateDb[city]?.country}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {cityData && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#166534' }}>
            📍 {cityData.country} · {cityData.lat.toFixed(2)}°N, {cityData.lng.toFixed(2)}°E
          </div>
        )}

        {/* Arrival date */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Arrival Date</label>
          <input
            type="date"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Nights */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Number of Nights</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="number"
              value={nights}
              onChange={(e) => setNights(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={365}
              style={{ ...inputStyle, width: 80 }}
            />
            {departureDate && (
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                → departs {format(parseISO(departureDate), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Hotels, activities, reminders..."
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              background: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              color: '#374151',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            style={{
              flex: 2,
              padding: '10px',
              border: 'none',
              borderRadius: 8,
              background: isValid ? '#3b82f6' : '#93c5fd',
              color: '#fff',
              cursor: isValid ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {editStop ? 'Save Changes' : 'Add to Itinerary'}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  color: '#111827',
  background: '#fff',
};
