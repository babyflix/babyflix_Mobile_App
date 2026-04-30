// import * as RNIap from 'react-native-iap';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { EXPO_PUBLIC_API_URL } from '@env';
// //import { Alert } from 'react-native';
// //import log from './logger';

// export const handlePlaySubscription = async ({
//   months,
//   autoRenew,
//   setShowModal,
//   currentPurchaseToken,
//   userUuid,
// }) => {
//   try {
//     //log.info("Starting Play Billing flow for months:", months);
//     console.log("Starting Play Billing flow for months:", months);
//     await AsyncStorage.setItem('flix10KPaying', 'true');

//     const productId = 'flix10k_subscription'; // ✅ must match Play Console
//     //const productId = 'storage_recovery';

//     const basePlanIdMap = {
//       1: 'flix-monthly',
//       3: 'flix-quarterly',
//       6: 'flix-halfyearly',
//       12: 'flix-yearly',
//     };

//     const basePlanId = basePlanIdMap[months];
//     //const basePlanId = 'storage-recovery-monthly';
//     if (!basePlanId) throw new Error('Invalid subscription duration selected.');

//     console.log("Base plan selected:", basePlanId, productId);
//     //log.info("Base plan selected:", basePlanId);
//     //Alert.alert('Debug', 'Step 1: Init connection');

//     // ✅ Flush any pending transactions first
//     await RNIap.flushFailedPurchasesCachedAsPendingAndroid();

//     // ✅ Initialize connection
//     //await RNIap.endConnection();
//     const connected = await RNIap.initConnection();
//     if (!connected) throw new Error('Billing connection failed.');

//     console.log("IAP connection initialized", connected);
//      //log.debug("IAP connection initialized");
//      //Alert.alert('Debug', 'Step 2: Getting subscriptions');

//     // ✅ Get available subscriptions
//     const subs = await RNIap.getSubscriptions({ skus: [productId] });
//     if (!subs || subs.length === 0) {
//       console.log(`Subscription ${productId} not found in Play Store.`);
//       throw new Error(`Subscription ${productId} not found in Play Store.`);
//     }
//     console.log('Available subscriptions:', JSON.stringify(subs, null, 2));
//     //log.debug("Subscriptions fetched:", subs);
//     console.log("Subscriptions fetched:", subs)
//     //  const allSubs = await RNIap.getSubscriptions();

//     // log.debug("Subscriptions fetched:", allSubs);
//     //console.log("Subscriptions fetched:", allSubs);

//     // const sub = allSubs.find((item) => item.productId === productId);

//     // if (!sub) throw new Error(`Subscription ${productId} not found in Play Store.`);

//     const sub = subs?.[0];
//     if (!sub) throw new Error('Subscription not found in Play Store.');
//     console.log("First subscription:", sub);

//     // ✅ Find correct offer
//     const offer = sub.subscriptionOfferDetails?.find(
//       (o) => o.basePlanId === basePlanId
//     );
//     if (!offer) throw new Error(`Offer not found for base plan: ${basePlanId}`);

//     //Alert.alert('Debug', 'Step 3: Found subscriptions');

//     console.log('Selected Offer:', offer);
//     //log.info("Offer selected:", offer);

//      await new Promise(res => setTimeout(res, 500));

//     // ✅ Purchase flow
//     const oldToken = currentPurchaseToken || null;
//     //log.debug("Old token:", oldToken);
//     console.log("Old token:", oldToken)

//     console.log('sub.productId:', sub.productId);
//     console.log('offerToken:', offer?.offerToken);

//     // const purchaseOptions = {
//     //     sku: sub.productId,
//     //     //subscriptionOffers: [{ offerToken: offer.offerToken }],
//     //     // Conditionally add upgrade options ONLY if a currentPurchaseToken exists
//     //     // ...(currentPurchaseToken && {
//     //     //   oldPurchaseToken: currentPurchaseToken,
//     //     //   prorationModeAndroid: prorationMode,
//     //     // }),
//     //   };
//      const purchaseOptions = {
//         sku: sub.productId,
//          subscriptionOffers: [
//           { sku: sub.productId, offerToken: offer.offerToken }
//         ],
//          ...(oldToken && {
//           oldPurchaseToken: oldToken,
//           prorationModeAndroid: RNIap.ProrationModes.IMMEDIATE_WITH_TIME_PRORATION,
//         }),
//       }

//       console.log("Requesting subscription with options:", purchaseOptions)

