// components/PlayBillingStorageHandler.js
import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';
//import log from './logger';
//import { Alert } from 'react-native';

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
    //log.info("Storage Starting Play Billing flow for months and planType:", months, planType);
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
    //log.info("Storage Base plan selected:", basePlanId);
    console.log("Storage Base plan selected:", basePlanId, productId);
    //Alert.alert('Debug', 'Step 1: Storage Init connection');

    //log.info("Step 1: Storage flush pending purchases");
    await RNIap.flushFailedPurchasesCachedAsPendingAndroid();

    // Connect and get subscription offers
    //await RNIap.initConnection();
     // ✅ Initialize connection
        //await RNIap.endConnection();
        const connected = await RNIap.initConnection();
        if (!connected) throw new Error('Billing connection failed.');

    //log.debug("Storage IAP connection initialized");
    console.log("Storage IAP connection initialized", connected);
    //Alert.alert('Debug', 'Step 2: Storage Getting subscriptions');

    //const subs = await RNIap.getSubscriptions([productId]);

    const subs = await RNIap.getSubscriptions({ skus: [productId] });
    if (!subs || subs.length === 0) {
      console.log(`Storage Subscription ${productId} not found in Play Store.`);
      throw new Error(`Storage Subscription ${productId} not found in Play Store.`);
    }

    //const allSubs = await RNIap.getSubscriptions();

    //log.debug("Storage Subscriptions fetched:", subs);
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
    //Alert.alert('Debug', 'Step 3: Storage Found subscriptions');

    console.log('Selected Offer:', offer);
    //log.info("Storage Offer selected:", offer);

    await new Promise(res => setTimeout(res, 500));

    const oldToken = currentPurchaseToken || null;
    //log.debug("Storage Old token:", oldToken);
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
        ? { oldPurchaseToken: oldToken, prorationModeAndroid: RNIap.ProrationModes.IMMEDIATE_WITH_TIME_PRORATION, }
        : {}),
    });

    console.log('Purchase result:', purchase);
    //log.info("Storage Purchase result:", purchase);

    const purchaseItem = Array.isArray(purchase) ? purchase[0] : purchase;

    const token = purchaseItem?.purchaseToken;
    
    if (!token) throw new Error("No purchase token");

    console.log("Sending token:", token);
    console.log("Sending product:", purchaseItem.productId);

    //Alert.alert('Debug', 'Step 4: Storage Purchase verification');

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
    //log.info("Storage Backend verification response:", response.data);

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
        //log.info('Purchase acknowledged successfully');
      } catch (ackErr) {
        console.warn('⚠️ Acknowledge failed:', ackErr);
        await AsyncStorage.setItem("pendingAckToken", token);
        //log.error('Acknowledge failed:', ackErr);
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
    //log.error("Storage Play Billing Subscription Error:", err);
    //Alert.alert('Storage Play Billing Error', err?.message || JSON.stringify(err));
    return {
      success: false,
      error: err.message || 'Payment failed',
    };
  } finally {
  await RNIap.endConnection();
  await AsyncStorage.removeItem('storagePaying');
}
};


// // components/PlayBillingStorageHandler.js
// import {
//   initConnection,
//   endConnection,
//   getSubscriptions,
//   requestPurchase,
//   finishTransaction,
//   flushFailedPurchasesCachedAsPendingAndroid,
// } from 'react-native-iap';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { EXPO_PUBLIC_API_URL } from '@env';

// export const handlePlayStorageSubscription = async ({
//   planType, // 1 = Basic, 2 = Pro, 3 = Recovery
//   months,
//   autoRenew,
//   setShowModal,
//   currentPurchaseToken, // for Pro upgrades
// }) => {
//   try {
//     await AsyncStorage.setItem('storagePaying', 'true');
//     console.log('Storage Starting Play Billing flow for months and planType:', months, planType);

//     let productId = '';
//     let basePlanIdMap = {};

//     if (planType === 1) {
//       productId = 'storage_basic';
//       basePlanIdMap = { 1: 'storage-basic-monthly' };
//       months = 1;
//       autoRenew = false;
//     } else if (planType === 2) {
//       productId = 'storage_pro';
//       basePlanIdMap = {
//         1: 'storage-pro-monthly',
//         3: 'storage-proplan-quarterly',
//         6: 'storage-pro-halfyearly',
//         12: 'storage-pro-yearly',
//       };
//     } else if (planType === 3) {
//       productId = 'storage_recovery';
//       basePlanIdMap = { 1: 'storage-recovery-monthly' };
//       months = 1;
//       autoRenew = false;
//     } else {
//       throw new Error('Invalid plan type selected.');
//     }

