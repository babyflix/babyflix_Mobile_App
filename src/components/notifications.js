// // import * as Notifications from 'expo-notifications';
// // import * as Device from 'expo-device';
// // import { Platform } from 'react-native';
// // import axios from 'axios';

// // export async function registerForPushNotificationsAsync(userId) {
// //   let token;

// //   if (Device.isDevice) {
// //     const { status: existingStatus } = await Notifications.getPermissionsAsync();
// //     let finalStatus = existingStatus;

// //     if (existingStatus !== 'granted') {
// //       const { status } = await Notifications.requestPermissionsAsync();
// //       finalStatus = status;
// //     }

// //     if (finalStatus !== 'granted') {
// //       alert('Failed to get push token for push notification!');
// //       return;
// //     }

// //     token = (await Notifications.getExpoPushTokenAsync()).data;

// //     // Save to backend
// //     await axios.post('https://your-backend-url/api/saveToken', {
// //       userId,
// //       expoToken: token,
// //     });
// //   }

// //   if (Platform.OS === 'android') {
// //     Notifications.setNotificationChannelAsync('default', {
// //       name: 'default',
// //       importance: Notifications.AndroidImportance.MAX,
// //     });
// //   }

// //   return token;
// // }

// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
// import { Platform } from 'react-native';

// export async function registerForPushNotificationsAsync() {
//   let token;

//   if (Device.isDevice) {
//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     if (existingStatus !== 'granted') {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     if (finalStatus !== 'granted') {
//       alert('Failed to get push token!');
//       return;
//     }

//     token = (await Notifications.getExpoPushTokenAsync()).data;
//     console.log('Expo Push Token:', token);
//   } else {
//     alert('Must use physical device for Push Notifications');
//   }

//   if (Platform.OS === 'android') {
//     Notifications.setNotificationChannelAsync('default', {
//       name: 'default',
//       importance: Notifications.AndroidImportance.MAX,
//     });
//   }

//   return token;
// }

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';

export async function registerForPushNotificationsAsync(userId) {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);

    // Save token to your backend
    console.log('userId',userId)
    if (userId && token) {
      try {
         const res = await axios.post(`${EXPO_PUBLIC_API_URL}/api/notification/registerToken`, {
          userId,
          token,
        });
        console.log('Push token saved successfully');
        console.log('message',res.data.message); 
        console.log('data',res.data);
      } catch (error) {
        console.error('Failed to save push token:', error.message);
      }
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}