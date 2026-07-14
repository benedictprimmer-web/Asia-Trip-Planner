import { useState, useEffect } from 'react';
import TravelMap from '../components/TravelMap';
import ItineraryPanel from '../components/ItineraryPanel';
import AddStopModal from '../components/AddStopModal';
import { createStop, updateStop, deleteStop, reorderStops } from '../db/index';
import { StopSchema } from '../models/schemas';

const MOBILE_QUERY = '(max-width: 768px)';

function mobileTabStyle(active) {
  return {
    flex: 1,
    padding: '10px 12px',
    border: 'none',
    borderBottom: active ? '2px solid #1d4ed8' : '2px solid transparent',
    background: active ? '#eff6ff' : '#fff',
    color: active ? '#1d4ed8' : '#6b7280',
    fontSize: 14,
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
  };
}

export default function PlannerPage({ trip, stops, climateDb, onStopsChange }) {
  const [showModal, setShowModal] = useState(false);
  const [editStop, setEditStop] = useState(null);
  const [clickedCity, setClickedCity] = useState(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );
  const [mobileView, setMobileView] = useState('map');

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handleChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  if (!trip) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          color: '#6b7280',
        }}
      >
        <div style={{ fontSize: 64 }}>🌏</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#374151' }}>Welcome to Asia Travel Planner</div>
        <div style={{ fontSize: 14 }}>Create a new trip or select one from the top bar to get started</div>
      </div>
    );
  }

  const handleAddStop = async (data) => {
    const validated = StopSchema.parse({
      ...data,
      tripId: trip.id,
      order: stops.length,
    });
    const created = await createStop(validated);
    onStopsChange([...stops, created]);
    setShowModal(false);
    setClickedCity(null);
    if (isMobile) setMobileView('itinerary');
  };

  const handleEditStop = async (data) => {
    const validated = StopSchema.parse({
      ...editStop,
      ...data,
    });
    const updated = await updateStop(editStop.id, validated);
    onStopsChange(stops.map(s => s.id === updated.id ? updated : s));
    setEditStop(null);
  };

  const handleDeleteStop = async (id) => {
    if (!window.confirm('Remove this stop?')) return;
    await deleteStop(id);
    onStopsChange(stops.filter(s => s.id !== id));
  };

  const handleReorder = async (reordered) => {
    onStopsChange(reordered);
    await reorderStops(reordered);
  };

  const handleCityClick = (cityName) => {
    setClickedCity(cityName);
    setEditStop(null);
    setShowModal(true);
  };

  const openAddModal = () => {
    setClickedCity(null);
    setEditStop(null);
    setShowModal(true);
  };

  const openEditModal = (stop) => {
    setEditStop(stop);
    setClickedCity(null);
    setShowModal(true);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
      {/* Mobile tab switcher: map and itinerary are full-screen, one at a time */}
      {isMobile && (
        <div style={{ display: 'flex', flexShrink: 0, background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          <button onClick={() => setMobileView('map')} style={mobileTabStyle(mobileView === 'map')}>
            🗺️ Map
          </button>
          <button onClick={() => setMobileView('itinerary')} style={mobileTabStyle(mobileView === 'itinerary')}>
            📋 Itinerary{stops.length > 0 ? ` · ${stops.length}` : ''}
          </button>
        </div>
      )}

      {/* Map */}
      {(!isMobile || mobileView === 'map') && (
        <TravelMap
          stops={stops}
          climateDb={climateDb}
          onCityClick={handleCityClick}
        />
      )}

      {/* Itinerary panel */}
      {(!isMobile || mobileView === 'itinerary') && (
        <ItineraryPanel
          stops={stops}
          climateDb={climateDb}
          onReorder={handleReorder}
          onDelete={handleDeleteStop}
          onEdit={openEditModal}
          onAddStop={openAddModal}
          fullWidth={isMobile}
        />
      )}

      {/* Modal */}
      {showModal && (
        <AddStopModal
          climateDb={climateDb}
          existingStops={stops}
          initialCity={clickedCity}
          editStop={editStop}
          onSave={editStop ? handleEditStop : handleAddStop}
          onClose={() => { setShowModal(false); setEditStop(null); setClickedCity(null); }}
        />
      )}
    </div>
  );
}
