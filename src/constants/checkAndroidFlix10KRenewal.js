import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';
import { sendLog } from './logger';

export const checkAndroidFlix10KRenewal = async ({
  userId,
  userEmail,
  dispatch,
  getFlix10KPlanApi,
}) => {
  if (Platform.OS !== 'android') return;

  const log = (msg, type = 'INFO') =>
    sendLog({
      message: msg,
      screen: 'Flix10KRenewalCheck',
      log_type: type,
      user_id: userId,
    });

  try {
    await RNIap.initConnection();

    const purchases = await RNIap.getAvailablePurchases();

    const flixPurchase = purchases.find(
      (p) => p.productId === 'flix10k_subscription'
    );

    if (!flixPurchase?.purchaseToken) {
      // Not in Google's list of current entitlements — either never
      // purchased or the subscription has actually lapsed (not just our
      // DB record being stale), so there's nothing to sync.
      log('No Flix10K purchase found in Google Play');
      return;
    }

    // Ask the backend to re-verify this token with Google Play (same
    // endpoint used at initial purchase in PlayBillingHandler.js). It
    // returns server-verified isActive/autoRenew/expiryDate straight from
    // the Play Developer API — more trustworthy than the client-side
    // purchase object, same "trust the server" principle iOS uses.
    const verifyRes = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/subscription/verify-google-subscription-app`,
      {
        purchaseToken: flixPurchase.purchaseToken,
        productId: flixPurchase.productId,
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

    await axios.put(
      `${EXPO_PUBLIC_API_URL}/api/subscription/update-flix10k-autorenewal-app`,
      {
        uuid: userId,
        autoRenewal: verifyData.autoRenew,
        expiryDate: verifyData.expiryDate || null,
        currentPurchaseToken: flixPurchase.purchaseToken,
        source: 'system',
      }
    );

    log('Flix10K renewal synced to DB');

    await getFlix10KPlanApi(userEmail, dispatch);
  } catch (err) {
    log(`Android Flix10K renewal check failed: ${err?.message || JSON.stringify(err)}`, 'ERROR');
  } finally {
    await RNIap.endConnection();
  }
};
