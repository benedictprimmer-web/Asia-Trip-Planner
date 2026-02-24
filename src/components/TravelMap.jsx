import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { greatCircleArc } from '../utils/greatCircle';
import { getCountryColor } from '../utils/climateUtils';

// Fix default leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createNumberedIcon(number, color) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: ${color};
        transform: rotate(-45deg);
        border: 2px solid rgba(255,255,255,0.8);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: 700;
          font-size: 13px;
          font-family: sans-serif;
          line-height: 1;
        ">${number}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function createCityIcon(color) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid rgba(255,255,255,0.9);
        box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        opacity: 0.7;
      "></div>
    `,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

function FitBounds({ stops }) {
  const map = useMap();
  const prevBoundsRef = useRef(null);

  useEffect(() => {
    if (stops.length === 0) return;

    const bounds = stops.map(s => [s.lat, s.lng]);
    const boundsKey = JSON.stringify(bounds);

    if (boundsKey === prevBoundsRef.current) return;
    prevBoundsRef.current = boundsKey;

    if (stops.length === 1) {
      map.setView([stops[0].lat, stops[0].lng], 6, { animate: true });
    } else {
      map.fitBounds(L.latLngBounds(bounds).pad(0.2), { animate: true });
    }
  }, [stops, map]);

  return null;
}

export default function TravelMap({ stops, climateDb, onCityClick }) {
  // Build arcs between consecutive stops
  const arcs = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    const points = greatCircleArc(a.lat, a.lng, b.lat, b.lng, 80);
    arcs.push(points);
  }

  // Background cities from climate db (not in itinerary)
  const stopCityNames = new Set(stops.map(s => s.cityName));
  const bgCities = climateDb
    ? Object.entries(climateDb).filter(([name]) => !stopCityNames.has(name))
    : [];

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <MapContainer
        center={[20, 105]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <FitBounds stops={stops} />

        {/* Background city markers */}
        {bgCities.map(([cityName, data]) => (
          <Marker
            key={cityName}
            position={[data.lat, data.lng]}
            icon={createCityIcon('#94a3b8')}
            eventHandlers={{
              click: () => onCityClick && onCityClick(cityName),
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} opacity={0.9}>
              <span style={{ fontWeight: 600 }}>{cityName}</span>
              <br />
              <span style={{ fontSize: 11, color: '#666' }}>{data.country} · Click to add</span>
            </Tooltip>
          </Marker>
        ))}

        {/* Route arcs */}
        {arcs.map((points, i) => (
          <Polyline
            key={i}
            positions={points}
            pathOptions={{
              color: '#3b82f6',
              weight: 2.5,
              opacity: 0.75,
              dashArray: '8 5',
            }}
          />
        ))}

        {/* Stop markers */}
        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={createNumberedIcon(index + 1, getCountryColor(stop.countryName))}
          >
            <Tooltip direction="top" offset={[0, -30]} permanent={false} opacity={0.95}>
              <div>
                <span style={{ fontWeight: 700 }}>{stop.cityName}</span>
                <span style={{ color: '#666', marginLeft: 4, fontSize: 11 }}>#{index + 1}</span>
                <br />
                <span style={{ fontSize: 11, color: '#555' }}>
                  {stop.arrivalDate} → {stop.departureDate}
                </span>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend hint */}
      {climateDb && bgCities.length > 0 && stops.length === 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.95)',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 13,
            color: '#374151',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            zIndex: 999,
          }}
        >
          Click any city dot to add it to your itinerary
        </div>
      )}
    </div>
  );
}
