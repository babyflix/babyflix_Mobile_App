import React, { useEffect, useRef, useState } from 'react';
import { ErrorBoundary, Stack, useRouter } from 'expo-router';
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
import { NotificationProvider } from '../src/constants/NotificationContext';
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Device from "expo-device";

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
import sendDeviceUserInfo from '../src/components/deviceInfo';
import LanguageModal from '../src/constants/LanguageModal';
import "../src/constants/i18n"; // Ensure i18n is initialized
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setupI18n } from '../src/constants/i18n';
//import sendDeviceUserInfo from '../src/components/deviceInfo';
import { setDeepLinkHandled } from '../src/state/slices/storageUISlice';

const LayoutContent = () => {
  const dispatch = useDispatch();
  const { loading, snackbar } = useSelector((state) => state.ui);
  const user = useSelector((state) => state.auth);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const deepLinkHandled = useSelector((state) => state.storageUI.deepLinkHandled);
  const [isConnected, setIsConnected] = useState(null);
  const [isUpdatePromptShown, setIsUpdatePromptShown] = useState(false);
  const [ready, setReady] = useState(false);
  //  const [showLangModal, setShowLangModal] = useState(false);

  const router = useRouter();
  const handledRef = useRef(false);

  // useEffect(() => {
  //   //sendDeviceUserInfo(user);
  //   sendDeviceUserInfo({
  //     action_type: "APP_OPENED",
  //     action_description: "User opened the app",
  //   });
  // }, [user]);

  // useEffect(() => {
  //   const checkLanguage = async () => {
  //     const lang = await AsyncStorage.getItem("appLanguage");
  //     console.log('Language from storage:', lang);
  //     if (!lang) {
  //       setShowLangModal(true); // show modal if not selected
  //     } else {
  //       i18n.changeLanguage(lang); // apply saved language
  //     }
  //   };
  //   checkLanguage();
  // }, []);

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

  useEffect(() => {
  if (user?.uuid) {
    registerForPushNotificationsAsync(user?.uuid);
  }
}, []);
//  useEffect(() => {
//     registerForPushNotificationsAsync();
//   }, []);


useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const { data } = response.notification.request.content;

    if (data?.screen === 'LiveStream' && data?.userId) {
      router.push({
        pathname: '/gallery',
        query: { userId: data.userId }, // ✅ use query, not params
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

// useEffect(() => {
//     Linking.getInitialURL().then((url) => {
//       if (url) {
//         console.log("Initial URL:", url); // ✅ Log it!
//         const parsed = Linking.parse(url);
//         console.log("Parsed deep link:", parsed); // ✅ Show parsed path & query

//         if (parsed.path === 'payment-redirect') {
//           router.replace('/(app)/payment-redirect');
//         }
//       }
//     });

//     const sub = Linking.addEventListener('url', (event) => {
//       const parsed = Linking.parse(event.url);
//       console.log("URL event:", parsed); // ✅ Debug log
//       if (parsed.path === 'payment-redirect') {
//         router.replace('/(app)/payment-redirect');
//       }
//     });

//     return () => sub.remove();
//   }, []);

// useEffect(() => {
//   const sub = Linking.addEventListener("url", ({ url }) => {
//     if (url.includes("payment-redirect")) {
//       console.log("Deep link URL:", url); // ✅ Log it
//       router.replace(url.replace("babyflix://", "/"));
//     }
//   });
//   return () => sub.remove();
// }, []);

// useEffect(() => {
//     const handleDeepLink = ({ url }) => {
//       if (url.includes("payment-redirect") && !handledRef.current) {
//         handledRef.current = true; // ✅ block further calls
//         console.log("Deep link URL (handled once):", url);

//         // Navigate only once
//         router.replace(url.replace("babyflix://", "/"));
//       }
//     };

//     const subscription = Linking.addEventListener("url", handleDeepLink);

//     return () => {
//       subscription.remove();
//     };
//   }, []);

useEffect(() => {
  const sub = Linking.addEventListener("url", ({ url }) => {
    if (url.includes("payment-redirect")) {
      if (!deepLinkHandled) { // ✅ check redux flag
        console.log("Deep link URL:", url);
        dispatch(setDeepLinkHandled(true)); // mark as handled
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
