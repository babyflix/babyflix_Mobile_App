import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

const tourKey = (screenId, userId) => `babyflix_tour_${screenId}_${userId}`;

// Every screenId that has a guided tour — used by the "Replay Tour" menu
// item to reset all of them at once. Add new screen ids here as more tours
// get added elsewhere in the app.
export const TOUR_SCREEN_IDS = ['gallery'];

export const isTourSeen = async (screenId, userId) => {
  const val = await AsyncStorage.getItem(tourKey(screenId, userId));
  return val === 'true';
};

export const setTourSeen = async (screenId, userId) => {
  await AsyncStorage.setItem(tourKey(screenId, userId), 'true');
};

export const resetTour = async (screenId, userId) => {
  await AsyncStorage.removeItem(tourKey(screenId, userId));
};

export const TourContext = createContext(null);

function useTourContext() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('Tour hooks must be used within a TourProvider');
  return ctx;
}

export function useTour() {
  return useTourContext();
}

// Registers a ref for a specific step's target element so the overlay can
// measure and spotlight it. Call once per element you want highlighted.
export function useTourTarget(screenId, stepId) {
  const { registerTarget, unregisterTarget } = useTourContext();
  const ref = useRef(null);

  useEffect(() => {
    registerTarget(screenId, stepId, ref);
    return () => unregisterTarget(screenId, stepId);
  }, [screenId, stepId, registerTarget, unregisterTarget]);

  return ref;
}

// Registers a screen's ScrollView so the overlay can auto-scroll an
// off-screen target into view before spotlighting it. Optional.
export function useTourScrollRef(screenId) {
  const { registerScrollRef, unregisterScrollRef } = useTourContext();
  const ref = useRef(null);

  useEffect(() => {
    registerScrollRef(screenId, ref);
    return () => unregisterScrollRef(screenId);
  }, [screenId, registerScrollRef, unregisterScrollRef]);

  return ref;
}

// Call once per screen. Automatically starts the tour on first focus if the
// current user hasn't seen it yet on this screen.
export function useScreenTour(screenId, steps) {
  const { start, abortIfActive } = useTourContext();
  const userId = useSelector((state) => state.auth?.uuid);

  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let cancelled = false;
      let timer = null;

      isTourSeen(screenId, userId).then((seen) => {
        if (seen || cancelled) return;
        timer = setTimeout(() => {
          if (!cancelled) start(screenId, stepsRef.current);
        }, 500);
      });

      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
        abortIfActive(screenId);
      };
    }, [screenId, userId])
  );
}
