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
       // Check persistent AsyncStorage flag
    // const alreadyHandled = await AsyncStorage.getItem('payment_handled');
    if (handledOnce.current) return;

    handledOnce.current = true;
    //await AsyncStorage.setItem('payment_handled', 'true'); // mark as handled

      setStatus(statusParam);

      if (statusParam === 'success') {
        await AsyncStorage.setItem('payment_status', 'done');
        await AsyncStorage.setItem('forAdd', 'done');

        console.log('Payment successful with params:', localParams);

      if (localParams?.planId) await AsyncStorage.setItem('planId', String(localParams.planId));
      if (localParams?.redirectUrl) await AsyncStorage.setItem('redirectUrl', String(localParams.redirectUrl));
      if (localParams?.userEmail) await AsyncStorage.setItem('userEmail', String(localParams.userEmail));
      if (localParams?.userUUID) await AsyncStorage.setItem('userUUID', String(localParams.userUUID));
      if (localParams?.autoRenewal) await AsyncStorage.setItem('autoRenewal', String(localParams.autoRenewal));
      if (localParams?.months) await AsyncStorage.setItem('months', String(localParams.months));
      if (localParams?.session_id) await AsyncStorage.setItem('session_id', String(localParams.session_id));

      } else {
        await AsyncStorage.setItem('payment_status', 'fail');
        await AsyncStorage.setItem('forAdd', 'fail');
      }

      await AsyncStorage.setItem('visited_after_redirect', 'true');
      await AsyncStorage.setItem('visited_after_redirect_notification', 'true');

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
      //subscription.remove(); // remove listener after first trigger
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
