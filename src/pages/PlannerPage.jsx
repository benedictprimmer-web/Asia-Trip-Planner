import { useState } from 'react';
import TravelMap from '../components/TravelMap';
import ItineraryPanel from '../components/ItineraryPanel';
import AddStopModal from '../components/AddStopModal';
import { createStop, updateStop, deleteStop, reorderStops } from '../db/index';
import { StopSchema } from '../models/schemas';

export default function PlannerPage({ trip, stops, climateDb, onStopsChange }) {
  const [showModal, setShowModal] = useState(false);
  const [editStop, setEditStop] = useState(null);
  const [clickedCity, setClickedCity] = useState(null);

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
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Map */}
      <TravelMap
        stops={stops}
        climateDb={climateDb}
        onCityClick={handleCityClick}
      />

      {/* Itinerary panel */}
      <ItineraryPanel
        stops={stops}
        climateDb={climateDb}
        onReorder={handleReorder}
        onDelete={handleDeleteStop}
        onEdit={openEditModal}
        onAddStop={openAddModal}
      />

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
