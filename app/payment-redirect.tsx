import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function PaymentResult() {
  const { status } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleStatus = async () => {
      if (status === 'success') {
        await AsyncStorage.setItem('payment_status', 'done');
      } else {
        await AsyncStorage.setItem('payment_status', 'fail');
      }

      await AsyncStorage.setItem('visited_after_redirect', 'true');
      router.replace('/(app)/gallery');
    };

    handleStatus();
  }, [status]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#b53bb7" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center'
  }
});
