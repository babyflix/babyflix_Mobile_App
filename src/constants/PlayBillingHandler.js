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

import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const handlePlaySubscription = async ({
  months,
  autoRenew,
  setShowModal,
  currentPurchaseToken, // <-- pass this if user already has a subscription
}) => { 
  try {
    await AsyncStorage.setItem('flix10KPaying', 'true');

    const productId = 'flix10k_subscription'; // same as in Play Console

    // Map months to Play Store base plan IDs
   const basePlanIdMap = {
        1: 'flix_monthly',     // 1 month
        3: 'flix_quarterly',   // 3 months
        6: 'flix_halfyearly',  // 6 months
        9: 'flix_nine_months', // 9 months
        12: 'flix_yearly',     // 12 months
    };

    const basePlanId = basePlanIdMap[months];
    if (!basePlanId) throw new Error('Invalid subscription duration selected.');

    // Connect and get subscription offers
    await RNIap.initConnection();
    const subs = await RNIap.getSubscriptions([productId]);
    const sub = subs?.[0];
    if (!sub) throw new Error('Subscription not found in Play Store.');

    // Find correct offer token for base plan
    const offer = sub.subscriptionOfferDetails.find(
      o => o.basePlanId === basePlanId
    );
    if (!offer) throw new Error('Offer not found for base plan: ' + basePlanId);

    console.log('Selected Offer:', offer);

    // Request subscription purchase
    const purchase = await RNIap.requestSubscription({
      sku: productId,
      subscriptionOffers: [{ offerToken: offer.offerToken }],
      ...(currentPurchaseToken && { oldSkuAndroid: currentPurchaseToken }), 
      // <-- pass old purchase token if upgrading
    });

    console.log('Purchase result:', purchase);

    // Send purchase data to backend for verification
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_URL}/api/subscription/verify-google-subscription`,
      {
        purchaseToken: purchase.purchaseToken,
        productId: purchase.productId,
        basePlanId,
        autoRenew,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('Backend verified:', response.data);

    setShowModal(false);
    await RNIap.endConnection();
    await AsyncStorage.removeItem('flix10KPaying');

     return {
      success: true,
      purchase,
      verification: response.data,
    };
  } catch (err) {
    console.error('Play Billing Subscription Error:', err);
    await AsyncStorage.removeItem('flix10KPaying');
    return {
      success: false,
      error: err.message || 'Payment failed',
    };
  }
};