import { useEffect, useState, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, StyleSheet, View, Linking, Platform } from 'react-native';

export default function PaymentRedirect() {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  const [status, setStatus] = useState<string | null>(null);
  const handledOnce = useRef(false); 

  const getStatusFromUrl = (url: string) => {
    const match = url.match(/[?&]status=([^&]+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const handleStatus = async (statusParam: string) => {
      if (handledOnce.current) return;
      handledOnce.current = true;

      setStatus(statusParam);

      if (statusParam === 'success') {
        await AsyncStorage.setItem('payment_status', 'done');
      } else {
        await AsyncStorage.setItem('payment_status', 'fail');
      }

      await AsyncStorage.setItem('visited_after_redirect', 'true');

      setTimeout(() => {
        router.replace('/(app)/gallery');
      }, 2000);
    };

    if (localParams?.status) {
      handleStatus(localParams.status as string);
      return;
    }

     const checkInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const status = getStatusFromUrl(initialUrl);
        if (status) handleStatus(status);
      }
    };
    checkInitialUrl();

    const subscription = Linking.addListener('url', ({ url }) => {
      const status = getStatusFromUrl(url);
      if (status) handleStatus(status);
    });

    return () => subscription.remove();
  }, [localParams, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#b53bb7" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
