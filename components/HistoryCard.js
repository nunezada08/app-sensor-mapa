import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDistance, formatDuration } from '../services/routing';

export default function HistoryCard({ route, onRepeat }) {
  const date = new Date(route.completedAt).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
  return <View style={styles.card}><View style={styles.top}><Text style={styles.title}>{route.destinationLabel}</Text><Text style={styles.date}>{date}</Text></View><Text style={styles.meta}>{route.modeLabel || 'Rota'} · {route.lightingScore === null || route.lightingScore === undefined ? 'iluminação sem dados' : `${route.lightingScore}% iluminada`}</Text><View style={styles.routeRow}><Text style={styles.dot}>●</Text><View><Text style={styles.label}>Ponto de partida</Text><Text style={styles.value}>{route.originLabel || 'Localização do dispositivo'}</Text></View></View><View style={styles.line} /><View style={styles.routeRow}><Text style={styles.pin}>⌖</Text><View><Text style={styles.label}>Destino</Text><Text style={styles.value}>{route.destinationLabel}</Text></View></View><View style={styles.bottom}><Text style={styles.duration}>{formatDuration(route.durationSeconds)} <Text style={styles.distance}>· {formatDistance(route.distanceMeters)}</Text></Text><Pressable style={styles.repeatButton} onPress={() => onRepeat(route)}><Text style={styles.repeatText}>Repetir</Text></Pressable></View></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#2a2a2a', borderRadius: 17, padding: 15, marginBottom: 13 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  title: { color: '#f5f5f5', fontSize: 14, fontWeight: '900', flex: 1 },
  date: { color: '#a9a9a9', fontSize: 10 },
  meta: { color: '#0cc5d7', fontSize: 10, marginTop: 5, marginBottom: 16 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  dot: { color: '#0cc5d7', fontSize: 16, lineHeight: 17 },
  pin: { color: '#f5f5f5', fontSize: 18, lineHeight: 17 },
  label: { color: '#999', fontSize: 10 },
  value: { color: '#f5f5f5', fontSize: 12, fontWeight: '800', marginTop: 3, maxWidth: 230 },
  line: { height: 16, width: 2, backgroundColor: '#0d8798', marginLeft: 6 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  duration: { color: '#f5f5f5', fontSize: 16, fontWeight: '900' },
  distance: { color: '#999', fontSize: 11, fontWeight: '500' },
  repeatButton: { backgroundColor: '#1e817d', borderRadius: 6, paddingHorizontal: 15, paddingVertical: 8 },
  repeatText: { color: '#baf3ee', fontWeight: '800', fontSize: 11 },
});
