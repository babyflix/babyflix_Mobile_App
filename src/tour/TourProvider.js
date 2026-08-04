import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TourContext, setTourSeen } from './TourContext';
import TourOverlay from './TourOverlay';

const keyOf = ({ screenId, stepId }) => `${screenId}::${stepId}`;

export default function TourProvider({ children }) {
  const userId = useSelector((state) => state.auth?.uuid);
  // Read insets here, in the normal screen tree — not inside TourOverlay's
  // <Modal>, where useSafeAreaInsets() can return a stale/incorrect value
  // since a Modal is a separate native render root.
  const insets = useSafeAreaInsets();
  const [activeScreenId, setActiveScreenId] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeSteps, setActiveSteps] = useState([]);
  const targetsRef = useRef(new Map());
  const scrollRefsRef = useRef(new Map());

  const activeScreenIdRef = useRef(null);
  useEffect(() => { activeScreenIdRef.current = activeScreenId; }, [activeScreenId]);
  const userIdRef = useRef(userId);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  const registerTarget = useCallback((screenId, stepId, ref) => {
    targetsRef.current.set(keyOf({ screenId, stepId }), ref);
  }, []);

  const unregisterTarget = useCallback((screenId, stepId) => {
    targetsRef.current.delete(keyOf({ screenId, stepId }));
  }, []);

  const getTargetRef = useCallback((screenId, stepId) => {
    return targetsRef.current.get(keyOf({ screenId, stepId }));
  }, []);

  const registerScrollRef = useCallback((screenId, ref) => {
    scrollRefsRef.current.set(screenId, ref);
  }, []);

  const unregisterScrollRef = useCallback((screenId) => {
    scrollRefsRef.current.delete(screenId);
  }, []);

  const getScrollRef = useCallback((screenId) => {
    return scrollRefsRef.current.get(screenId);
  }, []);

  const finish = useCallback(() => {
    const screenId = activeScreenIdRef.current;
    setActiveScreenId(null);
    setActiveStepIndex(0);
    setActiveSteps([]);
    if (screenId && userIdRef.current) {
      setTourSeen(screenId, userIdRef.current).catch(() => {});
    }
  }, []);

  const start = useCallback((screenId, steps) => {
    setActiveSteps(steps);
    setActiveStepIndex(0);
    setActiveScreenId(screenId);
  }, []);

  const next = useCallback(() => {
    if (activeStepIndex + 1 >= activeSteps.length) {
      finish();
    } else {
      setActiveStepIndex(activeStepIndex + 1);
    }
  }, [activeStepIndex, activeSteps.length, finish]);

  const previous = useCallback(() => {
    setActiveStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  const abortIfActive = useCallback((screenId) => {
    if (activeScreenIdRef.current !== screenId) return;
    setActiveScreenId(null);
    setActiveStepIndex(0);
    setActiveSteps([]);
  }, []);

  useEffect(() => {
    if (!activeScreenId) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      skip();
      return true;
    });
    return () => sub.remove();
  }, [activeScreenId, skip]);

  const value = {
    activeScreenId,
    activeStepIndex,
    activeSteps,
    start,
    next,
    previous,
    skip,
    abortIfActive,
    registerTarget,
    unregisterTarget,
    getTargetRef,
    registerScrollRef,
    unregisterScrollRef,
    getScrollRef,
    insets,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      <TourOverlay />
    </TourContext.Provider>
  );
}
