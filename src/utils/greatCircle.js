/**
 * Compute great-circle arc points between two lat/lng coordinates
 * using spherical linear interpolation (slerp).
 * Returns an array of [lat, lng] points.
 */
export function greatCircleArc(lat1, lng1, lat2, lng2, numPoints = 60) {
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const λ1 = toRad(lng1);
  const φ2 = toRad(lat2);
  const λ2 = toRad(lng2);

  // Convert to 3D Cartesian unit vectors
  const x1 = Math.cos(φ1) * Math.cos(λ1);
  const y1 = Math.cos(φ1) * Math.sin(λ1);
  const z1 = Math.sin(φ1);

  const x2 = Math.cos(φ2) * Math.cos(λ2);
  const y2 = Math.cos(φ2) * Math.sin(λ2);
  const z2 = Math.sin(φ2);

  // Angle between them
  const dot = x1 * x2 + y1 * y2 + z1 * z2;
  const clamped = Math.max(-1, Math.min(1, dot));
  const omega = Math.acos(clamped);

  const points = [];

  if (omega < 1e-10) {
    // Points are essentially the same
    return [[lat1, lng1], [lat2, lng2]];
  }

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const sinOmega = Math.sin(omega);
    const a = Math.sin((1 - t) * omega) / sinOmega;
    const b = Math.sin(t * omega) / sinOmega;

    const x = a * x1 + b * x2;
    const y = a * y1 + b * y2;
    const z = a * z1 + b * z2;

    const lat = toDeg(Math.asin(Math.max(-1, Math.min(1, z))));
    const lng = toDeg(Math.atan2(y, x));

    points.push([lat, lng]);
  }

  return points;
}
