// // components/PlayBillingStorageHandler.js
// import * as RNIap from 'react-native-iap';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// export const handlePlayStorageSubscription = async ({
//   months,
//   autoRenew,
//   setShowModal,
//   currentPurchaseToken, // pass if user already has a storage subscription
// }) => { 
//   try {
//     await AsyncStorage.setItem('storagePaying', 'true');

//     const productId = 'storage_subscription'; // storage subscription product in Play Console

//     // Map months to base plan IDs
//     const basePlanIdMap = {
//       1: 'storage_monthly',     // 1 month
//       3: 'storage_quarterly',   // 3 months
//       6: 'storage_halfyearly',  // 6 months
//       9: 'storage_nine_months', // 9 months
//       12: 'storage_yearly',     // 12 months
//     };

//     const basePlanId = basePlanIdMap[months];
//     if (!basePlanId) throw new Error('Invalid storage subscription duration selected.');

//     // Connect and get subscription offers
//     await RNIap.initConnection();
//     const subs = await RNIap.getSubscriptions([productId]);
//     const sub = subs?.[0];
//     if (!sub) throw new Error('Storage subscription not found in Play Store.');

//     // Find correct offer token for base plan
//     const offer = sub.subscriptionOfferDetails.find(
//       o => o.basePlanId === basePlanId
//     );
//     if (!offer) throw new Error('Offer not found for base plan: ' + basePlanId);

//     console.log('Selected Offer:', offer);

//     // Request subscription purchase
//     const purchase = await RNIap.requestSubscription({
//       sku: productId,
//       subscriptionOffers: [{ offerToken: offer.offerToken }],
//       ...(currentPurchaseToken && { oldSkuAndroid: currentPurchaseToken }), 
//       // use old purchase token if upgrading
//     });

//     console.log('Purchase result:', purchase);

//     // Send purchase data to backend for verification
//     const response = await axios.post(
//       `${process.env.EXPO_PUBLIC_API_URL}/api/subscription/verify-google-storage-subscription`,
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
//     await AsyncStorage.removeItem('storagePaying');
//   } catch (err) {
//     console.error('Play Billing Storage Subscription Error:', err);
//     await AsyncStorage.removeItem('storagePaying');
//   }
// };

// components/PlayBillingStorageHandler.js
import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';
import log from './logger';
import { Alert } from 'react-native';

