import { openDB } from 'idb';

const DB_NAME = 'asia_travel_db';
const DB_VERSION = 1;

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('trips')) {
          const tripStore = db.createObjectStore('trips', { keyPath: 'id', autoIncrement: true });
          tripStore.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('stops')) {
          const stopStore = db.createObjectStore('stops', { keyPath: 'id', autoIncrement: true });
          stopStore.createIndex('tripId', 'tripId');
          stopStore.createIndex('order', 'order');
        }
      },
    });
  }
  return dbPromise;
}

// Trips
export async function getAllTrips() {
  const db = await getDb();
  return db.getAll('trips');
}

export async function getTrip(id) {
  const db = await getDb();
  return db.get('trips', id);
}

export async function createTrip(data) {
  const db = await getDb();
  const trip = { ...data, createdAt: new Date().toISOString() };
  const id = await db.add('trips', trip);
  return { ...trip, id };
}

export async function updateTrip(id, data) {
  const db = await getDb();
  const existing = await db.get('trips', id);
  const updated = { ...existing, ...data };
  await db.put('trips', updated);
  return updated;
}

export async function deleteTrip(id) {
  const db = await getDb();
  // Delete all stops for this trip first
  const stops = await getStopsForTrip(id);
  const tx = db.transaction(['trips', 'stops'], 'readwrite');
  await Promise.all(stops.map(s => tx.objectStore('stops').delete(s.id)));
  await tx.objectStore('trips').delete(id);
  await tx.done;
}

// Stops
export async function getStopsForTrip(tripId) {
  const db = await getDb();
  const stops = await db.getAllFromIndex('stops', 'tripId', tripId);
  return stops.sort((a, b) => a.order - b.order);
}

export async function createStop(data) {
  const db = await getDb();
  const id = await db.add('stops', data);
  return { ...data, id };
}

export async function updateStop(id, data) {
  const db = await getDb();
  const existing = await db.get('stops', id);
  const updated = { ...existing, ...data };
  await db.put('stops', updated);
  return updated;
}

export async function deleteStop(id) {
  const db = await getDb();
  await db.delete('stops', id);
}

export async function reorderStops(stops) {
  const db = await getDb();
  const tx = db.transaction('stops', 'readwrite');
  await Promise.all(
    stops.map((stop, index) => {
      return tx.store.put({ ...stop, order: index });
    })
  );
  await tx.done;
}
