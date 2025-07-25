import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'downloadQueue';

export const useDownloadQueueHandler = (downloadQueue, resumeDownload) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (
        appState.current.match(/active/) &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(downloadQueue));
        } catch (e) {
          console.error('Failed to save download queue:', e);
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [downloadQueue]);

  useEffect(() => {
    const restoreQueue = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedQueue = JSON.parse(stored);
          for (const item of parsedQueue) {
            resumeDownload(item);
          }
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to restore download queue:', e);
      }
    };

    restoreQueue();
  }, []);
};