//     const basePlanId = basePlanIdMap[months];
//     if (!basePlanId) throw new Error('Invalid subscription duration selected.');
//     console.log('Storage Base plan selected:', basePlanId, productId);

//     // CHANGE 1: initConnection must come BEFORE flush in v14
//     const connected = await initConnection();
//     if (!connected) throw new Error('Billing connection failed.');
//     console.log('Storage IAP connection initialized', connected);

//     // CHANGE 1 (cont): flush runs after connection is established
//     await flushFailedPurchasesCachedAsPendingAndroid();

//     const subs = await getSubscriptions({ skus: [productId] });
//     if (!subs || subs.length === 0) {
//       throw new Error(`Storage Subscription ${productId} not found in Play Store.`);
//     }
//     console.log('Storage Subscriptions fetched:', subs);

//     const sub = subs[0];
//     if (!sub) throw new Error(`Storage Subscription ${productId} not found in Play Store.`);
//     console.log('First subscription:', sub);

//     // CHANGE 2: field renamed from subscriptionOfferDetails
//     //           to subscriptionOfferDetailsAndroid in v14
//     const offer = sub.subscriptionOfferDetailsAndroid?.find(
//       (o) => o.basePlanId === basePlanId
//     );
//     if (!offer) throw new Error('Offer not found for base plan: ' + basePlanId);
//     console.log('Selected Offer:', offer);

//     const oldToken = currentPurchaseToken || null;
//     console.log('Storage Old token:', oldToken);
//     console.log('sub.productId:', sub.productId);
//     console.log('offerToken:', offer?.offerToken);

//     // CHANGE 3: requestSubscription replaced by requestPurchase with
//     //           nested request.android shape and explicit type: 'subs'
//     // CHANGE 4: oldPurchaseToken renamed to purchaseTokenAndroid
//     // CHANGE 5: ProrationModes enum removed — replacementModeAndroid: 2
//     //           is IMMEDIATE_WITH_TIME_PRORATION (Pro upgrades only)
//     const purchase = await requestPurchase({
//       request: {
//         android: {
//           skus: [sub.productId],
//           subscriptionOffers: [
//             { sku: sub.productId, offerToken: offer.offerToken },
//           ],
//           ...(planType === 2 && oldToken && {
//             purchaseTokenAndroid: oldToken,
//             replacementModeAndroid: 2, // IMMEDIATE_WITH_TIME_PRORATION
//           }),
//         },
//       },
//       type: 'subs',
//     });

//     console.log('Purchase result:', purchase);

//     const purchaseItem = Array.isArray(purchase) ? purchase[0] : purchase;
//     const token = purchaseItem?.purchaseToken;
//     if (!token) throw new Error('No purchase token');

//     console.log('Sending token:', token);
//     console.log('Sending product:', purchaseItem.productId);

//     // Verify with backend
//     const response = await axios.post(
//       `${EXPO_PUBLIC_API_URL}/api/patients/verify-google-storage-subscription-app`,
//       {
//         planType,
//         purchaseToken: token,
//         productId: purchaseItem.productId,
//         basePlanId,
//         autoRenew,
//       },
//       { headers: { 'Content-Type': 'application/json' } }
//     );

//     console.log('Backend verified:', response.data);

//     if (!response?.data?.success) {
//       throw new Error('Server verification failed');
//     }

//     // CHANGE 6: acknowledgePurchaseAndroid removed in v14 —
//     //           finishTransaction is the unified replacement
//     if (!purchaseItem?.isAcknowledgedAndroid) {
//       try {
//         console.log('Acknowledging token:', token);
//         await finishTransaction({ purchase: purchaseItem, isConsumable: false });
//         console.log('Purchase acknowledged successfully');
//       } catch (ackErr) {
//         console.warn('Acknowledge failed:', ackErr);
//         await AsyncStorage.setItem('pendingAckToken', token);
//       }
//     }

//     setShowModal(false);
//     await AsyncStorage.removeItem('storagePaying');

//     return {
//       success: true,
//       purchase,
//       verification: response.data,
//     };
//   } catch (err) {
//     console.error('Storage Play Billing Subscription Error:', err);
//     return {
//       success: false,
//       error: err.message || 'Payment failed',
//     };
//   } finally {
//     await endConnection();
//     await AsyncStorage.removeItem('storagePaying');
//   }
// };