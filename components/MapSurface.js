import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

function json(value) {
  return JSON.stringify(value || null).replace(/</g, '\\u003c');
}

function buildMapHtml({ location, destination, routeCoordinates, trailCoordinates, followLocation }) {
  const initial = location || destination || { latitude: 0, longitude: 0 };
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#map{height:100%;margin:0;background:#202020} .leaflet-control-attribution{font-size:9px}</style></head>
<body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const locationPoint = ${json(location)};
const destinationPoint = ${json(destination)};
const route = ${json(routeCoordinates)} || [];
const trail = ${json(trailCoordinates)} || [];
const followLocation = ${Boolean(followLocation)};
const map = L.map('map', { zoomControl: true }).setView([${initial.latitude}, ${initial.longitude}], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
const bounds = [];
if (locationPoint) { const point = [locationPoint.latitude, locationPoint.longitude]; L.marker(point).addTo(map).bindPopup('Você está aqui'); bounds.push(point); }
if (destinationPoint) { const point = [destinationPoint.latitude, destinationPoint.longitude]; L.marker(point).addTo(map).bindPopup('Destino'); bounds.push(point); }
if (route.length > 1) { const line = route.map((point) => [point.latitude, point.longitude]); L.polyline(line, { color: '#08b9c9', weight: 5 }).addTo(map); bounds.push(...line); }
if (trail.length > 1) { const line = trail.map((point) => [point.latitude, point.longitude]); L.polyline(line, { color: '#ffcc33', weight: 6, opacity: 0.95 }).addTo(map); bounds.push(...line); }
if (followLocation && locationPoint) map.setView([locationPoint.latitude, locationPoint.longitude], 16);
else if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32] });
else if (bounds.length === 1) map.setView(bounds[0], 15);
setTimeout(() => map.invalidateSize(), 200);
</script></body></html>`;
}

export default function MapSurface({ location, destination, routeCoordinates, trailCoordinates, followLocation = false, compact = false }) {
  const html = buildMapHtml({ location, destination, routeCoordinates, trailCoordinates, followLocation });

  if (Platform.OS === 'web') {
    return <iframe title="Mapa OpenStreetMap" srcDoc={html} style={styles.webMap} />;
  }

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      style={[styles.nativeMap, compact && styles.compactMap]}
    />
  );
}

const styles = StyleSheet.create({
  webMap: { width: '100%', height: '100%', border: 0, display: 'block' },
  nativeMap: { flex: 1, backgroundColor: '#202020' },
  compactMap: { minHeight: 330 },
});
