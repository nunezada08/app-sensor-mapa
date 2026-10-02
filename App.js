import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  Pressable,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const COLORS = {
  background: '#111111',
  surface: '#2a2a2a',
  surfaceRaised: '#333333',
  text: '#f5f5f5',
  muted: '#999999',
  cyan: '#0cc5d7',
  cyanDark: '#0d8798',
  road: '#078cb9',
};

const DEFAULT_REGION = {
  latitude: -23.55052,
  longitude: -46.633308,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function distanceInKm(first, second) {
  if (!first || !second) return null;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(first.latitude)) * Math.cos(toRadians(second.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapSurface({ compact = false, location, destinationLocation, onMapPress }) {
  const region = location && destinationLocation
    ? {
      latitude: (location.latitude + destinationLocation.latitude) / 2,
      longitude: (location.longitude + destinationLocation.longitude) / 2,
      latitudeDelta: Math.max(Math.abs(location.latitude - destinationLocation.latitude) * 1.8, 0.03),
      longitudeDelta: Math.max(Math.abs(location.longitude - destinationLocation.longitude) * 1.8, 0.03),
    }
    : location
      ? { ...location, latitudeDelta: 0.08, longitudeDelta: 0.08 }
      : DEFAULT_REGION;
  const [mapRegion, setMapRegion] = useState(region);
  const routeCoordinates = location && destinationLocation ? [location, destinationLocation] : [];

  useEffect(() => {
    setMapRegion(region);
  }, [location?.latitude, location?.longitude, destinationLocation?.latitude, destinationLocation?.longitude]);

  if (Platform.OS === 'web') {
    const points = [location, destinationLocation].filter(Boolean);
    const latitudes = points.map((point) => point.latitude);
    const longitudes = points.map((point) => point.longitude);
    const minLatitude = Math.min(...(latitudes.length ? latitudes : [DEFAULT_REGION.latitude])) - 0.04;
    const maxLatitude = Math.max(...(latitudes.length ? latitudes : [DEFAULT_REGION.latitude])) + 0.04;
    const minLongitude = Math.min(...(longitudes.length ? longitudes : [DEFAULT_REGION.longitude])) - 0.04;
    const maxLongitude = Math.max(...(longitudes.length ? longitudes : [DEFAULT_REGION.longitude])) + 0.04;
    const marker = location || destinationLocation || DEFAULT_REGION;
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLongitude},${minLatitude},${maxLongitude},${maxLatitude}&layer=mapnik&marker=${marker.latitude},${marker.longitude}`;

    return (
      <View style={[styles.map, compact && styles.mapCompact]}>
        <iframe title="Mapa OpenStreetMap" src={mapUrl} style={styles.webMap} />
      </View>
    );
  }

  return (
    <MapView
      style={[styles.map, compact && styles.mapCompact]}
      initialRegion={DEFAULT_REGION}
      region={mapRegion}
      onRegionChangeComplete={setMapRegion}
      showsUserLocation={Boolean(location)}
      showsMyLocationButton
      showsCompass
      mapType="standard"
      onPress={onMapPress}
    >
      {location ? <Marker coordinate={location} title="Você está aqui" description="Localização atual" /> : null}
      {destinationLocation ? <Marker coordinate={destinationLocation} pinColor={COLORS.cyan} title="Destino" /> : null}
      {routeCoordinates.length > 1 ? (
        <Polyline coordinates={routeCoordinates} strokeColor={COLORS.cyan} strokeWidth={5} />
      ) : null}
    </MapView>
  );
}

function BackButton({ onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Voltar" style={styles.backButton} onPress={onPress}>
      <Text style={styles.backArrow}>‹</Text>
    </Pressable>
  );
}

function SearchBar({ value, onChangeText, onSubmit }) {
  return (
    <View style={styles.searchBar}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        accessibilityLabel="Buscar destino"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Para onde?"
        placeholderTextColor="#efefef"
        returnKeyType="search"
        style={styles.searchInput}
      />
    </View>
  );
}

function RouteCard({ type, time, icon, accent, onPress }) {
  return (
    <Pressable style={styles.routeCard} onPress={onPress} accessibilityRole="button">
      <View style={styles.routeCardHeader}>
        <Text style={styles.routeIcon}>{icon}</Text>
        <Text style={styles.routeTitle}>{type}</Text>
      </View>
      <Text style={styles.routeTime}>{time} minutos</Text>
      <View style={[styles.routeBadge, { backgroundColor: accent }]}>
        <Text style={styles.routeBadgeText}>{type === 'Rota segura' ? '✳ Mais lento' : 'ϟ Mais rápido'}</Text>
      </View>
    </Pressable>
  );
}

function HomeScreen({ destination, setDestination, onSearch, onHistory, onGps, location, locationStatus, destinationLocation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.homeContent} keyboardShouldPersistTaps="handled">
        <View style={styles.homeHeader}>
          <Text style={styles.wordmark}>Light Street</Text>
          <Pressable onPress={onHistory} style={styles.headerLink}>
            <Text style={styles.headerLinkText}>Histórico</Text>
          </Pressable>
        </View>
        <SearchBar value={destination} onChangeText={setDestination} onSubmit={onSearch} />
        <View style={styles.mapHomeWrap}>
          <MapSurface location={location} destinationLocation={destinationLocation} />
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayTitle}>{location ? 'Sua localização' : 'Mapa real'}</Text>
            <Text style={styles.mapOverlaySubtitle}>{locationStatus}</Text>
          </View>
        </View>
        <Pressable style={styles.primaryButton} onPress={onSearch}>
          <Text style={styles.primaryButtonText}>Encontrar rota</Text>
          <Text style={styles.primaryButtonArrow}>→</Text>
        </Pressable>
        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction} onPress={onGps}>
            <Text style={styles.quickIcon}>◎</Text>
            <View>
              <Text style={styles.quickTitle}>Localização</Text>
              <Text style={styles.quickSubtitle}>{location ? 'Sinal conectado' : 'Ativar sinal do GPS'}</Text>
            </View>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={onHistory}>
            <Text style={styles.quickIcon}>◷</Text>
            <View>
              <Text style={styles.quickTitle}>Rotas salvas</Text>
              <Text style={styles.quickSubtitle}>Acessar histórico</Text>
            </View>
          </Pressable>
        </View>
        <Text style={styles.footerNote}>Caminhos mais seguros para voltar para casa.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function RouteOptionsScreen({ destination, onBack, onSelect, location, destinationLocation }) {
  const distance = distanceInKm(location, destinationLocation);
  const safeTime = distance ? Math.max(5, Math.round(distance * 18)) : 15;
  const fastTime = distance ? Math.max(4, Math.round(distance * 12)) : 22;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.routeScreen}>
        <View style={styles.routeTopBar}>
          <BackButton onPress={onBack} />
          <View style={styles.destinationPill}>
            <Text numberOfLines={1} style={styles.destinationText}>{destination || 'Escolha um destino'}</Text>
          </View>
        </View>
        <MapSurface compact location={location} destinationLocation={destinationLocation} />
        <View style={styles.routeOptionsPanel}>
          <Text style={styles.panelKicker}>ESCOLHA COMO CHEGAR</Text>
          <RouteCard type="Rota segura" time={safeTime} icon="☼" accent="#078fb5" onPress={() => onSelect('Rota segura', safeTime)} />
          <RouteCard type="Rota rápida" time={fastTime} icon="☾" accent="#078fb5" onPress={() => onSelect('Rota rápida', fastTime)} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function NavigationScreen({ route, time, destination, onBack, onCancel, location, destinationLocation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navigationScreen}>
        <View style={styles.navigationMapWrap}>
          <MapSurface compact location={location} destinationLocation={destinationLocation} />
          <View style={styles.navigationTopBar}>
            <BackButton onPress={onBack} />
            <View style={styles.destinationPill}>
              <Text numberOfLines={1} style={styles.destinationText}>{destination || 'Destino selecionado'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.arrivalPanel}>
          <Text style={styles.arrivalKicker}>VOCÊ ESTÁ A CAMINHO</Text>
          <Text style={styles.arrivalTitle}>Tempo de chegada</Text>
          <Text style={styles.arrivalTime}>{time} min</Text>
          <View style={styles.routeStatusRow}>
            <Text style={styles.routeStatusDot}>●</Text>
            <Text style={styles.routeStatus}>{route} · iluminada</Text>
          </View>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancelar rota</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function GpsScreen({ onBack, onRetry, onManual }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.gpsContent}>
        <View style={styles.screenHeader}>
          <BackButton onPress={onBack} />
          <View>
            <Text style={styles.screenTitle}>Light Street</Text>
            <Text style={styles.screenSubtitle}>Localização (GPS) indisponível</Text>
          </View>
        </View>
        <View style={styles.gpsCard}>
          <View style={styles.gpsCircle}><Text style={styles.gpsCircleIcon}>⌾</Text><Text style={styles.gpsCross}>×</Text></View>
          <Text style={styles.gpsTitle}>Sinal de Localização Indisponível</Text>
          <Text style={styles.gpsDescription}>Não conseguimos achar sua localização no mapa para te guiar em tempo real :(</Text>
          <Text style={styles.lastLocation}>Última localização a 10 minutos</Text>
        </View>
        <Text style={styles.sectionLabel}>O que você pode fazer:</Text>
        <Pressable style={styles.gpsAction} onPress={onRetry}>
          <View><Text style={styles.gpsActionTitle}>Tentar Reconectar GPS</Text><Text style={styles.gpsActionText}>Reiniciar busca por satélites e sensores de localização</Text></View>
          <Text style={styles.gpsActionArrow}>›</Text>
        </Pressable>
        <Pressable style={styles.gpsAction} onPress={onManual}>
          <View><Text style={styles.gpsActionTitle}>Definir Ponto Manualmente</Text><Text style={styles.gpsActionText}>Indique seu endereço atual no mapa</Text></View>
          <Text style={styles.gpsActionArrow}>›</Text>
        </Pressable>
        <View style={styles.safetyTip}>
          <Text style={styles.safetyTipTitle}>♢ Dicas de Segurança Noturna</Text>
          <Text style={styles.safetyTipText}>Em caso de vulnerabilidade ou sensação de insegurança, permaneça em avenidas principais, bem iluminadas e de alto fluxo.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HistoryScreen({ onBack, onRepeat }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.historyContent}>
        <View style={styles.screenHeader}>
          <BackButton onPress={onBack} />
          <View style={styles.historyHeading}><Text style={styles.screenTitle}>Histórico de Rotas</Text><Text style={styles.screenSubtitle}>Trajetos noturnos monitorados</Text></View>
          <View style={styles.datePill}><Text style={styles.datePillText}>Últimos 30 dias</Text></View>
        </View>
        <View style={styles.filters}>
          <Text style={[styles.filter, styles.filterActive]}>Todos (10)</Text><Text style={styles.filter}>Rotas Seguras</Text><Text style={styles.filter}>Favoritas</Text>
        </View>
        <HistoryCard title="Rota Segura" time="18 min" distance="1.4 km" date="Ontem, 22:40" start="Av. Paulista, 1200" end="Rua Bela Cintra, 450" note="" onRepeat={onRepeat} />
        <HistoryCard title="Rota Rápida" time="12 min" distance="0.9 km" date="há 3 dias" start="Metrô Consolação" end="Alameda Santos, 800" note="Um trecho com poste apagado reportado" onRepeat={onRepeat} />
      </ScrollView>
    </SafeAreaView>
  );
}

function HistoryCard({ title, time, distance, date, start, end, note, onRepeat }) {
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyCardTop}><Text style={styles.historyCardTitle}>{title} <Text style={styles.historyCardIcon}>{title.includes('Segura') ? '☼' : '☾'}</Text></Text><Text style={styles.historyDate}>◷ {date}</Text></View>
      <View style={styles.tripLine}><Text style={styles.tripDot}>●</Text><View><Text style={styles.tripLabel}>Ponto de Partida</Text><Text style={styles.tripAddress}>{start}</Text></View></View>
      <View style={styles.tripConnector} />
      <View style={styles.tripLine}><Text style={styles.tripPin}>⌖</Text><View><Text style={styles.tripLabel}>Destino</Text><Text style={styles.tripAddress}>{end}</Text></View></View>
      {note ? <Text style={styles.historyNote}>{note}</Text> : null}
      <View style={styles.historyCardBottom}><Text style={styles.historyDuration}>{time} <Text style={styles.historyDistance}>●  {distance}</Text></Text><Pressable style={styles.repeatButton} onPress={onRepeat}><Text style={styles.repeatText}>Repetir</Text></Pressable></View>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [destination, setDestination] = useState('');
  const [activeRoute, setActiveRoute] = useState({ type: 'Rota segura', time: 15 });
  const [location, setLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Solicitando permissão de localização...');

  const requestLocation = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationStatus('Permissão de localização negada');
        return false;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      setLocationStatus('GPS conectado · localização atual');
      return true;
    } catch (error) {
      setLocationStatus('Não foi possível acessar o sensor GPS');
      return false;
    }
  };

  useEffect(() => {
    let watcher;
    let mounted = true;

    const startLocation = async () => {
      const granted = await requestLocation();
      if (!granted || !mounted) return;
      watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 5000 },
        (update) => {
          if (mounted) {
            setLocation({ latitude: update.coords.latitude, longitude: update.coords.longitude });
            setLocationStatus('GPS conectado · atualizando em tempo real');
          }
        },
      );
    };

    startLocation();
    return () => {
      mounted = false;
      watcher?.remove();
    };
  }, []);

  const search = async () => {
    if (destination.trim()) {
      try {
        const results = await Location.geocodeAsync(destination.trim());
        if (results[0]) {
          setDestinationLocation({ latitude: results[0].latitude, longitude: results[0].longitude });
        }
      } catch (error) {
        setDestinationLocation(null);
      }
    }
    setScreen('routes');
  };
  const selectRoute = (type, time) => { setActiveRoute({ type, time }); setScreen('navigation'); };
  const retryLocation = async () => {
    await requestLocation();
    setScreen('home');
  };

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      {screen === 'home' && <HomeScreen destination={destination} setDestination={setDestination} onSearch={search} onHistory={() => setScreen('history')} onGps={() => setScreen('gps')} location={location} locationStatus={locationStatus} destinationLocation={destinationLocation} />}
      {screen === 'routes' && <RouteOptionsScreen destination={destination} location={location} destinationLocation={destinationLocation} onBack={() => setScreen('home')} onSelect={selectRoute} />}
      {screen === 'navigation' && <NavigationScreen route={activeRoute.type} time={activeRoute.time} destination={destination} location={location} destinationLocation={destinationLocation} onBack={() => setScreen('routes')} onCancel={() => setScreen('home')} />}
      {screen === 'gps' && <GpsScreen onBack={() => setScreen('home')} onRetry={retryLocation} onManual={() => setScreen('home')} />}
      {screen === 'history' && <HistoryScreen onBack={() => setScreen('home')} onRepeat={() => setScreen('routes')} />}
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1, backgroundColor: COLORS.background },
  homeContent: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 32 },
  homeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  wordmark: { color: COLORS.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  headerLink: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 15, backgroundColor: '#202020' },
  headerLinkText: { color: COLORS.cyan, fontWeight: '700', fontSize: 12 },
  searchBar: { height: 58, borderRadius: 18, backgroundColor: COLORS.surfaceRaised, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 18 },
  searchIcon: { color: COLORS.text, fontSize: 33, lineHeight: 32, marginRight: 12, transform: [{ rotate: '-20deg' }] },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 17, fontWeight: '700' },
  mapHomeWrap: { height: 360, borderRadius: 24, overflow: 'hidden', marginBottom: 16 },
  map: { flex: 1, backgroundColor: '#26373c', overflow: 'hidden', position: 'relative' },
  mapCompact: { minHeight: 330, borderRadius: 0 },
  webMap: { width: '100%', height: '100%', border: '0', display: 'block' },
  mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.25, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#78909c' },
  road: { position: 'absolute', backgroundColor: COLORS.road, borderRadius: 30, opacity: 0.95 },
  roadOne: { width: 24, height: 450, left: '55%', top: -48, transform: [{ rotate: '33deg' }] },
  roadTwo: { width: 18, height: 400, left: '28%', top: 100, transform: [{ rotate: '-29deg' }] },
  roadThree: { width: 12, height: 360, left: '69%', top: 60, transform: [{ rotate: '72deg' }] },
  roadFour: { width: 13, height: 430, left: '12%', top: 70, transform: [{ rotate: '74deg' }] },
  mapLabel: { position: 'absolute', color: '#92a0a4', fontSize: 10, fontWeight: '600', letterSpacing: 0.6 },
  labelHudson: { left: 12, top: 28, transform: [{ rotate: '-75deg' }] },
  labelCity: { left: '31%', top: '42%', color: '#d6e0e1', fontSize: 27, fontWeight: '500' },
  labelSoho: { left: '63%', top: '26%' },
  labelBrooklyn: { left: '69%', top: '62%', color: '#b5c3c5', fontSize: 12 },
  labelPark: { left: '20%', bottom: '17%' },
  destinationPin: { position: 'absolute', left: '52%', top: '45%', height: 26, width: 26, borderRadius: 20, backgroundColor: '#7ee6e7', borderWidth: 5, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  pinDot: { height: 8, width: 8, borderRadius: 8, backgroundColor: '#ffffff' },
  mapScale: { position: 'absolute', right: 16, bottom: 16, backgroundColor: 'rgba(14,20,22,.65)', paddingVertical: 6, paddingHorizontal: 9, borderRadius: 8 },
  scaleText: { color: COLORS.text, fontSize: 11, fontWeight: '700' },
  mapOverlay: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(16,16,16,0.72)', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12 },
  mapOverlayTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  mapOverlaySubtitle: { color: '#b6c5c5', fontSize: 10, marginTop: 3 },
  primaryButton: { backgroundColor: COLORS.cyan, minHeight: 56, borderRadius: 17, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 20 },
  primaryButtonText: { color: '#062a31', fontWeight: '900', fontSize: 17 },
  primaryButtonArrow: { color: '#062a31', fontSize: 24, fontWeight: '900', marginLeft: 12 },
  quickActions: { flexDirection: 'row', gap: 10 },
  quickAction: { flex: 1, minHeight: 78, borderRadius: 16, backgroundColor: '#202020', padding: 13, flexDirection: 'row', alignItems: 'center' },
  quickIcon: { fontSize: 23, color: COLORS.cyan, marginRight: 9 },
  quickTitle: { color: COLORS.text, fontWeight: '800', fontSize: 12 },
  quickSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  footerNote: { color: '#626262', textAlign: 'center', fontSize: 11, marginTop: 26 },
  routeScreen: { flex: 1 },
  routeTopBar: { position: 'absolute', top: 14, left: 18, right: 18, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 45, height: 45, borderRadius: 24, backgroundColor: 'rgba(35,35,35,.95)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: COLORS.text, fontSize: 37, lineHeight: 36, fontWeight: '300', marginTop: -4 },
  destinationPill: { flex: 1, maxWidth: 250, borderRadius: 25, paddingVertical: 13, paddingHorizontal: 18, backgroundColor: 'rgba(35,35,35,.95)' },
  destinationText: { color: COLORS.text, fontWeight: '900', fontSize: 17 },
  routeOptionsPanel: { backgroundColor: COLORS.background, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 30, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -26, zIndex: 3 },
  panelKicker: { color: COLORS.muted, fontSize: 10, letterSpacing: 1.2, fontWeight: '800', marginBottom: 14 },
  routeCard: { backgroundColor: COLORS.surface, borderRadius: 22, padding: 19, marginBottom: 14, minHeight: 125 },
  routeCardHeader: { flexDirection: 'row', alignItems: 'center' },
  routeIcon: { color: COLORS.text, fontSize: 22, width: 34 },
  routeTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  routeTime: { color: '#d1d1d1', fontSize: 13, marginTop: 9, marginLeft: 34 },
  routeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 5, marginLeft: 34, marginTop: 7 },
  routeBadgeText: { color: COLORS.text, fontSize: 11, fontWeight: '800' },
  navigationScreen: { flex: 1 },
  navigationMapWrap: { height: '64%', position: 'relative' },
  navigationTopBar: { position: 'absolute', top: 14, left: 18, right: 18, zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  navigationRouteLine: { position: 'absolute', left: '48%', top: '31%', width: 7, height: 190, backgroundColor: COLORS.cyan, borderRadius: 8, transform: [{ rotate: '-29deg' }] },
  arrivalPanel: { flex: 1, backgroundColor: COLORS.background, marginTop: -18, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 26, paddingTop: 26, alignItems: 'center' },
  arrivalKicker: { color: COLORS.cyan, fontWeight: '900', fontSize: 10, letterSpacing: 1.4, marginBottom: 14 },
  arrivalTitle: { color: COLORS.text, fontWeight: '800', fontSize: 22 },
  arrivalTime: { color: COLORS.text, fontSize: 44, fontWeight: '900', letterSpacing: -1, marginTop: 3 },
  routeStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 24 },
  routeStatusDot: { color: COLORS.cyan, marginRight: 7 },
  routeStatus: { color: COLORS.muted, fontSize: 13 },
  cancelButton: { width: '100%', backgroundColor: COLORS.surfaceRaised, borderRadius: 17, minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: COLORS.text, fontWeight: '900', fontSize: 17 },
  gpsContent: { padding: 22, paddingBottom: 32 },
  screenHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  screenTitle: { color: COLORS.text, fontSize: 21, fontWeight: '900' },
  screenSubtitle: { color: COLORS.cyan, fontSize: 12, marginTop: 4 },
  gpsCard: { alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 24, marginBottom: 22 },
  gpsCircle: { width: 54, height: 54, borderRadius: 30, borderWidth: 2, borderColor: COLORS.cyanDark, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  gpsCircleIcon: { color: COLORS.cyan, fontSize: 26 },
  gpsCross: { position: 'absolute', right: 6, bottom: 2, color: COLORS.text, fontSize: 22, fontWeight: '900' },
  gpsTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  gpsDescription: { color: COLORS.muted, fontSize: 12, textAlign: 'center', lineHeight: 17, marginTop: 9 },
  lastLocation: { color: '#d3d3d3', backgroundColor: '#3b3b3b', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 7, fontSize: 11, marginTop: 16 },
  sectionLabel: { color: COLORS.text, fontSize: 14, fontWeight: '800', marginBottom: 8 },
  gpsAction: { backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  gpsActionTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  gpsActionText: { color: COLORS.muted, fontSize: 10, marginTop: 4, maxWidth: 270 },
  gpsActionArrow: { color: COLORS.text, fontSize: 25 },
  safetyTip: { backgroundColor: COLORS.surface, padding: 12, borderRadius: 7, marginTop: 14, alignItems: 'center' },
  safetyTipTitle: { color: '#d4d4d4', fontSize: 12, fontWeight: '700' },
  safetyTipText: { color: COLORS.muted, fontSize: 10, lineHeight: 14, textAlign: 'center', marginTop: 6 },
  historyContent: { padding: 22, paddingBottom: 32 },
  historyHeading: { flex: 1 },
  datePill: { backgroundColor: '#154d55', borderRadius: 10, paddingVertical: 4, paddingHorizontal: 7 },
  datePillText: { color: COLORS.cyan, fontSize: 9, fontWeight: '800' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  filter: { color: COLORS.text, backgroundColor: COLORS.surface, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 16, fontSize: 11, fontWeight: '800' },
  filterActive: { backgroundColor: '#4b9b9f' },
  historyCard: { backgroundColor: COLORS.surface, borderRadius: 17, padding: 15, marginBottom: 13 },
  historyCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  historyCardTitle: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  historyCardIcon: { color: '#d0d0d0', fontSize: 17 },
  historyDate: { color: '#a9a9a9', fontSize: 11 },
  tripLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  tripDot: { color: COLORS.cyan, fontSize: 16, lineHeight: 17 },
  tripPin: { color: COLORS.text, fontSize: 18, lineHeight: 17 },
  tripLabel: { color: COLORS.muted, fontSize: 10 },
  tripAddress: { color: COLORS.text, fontSize: 12, fontWeight: '800', marginTop: 3 },
  tripConnector: { height: 16, width: 2, backgroundColor: COLORS.cyanDark, marginLeft: 6, marginVertical: 0 },
  historyNote: { color: '#d2d2d2', fontSize: 10, backgroundColor: '#3a3a3a', borderRadius: 6, padding: 7, marginTop: 14 },
  historyCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  historyDuration: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  historyDistance: { color: COLORS.muted, fontSize: 11, fontWeight: '500' },
  repeatButton: { backgroundColor: '#1e817d', borderRadius: 6, paddingHorizontal: 15, paddingVertical: 8 },
  repeatText: { color: '#baf3ee', fontWeight: '800', fontSize: 11 },
});
