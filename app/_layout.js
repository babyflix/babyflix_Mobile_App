import React, { useEffect, useRef, useState } from 'react';
import { ErrorBoundary, Stack, useRouter } from 'expo-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from '../src/state/store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Snackbar from '../src/components/Snackbar';
import Loader from '../src/components/Loader';
import AuthLoader from '../src/components/AuthLoader';
import NetInfo from '@react-native-community/netinfo';
import { showSnackbar } from '../src/state/slices/uiSlice';
import { Alert, Linking, Platform, Text, TextInput } from 'react-native';
import { HeaderActionProvider } from '../src/components/HeaderActionContext';
import { NotificationProvider } from '../src/constants/NotificationContext';

import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { ShadowsIntoLight_400Regular } from '@expo-google-fonts/shadows-into-light';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { DancingScript_400Regular } from '@expo-google-fonts/dancing-script';
import { Quicksand_400Regular, Quicksand_600SemiBold } from '@expo-google-fonts/quicksand';
import { 
  Nunito_400Regular,
  Nunito_700Bold
} from '@expo-google-fonts/nunito';

import { getStoragePlanDetails } from '../src/components/getStoragePlanDetails';
import { registerForPushNotificationsAsync } from '../src/components/notifications';
import { requestMediaLibraryPermission } from '../src/components/requestMediaPermission';
import "../src/constants/i18n"; 
import { setDeepLinkHandled } from '../src/state/slices/storageUISlice';

const LayoutContent = () => {
  const dispatch = useDispatch();
  const { loading, snackbar } = useSelector((state) => state.ui);
  const user = useSelector((state) => state.auth);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const deepLinkHandled = useSelector((state) => state.storageUI.deepLinkHandled);
  const [isConnected, setIsConnected] = useState(null);

  const router = useRouter();

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

useEffect(() => {
  const requestPermissions = async () => {
    if (isAuthenticated) {
      const granted = await requestMediaLibraryPermission();
    }
  };
  requestPermissions();
}, [isAuthenticated]);

   useEffect(() => {
    if (isAuthenticated && user?.email) {
      getStoragePlanDetails(user.email, dispatch);
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
  if (user?.uuid) {
    registerForPushNotificationsAsync(user?.uuid);
  }
}, []);

useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const { data } = response.notification.request.content;

    if (data?.screen === 'LiveStream' && data?.userId) {
      router.push({
        pathname: '/gallery',
        query: { userId: data.userId },
      });
    }
  });

  return () => subscription.remove();
}, []);


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

useEffect(() => {
  const sub = Linking.addEventListener("url", ({ url }) => {
    if (url.includes("payment-redirect")) {
      if (!deepLinkHandled) { 
        console.log("Deep link URL:", url);
        dispatch(setDeepLinkHandled(true));
        router.replace(url.replace("babyflix://", "/"));
      }
    }
  });

  return () => sub.remove();
}, [deepLinkHandled, dispatch, router]);


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
      {/* <LanguageModal visible={showLangModal} onClose={() => setShowLangModal(false)} /> */}
    </>
  );
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    ShadowsIntoLight: ShadowsIntoLight_400Regular,
    Pacifico: Pacifico_400Regular,
    DancingScript: DancingScript_400Regular,
    Quicksand400: Quicksand_400Regular,
    Quicksand600: Quicksand_600SemiBold,
    Nunito400: Nunito_400Regular,
    Nunito700: Nunito_700Bold,
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
        <NotificationProvider>
        <HeaderActionProvider>
        <AuthLoader>
          <LayoutContent />
        </AuthLoader>
        </HeaderActionProvider>
        </NotificationProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