export const handlePlayStorageSubscription = async ({
  planType, // 1 = Basic, 2 = Pro, 3 = Recovery
  months,
  autoRenew,
  setShowModal,
  currentPurchaseToken, // for Pro upgrades
  //hasPurchasedBasic, // flag from backend/user data
}) => { 
  try {
    await AsyncStorage.setItem('storagePaying', 'true');
    log.info("Storage Starting Play Billing flow for months and planType:", months, planType);
    console.log("Storage Starting Play Billing flow for months and planType:", months, planType);

    let productId = '';
    let basePlanIdMap = {};

    if (planType === 1) {
      // Basic plan
      // if (hasPurchasedBasic) {
      //   throw new Error('Basic plan can be purchased only once.');
      // }
      productId = 'storage_basic';
      basePlanIdMap = { 1: 'storage-basic-monthly' }; // only 1 month
      months = 1; // enforce 1 month
      autoRenew = false; // no auto-renew
    } else if (planType === 2) {
      // Pro plan
      productId = 'storage_pro';
      //productId = 'storage_basic';
      basePlanIdMap = {
        1: 'storage-pro-monthly',
        3: 'storage-proplan-quarterly',
        6: 'storage-pro-halfyearly',
        12: 'storage-pro-yearly',
      };
    } else if (planType === 3) {
      // Recovery plan (you can set logic same as Pro or custom)
      productId = 'storage_recovery';
      //productId = 'storage_basic';
      basePlanIdMap = { 1: 'storage-recovery-monthly' }; // example: 1 month
      months = 1;
      autoRenew = false;
    } else {
      throw new Error('Invalid plan type selected.');
    }

    const basePlanId = basePlanIdMap[months];
    //const basePlanId = 'storage-basic-monthly';
     if (!basePlanId) throw new Error('Invalid subscription duration selected.');
    log.info("Storage Base plan selected:", basePlanId);
    console.log("Storage Base plan selected:", basePlanId, productId);
    Alert.alert('Debug', 'Step 1: Storage Init connection');

    log.info("Step 1: Storage flush pending purchases");
    await RNIap.flushFailedPurchasesCachedAsPendingAndroid();

    // Connect and get subscription offers
    //await RNIap.initConnection();
     // ✅ Initialize connection
        //await RNIap.endConnection();
        const connected = await RNIap.initConnection();
        if (!connected) throw new Error('Billing connection failed.');

    log.debug("Storage IAP connection initialized");
    console.log("Storage IAP connection initialized", connected);
    Alert.alert('Debug', 'Step 2: Storage Getting subscriptions');

    //const subs = await RNIap.getSubscriptions([productId]);

    const subs = await RNIap.getSubscriptions({ skus: [productId] });
    if (!subs || subs.length === 0) {
      console.log(`Storage Subscription ${productId} not found in Play Store.`);
      throw new Error(`Storage Subscription ${productId} not found in Play Store.`);
    }

    //const allSubs = await RNIap.getSubscriptions();

    log.debug("Storage Subscriptions fetched:", subs);
    console.log("Storage Subscriptions fetched:", subs);

// const sub = allSubs.find((item) => item.productId === productId);

// if (!sub) throw new Error(`Subscription ${productId} not found in Play Store.`);

    const sub = subs?.[0];
    if (!sub) throw new Error(`Storage Subscription ${productId} not found in Play Store.`);
    console.log("First subscription:", sub);

    const offer = sub.subscriptionOfferDetails.find(
      o => o.basePlanId === basePlanId
    );
    if (!offer) throw new Error('Offer not found for base plan: ' + basePlanId);
    Alert.alert('Debug', 'Step 3: Storage Found subscriptions');

    console.log('Selected Offer:', offer);
    log.info("Storage Offer selected:", offer);

    await new Promise(res => setTimeout(res, 500));

    const oldToken = currentPurchaseToken || null;
    log.debug("Storage Old token:", oldToken);
    console.log("Storage Old token:", oldToken);

    console.log('sub.productId:', sub.productId);
    console.log('offerToken:', offer?.offerToken);

    // Request subscription purchase
    // const purchase = await RNIap.requestSubscription({
    //   sku: sub.productId,
    //   //subscriptionOffers: [{ offerToken: offer.offerToken }],
    //   // ...(planType === 2 && oldToken
    //   //   ? { oldSkuAndroid: oldToken }
    //   //   : {}), // upgrade logic only for Pro plan
    // });
    const purchase = await RNIap.requestSubscription({
      sku: sub.productId,
      subscriptionOffers: [
          { sku: sub.productId, offerToken: offer.offerToken }
        ],
         ...(planType === 2 && oldToken
        ? { oldPurchaseToken: oldToken }
        : {}),
    });

    console.log('Purchase result:', purchase);
    log.info("Storage Purchase result:", purchase);

    const purchaseItem = Array.isArray(purchase) ? purchase[0] : purchase;

    const token = purchaseItem?.purchaseToken;
    
    if (!token) throw new Error("No purchase token");

    console.log("Sending token:", token);
    console.log("Sending product:", purchaseItem.productId);

    Alert.alert('Debug', 'Step 4: Storage Purchase verification');

    // Send purchase data to backend for verification
    const response = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/patients/verify-google-storage-subscription-app`,
      {
        planType,
        purchaseToken: token,
        productId: purchaseItem.productId,
        basePlanId,
        autoRenew,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('Backend verified:', response.data);
    log.info("Storage Backend verification response:", response.data);

    if (!response?.data?.success) {
      throw new Error("Server verification failed");
    }

     // ✅ Step 5: Acknowledge purchase
    if (!purchaseItem?.isAcknowledgedAndroid) {
      try {
        console.log("token",token)
        await RNIap.acknowledgePurchaseAndroid({
          token: token,
        });
        console.log('✅ Purchase acknowledged successfully');
        log.info('Purchase acknowledged successfully');
      } catch (ackErr) {
        console.warn('⚠️ Acknowledge failed:', ackErr);
        await AsyncStorage.setItem("pendingAckToken", token);
        log.error('Acknowledge failed:', ackErr);
      }
    }

    setShowModal(false);
    //await RNIap.endConnection();
    await AsyncStorage.removeItem('storagePaying');

     return {
      success: true,
      purchase,
      verification: response.data,
    };
  } catch (err) {
    console.error('Storage Play Billing Subscription Error:', err);
    log.error("Storage Play Billing Subscription Error:", err);
    Alert.alert('Storage Play Billing Error', err?.message || JSON.stringify(err));
    return {
      success: false,
      error: err.message || 'Payment failed',
    };
  } finally {
  await RNIap.endConnection();
  await AsyncStorage.removeItem('storagePaying');
}
};