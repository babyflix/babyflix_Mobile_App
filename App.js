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

//   return (
//     <Provider store={store}>
//       <SafeAreaProvider>
//         <AppContent />
//       </SafeAreaProvider>
//     </Provider>
//   );
// }


import React from 'react';
import { Provider } from 'react-redux';
import { store } from './src/state/store';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Snackbar from './src/components/Snackbar';
import Loader from './src/components/Loader';
import { useSelector } from 'react-redux';
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

const AppContent = () => {
  const { loading } = useSelector((state) => state.ui);
  const snackbar = useSelector((state) => state.ui.snackbar);

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

  // ✅ Disable font scaling globally
  const { Text, TextInput } = require('react-native');
  if (Text.defaultProps == null) Text.defaultProps = {};
  if (TextInput.defaultProps == null) TextInput.defaultProps = {};
  Text.defaultProps.allowFontScaling = false;
  TextInput.defaultProps.allowFontScaling = false;
  TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [{ color: 'black' }];


  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </Provider>
  );
}