//     // const purchase = await RNIap.requestSubscription({
//     //   sku: sub.productId,
//     //   subscriptionOffers: [{ offerToken: offer.offerToken }],
//     //   //...(oldToken && { oldSkuAndroid: oldToken }),
//     // });
//     const purchase = await RNIap.requestSubscription(purchaseOptions);
//     // const purchase = await RNIap.requestSubscription({
//     //   skus: [productId],
//     //   subscriptionOffers: [{ offerToken: offer.offerToken }],
//     //   ...(oldToken && { oldSkuAndroid: oldToken }),
//     // });

//     console.log('Purchase result:', purchase);
//     //log.info("Purchase result:", purchase);

//     const purchaseItem = Array.isArray(purchase) ? purchase[0] : purchase;

//     const token = purchaseItem?.purchaseToken;

//     if (!token) throw new Error("No purchase token");

//     console.log("Sending token:", token);
//     console.log("Sending product:", purchaseItem.productId);

//     //Alert.alert('Debug', 'Step 4: Purchase verification');

//     // ✅ Verify with backend
//     const response = await axios.post(
//       `${EXPO_PUBLIC_API_URL}/api/subscription/verify-google-subscription-app`,
//       {
//         purchaseToken: token,
//         productId: purchaseItem.productId,
//         basePlanId,
//         autoRenew,
//       },
//       { headers: { 'Content-Type': 'application/json' } }
//     );

//     console.log('Backend verified:', response.data);
//     //log.info("Backend verification response:", response.data);

//     if (!response?.data?.success) {
//       throw new Error("Server verification failed");
//     }

//      // ✅ Step 5: Acknowledge purchase
//     if (!purchaseItem?.isAcknowledgedAndroid) {
//       try {
//         console.log("Acknowledging token:", token);
//         await RNIap.acknowledgePurchaseAndroid({
//           token: token,
//         });
//         console.log("✅ Purchase acknowledged successfully");
//       } catch (ackErr) {
//         console.warn("⚠️ Acknowledge failed:", ackErr);
//         await AsyncStorage.setItem("pendingAckToken", token);
//       }
//     }

//     // ✅ SAVE SUBSCRIPTION TO DATABASE
//     const subscriptionPayload = {
//       uuid: userUuid,
//       subscriptionId: 1,
//       autoRenewal: autoRenew,
//       subscribedMonths: months,
//       stripeSessionId: "play_billing_" + Date.now(),
//       status: "SUCCESS",
//       provider: "play_billing",
//       currentPurchaseToken: token,
//     };

//     //console.log("Calling subscription API with:", subscriptionPayload);

//     // await axios.post(
//     //   `${EXPO_PUBLIC_API_URL}/api/subscription/subscription`,
//     //   subscriptionPayload
//     // );

//     console.log("Subscription API saved successfully");

//     try {
//       const subscriptionResponse = await axios.post(
//         `${EXPO_PUBLIC_API_URL}/api/subscription/subscription`,
//         subscriptionPayload
//       );

//       //console.log("Subscription API response:", subscriptionResponse.data);
//     } catch (apiErr) {
//       // console.log("Subscription API error FULL:", {
//       //   message: apiErr.message,
//       //   status: apiErr.response?.status,
//       //   data: apiErr.response?.data,
//       // });
//       throw apiErr; // optional
//     }

//     setShowModal(false);
//     await AsyncStorage.removeItem('flix10KPaying');
//     //await RNIap.endConnection();

//     return {
//       success: true,
//       purchase,
//       verification: response.data,
//     };
//   } catch (err) {
//     console.error('Play Billing Subscription Error:', err);
//     //log.error("Play Billing Subscription Error:", err);
//     //Alert.alert('Play Billing Error', err?.message || JSON.stringify(err));
//     return {
//       success: false,
//       error: err.message || 'Payment failed',
//     };
//   } finally {
//   await RNIap.endConnection();
//   await AsyncStorage.removeItem('flix10KPaying');
// }
// };


import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestPurchase,
  finishTransaction,
  flushFailedPurchasesCachedAsPendingAndroid,
} from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';

