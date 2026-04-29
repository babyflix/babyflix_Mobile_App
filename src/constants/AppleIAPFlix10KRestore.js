import * as RNIap from 'react-native-iap';
import { Platform, Alert } from 'react-native';
import { EXPO_PUBLIC_API_URL } from '@env';

export const restoreIOSFlix10KPurchase = async ({
  userId,
  userEmail,
  dispatch,
  getFlix10KDetails,
}) => {
  if (Platform.OS !== 'ios') return;

  try {
    // 1️⃣ Init IAP
    await RNIap.initConnection();

    const purchases = await RNIap.getAvailablePurchases();
    //console.log('[iOS Flix10K Restore] Purchases:', purchases);

    // ✅ Get all flix purchases
    const flixPurchases = purchases.filter(
      p => p.productId && p.productId.startsWith('flix10k_')
    );

    // ✅ Pick latest purchase
    const flixPurchase = flixPurchases.sort(
      (a, b) => b.transactionDate - a.transactionDate
    )[0];

    if (!flixPurchase) {
      Alert.alert('No valid subscription found to restore.');
      return;
    }

    // ✅ Receipt check
    if (!flixPurchase?.transactionReceipt) {
      Alert.alert('No valid subscription found to restore.');
      return;
    }

    // 2️⃣ Verify receipt
    const verifyRes = await fetch(
      `${EXPO_PUBLIC_API_URL}/api/subscription/verify-ios-flix10k-subscription`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          receipt: flixPurchase.transactionReceipt,
          productId: flixPurchase.productId,
        }),
      }
    );

    const verifyData = await verifyRes.json();

    if (verifyData?.status !== 'active') {
      Alert.alert('No active subscription found.');
      return;
    }

    // 3️⃣ Sync auto-renew + expiry
    await fetch(
      `${EXPO_PUBLIC_API_URL}/api/subscription/update-flix10k-autorenewal-app`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: userId,
          autoRenewal: verifyData.autoRenewal,
          expiryDate: verifyData.expiryDate,
          currentPurchaseToken:
            flixPurchase.originalTransactionId ||
            flixPurchase.originalTransactionIdentifier ||
            flixPurchase.originalTransactionIdentifierIOS,
          source: 'Restore Button', // 👈 prevents email spam
        }),
      }
    );

    // 4️⃣ Refresh UI
    await getFlix10KDetails(userEmail, dispatch);

    Alert.alert('Your Flix10K subscription has been restored.');

  } catch (error) {
    console.error('[iOS Flix10K Restore] Failed:', error);
    Alert.alert('Restore failed. Please try again.');
  } finally {
    try {
      await RNIap.endConnection();
    } catch (e) {}
  }
};


// import * as RNIap from 'react-native-iap';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Platform, Alert } from 'react-native';
// import axios from 'axios';
// import { EXPO_PUBLIC_API_URL } from '@env';

// const FLIX10K_PRODUCTS = {
//   1: 'flix10k_monthly',
//   3: 'flix10k_quarterly',
//   6: 'flix10k_halfyear',
//   12: 'flix10k_yearly',
// };

// export const handleAppleFlix10KPayment = async ({
//   months,
//   user,
//   setShowafterAdd,
//   setShowPaymentSuccess,
//   setShowPaymentFailure,
// }) => {
//   if (Platform.OS !== 'ios') return;

//   const productId = FLIX10K_PRODUCTS[months];

//   //Alert.alert('Flix10K IAP', `Starting payment\nMonths: ${months}\nProduct: ${productId}`);

//   if (!productId) {
//     //Alert.alert('Error', 'Invalid product selected');
//     return;
//   }

//   try {
//     // 1️⃣ Init IAP
//     //Alert.alert('Step 1', 'Initializing Apple IAP connection');
//     await RNIap.initConnection();

//     // 2️⃣ Set local paying flag
//     //Alert.alert('Step 2', 'Setting flix10KPaying flag');
//     await AsyncStorage.setItem('flix10KPaying', 'true');

//     // 3️⃣ Request subscription
//     //Alert.alert('Step 3', `Requesting subscription\nSKU: ${productId}`);
//     const purchase = await RNIap.requestSubscription(productId);

//     // Alert.alert(
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
//       throw new Error('No receipt received');
//     }

//     // 4️⃣ Verify receipt with backend
//     //Alert.alert('Step 4', 'Verifying receipt with backend');

//     const verifyRes = await axios.post(
//       `${EXPO_PUBLIC_API_URL}/api/subscription/verify-ios-flix10k-subscription`,
//       {
//         uuid: user.uuid,
//         receipt: purchase.transactionReceipt,
//         productId,
//       }
//     );

//     // Alert.alert(
//     //   'Verify Response',
//     //   JSON.stringify(verifyRes.data, null, 2)
//     // );

//     const verifyData = verifyRes.data;

//     if (verifyData.status !== 'active') {
//       //Alert.alert('Error', 'Subscription not active after verification');
//       throw new Error('Subscription not active');
//     }

//     // 5️⃣ Save subscription in DB
//     //Alert.alert('Step 5', 'Saving subscription to database');

//     const payload = {
//       uuid: user.uuid,
//       subscriptionId: 1,
//       autoRenewal: verifyData.autoRenewal,
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

//     // 6️⃣ Success UI
//     //Alert.alert('Success', 'Flix10K subscription completed successfully');

//     setShowafterAdd(true);
//     setTimeout(() => {
//       //Alert.alert('UI', 'Showing success modal');
//       setShowPaymentSuccess(true);
//     }, 800);
//   } catch (err) {
//     if (err?.code === 'E_USER_CANCELLED') {
//       //Alert.alert('Cancelled', 'User cancelled Apple subscription');
//       return;
//     }

//     // Alert.alert(
//     //   'IAP Error',
//     //   err?.message || JSON.stringify(err, null, 2)
//     // );

//     setShowafterAdd(true);
//     setTimeout(() => {
//       //Alert.alert('UI', 'Showing failure modal');
//       setShowPaymentFailure(true);
//     }, 800);
//   } finally {
//     // 7️⃣ Cleanup
//     //Alert.alert('Cleanup', 'Clearing local flags and closing IAP connection');

//     await AsyncStorage.removeItem('flix10KPaying');
//     // await RNIap.endConnection();
//   }
// };
