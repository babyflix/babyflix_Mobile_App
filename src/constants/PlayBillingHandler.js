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

export const handlePlaySubscription = async ({
  months,
  autoRenew,
  setShowModal,
  currentPurchaseToken,
  userUuid,
}) => {
  const log = (msg, type = 'INFO') =>
    sendLog({
      message: msg,
      screen: 'Flix10KPurchase',
      log_type: type,
      user_id: userUuid,
    });

  try {
    console.log("Starting Play Billing flow for months:", months);
    log(`Purchase flow started: months=${months}, autoRenew=${autoRenew}`);
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

    // ✅ Initialize connection
    const connected = await RNIap.initConnection();
    if (!connected) throw new Error('Billing connection failed.');

    console.log("IAP connection initialized", connected);

    // ✅ Get available subscriptions
    const subs = await RNIap.fetchProducts({ skus: [productId], type: 'subs' });
    if (!subs || subs.length === 0) {
      console.log(`Subscription ${productId} not found in Play Store.`);
      throw new Error(`Subscription ${productId} not found in Play Store.`);
    }
    console.log('Available subscriptions:', JSON.stringify(subs, null, 2));

    const sub = subs?.[0];
    if (!sub) throw new Error('Subscription not found in Play Store.');
    console.log("First subscription:", sub);

    // ✅ Find correct offer
    const offer = sub.subscriptionOfferDetailsAndroid?.find(
      (o) => o.basePlanId === basePlanId
    );
    if (!offer) throw new Error(`Offer not found for base plan: ${basePlanId}`);

    console.log('Selected Offer:', offer);

    await new Promise(res => setTimeout(res, 500));

    // ✅ Purchase flow
    const oldToken = currentPurchaseToken || null;
    console.log("Old token:", oldToken);

    console.log('sub.id:', sub.id);
    console.log('offerToken:', offer?.offerToken);

    const purchase = await waitForSubscriptionPurchase(sub.id, {
      subscriptionOffers: [{ sku: sub.id, offerToken: offer.offerToken }],
      ...(oldToken && {
        purchaseToken: oldToken,
        subscriptionProductReplacementParams: {
          oldProductId: sub.id,
          replacementMode: 'with-time-proration',
        },
      }),
    });

    console.log('Purchase result:', purchase);
    log(`Purchase completed: productId=${purchase?.productId}`);

    const token = purchase?.purchaseToken;

    if (!token) throw new Error("No purchase token");

    console.log("Sending token:", token);
    console.log("Sending product:", purchase.productId);

    // ✅ Verify with backend
    const response = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/subscription/verify-google-subscription-app`,
      {
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
        console.log("Acknowledging token:", token);
        await RNIap.finishTransaction({ purchase, isConsumable: false });
        console.log("✅ Purchase acknowledged successfully");
      } catch (ackErr) {
        console.warn("⚠️ Acknowledge failed:", ackErr);
        await AsyncStorage.setItem("pendingAckToken", token);
      }
    }

    // ✅ SAVE SUBSCRIPTION TO DATABASE
    const subscriptionPayload = {
      uuid: userUuid,
      subscriptionId: 1,
      autoRenewal: autoRenew,
      subscribedMonths: months,
      stripeSessionId: "play_billing_" + (purchase.transactionId || Date.now()),
      status: "SUCCESS",
      provider: "play_billing",
      currentPurchaseToken: token,
    };

    try {
      await axios.post(
        `${EXPO_PUBLIC_API_URL}/api/subscription/subscription`,
        subscriptionPayload
      );
      console.log("Subscription API saved successfully");
      log('Subscription saved to DB');
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
    log(`Purchase flow failed: ${err?.message || JSON.stringify(err)}`, 'ERROR');
    return {
      success: false,
      error: err.message || 'Payment failed',
    };
  } finally {
    await RNIap.endConnection();
    await AsyncStorage.removeItem('flix10KPaying');
  }
};
