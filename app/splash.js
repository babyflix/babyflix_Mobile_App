// import { Stack } from 'expo-router';
// import SplashScreen from '../src/screens/SplashScreen';

// export default function Splash() {
//   return (
//     <>
//       <Stack.Screen options={{ headerShown: false }} />
//       <SplashScreen />
//     </>
//   );
// }

// app/splash.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import * as ExpoSplashScreen from 'expo-splash-screen';
import Colors from '../src/constants/Colors';
import { Stack } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Splash() {
  const router = useRouter();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        await ExpoSplashScreen.preventAutoHideAsync();
        // Simulate loading
        setTimeout(() => {
          setAppIsReady(true);
        }, 2000);
      } catch (e) {
        console.warn('Splash error:', e);
      }
    };
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      router.replace(isAuthenticated ? '/(app)/gallery' : '/(auth)/login');
    }
  }, [appIsReady, isAuthenticated]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await ExpoSplashScreen.hideAsync();
    }
  }, [appIsReady]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container} onLayout={onLayoutRootView}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
  },
});
