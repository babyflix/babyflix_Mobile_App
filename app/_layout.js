// import { Stack } from 'expo-router';
// import { Provider } from 'react-redux';
// import { store } from '../src/state/store';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import Snackbar from '../src/components/Snackbar';
// import Loader from '../src/components/Loader';
// import LiveStreamStatus from '../src/screens/LiveStreamStatus';

// import { useFonts } from 'expo-font';
// import {
//   Poppins_400Regular,
//   Poppins_500Medium,
//   Poppins_600SemiBold,
//   Poppins_700Bold,
// } from '@expo-google-fonts/poppins';

// import { Text } from 'react-native';

// export default function RootLayout() {
//   const [fontsLoaded] = useFonts({
//     Poppins_400Regular,
//     Poppins_500Medium,
//     Poppins_600SemiBold,
//     Poppins_700Bold,
//   });

//   if (!fontsLoaded) {
//     return null; // Or use a loading screen
//   }

//   return (
//     <Provider store={store}>
//       <SafeAreaProvider>
//         <Stack screenOptions={{ headerShown: false }} initialRouteName="splash">
//           <Stack.Screen name="index" />
//           <Stack.Screen name="splash" />
//           <Stack.Screen name="(auth)" options={{ headerShown: false }} />
//           <Stack.Screen name="(app)" options={{ headerShown: false }} />
//         </Stack>
//         <Snackbar />
//         <Loader />
//       </SafeAreaProvider>
//     </Provider>
//   );
// }

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from '../src/state/store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Snackbar from '../src/components/Snackbar';
import Loader from '../src/components/Loader';
import AuthLoader from '../src/components/AuthLoader';
import NetInfo from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker';
import { showSnackbar } from '../src/state/slices/uiSlice';
import { Text, TextInput } from 'react-native';

import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

const LayoutContent = () => {
  const dispatch = useDispatch();
  const { loading, snackbar } = useSelector((state) => state.ui);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [isConnected, setIsConnected] = useState(null);

  useEffect(() => {
    const checkConnection = async () => {
      const state = await NetInfo.fetch(); // Check the current connection status once
      setIsConnected(state.isConnected);
    };

    checkConnection(); // Check connection on load

    const unsubscribe = NetInfo.addEventListener(state => {
      const isNowConnected = state.isConnected;

      if (isConnected === null) {
        // First check (on mount)
        if (!isNowConnected) {
          dispatch(showSnackbar({ visible: true, message: 'No internet connection', type: 'error' }));
          setTimeout(() => {
            dispatch(showSnackbar({ visible: false, message: '', type: '' }));
          }, 3000);
        }
      } else {
        if (!isNowConnected) {
          dispatch(showSnackbar({ visible: true, message: 'No internet connection', type: 'error' }));
          setTimeout(() => {
            dispatch(showSnackbar({ visible: false, message: '', type: '' }));
          }, 3000);
        } else if (!isConnected && isNowConnected) {
          // Only show 'online' if coming back from offline
          dispatch(showSnackbar({ visible: true, message: 'You are online', type: 'success' }));

          // Hide snackbar after 3 seconds
          setTimeout(() => {
            dispatch(showSnackbar({ visible: false, message: '', type: '' }));
          }, 3000);
        }
      }

      setIsConnected(isNowConnected);
    });

    return () => unsubscribe();
  }, [isConnected, dispatch]);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Please enable media access.');
      }
    };
    if (isAuthenticated) requestPermissions();
  }, [isAuthenticated]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} initialRouteName="splash">
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <Snackbar {...snackbar} />
      <Loader loading={loading} />
    </>
  );
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  // Prevent scaling
  if (Text.defaultProps == null) Text.defaultProps = {};
  if (TextInput.defaultProps == null) TextInput.defaultProps = {};
  Text.defaultProps.allowFontScaling = false;
  TextInput.defaultProps.allowFontScaling = false;
  TextInput.defaultProps.style = [{ color: 'black' }];

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AuthLoader>
          <LayoutContent />
        </AuthLoader>
      </SafeAreaProvider>
    </Provider>
  );
}
