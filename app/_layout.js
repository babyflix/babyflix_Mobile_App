import React, { useEffect, useState } from 'react';
import { ErrorBoundary, Stack } from 'expo-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from '../src/state/store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Snackbar from '../src/components/Snackbar';
import Loader from '../src/components/Loader';
import AuthLoader from '../src/components/AuthLoader';
import NetInfo from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker';
import { showSnackbar } from '../src/state/slices/uiSlice';
import { Alert, Linking, Platform, Text, TextInput } from 'react-native';
import Constants from 'expo-constants';
import { HeaderActionProvider } from '../src/components/HeaderActionContext';
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';

import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { getStoragePlanDetails } from '../src/components/getStoragePlanDetails';
import { registerForPushNotificationsAsync } from '../src/components/notifications';
import { requestMediaLibraryPermission } from '../src/components/requestMediaPermission';

const LayoutContent = () => {
  const dispatch = useDispatch();
  const { loading, snackbar } = useSelector((state) => state.ui);
  const user = useSelector((state) => state.auth);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [isConnected, setIsConnected] = useState(null);
  const [isUpdatePromptShown, setIsUpdatePromptShown] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const state = await NetInfo.fetch(); 
      setIsConnected(state.isConnected);
    };

    checkConnection(); 

    const unsubscribe = NetInfo.addEventListener(state => {
      const isNowConnected = state.isConnected;

      if (isConnected === null) {
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
          dispatch(showSnackbar({ visible: true, message: 'You are online', type: 'success' }));

          setTimeout(() => {
            dispatch(showSnackbar({ visible: false, message: '', type: '' }));
          }, 3000);
        }
      }

      setIsConnected(isNowConnected);
    });

    return () => unsubscribe();
  }, [isConnected, dispatch]);

//   useEffect(() => {
//   const requestPermissions = async () => {
//     try {
//       const { status, granted, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (status !== 'granted' && !granted && !canAskAgain) {
//         Alert.alert('Permission Required', 'Please enable media access in Settings.');
//       }
//     } catch (error) {
//       console.warn('Permission request failed:', error);
//     }
//   };
//   if (isAuthenticated) requestPermissions();
// }, [isAuthenticated]);   

useEffect(() => {
  const requestPermissions = async () => {
    if (isAuthenticated) {
      const granted = await requestMediaLibraryPermission();
      // You don't need to do anything else here
    }
  };
  requestPermissions();
}, [isAuthenticated]);

   useEffect(() => {
    if (isAuthenticated && user?.email) {
      getStoragePlanDetails(user.email, dispatch);
    }
  }, [isAuthenticated, user?.email]);

//   useEffect(() => {
//   if (user?.id) {
//     registerForPushNotificationsAsync(user.id);
//   }
// }, []);

useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const { uri, mimeType } = response.notification.request.content.data;

    if (uri) {
      if (Platform.OS === 'android') {
        try {
          IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: uri,
            flags: 1,
            type: mimeType || 'video/*',
          });
        } catch (e) {
          console.warn('Failed to open file:', e.message);
        }
      } else if (Platform.OS === 'ios') {
        Linking.openURL(uri);
      }
    }
  });

  return () => subscription.remove();
}, []);

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

  if (Text.defaultProps == null) Text.defaultProps = {};
  if (TextInput.defaultProps == null) TextInput.defaultProps = {};
  Text.defaultProps.allowFontScaling = false;
  TextInput.defaultProps.allowFontScaling = false;
  TextInput.defaultProps.style = [{ color: 'black' }];

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <HeaderActionProvider>
        <AuthLoader>
          <LayoutContent />
        </AuthLoader>
        </HeaderActionProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