export const handlePlaySubscription = async ({
  months,
  autoRenew,
  setShowModal,
  currentPurchaseToken,
  userUuid,
}) => {
  try {
    console.log('Starting Play Billing flow for months:', months);
    await AsyncStorage.setItem('flix10KPaying', 'true');

    const productId = 'flix10k_subscription';

    const basePlanIdMap = {
      1: 'flix-monthly',
      3: 'flix-quarterly',
      6: 'flix-halfyearly',
      12: 'flix-yearly',
    };

    const basePlanId = basePlanIdMap[months];
    if (!basePlanId) throw new Error('Invalid subscription duration selected.');

    console.log('Base plan selected:', basePlanId, productId);

    // CHANGE 1: initConnection must come BEFORE flush in v14
    const connected = await initConnection();
    if (!connected) throw new Error('Billing connection failed.');
    console.log('IAP connection initialized', connected);

    // CHANGE 1 (cont): flush runs after connection is established
    await flushFailedPurchasesCachedAsPendingAndroid();

    // Get available subscriptions — same call, same shape
    const subs = await getSubscriptions({ skus: [productId] });
    if (!subs || subs.length === 0) {
      throw new Error(`Subscription ${productId} not found in Play Store.`);
    }

    const sub = subs[0];
    if (!sub) throw new Error('Subscription not found in Play Store.');
    console.log('First subscription:', sub);

    // CHANGE 2: field renamed from subscriptionOfferDetails
    //           to subscriptionOfferDetailsAndroid in v14
    const offer = sub.subscriptionOfferDetailsAndroid?.find(
      (o) => o.basePlanId === basePlanId
    );
    if (!offer) throw new Error(`Offer not found for base plan: ${basePlanId}`);

    console.log('Selected Offer:', offer);

    const oldToken = currentPurchaseToken || null;
    console.log('Old token:', oldToken);

    // CHANGE 3: requestSubscription replaced by requestPurchase with
    //           nested request.android shape and explicit type: 'subs'
    // CHANGE 4: oldPurchaseToken renamed to purchaseTokenAndroid
    // CHANGE 5: ProrationModes enum removed — use replacementModeAndroid
    //           integer instead (2 = IMMEDIATE_WITH_TIME_PRORATION)
    const purchase = await requestPurchase({
      request: {
        android: {
          skus: [sub.productId],
          subscriptionOffers: [
            { sku: sub.productId, offerToken: offer.offerToken },
          ],
          ...(oldToken && {
            purchaseTokenAndroid: oldToken,
            replacementModeAndroid: 2, // IMMEDIATE_WITH_TIME_PRORATION
          }),
        },
      },
      type: 'subs',
    });

    console.log('Purchase result:', purchase);

    const purchaseItem = Array.isArray(purchase) ? purchase[0] : purchase;
    const token = purchaseItem?.purchaseToken;
    if (!token) throw new Error('No purchase token');

    console.log('Sending token:', token);
    console.log('Sending product:', purchaseItem.productId);

    // Verify with backend
    const response = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/subscription/verify-google-subscription-app`,
      {
        purchaseToken: token,
        productId: purchaseItem.productId,
        basePlanId,
        autoRenew,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('Backend verified:', response.data);

    if (!response?.data?.success) {
      throw new Error('Server verification failed');
    }

    // CHANGE 6: acknowledgePurchaseAndroid removed in v14 —
    //           finishTransaction is the unified replacement for both
    //           acknowledge (non-consumable) and consume (consumable)
    if (!purchaseItem?.isAcknowledgedAndroid) {
      try {
        console.log('Acknowledging token:', token);
        await finishTransaction({ purchase: purchaseItem, isConsumable: false });
        console.log('Purchase acknowledged successfully');
      } catch (ackErr) {
        console.warn('Acknowledge failed:', ackErr);
        await AsyncStorage.setItem('pendingAckToken', token);
      }
    }

    // Save subscription to database
    const subscriptionPayload = {
      uuid: userUuid,
      subscriptionId: 1,
      autoRenewal: autoRenew,
      subscribedMonths: months,
      stripeSessionId: 'play_billing_' + Date.now(),
      status: 'SUCCESS',
      provider: 'play_billing',
      currentPurchaseToken: token,
    };

    try {
      const subscriptionResponse = await axios.post(
        `${EXPO_PUBLIC_API_URL}/api/subscription/subscription`,
        subscriptionPayload
      );
      console.log('Subscription API saved successfully');
    } catch (apiErr) {
      throw apiErr;
    }

    setShowModal(false);
    await AsyncStorage.removeItem('flix10KPaying');

    return {
      success: true,
      purchase,
      verification: response.data,
    };
  } catch (err) {
    console.error('Play Billing Subscription Error:', err);
    return {
      success: false,
      error: err.message || 'Payment failed',
    };
  } finally {
    await endConnection();
    await AsyncStorage.removeItem('flix10KPaying');
  }
};