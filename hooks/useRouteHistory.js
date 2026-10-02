import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const STORAGE_KEY = '@light-street/routes';

export function useRouteHistory() {
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value) setHistory(JSON.parse(value));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history)).catch(() => {});
  }, [history, loaded]);

  const addCompletedRoute = (route) => {
    const record = {
      ...route,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      completedAt: new Date().toISOString(),
    };
    setHistory((current) => [record, ...current]);
    return record;
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return { history, addCompletedRoute, clearHistory };
}
