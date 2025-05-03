// import React from 'react';
// import { Provider } from 'react-redux';
// import { store } from './src/state/store';
// import { NavigationContainer } from '@react-navigation/native';
// import AppNavigator from './src/navigation/AppNavigator';
// import { StatusBar } from 'expo-status-bar';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import Snackbar from './src/components/Snackbar';
// import Loader from './src/components/Loader';
// import { useSelector } from 'react-redux';
// import { API_URL, DEBUG } from '@env';
// import 'react-native-polyfill-globals/auto';
// import 'react-native-url-polyfill/auto';

// import { useFonts } from 'expo-font';
// import {
//   Poppins_400Regular,
//   Poppins_500Medium,
//   Poppins_600SemiBold,
//   Poppins_700Bold,
// } from '@expo-google-fonts/poppins';

// const AppContent = () => {
//   const { loading } = useSelector((state) => state.ui);
//   const snackbar = useSelector((state) => state.ui.snackbar);

//   return (
//     <>
//       <NavigationContainer>
//         <AppNavigator />
//       </NavigationContainer>
//       <StatusBar style="auto" />
//       <Snackbar
//         visible={snackbar.visible}
//         message={snackbar.message}
//         type={snackbar.type}
//       />
//       <Loader loading={loading} />
//     </>
//   );
// };

// export default function App() {
//   const [fontsLoaded] = useFonts({
//     Poppins_400Regular,
//     Poppins_500Medium,
//     Poppins_600SemiBold,
//     Poppins_700Bold,
//   });

//   if (!fontsLoaded) {
//     return null; 
//   }

//   const { Text, TextInput } = require('react-native');
//   if (Text.defaultProps == null) Text.defaultProps = {};
//   if (TextInput.defaultProps == null) TextInput.defaultProps = {};
//   Text.defaultProps.allowFontScaling = false;
//   TextInput.defaultProps.allowFontScaling = false;
//   TextInput.defaultProps = TextInput.defaultProps || {};
// TextInput.defaultProps.style = [{ color: 'black' }];


//   return (
//     <Provider store={store}>
//       <SafeAreaProvider>
//         <AppContent />
//       </SafeAreaProvider>
//     </Provider>
//   );
// }


// import React, { useEffect, useState } from 'react';
// import { Provider, useDispatch, useSelector } from 'react-redux';
// import { store } from './src/state/store';
// import { NavigationContainer } from '@react-navigation/native';
// import AppNavigator from './src/navigation/AppNavigator';
// import { StatusBar } from 'expo-status-bar';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import Snackbar from './src/components/Snackbar';
// import Loader from './src/components/Loader';
// import { API_URL, DEBUG } from '@env';
// import 'react-native-polyfill-globals/auto';
// import 'react-native-url-polyfill/auto';

// import { useFonts } from 'expo-font';
// import {
//   Poppins_400Regular,
//   Poppins_500Medium,
//   Poppins_600SemiBold,
//   Poppins_700Bold,
// } from '@expo-google-fonts/poppins';

// import NetInfo from '@react-native-community/netinfo';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { setCredentials, logout } from './src/state/slices/authSlice';
// import * as ImagePicker from 'expo-image-picker';

// const AuthLoader = ({ children }) => {
//   const [checkingAuth, setCheckingAuth] = useState(true);
//   const dispatch = useDispatch();

//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         const userDataStr = await AsyncStorage.getItem('userData');
//         const userData = userDataStr ? JSON.parse(userDataStr) : null;
//         console.log('checkAuth')
//         if (token && userData) {
//           console.log('checkAuth 2')
//           dispatch(setCredentials(userData));
//         } else {
//           dispatch(logout());
//         }
//       } catch (error) {
//         dispatch(logout());
//       } finally {
//         setCheckingAuth(false);
//       }
//     };

//     checkAuth();
//   }, []);

//   if (checkingAuth) return null; 

//   return children;
// };

// const AppContent = () => {
//   const { loading } = useSelector((state) => state.ui);
//   const snackbar = useSelector((state) => state.ui.snackbar);
//   const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
//   const [isConnected, setIsConnected] = useState(null);


// useEffect(() => {
//   const requestPermissions = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     console.log('Media library permission:', status);
//     if (status !== 'granted') {
//       alert('Please enable media access to upload photos or videos.');
//     }
//   };

//   requestPermissions();
// }, []);


//   useEffect(() => {
//     const unsubscribe = NetInfo.addEventListener(state => {
//       setIsConnected(state.isConnected);
//     });

