// import * as RNIap from 'react-native-iap';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Alert, Platform } from 'react-native';
// import axios from 'axios';
// import { EXPO_PUBLIC_API_URL } from '@env';
// import { sendLog } from './logger';

// const FLIX10K_PRODUCTS = {
//   1: 'flix10k_monthly',
//   3: 'flix10k_quarterly',
//   6: 'flix10k_halfyear',
//   12: 'flix10k_yearly',
// };

// let isProcessing = false;

// export const handleAppleFlix10KPayment = async ({
//   months,
//   user,
//   setShowafterAdd,
//   setShowPaymentSuccess,
//   setShowPaymentFailure,
// }) => {
//   if (Platform.OS !== 'ios') return;

//   const log = (msg, type = "INFO") =>
//   sendLog({
//     message: msg,
//     screen: "Flix10KSubscription",
//     log_type: type,
//     user_id: user?.uuid,
//   });

//   if (isProcessing) {
//     log("Blocked duplicate IAP call");
//     return;
//   }

//   isProcessing = true;

//   const productId = FLIX10K_PRODUCTS[months];

//   log(`IAP START | months=${months}, productId=${productId}`);

//   //Alert.alert('Flix10K IAP', `Starting payment\nMonths: ${months}\nProduct: ${productId}`);

//    if (!productId) {
//     //Alert.alert('Error', 'Invalid product selected');
//     log("Invalid product selected", "ERROR");
//     isProcessing = false;
//     return;
//   }

//   try {
//     //Alert.alert('Step 1', 'Initializing Apple IAP connection');
//      //log("Initializing IAP connection");
//     await RNIap.initConnection();

//     log("IAP connection initialized");

//      // ✅ Fetch products from Apple
//     //log("Fetching subscriptions from Apple");

//     const products = await RNIap.getSubscriptions({
//       skus: Object.values(FLIX10K_PRODUCTS),
//     });

//     log(`Products count: ${products.length}`);

//     if (!products || products.length === 0) {
//       throw new Error("No products returned from App Store");
//     }

//     const productExists = products.find(
//       (p) => p.productId === productId
//     );

//     if (!productExists) {
//       log(`Product not found: ${productId}`, "ERROR");
//       throw new Error("Product not available in App Store");
//     }

//     //log("Setting flix10KPaying flag");

//     //Alert.alert('Step 2', 'Setting flix10KPaying flag');
//     await AsyncStorage.setItem('flix10KPaying', 'true');

//     log(`Requesting subscription: ${productId}`);

//     //Alert.alert('Step 3', `Requesting subscription from Apple\nSKU: ${productId}`);
//     const purchase = await RNIap.requestSubscription({
//       sku: productId,
//     });

//     log(`Purchase success: ${purchase?.productId}`);

//     //  Alert.alert(
//     //   'Purchase Result',
//     //   JSON.stringify(
//     //     {
//     //       productId: purchase?.productId,
//     //       transactionId: purchase?.transactionId,
//     //       originalTransactionId: purchase?.originalTransactionIdentifier,
//     //     },
//     //     null,
//     //     2
//     //   )
//     // );

//     if (!purchase?.transactionReceipt) {
//       //Alert.alert('Error', 'No receipt received from Apple');
//       log("No receipt received from Apple", "ERROR");
//       throw new Error('No receipt received');
//     }

//     //Alert.alert('Step 4', 'Verifying receipt with backend');
//     // 🔐 Verify receipt with backend

//     log("Sending receipt to backend");
//     const verifyRes = await axios.post(
//       `${EXPO_PUBLIC_API_URL}/api/subscription/verify-ios-flix10k-subscription`,
//       {
//         uuid: user.uuid,
//         receipt: purchase.transactionReceipt,
//         productId,
//       }
//     );

//     const verifyData = verifyRes.data;

//     log(`Verify response: ${JSON.stringify(verifyData)}`);

//     // Alert.alert(
//     //   'Verify Response',
//     //   JSON.stringify(verifyRes.data, null, 2)
//     // );


//     if (verifyData.status !== 'active') {
//        //Alert.alert('Error', 'Subscription not active after verification');
//        log("Subscription not active after verification", "ERROR");
//       throw new Error('Subscription not active');
//     }

//     //Alert.alert('Step 5', 'Saving subscription to database');
//     // ✅ Update Flix10K subscription in DB
//     log("Saving subscription to DB");
//     const payload = {
//       uuid: user.uuid,
//       subscriptionId: 1,
//       autoRenewal: verifyData.autoRenewal, // real Apple value
//       subscribedMonths: months,
//       stripeSessionId: `ios_iap_${Date.now()}`,
//       status: 'SUCCESS',
//       provider: 'ios_iap',
//     };

//     //Alert.alert('Subscription Payload', JSON.stringify(payload, null, 2));

//     await axios.post(
//       `${EXPO_PUBLIC_API_URL}/api/subscription/subscription`,
//       payload
//     );

//     log("Subscription saved successfully");

//     await RNIap.finishTransaction({ purchase, isConsumable: false });

//     //Alert.alert('Success', 'Flix10K subscription completed successfully');

//     log("Transaction finished successfully");

//     //setShowafterAdd(true);
//     setShowafterAdd?.(true);
//     setTimeout(() => {
//       //Alert.alert('UI', 'Showing success modal');
//       setShowPaymentSuccess(true)
//     }, 800);
//   } catch (err) {
//     console.error('[Flix10K iOS IAP]', err);
//     log(`ERROR: ${err?.message || JSON.stringify(err)}`, "ERROR");

