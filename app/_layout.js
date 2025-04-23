import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../src/state/store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Snackbar from '../src/components/Snackbar';
import Loader from '../src/components/Loader';
import LiveStreamStatus from '../src/screens/LiveStreamStatus';

import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { Text } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null; // Or use a loading screen
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="splash">
          <Stack.Screen name="index" />
          <Stack.Screen name="splash" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
        <Snackbar />
        <Loader />
      </SafeAreaProvider>
    </Provider>
  );
}

