import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import PlannerPage from './pages/PlannerPage';
import CalendarPage from './pages/CalendarPage';
import ClimateGridPage from './pages/ClimateGridPage';
import OptimiserPage from './pages/OptimiserPage';
import { getAllTrips, createTrip, updateTrip, getStopsForTrip } from './db/index';

export default function App() {
  const [page, setPage] = useState('planner');
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [stops, setStops] = useState([]);
  const [climateDb, setClimateDb] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load climate data
  useEffect(() => {
    fetch('/asia-climate.json')
      .then(r => r.json())
      .then(setClimateDb)
      .catch(err => console.error('Failed to load climate data', err));
  }, []);

  // Load trips from DB
  useEffect(() => {
    getAllTrips().then(all => {
      setTrips(all.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
      if (all.length > 0) {
        setSelectedTripId(all[0].id);
      }
      setLoading(false);
    });
  }, []);

  // Load stops when trip changes
  useEffect(() => {
    if (!selectedTripId) {
      setStops([]);
      return;
    }
    getStopsForTrip(selectedTripId).then(setStops);
  }, [selectedTripId]);

  const selectedTrip = trips.find(t => t.id === selectedTripId) || null;

  const handleNewTrip = async () => {
    const name = window.prompt('Trip name:', 'Asia Adventure');
    if (!name || !name.trim()) return;
    const trip = await createTrip({ name: name.trim() });
    setTrips(prev => [...prev, trip]);
    setSelectedTripId(trip.id);
  };

  const handleRenameTrip = async (trip) => {
    const name = window.prompt('Rename trip:', trip.name);
    if (!name || !name.trim() || name.trim() === trip.name) return;
    const updated = await updateTrip(trip.id, { name: name.trim() });
    setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleSelectTrip = (id) => {
    setSelectedTripId(id);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navigation
        currentPage={page}
        onNavigate={setPage}
        trips={trips}
        selectedTripId={selectedTripId}
        onSelectTrip={handleSelectTrip}
        onNewTrip={handleNewTrip}
        onRenameTrip={handleRenameTrip}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {page === 'planner' && (
          <PlannerPage
            trip={selectedTrip}
            stops={stops}
            climateDb={climateDb}
            onStopsChange={setStops}
          />
        )}
        {page === 'calendar' && (
          <CalendarPage
            trip={selectedTrip}
            stops={stops}
          />
        )}
        {page === 'climate' && (
          <ClimateGridPage
            stops={stops}
            climateDb={climateDb}
          />
        )}
        {page === 'optimise' && (
          <OptimiserPage
            stops={stops}
            climateDb={climateDb}
          />
        )}
      </div>
    </div>
  );
}