//     isProcessing = false;

//     if (err?.code === 'E_USER_CANCELLED') {
//       log("User cancelled purchase");
//       //Alert.alert('Cancelled', 'User cancelled Apple subscription');
//       return;
//     }

//     // Alert.alert(
//     //   'IAP Error',
//     //   err?.message || JSON.stringify(err, null, 2)
//     // );

//     //setShowafterAdd(true);
//     setShowafterAdd?.(true);
//     setTimeout(() => {
//       log("Showing failure modal", "ERROR");
//       //Alert.alert('UI', 'Showing failure modal');
//       setShowPaymentFailure(true);
//     }, 800);
//   } finally {
//     //Alert.alert('Cleanup', 'Clearing local flags and closing IAP connection');
//     log("Cleaning up AsyncStorage + connection");
//     await AsyncStorage.removeItem('flix10KPaying');
//     // await RNIap.endConnection();
//     isProcessing = false;
//   }
// };


import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestPurchase,
  finishTransaction,
} from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';
import { sendLog } from './logger';

const FLIX10K_PRODUCTS = {
  1: 'flix10k_monthly',
  3: 'flix10k_quarterly',
  6: 'flix10k_halfyear',
  12: 'flix10k_yearly',
};

let isProcessing = false;

export const handleAppleFlix10KPayment = async ({
  months,
  user,
  setShowafterAdd,
  setShowPaymentSuccess,
  setShowPaymentFailure,
}) => {
  if (Platform.OS !== 'ios') return;

  const log = (msg, type = 'INFO') =>
    sendLog({
      message: msg,
      screen: 'Flix10KSubscription',
      log_type: type,
      user_id: user?.uuid,
    });

  if (isProcessing) {
    log('Blocked duplicate IAP call');
    return;
  }

  isProcessing = true;

  const productId = FLIX10K_PRODUCTS[months];
  log(`IAP START | months=${months}, productId=${productId}`);

  if (!productId) {
    log('Invalid product selected', 'ERROR');
    isProcessing = false;
    return;
  }

  try {
    // CHANGE 1: named import instead of RNIap.initConnection()
    await initConnection();
    log('IAP connection initialized');

    // CHANGE 1: named import instead of RNIap.getSubscriptions()
    const products = await getSubscriptions({
      skus: Object.values(FLIX10K_PRODUCTS),
    });

    log(`Products count: ${products.length}`);

    if (!products || products.length === 0) {
      throw new Error('No products returned from App Store');
    }

    const productExists = products.find((p) => p.productId === productId);
    if (!productExists) {
      log(`Product not found: ${productId}`, 'ERROR');
      throw new Error('Product not available in App Store');
    }

    await AsyncStorage.setItem('flix10KPaying', 'true');
    log(`Requesting subscription: ${productId}`);

    // CHANGE 2: requestSubscription replaced by requestPurchase with
    //           nested request.apple shape and explicit type: 'subs'
    const purchase = await requestPurchase({
      request: {
        apple: {
          sku: productId,
        },
      },
      type: 'subs',
    });

    log(`Purchase success: ${purchase?.productId}`);

    if (!purchase?.transactionReceipt) {
      log('No receipt received from Apple', 'ERROR');
      throw new Error('No receipt received');
    }

    log('Sending receipt to backend');
    const verifyRes = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/subscription/verify-ios-flix10k-subscription`,
      {
        uuid: user.uuid,
        receipt: purchase.transactionReceipt,
        productId,
      }
    );

    const verifyData = verifyRes.data;
    log(`Verify response: ${JSON.stringify(verifyData)}`);

    if (verifyData.status !== 'active') {
      log('Subscription not active after verification', 'ERROR');
      throw new Error('Subscription not active');
    }

    log('Saving subscription to DB');
    const payload = {
      uuid: user.uuid,
      subscriptionId: 1,
      autoRenewal: verifyData.autoRenewal,
      subscribedMonths: months,
      stripeSessionId: `ios_iap_${Date.now()}`,
      status: 'SUCCESS',
      provider: 'ios_iap',
    };

    await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/subscription/subscription`,
      payload
    );

    log('Subscription saved successfully');

    // CHANGE 1: named import instead of RNIap.finishTransaction()
    // (method itself is unchanged — correct call for iOS non-consumable)
    await finishTransaction({ purchase, isConsumable: false });
    log('Transaction finished successfully');

    setShowafterAdd?.(true);
    setTimeout(() => setShowPaymentSuccess(true), 800);
  } catch (err) {
    console.error('[Flix10K iOS IAP]', err);
    log(`ERROR: ${err?.message || JSON.stringify(err)}`, 'ERROR');
    isProcessing = false;

    if (err?.code === 'E_USER_CANCELLED') {
      log('User cancelled purchase');
      return;
    }

    setShowafterAdd?.(true);
    setTimeout(() => {
      log('Showing failure modal', 'ERROR');
      setShowPaymentFailure(true);
    }, 800);
  } finally {
    log('Cleaning up AsyncStorage + connection');
    await AsyncStorage.removeItem('flix10KPaying');
    // CHANGE 3: endConnection was commented out — in v14 always clean up
    await endConnection();
    isProcessing = false;
  }
};