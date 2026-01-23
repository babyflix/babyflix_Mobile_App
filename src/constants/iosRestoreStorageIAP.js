import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';
import { EXPO_PUBLIC_API_URL } from '@env';

/**
 * Restore iOS Storage Subscription
 * Safe to call from App.jsx or any screen
 */
export const restoreIOSStoragePurchase = async ({
  userId,
  userEmail,
  dispatch,
  getStoragePlanDetails,
  silent = true, // true when called from App.jsx
}) => {
  if (Platform.OS !== 'ios') return;

  try {
    await RNIap.initConnection();

    const purchases = await RNIap.getAvailablePurchases();
    console.log('[iOS Restore] Purchases:', purchases);

    const storagePurchase = purchases.find(
      p => p.productId && p.productId.startsWith('storage_')
    );

    if (!storagePurchase) {
      console.log('[iOS Restore] No active storage subscription found');
      return;
    }

    // 🔐 Step 1: Verify receipt with backend
    const verifyRes = await fetch(
      `${EXPO_PUBLIC_API_URL}/api/patients/verify-ios-storage-subscription`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          receipt: storagePurchase.transactionReceipt,
          productId: storagePurchase.productId,
        }),
      }
    );

    const verifyData = await verifyRes.json();

    if (verifyData?.status !== 'active') {
      console.log('[iOS Restore] Subscription not active');
      return;
    }

    /**
     * Expected verifyData:
     * {
     *   status: 'active',
     *   expiryDate,
     *   autoRenewal
     * }
     */

    // 🔄 Step 2: Sync auto-renew + expiry ONLY
    await fetch(
      `${EXPO_PUBLIC_API_URL}/api/patients/update-storage-autorenewal-app`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: userId,
          autoRenewal: verifyData.autoRenewal,
          expiryDate: verifyData.expiryDate,
          currentPurchaseToken: storagePurchase.originalTransactionId,
          source: 'system', // 👈 prevents email spam
        }),
      }
    );

    // 🔄 Refresh Redux + UI
    await getStoragePlanDetails(userEmail, dispatch);

    if (!silent) {
      alert('Your storage subscription has been restored.');
    }
  } catch (error) {
    console.error('[iOS Restore] Failed:', error);
  } finally {
    await RNIap.endConnection();
  }
};
