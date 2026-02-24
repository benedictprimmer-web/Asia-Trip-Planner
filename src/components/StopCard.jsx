import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, parseISO } from 'date-fns';
import ClimateIndicator from './ClimateIndicator';
import { nightsCount, getCountryColor } from '../utils/climateUtils';

export default function StopCard({ stop, index, climateDb, onDelete, onEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const nights = nightsCount(stop.arrivalDate, stop.departureDate);
  const countryColor = getCountryColor(stop.countryName);

  const formatDate = (d) => {
    try { return format(parseISO(d), 'MMM d'); } catch { return d; }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: '10px 12px',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
        position: 'relative',
      }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab',
          color: '#9ca3af',
          fontSize: 18,
          lineHeight: 1,
          padding: '2px 0',
          flexShrink: 0,
          userSelect: 'none',
          touchAction: 'none',
        }}
        title="Drag to reorder"
      >
        ⠿
      </div>

      {/* Number badge */}
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: countryColor,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 13,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {index + 1}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{stop.cityName}</span>
            <span style={{ marginLeft: 6, fontSize: 12, color: '#6b7280' }}>{stop.countryName}</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => onEdit(stop)}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                fontSize: 13,
                padding: '2px 6px',
                borderRadius: 4,
              }}
              title="Edit stop"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(stop.id)}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                fontSize: 13,
                padding: '2px 6px',
                borderRadius: 4,
              }}
              title="Remove stop"
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
          {formatDate(stop.arrivalDate)} – {formatDate(stop.departureDate)} · {nights} night{nights !== 1 ? 's' : ''}
        </div>

        <div style={{ marginTop: 6 }}>
          <ClimateIndicator
            cityName={stop.cityName}
            arrivalDate={stop.arrivalDate}
            climateDb={climateDb}
          />
        </div>

        {stop.notes && (
          <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
            {stop.notes}
          </div>
        )}
      </div>
    </div>
  );
}
