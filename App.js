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
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </Provider>
  );
}
