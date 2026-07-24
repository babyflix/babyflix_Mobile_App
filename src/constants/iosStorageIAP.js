import * as RNIap from 'react-native-iap';
import axios from 'axios';
import { Platform } from 'react-native';
import { EXPO_PUBLIC_API_URL } from '@env';
import { sendLog } from './logger';

/**
 * Storage IAP product mapping (Apple)
 */
const IOS_STORAGE_PRODUCTS = {
  0: 'storage_recovery',
  1: 'storage_monthly',
  3: 'storage_quarterly',
  6: 'storage_halfyearly',
  12: 'storage_yearly',
};

let isProcessing = false;

/**
 * Convert months → Apple productId
 */
const getIOSStorageProductId = (months, planId) => {
  if (planId === 3) return IOS_STORAGE_PRODUCTS[0]; // recovery
  return IOS_STORAGE_PRODUCTS[months] || IOS_STORAGE_PRODUCTS[1];
};

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

/**
 * MAIN FUNCTION (same pattern as Flix10K)
 * Safe to call from any screen
 */
export const handleIOSStorageSubscription = async ({
  planId,
  months,
  userId,
  onSuccess,
  onFailure,
}) => {
  if (Platform.OS !== 'ios') return;

  const log = (msg, type = "INFO") =>
  sendLog({
    message: msg,
    screen: "StorageSubscription",
    log_type: type,
    user_id: userId,
  });

   if (isProcessing) {
    log("Blocked duplicate IAP call");
    return;
  }

  isProcessing = true;

  log(`IAP START | planId=${planId}, months=${months}`);

  try {
    // 1️⃣ Reset + Init connection
    await RNIap.endConnection();
    await RNIap.initConnection();
    log("IAP connection initialized");

    // 2️⃣ Resolve productId
    const productId = getIOSStorageProductId(months, planId);
    log(`ProductId resolved: ${productId}`);

    if (!productId) {
      log("Invalid productId", "ERROR");
      throw new Error('Invalid productId');
    }

    // ✅ Fetch products from Apple
    log("Fetching subscriptions from Apple");

    const products = await RNIap.fetchProducts({
      skus: Object.values(IOS_STORAGE_PRODUCTS),
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

    // 3️⃣ Request subscription
    log(`Requesting subscription for ${productId}`);
    const purchase = await waitForSubscriptionPurchase(productId);

    log(`Purchase success: ${purchase?.productId}`);

    if (!purchase?.purchaseToken) {
      log("No receipt received", "ERROR");
      throw new Error('No receipt received from Apple');
    }

    // 4️⃣ Verify receipt with backend
    log("Sending receipt to backend");

    const verifyRes = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/patients/verify-ios-storage-subscription`,
      {
        userId,
        receipt: purchase.purchaseToken,
        productId,
      }
    );

    log(`Verify status: ${verifyRes.data?.status}`);

    if (verifyRes.data?.status !== 'active') {
      log("Subscription not active after verification", "ERROR");
      throw new Error('Subscription verification failed');
    }

    await RNIap.finishTransaction({
      purchase,
      isConsumable: false,
    });

    log("Transaction finished successfully");

    // 5️⃣ Success callback
    onSuccess?.({
      productId,
      autoRenewal: verifyRes.data.autoRenewal,
      expiryDate: verifyRes.data.expiryDate,
      originalTransactionId:
        purchase.originalTransactionIdentifierIOS,
    });
  } catch (err) {
    log(`ERROR: ${err?.message || JSON.stringify(err)}`, "ERROR");
    isProcessing = false;
    if (err?.code === 'user-cancelled') {
      log("User cancelled purchase");
      return;
    }

    onFailure?.(err);
  } finally {
    // 6️⃣ Cleanup
    isProcessing = false;
  }
};
