const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function geocodeDestination(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) throw new Error('Digite um destino.');

  const response = await fetch(`${NOMINATIM_URL}?format=jsonv2&limit=1&accept-language=pt-BR&q=${encodeURIComponent(cleanQuery)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Não foi possível buscar esse destino.');

  const results = await response.json();
  if (!results.length) throw new Error('Destino não encontrado.');

  return {
    latitude: Number(results[0].lat),
    longitude: Number(results[0].lon),
    label: results[0].display_name,
  };
}
