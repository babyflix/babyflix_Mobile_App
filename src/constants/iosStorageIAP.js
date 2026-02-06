// import * as RNIap from 'react-native-iap';
// import axios from 'axios';
// import { EXPO_PUBLIC_API_URL } from '@env';

// /**
//  * Storage IAP product mapping (Apple)
//  */
// const IOS_STORAGE_PRODUCTS = {
//   0: 'storage_recovery',
//   1: 'storage_monthly',
//   3: 'storage_quarterly',
//   6: 'storage_halfyearly',
//   12: 'storage_yearly',
// };

// /**
//  * Convert months → Apple productId
//  */
// const getIOSStorageProductId = (months, planId) => {
//   return IOS_STORAGE_PRODUCTS[months] || planId === 3 ? IOS_STORAGE_PRODUCTS[0] : IOS_STORAGE_PRODUCTS[1];
// };

// /**
//  * MAIN FUNCTION (same pattern as Flix10K)
//  * Call this from handleSubscribe (Storage)
//  */
// export const handleIOSStorageSubscription = async ({
//   planId,
//   months,
//   userId,
//   onSuccess,
//   onFailure,
// }) => {
//   try {
//     await RNIap.endConnection();
//     await RNIap.initConnection();

//     let productId;
//     if (planId === 3) 
//      {
//       productId = getIOSStorageProductId(0, planId);
//      } else {
//      productId = getIOSStorageProductId(months, planId);
//      }

//     console.log('[iOS Storage IAP] Purchasing:', productId);

//     const purchase = await RNIap.requestSubscription({
//       sku: productId,
//     });

//     if (!purchase?.transactionReceipt) {
//       throw new Error('No receipt received from Apple');
//     }

//     // 🔐 Send receipt to backend for verification
//     await axios.post(
//       `${EXPO_PUBLIC_API_URL}/api/patients/verify-ios-storage-subscription`,
//       {
//         userId,
//         receipt: purchase.transactionReceipt,
//         productId,
//       }
//     );

//     onSuccess?.();
//   } catch (err) {
//     console.error('[iOS Storage IAP Error]', err);
//     onFailure?.(err);
//   } finally {
//     await RNIap.endConnection();
//   }
// };


import * as RNIap from 'react-native-iap';
import axios from 'axios';
import { Alert, Platform } from 'react-native';
import { EXPO_PUBLIC_API_URL } from '@env';

/**
 * Storage IAP product mapping (Apple)
 */
const IOS_STORAGE_PRODUCTS = {
  0: 'storage_recovery',
  1: 'storage_monthly',
  3: 'storage_quarterly',
  6: 'storage_halfyearly',
  12: 'storage_yearly',
};

/**
 * Convert months → Apple productId
 */
const getIOSStorageProductId = (months, planId) => {
  if (planId === 3) return IOS_STORAGE_PRODUCTS[0]; // recovery
  return IOS_STORAGE_PRODUCTS[months] || IOS_STORAGE_PRODUCTS[1];
};

/**
 * MAIN FUNCTION (same pattern as Flix10K)
 * Safe to call from any screen
 */
export const handleIOSStorageSubscription = async ({
  planId,
  months,
  userId,
  onSuccess,
  onFailure,
}) => {
  if (Platform.OS !== 'ios') return;

  // Alert.alert(
  //   'Storage IAP',
  //   `Starting iOS Storage purchase\nPlanId: ${planId}\nMonths: ${months}`
  // );

  try {
    // 1️⃣ Reset + Init connection
    //Alert.alert('Step 1', 'Initializing Apple IAP connection');
    await RNIap.endConnection();
    await RNIap.initConnection();

    // 2️⃣ Resolve productId
    const productId = getIOSStorageProductId(months, planId);

    // Alert.alert(
    //   'Step 2',
    //   `Resolved Product ID:\n${productId}`
    // );

    if (!productId) {
      //Alert.alert('Error', 'Invalid storage product selected');
      throw new Error('Invalid productId');
    }

    // 3️⃣ Request subscription
    // Alert.alert(
    //   'Step 3',
    //   `Requesting subscription from Apple\nSKU: ${productId}`
    // );

    const purchase = await RNIap.requestSubscription({
      sku: productId,
    });

    // Alert.alert(
    //   'Purchase Result',
    //   JSON.stringify(
    //     {
    //       productId: purchase?.productId,
    //       transactionId: purchase?.transactionId,
    //       originalTransactionId:
    //         purchase?.originalTransactionIdentifier,
    //     },
    //     null,
    //     2
    //   )
    // );

    if (!purchase?.transactionReceipt) {
      //Alert.alert('Error', 'No receipt received from Apple');
      throw new Error('No receipt received from Apple');
    }

    // 4️⃣ Verify receipt with backend
    //Alert.alert('Step 4', 'Verifying receipt with backend');

    const verifyRes = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/patients/verify-ios-storage-subscription`,
      {
        userId,
        receipt: purchase.transactionReceipt,
        productId,
      }
    );

    // Alert.alert(
    //   'Verify Response',
    //   JSON.stringify(verifyRes.data, null, 2)
    // );

    if (verifyRes.data?.status !== 'active') {
      // Alert.alert(
      //   'Verification Failed',
      //   'Subscription not active after verification'
      // );
      throw new Error('Subscription verification failed');
    }

    await RNIap.finishTransaction({
      purchase,
      isConsumable: false,
    });

    // 5️⃣ Success callback
    // Alert.alert(
    //   'Success',
    //   'Storage subscription verified successfully'
    // );

    onSuccess?.({
      productId,
      autoRenewal: verifyRes.data.autoRenewal,
      expiryDate: verifyRes.data.expiryDate,
      originalTransactionId:
        purchase.originalTransactionIdentifier,
    });
  } catch (err) {
    if (err?.code === 'E_USER_CANCELLED') {
      // Alert.alert(
      //   'Cancelled',
      //   'User cancelled Apple subscription'
      // );
      return;
    }

    // Alert.alert(
    //   'Storage IAP Error',
    //   err?.message || JSON.stringify(err, null, 2)
    // );

    onFailure?.(err);
  } finally {
    // 6️⃣ Cleanup
    // Alert.alert(
    //   'Cleanup',
    //   'Closing Apple IAP connection'
    // );
    //await RNIap.endConnection();
  }
};
