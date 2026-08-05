import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';
import { sendLog } from './logger';

export const checkAndroidStorageRenewal = async ({
  userId,
  userEmail,
  dispatch,
  getStoragePlanDetails,
}) => {
  if (Platform.OS !== 'android') return;

  const log = (msg, type = 'INFO') =>
    sendLog({
      message: msg,
      screen: 'StorageRenewalCheck',
      log_type: type,
      user_id: userId,
    });

  try {
    await RNIap.initConnection();

    const purchases = await RNIap.getAvailablePurchases();

    // Only storage_pro auto-renews — Basic/Recovery are forced
    // autoRenew:false, single-month, non-renewing by design
    // (see PlayBillingStorageHandler.js), so they're intentionally excluded
    // here, matching StorageTab.js's existing verifyAutoRenewStatus.
    const storagePurchase = purchases.find(
      (p) => p.productId === 'storage_pro'
    );

    if (!storagePurchase?.purchaseToken) {
      log('No Storage Pro purchase found in Google Play');
      return;
    }

    // Ask the backend to re-verify this token with Google Play (same
    // endpoint used at initial purchase in PlayBillingStorageHandler.js) —
    // it's read-only verification (no DB write), so it's safe to call from
    // a background check. Returns server-verified autoRenew/expiryDate
    // straight from the Play Developer API — more trustworthy than the
    // client-side purchase object, same principle iOS uses.
    const verifyRes = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/patients/verify-google-storage-subscription-app`,
      {
        purchaseToken: storagePurchase.purchaseToken,
        productId: storagePurchase.productId,
      }
    );

    const verifyData = verifyRes.data;

    log(`Verify response: ${verifyData.expiryDate}, ${verifyData.isActive}`);

    if (!verifyData?.success) {
      log('Verification unsuccessful, skipping sync', 'ERROR');
      return;
    }

    // isActive from the backend is unreliable (paymentState === 1 misses
    // free trials and other legitimately-active states), so compare the
    // real expiryDate against now directly instead of trusting that flag.
    const hasRenewed = verifyData.expiryDate && new Date(verifyData.expiryDate) > new Date();

    if (!hasRenewed) {
      log('Expiry date not in the future, skipping sync');
      return;
    }

    await axios.post(`${EXPO_PUBLIC_API_URL}/api/patients/update-storage-autorenewal-app`, {
      uuid: userId,
      autoRenewal: verifyData.autoRenew,
      expiryDate: verifyData.expiryDate || null,
      currentPurchaseToken: storagePurchase.purchaseToken,
      source: 'system',
    });

    log('Storage renewal synced to DB');

    await getStoragePlanDetails(userEmail, dispatch);
  } catch (err) {
    log(`Android storage renewal check failed: ${err?.message || JSON.stringify(err)}`, 'ERROR');
  } finally {
    await RNIap.endConnection();
  }
};
