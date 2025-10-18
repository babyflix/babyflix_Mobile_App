// // components/PlayBillingHandler.js
// import * as RNIap from 'react-native-iap';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// export const handleGooglePlayPayment = async ({ months, autoRenew, setShowModal }) => {
//   try {
//     await AsyncStorage.setItem('flix10KPaying', 'true');

//     const productId = 'flix10k_subscription'; // your Play Store subscription ID
//     const basePlanIdMap = {
//       1: 'flix1m',
//       3: 'flix3m',
//       6: 'flix6m',
//       9: 'flix9m',
//       12: 'flix12m',
//     };

//     const basePlanId = basePlanIdMap[months];
//     if (!basePlanId) throw new Error('Invalid subscription duration selected.');

//     await RNIap.initConnection();

//     const subscriptions = await RNIap.getSubscriptions([productId]);
//     const selectedOffer = subscriptions[0]?.subscriptionOfferDetails?.find(
//       o => o.basePlanId === basePlanId
//     );

//     if (!selectedOffer) throw new Error(`Offer not found for ${months}-month plan.`);

//     // Request the subscription purchase
//     const purchase = await RNIap.requestSubscription({
//       sku: productId,
//       subscriptionOffers: [{ offerToken: selectedOffer.offerToken }],
//     });

//     console.log('Purchase result:', purchase);

//     // Send purchase data to backend to verify and store
//     const response = await axios.post(
//       `${process.env.EXPO_PUBLIC_API_URL}/api/subscription/verify-google-play`,
//       {
//         purchaseToken: purchase.purchaseToken,
//         productId: purchase.productId,
//         months,
//         autoRenew, // user’s choice true/false
//       },
//       {
//         headers: { 'Content-Type': 'application/json' },
//       }
//     );

//     console.log('Backend verified:', response.data);
//     setShowModal(false);
//     await RNIap.endConnection();
//     await AsyncStorage.removeItem('flix10KPaying');
//   } catch (err) {
//     console.error('Play Billing error:', err);
//     await AsyncStorage.removeItem('flix10KPaying');
//   }
// };

// import * as RNIap from 'react-native-iap';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { EXPO_PUBLIC_API_URL } from '@env';

// export const handlePlaySubscription = async ({
//   months,
//   autoRenew,
//   setShowModal,
//   currentPurchaseToken, // <-- pass this if user already has a subscription
// }) => { 
//   try {
//     await AsyncStorage.setItem('flix10KPaying', 'true');

//     const productId = 'flix10k_subscription'; // same as in Play Console

//     // Map months to Play Store base plan IDs
//    const basePlanIdMap = {
//         1: 'flix-monthly',     // 1 month
//         3: 'flix-quarterly',   // 3 months
//         6: 'flix-halfyearly',  // 6 months
//         12: 'flix-yearly',     // 12 months
//     };

//     const basePlanId = basePlanIdMap[months];
//     if (!basePlanId) throw new Error('Invalid subscription duration selected.');

//     // Connect and get subscription offers
//     await RNIap.initConnection();
//     const subs = await RNIap.getSubscriptions([productId]);
//     const sub = subs?.[0];
//     if (!sub) throw new Error('Subscription not found in Play Store.');

//     // Find correct offer token for base plan
//     const offer = sub.subscriptionOfferDetails.find(
//       o => o.basePlanId === basePlanId
//     );
//     if (!offer) throw new Error('Offer not found for base plan: ' + basePlanId);

//     console.log('Selected Offer:', offer);

//     const oldToken = currentPurchaseToken || null;
//     // Request subscription purchase
//     const purchase = await RNIap.requestSubscription({
//       sku: productId,
//       subscriptionOffers: [{ offerToken: offer.offerToken }],
//       ...(oldToken && { oldSkuAndroid: oldToken }), 
//       // <-- pass old purchase token if upgrading
//     });

//     console.log('Purchase result:', purchase);

//     // Send purchase data to backend for verification
//     const response = await axios.post(
//       `${EXPO_PUBLIC_API_URL}/api/subscription/verify-google-subscription-app`,
//       {
//         purchaseToken: purchase.purchaseToken,
//         productId: purchase.productId,
//         basePlanId,
//         autoRenew,
//       },
//       { headers: { 'Content-Type': 'application/json' } }
//     );

//     console.log('Backend verified:', response.data);

//     setShowModal(false);
//     await RNIap.endConnection();
//     await AsyncStorage.removeItem('flix10KPaying');

