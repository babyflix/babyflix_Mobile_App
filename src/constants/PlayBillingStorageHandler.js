// components/PlayBillingStorageHandler.js
import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';
import { sendLog } from './logger';

const waitForSubscriptionPurchase = (productId, androidExtra = {}) =>
  new Promise((resolve, reject) => {
    let settled = false;

    const updateSub = RNIap.purchaseUpdatedListener((purchase) => {
      if (settled) return;
      settled = true;
      updateSub.remove();
      errorSub.remove();
      resolve(purchase);
    });

    const errorSub = RNIap.purchaseErrorListener((error) => {
      if (settled) return;
      settled = true;
      updateSub.remove();
      errorSub.remove();
      reject(error);
    });

    RNIap.requestPurchase({
      request: {
        google: {
          skus: [productId],
          ...androidExtra,
        },
      },
      type: 'subs',
    }).catch((err) => {
      if (settled) return;
      settled = true;
      updateSub.remove();
      errorSub.remove();
      reject(err);
    });
  });

export const handlePlayStorageSubscription = async ({
  planType, // 1 = Basic, 2 = Pro, 3 = Recovery
  months,
  autoRenew,
  setShowModal,
  currentPurchaseToken, // for Pro upgrades
}) => {
  const log = (msg, type = 'INFO') =>
    sendLog({
      message: msg,
      screen: 'StoragePurchase',
      log_type: type,
    });

  try {
    await AsyncStorage.setItem('storagePaying', 'true');
    console.log("Storage Starting Play Billing flow for months and planType:", months, planType);
    log(`Purchase flow started: planType=${planType}, months=${months}, autoRenew=${autoRenew}`);

    let productId = '';
    let basePlanIdMap = {};

    if (planType === 1) {
      // Basic plan
      productId = 'storage_basic';
      basePlanIdMap = { 1: 'storage-basic-monthly' }; // only 1 month
      months = 1; // enforce 1 month
      autoRenew = false; // no auto-renew
    } else if (planType === 2) {
      // Pro plan
      productId = 'storage_pro';
      basePlanIdMap = {
        1: 'storage-pro-monthly',
        3: 'storage-proplan-quarterly',
        6: 'storage-pro-halfyearly',
        12: 'storage-pro-yearly',
      };
    } else if (planType === 3) {
      // Recovery plan (you can set logic same as Pro or custom)
      productId = 'storage_recovery';
      basePlanIdMap = { 1: 'storage-recovery-monthly' }; // example: 1 month
      months = 1;
      autoRenew = false;
    } else {
      throw new Error('Invalid plan type selected.');
    }

    const basePlanId = basePlanIdMap[months];
    if (!basePlanId) throw new Error('Invalid subscription duration selected.');
    console.log("Storage Base plan selected:", basePlanId, productId);

    // ✅ Initialize connection
    const connected = await RNIap.initConnection();
    if (!connected) throw new Error('Billing connection failed.');

    console.log("Storage IAP connection initialized", connected);

    const subs = await RNIap.fetchProducts({ skus: [productId], type: 'subs' });
    if (!subs || subs.length === 0) {
      console.log(`Storage Subscription ${productId} not found in Play Store.`);
      throw new Error(`Storage Subscription ${productId} not found in Play Store.`);
    }

    console.log("Storage Subscriptions fetched:", subs);

    const sub = subs?.[0];
    if (!sub) throw new Error(`Storage Subscription ${productId} not found in Play Store.`);
    console.log("First subscription:", sub);

    const offer = sub.subscriptionOfferDetailsAndroid?.find(
      o => o.basePlanId === basePlanId
    );
    if (!offer) throw new Error('Offer not found for base plan: ' + basePlanId);

    console.log('Selected Offer:', offer);

    await new Promise(res => setTimeout(res, 500));

    const oldToken = currentPurchaseToken || null;
    console.log("Storage Old token:", oldToken);

    console.log('sub.id:', sub.id);
    console.log('offerToken:', offer?.offerToken);

    // Request subscription purchase — upgrade proration only applies to Pro plan
    const purchase = await waitForSubscriptionPurchase(sub.id, {
      subscriptionOffers: [{ sku: sub.id, offerToken: offer.offerToken }],
      ...(planType === 2 && oldToken
        ? {
            purchaseToken: oldToken,
            subscriptionProductReplacementParams: {
              oldProductId: sub.id,
              replacementMode: 'with-time-proration',
            },
          }
        : {}),
    });

    console.log('Purchase result:', purchase);
    log(`Purchase completed: productId=${purchase?.productId}`);

    const token = purchase?.purchaseToken;

    if (!token) throw new Error("No purchase token");

    console.log("Sending token:", token);
    console.log("Sending product:", purchase.productId);

    // Send purchase data to backend for verification
    const response = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/patients/verify-google-storage-subscription-app`,
      {
        planType,
        purchaseToken: token,
        productId: purchase.productId,
        basePlanId,
        autoRenew,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('Backend verified:', response.data);
    log(`Backend verification response: ${JSON.stringify(response.data)}`);

    if (!response?.data?.success) {
      throw new Error("Server verification failed");
    }

    // ✅ Step 5: Acknowledge purchase
    if (!purchase?.isAcknowledgedAndroid) {
      try {
        console.log("token", token);
        await RNIap.finishTransaction({ purchase, isConsumable: false });
        console.log('✅ Purchase acknowledged successfully');
        log('Purchase acknowledged');
      } catch (ackErr) {
        console.warn('⚠️ Acknowledge failed:', ackErr);
        await AsyncStorage.setItem("pendingAckToken", token);
      }
    }

    setShowModal(false);
    await AsyncStorage.removeItem('storagePaying');

    return {
      success: true,
      purchase,
      verification: response.data,
    };
  } catch (err) {
    console.error('Storage Play Billing Subscription Error:', err);
    log(`Purchase flow failed: ${err?.message || JSON.stringify(err)}`, 'ERROR');
    return {
      success: false,
      error: err.message || 'Payment failed',
    };
  } finally {
    await RNIap.endConnection();
    await AsyncStorage.removeItem('storagePaying');
  }
};
