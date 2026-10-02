import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export function useDeviceLocation() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('Solicitando permissão de localização...');
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocation = useCallback(async () => {
    try {
      setStatus('Solicitando permissão de localização...');
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setPermissionDenied(true);
        setStatus('Permissão de localização negada');
        return null;
      }

      setPermissionDenied(false);
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nextLocation = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setLocation(nextLocation);
      setStatus('GPS conectado · localização atual');
      return nextLocation;
    } catch (error) {
      setStatus('Não foi possível acessar o sensor GPS');
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let watcher;

    const startWatcher = async () => {
      const current = await requestLocation();
      if (!current || !mounted) return;

      watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 5000 },
        (update) => {
          if (!mounted) return;
          setLocation({ latitude: update.coords.latitude, longitude: update.coords.longitude });
          setStatus('GPS conectado · atualizando em tempo real');
        },
      );
    };

    startWatcher();
    return () => {
      mounted = false;
      watcher?.remove();
    };
  }, [requestLocation]);

  return { location, status, permissionDenied, requestLocation };
}
