// import { useEffect } from 'react';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { ActivityIndicator, StyleSheet, View } from 'react-native';

// export default function PaymentResult() {
//   const { status } = useLocalSearchParams();
//   const router = useRouter();

//   useEffect(() => {
//     const handleStatus = async () => {
//       if (status === 'success') {
//         await AsyncStorage.setItem('payment_status', 'done');
//       } else {
//         await AsyncStorage.setItem('payment_status', 'fail');
//       }

//       await AsyncStorage.setItem('visited_after_redirect', 'true');
//       router.replace('/(app)/gallery');
//     };

//     handleStatus();
//   }, [status]);

//   return (
//     <View style={styles.container}>
//       <ActivityIndicator size="large" color="#b53bb7" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1, justifyContent: 'center', alignItems: 'center'
//   }
// });

// import { useEffect, useState } from 'react';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { ActivityIndicator, StyleSheet, View, Linking } from 'react-native';

// export default function PaymentResult() {
//   const router = useRouter();
//   const localParams = useLocalSearchParams();
//   const [status, setStatus] = useState<string | null>(null);

//   useEffect(() => {
//     const getStatus = async () => {
//       // Try local params first (works on Android & when app already open)
//       if (localParams?.status) {
//         setStatus(localParams.status as string);
//         return;
//       }

//       // If no local params, try deep link from iOS cold start
//       const initialUrl = await Linking.getInitialURL();
//       if (initialUrl) {
//         const parsed = new URL(initialUrl);
//         const s = parsed.searchParams.get('status');
//         if (s) setStatus(s);
//       }
//     };

//     getStatus();
//   }, [localParams]);

//   useEffect(() => {
//     if (!status) return;

//     const handleStatus = async () => {
//       if (status === 'success') {
//         await AsyncStorage.setItem('payment_status', 'done');
//         console.log('Payment successful, status set to done', status);
//       } else {
//         await AsyncStorage.setItem('payment_status', 'fail');
//         console.log('Payment failed, status set to fail', status);
//       }

//       await AsyncStorage.setItem('visited_after_redirect', 'true');
//       router.replace('/(app)/gallery');
//     };

//     handleStatus();
//   }, [status]);

//   return (
//     <View style={styles.container}>
//       <ActivityIndicator size="large" color="#b53bb7" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
// });


import { useEffect, useState, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, StyleSheet, View, Linking, Platform, Alert } from 'react-native';

export default function PaymentRedirect() {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  const [status, setStatus] = useState<string | null>(null);
  const handledOnce = useRef(false); // ✅ make sure we only handle once

  const getStatusFromUrl = (url: string) => {
    const match = url.match(/[?&]status=([^&]+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const handleStatus = async (statusParam: string) => {
      console.log('Handling status:', statusParam);
      alert('Handling status: ' + statusParam);
      if (handledOnce.current) return;
      handledOnce.current = true;

      setStatus(statusParam);

      if (statusParam === 'success') {
        console.log('Payment successful Old 2');
        await AsyncStorage.setItem('payment_status', 'done');
        alert('Payment successful');
        //console.log('Payment successful');
      } else {
        console.log('Payment failed Old 2');
        await AsyncStorage.setItem('payment_status', 'fail');
        alert('Payment failed');
        //console.log('Payment failed');
      }

      await AsyncStorage.setItem('visited_after_redirect', 'true');

      // Navigate to gallery or wherever needed
      //router.replace('/(app)/gallery');
      setTimeout(() => {
        router.replace('/(app)/gallery');
      }, 2000);
    };

    // 1️⃣ Local params (works when app already open)
    if (localParams?.status) {
      //alert('handleStatus call from Local params status: ' + localParams.status);
      handleStatus(localParams.status as string);
      return;
    }

    // 2️⃣ Deep link (iOS cold start)
     const checkInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const status = getStatusFromUrl(initialUrl);
        if (status) handleStatus(status);
      }
    };
    checkInitialUrl();

    // 3️⃣ Foreground listener
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
