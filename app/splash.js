import { Stack } from 'expo-router';
import SplashScreen from '../src/screens/SplashScreen';

export default function Splash() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SplashScreen />
    </>
  );
}