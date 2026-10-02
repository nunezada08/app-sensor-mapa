const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

export async function calculateRoute(origin, destination) {
  if (!origin || !destination) return null;

  const url = `${OSRM_URL}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=false`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Não foi possível calcular a rota.');

  const payload = await response.json();
  const route = payload.routes?.[0];
  if (!route) throw new Error('Nenhuma rota encontrada para esse destino.');

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    coordinates: route.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
  };
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

export function formatDistance(meters) {
  if (!Number.isFinite(meters)) return '—';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}
