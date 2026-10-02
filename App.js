import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDeviceLocation } from './hooks/useDeviceLocation';
import { useRouteHistory } from './hooks/useRouteHistory';
import GpsPage from './pages/GpsPage';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import NavigationPage from './pages/NavigationPage';
import RouteOptionsPage from './pages/RouteOptionsPage';
import { geocodeDestination, searchDestinations } from './services/geocoding';
import { calculateRoutes } from './services/routing';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [destinationText, setDestinationText] = useState('');
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);
  const { location, status: locationStatus, permissionDenied, requestLocation } = useDeviceLocation();
  const { history, addCompletedRoute, clearHistory } = useRouteHistory();

  useEffect(() => {
    if (destinationText.trim().length < 2) {
      setSuggestions([]);
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setSearchingSuggestions(true);
      try {
        const results = await searchDestinations(destinationText);
        if (active) setSuggestions(results);
      } catch (suggestionError) {
        if (active) setSuggestions([]);
      } finally {
        if (active) setSearchingSuggestions(false);
      }
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [destinationText]);

  const openHome = () => {
    setError('');
    setScreen('home');
  };

  const findRoute = async (query = destinationText, selectedDestination = null) => {
    setError('');
    setLoading(true);
    try {
      const nextDestination = selectedDestination || await geocodeDestination(query);
      setDestination(nextDestination);
      setDestinationText(query);
      setSuggestions([]);

      if (!location) {
        setError('Destino encontrado. Ative o GPS para calcular a rota.');
        setScreen('gps');
        return;
      }

      setRoutes([]);
      setSelectedRoute(null);
      setScreen('routes');
      const nextRoutes = await calculateRoutes(location, nextDestination);
      setRoutes(nextRoutes);
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível encontrar a rota.');
      setScreen('home');
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setDestinationText(suggestion.label);
    setSuggestions([]);
    findRoute(suggestion.label, suggestion);
  };

  const retryLocation = async () => {
    const currentLocation = await requestLocation();
    if (currentLocation && destination) {
      setLoading(true);
      setError('');
      try {
        const nextRoutes = await calculateRoutes(currentLocation, destination);
        setRoutes(nextRoutes);
        setScreen('routes');
      } catch (routeError) {
        setError(routeError.message || 'Não foi possível calcular a rota.');
        setScreen('home');
      } finally {
        setLoading(false);
      }
    } else {
      openHome();
    }
  };

  const completeRoute = () => {
    if (!destination || !selectedRoute || !location) return;
    addCompletedRoute({
      destinationLabel: destination.label,
      destinationCoordinates: destination,
      originCoordinates: location,
      originLabel: `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`,
      distanceMeters: selectedRoute.distanceMeters,
      durationSeconds: selectedRoute.durationSeconds,
      modeLabel: selectedRoute.modeLabel,
      lightingScore: selectedRoute.lightingScore,
    });
    setScreen('home');
    setDestinationText('');
    setDestination(null);
    setRoutes([]);
    setSelectedRoute(null);
  };

  const repeatRoute = (savedRoute) => {
    setDestinationText(savedRoute.destinationLabel);
    findRoute(savedRoute.destinationLabel);
  };

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      {screen === 'home' ? <HomePage destinationText={destinationText} setDestinationText={setDestinationText} onSearch={() => findRoute()} onSelectSuggestion={selectSuggestion} suggestions={suggestions} searchingSuggestions={searchingSuggestions} onHistory={() => setScreen('history')} onGps={() => setScreen('gps')} location={location} locationStatus={locationStatus} error={error} loading={loading} /> : null}
      {screen === 'routes' && destination ? <RouteOptionsPage destination={destination} location={location} routes={routes} loading={loading} error={error} onBack={openHome} onSelect={(route) => { setSelectedRoute(route); setScreen('navigation'); }} /> : null}
      {screen === 'navigation' && destination && selectedRoute ? <NavigationPage destination={destination} location={location} route={selectedRoute} onBack={() => setScreen('routes')} onFinish={completeRoute} /> : null}
      {screen === 'gps' ? <GpsPage status={locationStatus} permissionDenied={permissionDenied} onBack={openHome} onRetry={retryLocation} /> : null}
      {screen === 'history' ? <HistoryPage history={history} onBack={openHome} onRepeat={repeatRoute} onClear={clearHistory} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({ app: { flex: 1, backgroundColor: '#111' } });
