import { useEffect, useState, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, StyleSheet, View, Linking } from 'react-native';

export default function Flix10KRedirect() {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  const [status, setStatus] = useState<string | null>(null);
  const handledOnce = useRef(false);

  const getQueryParam = (url: string, name: string) => {
    const regex = new RegExp(`[?&]${name}=([^&]+)`);
    const match = url.match(regex);
    return match ? decodeURIComponent(match[1]) : null;
  };

  useEffect(() => {
    const handleStatus = async (urlStatus: string, fullUrl?: string) => {
      if (handledOnce.current) return;
      handledOnce.current = true;
      
      setStatus(urlStatus);

      const subscriptionId = fullUrl ? getQueryParam(fullUrl, 'subscriptionId') : localParams.subscriptionId;
      const autoRenewal = fullUrl ? getQueryParam(fullUrl, 'autoRenewal') : localParams.autoRenewal;
      const subscribedMonths = fullUrl ? getQueryParam(fullUrl, 'subscribedMonths') : localParams.subscribedMonths;
      const sessionId = fullUrl ? getQueryParam(fullUrl, 'session_id') : localParams.session_id;

      if (urlStatus === 'success') {

        console.log('✅ Flix10K Payment Success:', { subscriptionId, autoRenewal, subscribedMonths, sessionId, urlStatus });

        await AsyncStorage.setItem('flix10k_payment_status', 'done');
        await AsyncStorage.setItem('flix10kPaymentForAdd', 'done');
        await AsyncStorage.setItem('flix10KPaying', 'false');
        if (subscriptionId) await AsyncStorage.setItem('flix10k_subscriptionId', String(subscriptionId));
        if (autoRenewal) await AsyncStorage.setItem('flix10k_autoRenewal', String(autoRenewal));
        if (subscribedMonths) await AsyncStorage.setItem('flix10k_subscribedMonths', String(subscribedMonths));
        if (sessionId) await AsyncStorage.setItem('flix10k_stripeSessionId', String(sessionId));
        if (urlStatus) await AsyncStorage.setItem('flix10k_status', String(urlStatus));

      } else {
        console.log('❌ Flix10K Payment Failed');
        await AsyncStorage.setItem('flix10k_payment_status', 'fail');
        await AsyncStorage.setItem('flix10kPaymentForAdd', 'fail');
        await AsyncStorage.setItem('flix10KPaying', 'false');
        if (subscriptionId) await AsyncStorage.setItem('flix10k_subscriptionId', String(subscriptionId));
        if (autoRenewal) await AsyncStorage.setItem('flix10k_autoRenewal', String(autoRenewal));
        if (subscribedMonths) await AsyncStorage.setItem('flix10k_subscribedMonths', String(subscribedMonths));
        if (sessionId) await AsyncStorage.setItem('flix10k_stripeSessionId', String(sessionId));
        if (urlStatus) await AsyncStorage.setItem('flix10k_status', String(urlStatus));

        console.log('Flix10K Payment failed:', { subscriptionId, autoRenewal, subscribedMonths, sessionId, urlStatus });
      }

      await AsyncStorage.setItem('flix10k_visited_after_redirect', 'true');

      setTimeout(() => {
        router.replace('(app)/gallery');
      }, 2000);
    };

    if (localParams?.status) {
      handleStatus(localParams.status as string);
      return;
    }

    const checkInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const status = getQueryParam(initialUrl, 'status');
        if (status) handleStatus(status, initialUrl);
      }
    };
    checkInitialUrl();

    const subscription = Linking.addListener('url', ({ url }) => {
      const status = getQueryParam(url, 'status');
      if (status) handleStatus(status, url);
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
