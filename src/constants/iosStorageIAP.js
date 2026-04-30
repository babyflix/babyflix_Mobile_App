import * as RNIap from 'react-native-iap';
import axios from 'axios';
import { Alert, Platform } from 'react-native';
import { EXPO_PUBLIC_API_URL } from '@env';
import { sendLog } from './logger';

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

let isProcessing = false;

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

  const log = (msg, type = "INFO") =>
  sendLog({
    message: msg,
    screen: "StorageSubscription",
    log_type: type,
    user_id: userId,
  });

   if (isProcessing) {
    log("Blocked duplicate IAP call");
    return;
  }

  isProcessing = true;

  log(`IAP START | planId=${planId}, months=${months}`);

  try {
    // 1️⃣ Reset + Init connection
    //Alert.alert('Step 1', 'Initializing Apple IAP connection');
    //log("Initializing IAP connection");
    await RNIap.endConnection();
    await RNIap.initConnection();
    log("IAP connection initialized");

    // 2️⃣ Resolve productId
    const productId = getIOSStorageProductId(months, planId);
    log(`ProductId resolved: ${productId}`);

    // Alert.alert(
    //   'Step 2',
    //   `Resolved Product ID:\n${productId}`
    // );

    if (!productId) {
      //Alert.alert('Error', 'Invalid storage product selected');
      log("Invalid productId", "ERROR");
      throw new Error('Invalid productId');
    }

    // ✅ Fetch products from Apple
    log("Fetching subscriptions from Apple");

    const products = await RNIap.getSubscriptions({
      skus: Object.values(IOS_STORAGE_PRODUCTS),
    });

    log(`Products count: ${products.length}`);

    if (!products || products.length === 0) {
      throw new Error("No products returned from App Store");
    }

    const productExists = products.find(
      (p) => p.productId === productId
    );

    if (!productExists) {
      log(`Product not found: ${productId}`, "ERROR");
      throw new Error("Product not available in App Store");
    }

    // 3️⃣ Request subscription
    // Alert.alert(
    //   'Step 3',
    //   `Requesting subscription from Apple\nSKU: ${productId}`
    // );

    log(`Requesting subscription for ${productId}`);
    const purchase = await RNIap.requestSubscription({
      sku: productId,
    });

    log(`Purchase success: ${purchase?.productId}`);

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
      log("No receipt received", "ERROR");
      //Alert.alert('Error', 'No receipt received from Apple');
      throw new Error('No receipt received from Apple');
    }

    // 4️⃣ Verify receipt with backend
    //Alert.alert('Step 4', 'Verifying receipt with backend');

    log("Sending receipt to backend");

    const verifyRes = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/patients/verify-ios-storage-subscription`,
      {
        userId,
        receipt: purchase.transactionReceipt,
        productId,
      }
    );

    log(`Verify status: ${verifyRes.data?.status}`);

    // Alert.alert(
    //   'Verify Response',
    //   JSON.stringify(verifyRes.data, null, 2)
    // );

    if (verifyRes.data?.status !== 'active') {
      // Alert.alert(
      //   'Verification Failed',
      //   'Subscription not active after verification'
      // );
      log("Subscription not active after verification", "ERROR");
      throw new Error('Subscription verification failed');
    }

    await RNIap.finishTransaction({
      purchase,
      isConsumable: false,
    });

    log("Transaction finished successfully");

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
    log(`ERROR: ${err?.message || JSON.stringify(err)}`, "ERROR");
    isProcessing = false;
    if (err?.code === 'E_USER_CANCELLED') {
      // Alert.alert(
      //   'Cancelled',
      //   'User cancelled Apple subscription'
      // );
      log("User cancelled purchase");
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
    isProcessing = false;
  }
};


// import {
//   initConnection,
//   endConnection,
//   getSubscriptions,
//   requestPurchase,
//   finishTransaction,
// } from 'react-native-iap';
// import axios from 'axios';
// import { Platform } from 'react-native';
// import { EXPO_PUBLIC_API_URL } from '@env';
// import { sendLog } from './logger';

// const IOS_STORAGE_PRODUCTS = {
//   0: 'storage_recovery',
//   1: 'storage_monthly',
//   3: 'storage_quarterly',
//   6: 'storage_halfyearly',
//   12: 'storage_yearly',
// };

// let isProcessing = false;

// const getIOSStorageProductId = (months, planId) => {
//   if (planId === 3) return IOS_STORAGE_PRODUCTS[0]; // recovery
//   return IOS_STORAGE_PRODUCTS[months] || IOS_STORAGE_PRODUCTS[1];
// };

// export const handleIOSStorageSubscription = async ({
//   planId,
//   months,
//   userId,
//   onSuccess,
//   onFailure,
// }) => {
//   if (Platform.OS !== 'ios') return;

//   const log = (msg, type = 'INFO') =>
//     sendLog({
//       message: msg,
//       screen: 'StorageSubscription',
//       log_type: type,
//       user_id: userId,
//     });

//   if (isProcessing) {
//     log('Blocked duplicate IAP call');
//     return;
//   }

//   isProcessing = true;
//   log(`IAP START | planId=${planId}, months=${months}`);

//   try {
//     // CHANGE 1: named imports instead of RNIap.endConnection / RNIap.initConnection
//     // The reset pattern (endConnection → initConnection) is preserved as-is —
//     // it's valid in v14 to reset a stale billing session before starting fresh
//     await endConnection();
//     await initConnection();
//     log('IAP connection initialized');

//     const productId = getIOSStorageProductId(months, planId);
//     log(`ProductId resolved: ${productId}`);

//     if (!productId) {
//       log('Invalid productId', 'ERROR');
//       throw new Error('Invalid productId');
//     }

//     log('Fetching subscriptions from Apple');

//     // CHANGE 1: named import instead of RNIap.getSubscriptions()
//     const products = await getSubscriptions({
//       skus: Object.values(IOS_STORAGE_PRODUCTS),
//     });

//     log(`Products count: ${products.length}`);

//     if (!products || products.length === 0) {
//       throw new Error('No products returned from App Store');
//     }

//     const productExists = products.find((p) => p.productId === productId);
//     if (!productExists) {
//       log(`Product not found: ${productId}`, 'ERROR');
//       throw new Error('Product not available in App Store');
//     }

//     log(`Requesting subscription for ${productId}`);

//     // CHANGE 2: requestSubscription replaced by requestPurchase with
//     //           nested request.apple shape and explicit type: 'subs'
//     const purchase = await requestPurchase({
//       request: {
//         apple: {
//           sku: productId,
//         },
//       },
//       type: 'subs',
//     });

//     log(`Purchase success: ${purchase?.productId}`);

//     if (!purchase?.transactionReceipt) {
//       log('No receipt received', 'ERROR');
//       throw new Error('No receipt received from Apple');
//     }

//     log('Sending receipt to backend');

//     const verifyRes = await axios.post(
//       `${EXPO_PUBLIC_API_URL}/api/patients/verify-ios-storage-subscription`,
//       {
//         userId,
//         receipt: purchase.transactionReceipt,
//         productId,
//       }
//     );

//     log(`Verify status: ${verifyRes.data?.status}`);

//     if (verifyRes.data?.status !== 'active') {
//       log('Subscription not active after verification', 'ERROR');
//       throw new Error('Subscription verification failed');
//     }

//     // CHANGE 1: named import instead of RNIap.finishTransaction()
//     // (method itself unchanged — correct call for iOS non-consumable)
//     await finishTransaction({ purchase, isConsumable: false });
//     log('Transaction finished successfully');

//     onSuccess?.({
//       productId,
//       autoRenewal: verifyRes.data.autoRenewal,
//       expiryDate: verifyRes.data.expiryDate,
//       originalTransactionId: purchase.originalTransactionIdentifier,
//     });
//   } catch (err) {
//     log(`ERROR: ${err?.message || JSON.stringify(err)}`, 'ERROR');
//     isProcessing = false;

//     if (err?.code === 'E_USER_CANCELLED') {
//       log('User cancelled purchase');
//       return;
//     }

//     onFailure?.(err);
//   } finally {
//     // CHANGE 3: endConnection was commented out in finally — in v14
//     //           always clean up to avoid stale Nitro Module billing state
//     await endConnection();
//     isProcessing = false;
//   }
// };