const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const PHOTON_URL = 'https://photon.komoot.io/api/';
const SAO_PAULO_BBOX = {
  minLongitude: -53.2,
  minLatitude: -25.4,
  maxLongitude: -44.0,
  maxLatitude: -19.7,
};

function toPlace(result) {
  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    label: result.display_name,
    state: result.address?.state || '',
  };
}

function toPhotonPlace(feature) {
  const [longitude, latitude] = feature.geometry.coordinates;
  const properties = feature.properties || {};
  const main = [properties.name, properties.housenumber && properties.street ? `${properties.street}, ${properties.housenumber}` : properties.street].filter(Boolean);
  const context = [properties.city, properties.county, properties.state].filter(Boolean);
  return { latitude, longitude, label: [...main, ...context].join(', ') || 'Lugar encontrado em São Paulo', state: properties.state || '' };
}

function isInsideSaoPaulo({ latitude, longitude, state = '' }) {
  const insideBoundingBox = latitude >= SAO_PAULO_BBOX.minLatitude && latitude <= SAO_PAULO_BBOX.maxLatitude && longitude >= SAO_PAULO_BBOX.minLongitude && longitude <= SAO_PAULO_BBOX.maxLongitude;
  const normalizedState = state.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return insideBoundingBox && (!normalizedState || normalizedState.includes('sao paulo'));
}

async function searchWithPhoton(query) {
  const bbox = `${SAO_PAULO_BBOX.minLongitude},${SAO_PAULO_BBOX.minLatitude},${SAO_PAULO_BBOX.maxLongitude},${SAO_PAULO_BBOX.maxLatitude}`;
  const response = await fetch(`${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=8&bbox=${bbox}`);
  if (!response.ok) return [];
  const payload = await response.json();
  return (payload.features || []).map(toPhotonPlace).filter(isInsideSaoPaulo);
}

async function searchWithNominatim(query, limit = 8) {
  const viewbox = `${SAO_PAULO_BBOX.minLongitude},${SAO_PAULO_BBOX.maxLatitude},${SAO_PAULO_BBOX.maxLongitude},${SAO_PAULO_BBOX.minLatitude}`;
  const response = await fetch(`${NOMINATIM_URL}?format=jsonv2&addressdetails=1&limit=${limit}&countrycodes=br&bounded=1&viewbox=${viewbox}&accept-language=pt-BR&q=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return [];
  const results = await response.json();
  return results.map(toPlace).filter(isInsideSaoPaulo);
}

export async function searchDestinations(query) {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) return [];

  const photonResults = await searchWithPhoton(cleanQuery).catch(() => []);
  if (photonResults.length) return photonResults;
  return searchWithNominatim(cleanQuery);
}

export async function geocodeDestination(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) throw new Error('Digite um destino.');
  const results = await searchDestinations(cleanQuery);
  if (!results.length) throw new Error('Lugar não encontrado no estado de São Paulo.');
  return results[0];
}
