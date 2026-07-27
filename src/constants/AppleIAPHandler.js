import * as RNIap from 'react-native-iap';
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

const waitForSubscriptionPurchase = (productId) =>
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
        apple: { sku: productId },
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

export const handleAppleFlix10KPayment = async ({
  months,
  user,
  setShowafterAdd,
  setShowPaymentSuccess,
  setShowPaymentFailure,
}) => {
  if (Platform.OS !== 'ios') return;

  const log = (msg, type = "INFO") =>
  sendLog({
    message: msg,
    screen: "Flix10KSubscription",
    log_type: type,
    user_id: user?.uuid,
  });

  if (isProcessing) {
    log("Blocked duplicate IAP call");
    return;
  }

  isProcessing = true;

  const productId = FLIX10K_PRODUCTS[months];

  log(`IAP START | months=${months}, productId=${productId}`);

   if (!productId) {
    log("Invalid product selected", "ERROR");
    isProcessing = false;
    return;
  }

  try {
    await RNIap.initConnection();

    log("IAP connection initialized");

     // ✅ Fetch products from Apple
    const products = await RNIap.fetchProducts({
      skus: Object.values(FLIX10K_PRODUCTS),
      type: 'subs',
    });

    log(`Products count: ${products.length}`);

    if (!products || products.length === 0) {
      throw new Error("No products returned from App Store");
    }

    const productExists = products.find(
      (p) => p.id === productId
    );

    if (!productExists) {
      log(`Product not found: ${productId}`, "ERROR");
      throw new Error("Product not available in App Store");
    }

    await AsyncStorage.setItem('flix10KPaying', 'true');

    log(`Requesting subscription: ${productId}`);

    const purchase = await waitForSubscriptionPurchase(productId);

    log(`Purchase success: ${purchase?.productId}`);

    if (!purchase?.purchaseToken) {
      log("No receipt received from Apple", "ERROR");
      throw new Error('No receipt received');
    }

    // 🔐 Verify receipt with backend
    log("Sending receipt to backend");
    const verifyRes = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/subscription/verify-ios-flix10k-subscription`,
      {
        uuid: user.uuid,
        receipt: purchase.purchaseToken,
        productId,
      }
    );

    const verifyData = verifyRes.data;

    log(`Verify response: ${JSON.stringify(verifyData)}`);

    if (verifyData.status !== 'active') {
       log("Subscription not active after verification", "ERROR");
      throw new Error('Subscription not active');
    }

    // ✅ Update Flix10K subscription in DB
    log("Saving subscription to DB");
    const payload = {
      uuid: user.uuid,
      subscriptionId: 1,
      autoRenewal: verifyData.autoRenewal, // real Apple value
      subscribedMonths: months,
      stripeSessionId: `ios_iap_${purchase.originalTransactionIdentifierIOS || Date.now()}`,
      status: 'SUCCESS',
      provider: 'ios_iap',
    };

    await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/subscription/subscription`,
      payload
    );

    log("Subscription saved successfully");

    await RNIap.finishTransaction({ purchase, isConsumable: false });

    log("Transaction finished successfully");

    setShowafterAdd?.(true);
    setTimeout(() => {
      setShowPaymentSuccess(true)
    }, 800);
  } catch (err) {
    console.error('[Flix10K iOS IAP]', err);
    log(`ERROR: ${err?.message || JSON.stringify(err)}`, "ERROR");

    isProcessing = false;

    if (err?.code === 'user-cancelled') {
      log("User cancelled purchase");
      return;
    }

    setShowafterAdd?.(true);
    setTimeout(() => {
      log("Showing failure modal", "ERROR");
      setShowPaymentFailure(true);
    }, 800);
  } finally {
    log("Cleaning up AsyncStorage + connection");
    await AsyncStorage.removeItem('flix10KPaying');
    isProcessing = false;
  }
};
