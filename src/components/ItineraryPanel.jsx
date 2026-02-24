import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import StopCard from './StopCard';
import TripStats from './TripStats';

export default function ItineraryPanel({ stops, climateDb, onReorder, onDelete, onEdit, onAddStop }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stops.findIndex(s => s.id === active.id);
    const newIndex = stops.findIndex(s => s.id === over.id);
    const reordered = arrayMove(stops, oldIndex, newIndex);
    onReorder(reordered);
  }

  return (
    <div
      style={{
        width: 320,
        minWidth: 280,
        maxWidth: 360,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #e5e7eb',
        background: '#f9fafb',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid #e5e7eb',
          background: '#fff',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>
          Itinerary
        </h2>
        {stops.length > 0 && (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {stops.length} stop{stops.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Trip stats */}
      {stops.length > 0 && <TripStats stops={stops} climateDb={climateDb} />}

      {/* Stop list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {stops.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#9ca3af',
              padding: '40px 16px',
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No stops yet</div>
            <div>Click on a city on the map or use the button below to add your first stop</div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={stops.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {stops.map((stop, index) => (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  index={index}
                  climateDb={climateDb}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add stop button */}
      <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', background: '#fff' }}>
        <button
          onClick={onAddStop}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px dashed #93c5fd',
            borderRadius: 8,
            background: '#eff6ff',
            color: '#1d4ed8',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 18 }}>+</span> Add Stop
        </button>
      </div>
    </div>
  );
}