//     return () => {
//       unsubscribe();
//     };
//   }, []);

//   return (
//     <>
//       <NavigationContainer>
//         <AppNavigator />
//       </NavigationContainer>
//       <StatusBar style="auto" />
//       <Snackbar
//         visible={snackbar.visible}
//         message={snackbar.message}
//         type={snackbar.type}
//       />
//       <Loader loading={loading} />

//       {isConnected === null ? (
//         <Snackbar visible={true} message="Checking connection..." type="info" />
//       ) : isConnected ? (
//         <Snackbar visible={true} message="You are online!" type="success" />
//       ) : (
//         <Snackbar visible={true} message="No internet connection." type="error" />
//       )}
//     </>
//   );
// };

// export default function App() {
//   const [fontsLoaded] = useFonts({
//     Poppins_400Regular,
//     Poppins_500Medium,
//     Poppins_600SemiBold,
//     Poppins_700Bold,
//   });

//   if (!fontsLoaded) {
//     return null;
//   }

//   const { Text, TextInput } = require('react-native');
//   if (Text.defaultProps == null) Text.defaultProps = {};
//   if (TextInput.defaultProps == null) TextInput.defaultProps = {};
//   Text.defaultProps.allowFontScaling = false;
//   TextInput.defaultProps.allowFontScaling = false;
//   TextInput.defaultProps.style = [{ color: 'black' }];

//   return (
//     <Provider store={store}>
//       <SafeAreaProvider>
//         <AuthLoader>
//           <AppContent />
//         </AuthLoader>
//       </SafeAreaProvider>
//     </Provider>
//   );
// }


import React, { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './src/state/store';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Snackbar from './src/components/Snackbar';
import Loader from './src/components/Loader';
import { API_URL, DEBUG } from '@env';
import 'react-native-polyfill-globals/auto';
import 'react-native-url-polyfill/auto';

import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCredentials, logout } from './src/state/slices/authSlice';
import * as ImagePicker from 'expo-image-picker';
import { setSnackbar, setLoading } from './src/state/slices/uiSlice';

// AuthLoader checks for token + user data on startup
const AuthLoader = ({ children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userDataStr = await AsyncStorage.getItem('userData');
        const userData = userDataStr ? JSON.parse(userDataStr) : null;

        if (token && userData) {
          dispatch(setCredentials(userData));
        } else {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('userData');
          dispatch(logout());
        }
      } catch (error) {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userData');
        dispatch(logout());
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  if (checkingAuth) return null; // or show splash screen/loader

  return children;
};

const AppContent = () => {
  const { loading } = useSelector((state) => state.ui);
  const snackbar = useSelector((state) => state.ui.snackbar);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [isConnected, setIsConnected] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    const checkConnection = async () => {
      const state = await NetInfo.fetch(); // Check the current connection status once
      setIsConnected(state.isConnected);
    };

    checkConnection(); // Check connection on load

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected); // Update connection status on changes
    });

    return () => {
      unsubscribe(); // Cleanup listener when component unmounts
    };
  }, []);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Media library permission:', status);
      if (status !== 'granted') {
        alert('Please enable media access to upload photos or videos.');
      }
    };

    if (isAuthenticated) {
      requestPermissions(); // Request permissions if authenticated
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isConnected === false) {
      dispatch(setSnackbar({ visible: true, message: 'No internet connection', type: 'error' }));
    } else if (isConnected === true) {
      dispatch(setSnackbar({ visible: true, message: 'You are online', type: 'success' }));
    }
  }, [isConnected, dispatch]);

  return (
    <>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
      />
      <Loader loading={loading} />

      {isConnected === null ? (
        <Snackbar visible={true} message="Checking connection..." type="info" />
      ) : isConnected ? (
        <Snackbar visible={true} message="You are online!" type="success" />
      ) : (
        <Snackbar visible={true} message="No internet connection." type="error" />
      )}
    </>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const { Text, TextInput } = require('react-native');
  if (Text.defaultProps == null) Text.defaultProps = {};
  if (TextInput.defaultProps == null) TextInput.defaultProps = {};
  Text.defaultProps.allowFontScaling = false;
  TextInput.defaultProps.allowFontScaling = false;
  TextInput.defaultProps.style = [{ color: 'black' }];

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AuthLoader>
          <AppContent />
        </AuthLoader>
      </SafeAreaProvider>
    </Provider>
  );
}
