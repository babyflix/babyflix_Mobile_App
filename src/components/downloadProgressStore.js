import { useSyncExternalStore } from 'react';

// Download progress lives outside React state so that frequent progress
// ticks only re-render FloatingDownloadBar, not the whole Gallery screen.
// The setters accept a value or an updater function, like useState setters,
// so they can be passed anywhere a useState setter was passed before.

let state = {
  visible: false,
  progress: 0,
  title: '',
  activeDownloads: 0,
};

const listeners = new Set();

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;

const createSetter = (key) => (valueOrUpdater) => {
  const next =
    typeof valueOrUpdater === 'function'
      ? valueOrUpdater(state[key])
      : valueOrUpdater;
  if (Object.is(next, state[key])) return;
  state = { ...state, [key]: next };
  listeners.forEach((listener) => listener());
};

export const setDownloadVisible = createSetter('visible');
export const setDownloadProgress = createSetter('progress');
export const setDownloadTitle = createSetter('title');
export const setActiveDownloads = createSetter('activeDownloads');

export const useDownloadProgress = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
