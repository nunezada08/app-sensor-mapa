const ROUTERS = {
  walking: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving',
  bicycle: 'https://routing.openstreetmap.de/routed-bike/route/v1/driving',
  car: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
};

export const ROUTE_MODES = [
  { id: 'walking', label: 'A pé', icon: '♧' },
  { id: 'bicycle', label: 'De bike', icon: '♢' },
  { id: 'car', label: 'De carro', icon: '▣' },
];

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const POSITIVE_LIGHTING = new Set(['yes', '24/7', 'automatic', 'limited', 'interval', 'dusk-dawn']);
const NEGATIVE_LIGHTING = new Set(['no', 'disused']);

function toCoordinates(route) {
  return route.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
}

async function requestModeRoutes(origin, destination, mode) {
  const baseUrl = ROUTERS[mode.id];
  const url = `${baseUrl}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=false&alternatives=true`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Não foi possível calcular a rota ${mode.label.toLowerCase()}.`);
  const payload = await response.json();
  if (payload.code !== 'Ok' || !payload.routes?.length) throw new Error(`Nenhuma rota ${mode.label.toLowerCase()} encontrada.`);
  return payload.routes.map((route, index) => ({
    id: `${mode.id}-${index}`,
    modeId: mode.id,
    modeLabel: mode.label,
    modeIcon: mode.icon,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    coordinates: toCoordinates(route),
    alternativeIndex: index,
  }));
}

function routeBounds(routes) {
  const points = routes.flatMap((route) => route.coordinates);
  return {
    south: Math.min(...points.map((point) => point.latitude)) - 0.003,
    west: Math.min(...points.map((point) => point.longitude)) - 0.003,
    north: Math.max(...points.map((point) => point.latitude)) + 0.003,
    east: Math.max(...points.map((point) => point.longitude)) + 0.003,
  };
}

async function fetchLightingWays(routes) {
  const { south, west, north, east } = routeBounds(routes);
  const query = `[out:json][timeout:15];way["highway"]["lit"](${south},${west},${north},${east});out tags geom;`;
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'LightStreet/1.0 (OpenStreetMap routing app)' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) return [];
  const payload = await response.json();
  return payload.elements || [];
}

function pointDistanceMeters(point, geometryPoint) {
  const latitudeMeters = (point.latitude - geometryPoint.lat) * 111320;
  const longitudeMeters = (point.longitude - geometryPoint.lon) * 111320 * Math.cos((point.latitude * Math.PI) / 180);
  return Math.sqrt(latitudeMeters ** 2 + longitudeMeters ** 2);
}

function lightingKind(tags = {}) {
  const value = String(tags.lit || '').toLowerCase();
  if (POSITIVE_LIGHTING.has(value)) return 'lit';
  if (NEGATIVE_LIGHTING.has(value)) return 'unlit';
  return 'unknown';
}

function scoreLighting(route, lightingWays) {
  const step = Math.max(1, Math.floor(route.coordinates.length / 80));
  let lit = 0;
  let unlit = 0;
  let inspected = 0;

  for (let index = 0; index < route.coordinates.length; index += step) {
    const point = route.coordinates[index];
    let nearestKind = 'unknown';
    let nearestDistance = 70;

    for (const way of lightingWays) {
      const kind = lightingKind(way.tags);
      if (kind === 'unknown' || !way.geometry) continue;
      for (const geometryPoint of way.geometry) {
        const distance = pointDistanceMeters(point, geometryPoint);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestKind = kind;
        }
      }
    }

    if (nearestKind === 'lit') lit += 1;
    if (nearestKind === 'unlit') unlit += 1;
    if (nearestKind !== 'unknown') inspected += 1;
  }

  const sampleCount = Math.ceil(route.coordinates.length / step);
  const safetyScore = inspected ? Math.round((lit / sampleCount) * 100) : null;
  return {
    ...route,
    lightingScore: safetyScore,
    lightingCoverage: inspected ? Math.round((inspected / Math.ceil(route.coordinates.length / step)) * 100) : 0,
    safetyLabel: safetyScore === null ? 'Iluminação sem dados suficientes' : `${safetyScore}% iluminada · ${Math.round((inspected / sampleCount) * 100)}% mapeada`,
  };
}

function chooseSafestRoute(candidates) {
  const scored = candidates.map((candidate) => candidate);
  return scored.sort((first, second) => {
    const firstScore = first.lightingScore === null ? -1 : first.lightingScore;
    const secondScore = second.lightingScore === null ? -1 : second.lightingScore;
    if (firstScore !== secondScore) return secondScore - firstScore;
    return first.durationSeconds - second.durationSeconds;
  })[0];
}

export async function calculateRoutes(origin, destination) {
  if (!origin || !destination) return [];
  const candidatesByMode = [];
  for (let index = 0; index < ROUTE_MODES.length; index += 1) {
    const mode = ROUTE_MODES[index];
    candidatesByMode.push(await requestModeRoutes(origin, destination, mode).catch(() => []));
    if (index < ROUTE_MODES.length - 1) await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const allCandidates = candidatesByMode.flat();
  if (!allCandidates.length) throw new Error('Nenhuma modalidade conseguiu calcular uma rota para esse destino.');
  let lightingWays = [];
  try {
    lightingWays = await fetchLightingWays(allCandidates);
  } catch (error) {
    lightingWays = [];
  }

  return candidatesByMode.filter((candidates) => candidates.length).map((candidates) => chooseSafestRoute(candidates.map((candidate) => scoreLighting(candidate, lightingWays))));
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
