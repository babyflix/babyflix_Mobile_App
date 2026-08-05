import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';
import { sendLog } from './logger';

export const checkIOSStorageRenewal = async ({
  userId,
  userEmail,
  dispatch,
  getStoragePlanDetails,
}) => {
  if (Platform.OS !== 'ios') return;

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

    const storagePurchase = purchases.find(
      p => p.productId && p.productId.startsWith('storage_')
    );

    if (!storagePurchase?.purchaseToken) {
      log('No Storage purchase found in Apple');
      return;
    }

    const verifyRes = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/patients/verify-ios-storage-subscription`,
      {
        userId,
        receipt: storagePurchase.purchaseToken,
        productId: storagePurchase.productId,
      }
    );

    const verifyData = verifyRes.data;

    log(`Verify response: ${verifyData.expiryDate}, ${verifyData.isActive}`);

    if (verifyData?.status !== 'active') {
      log('Still expired from Apple');
      return;
    }

    await axios.put(
      `${EXPO_PUBLIC_API_URL}/api/patients/update-storage-autorenewal-app`,
      {
        uuid: userId,
        autoRenewal: verifyData.autoRenewal,
        expiryDate: verifyData.expiryDate,
        currentPurchaseToken: storagePurchase.originalTransactionIdentifierIOS,
        source: 'system',
      }
    );

    log('Storage renewed → DB updated');

    await getStoragePlanDetails(userEmail, dispatch);
  } catch (err) {
    log(`Storage renewal check failed: ${err?.message || JSON.stringify(err)}`, 'ERROR');
  }
};
