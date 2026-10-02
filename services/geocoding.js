const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function toPlace(result) {
  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    label: result.display_name,
  };
}

export async function searchDestinations(query) {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 3) return [];

  const response = await fetch(`${NOMINATIM_URL}?format=jsonv2&limit=5&accept-language=pt-BR&q=${encodeURIComponent(cleanQuery)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Não foi possível carregar sugestões.');
  const results = await response.json();
  return results.map(toPlace);
}

export async function geocodeDestination(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) throw new Error('Digite um destino.');

  const response = await fetch(`${NOMINATIM_URL}?format=jsonv2&limit=1&accept-language=pt-BR&q=${encodeURIComponent(cleanQuery)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Não foi possível buscar esse destino.');

  const results = await response.json();
  if (!results.length) throw new Error('Destino não encontrado.');

  return toPlace(results[0]);
}