//      return {
//       success: true,
//       purchase,
//       verification: response.data,
//     };
//   } catch (err) {
//     console.error('Play Billing Subscription Error:', err);
//     await AsyncStorage.removeItem('flix10KPaying');
//     return {
//       success: false,
//       error: err.message || 'Payment failed',
//     };
//   }
// };

import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';
import { Alert } from 'react-native';
import log from './logger';

export const handlePlaySubscription = async ({
  months,
  autoRenew,
  setShowModal,
  currentPurchaseToken,
}) => {
  try {
    log.info("Starting Play Billing flow for months:", months);
    console.log("Starting Play Billing flow for months:", months);
    await AsyncStorage.setItem('flix10KPaying', 'true');

    const productId = 'flix10k_subscription'; // ✅ must match Play Console

    const basePlanIdMap = {
      1: 'flix-monthly',
      3: 'flix-quarterly',
      6: 'flix-halfyearly',
      12: 'flix-yearly',
    };

    const basePlanId = basePlanIdMap[months];
    if (!basePlanId) throw new Error('Invalid subscription duration selected.');

    console.log("Base plan selected:", basePlanId, productId);
    log.info("Base plan selected:", basePlanId);
    Alert.alert('Debug', 'Step 1: Init connection');

    // ✅ Flush any pending transactions first
    await RNIap.flushFailedPurchasesCachedAsPendingAndroid();

    // ✅ Initialize connection
    const connected = await RNIap.initConnection();
    if (!connected) throw new Error('Billing connection failed.');

    console.log("IAP connection initialized", connected);
     log.debug("IAP connection initialized");
     Alert.alert('Debug', 'Step 2: Getting subscriptions');

    // ✅ Get available subscriptions
    const subs = await RNIap.getSubscriptions({ skus: [productId] });
    if (!subs || subs.length === 0) {
      console.log(`Subscription ${productId} not found in Play Store.`);
      throw new Error(`Subscription ${productId} not found in Play Store.`);
    }
    console.log('Available subscriptions:', JSON.stringify(subs, null, 2));
    log.debug("Subscriptions fetched:", subs);
    console.log("Subscriptions fetched:", subs)
    //  const allSubs = await RNIap.getSubscriptions();

    // log.debug("Subscriptions fetched:", allSubs);
    // console.log("Subscriptions fetched:", allSubs);

    // const sub = allSubs.find((item) => item.productId === productId);

    // if (!sub) throw new Error(`Subscription ${productId} not found in Play Store.`);

    const sub = subs?.[0];
    if (!sub) throw new Error('Subscription not found in Play Store.');
    console.log("First subscription:", sub);

    // ✅ Find correct offer
    const offer = sub.subscriptionOfferDetails?.find(
      (o) => o.basePlanId === basePlanId
    );
    if (!offer) throw new Error(`Offer not found for base plan: ${basePlanId}`);

    Alert.alert('Debug', 'Step 3: Found subscriptions');

    console.log('Selected Offer:', offer);
     log.info("Offer selected:", offer);

     await new Promise(res => setTimeout(res, 500));

    // ✅ Purchase flow
    const oldToken = currentPurchaseToken || null;
    log.debug("Old token:", oldToken);

    const purchase = await RNIap.requestSubscription({
      sku: productId,
      subscriptionOffers: [{ offerToken: offer.offerToken }],
      ...(oldToken && { oldSkuAndroid: oldToken }),
    });

    // const purchase = await RNIap.requestSubscription({
    //   skus: [productId],
    //   subscriptionOffers: [{ offerToken: offer.offerToken }],
    //   ...(oldToken && { oldSkuAndroid: oldToken }),
    // });

    console.log('Purchase result:', purchase);
    log.info("Purchase result:", purchase);

    Alert.alert('Debug', 'Step 4: Purchase verification');

    // ✅ Verify with backend
    const response = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/subscription/verify-google-subscription-app`,
      {
        purchaseToken: purchase.purchaseToken,
        productId: purchase.productId,
        basePlanId,
        autoRenew,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('Backend verified:', response.data);
    log.info("Backend verification response:", response.data);

    setShowModal(false);
    await AsyncStorage.removeItem('flix10KPaying');
    await RNIap.endConnection();

    return {
      success: true,
      purchase,
      verification: response.data,
    };
  } catch (err) {
    console.error('Play Billing Subscription Error:', err);
    log.error("Play Billing Subscription Error:", err);
    Alert.alert('Play Billing Error', err?.message || JSON.stringify(err));
    await AsyncStorage.removeItem('flix10KPaying');
    await RNIap.endConnection();
    return {
      success: false,
      error: err.message || 'Payment failed',
    };
  }
};
