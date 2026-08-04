import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// On Android, `insets.bottom` from safe-area-context is only accurate once
// the app is properly configured for edge-to-edge at the native level
// (app.config.js's edgeToEdgeEnabled). On a dev client built BEFORE that
// config existed, insets.bottom can silently report 0 even though the
// classic 3-button system nav bar is actually covering app content —
// so anything computed purely from insets.bottom becomes a no-op.
//
// Dimensions.get('screen') (full physical display) vs Dimensions.get('window')
// (usable app window) are core React Native APIs, not gated behind any Expo
// config or native rebuild — the gap between them is the real, currently-
// measured height of system bars encroaching on the window. We use the max
// of that gap and insets.bottom so this works whether or not insets are
// currently being reported correctly, and still resolves to ~0 on
// gesture-nav devices where there's nothing to clear.
const getNavBarHeightFromDimensions = () => {
  if (Platform.OS !== 'android') return 0;
  const screen = Dimensions.get('screen');
  const window = Dimensions.get('window');
  const diff = screen.height - window.height;
  return diff > 0 ? diff : 0;
};

const useAndroidNavBarHeight = () => {
  const insets = useSafeAreaInsets();
  const [dimsNavBarHeight, setDimsNavBarHeight] = useState(getNavBarHeightFromDimensions);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = Dimensions.addEventListener('change', () => {
      setDimsNavBarHeight(getNavBarHeightFromDimensions());
    });
    return () => sub?.remove?.();
  }, []);

  if (Platform.OS !== 'android') return 0;
  return Math.max(insets.bottom, dimsNavBarHeight);
};

export default useAndroidNavBarHeight;
