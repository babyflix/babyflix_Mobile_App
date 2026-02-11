import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';

export const checkIOSStorageRenewal = async ({
  userId,
  userEmail,
  dispatch,
  getStoragePlanDetails,
}) => {
  if (Platform.OS !== 'ios') return;

  try {
    await RNIap.initConnection();

    const purchases = await RNIap.getAvailablePurchases();

    const storagePurchase = purchases.find(
      p => p.productId && p.productId.startsWith('storage_')
    );

    if (!storagePurchase?.transactionReceipt) {
      console.log('No Storage purchase found in Apple');
      return;
    }

    const verifyRes = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/patients/verify-ios-storage-subscription`,
      {
        userId,
        receipt: storagePurchase.transactionReceipt,
        productId: storagePurchase.productId,
      }
    );

    const verifyData = verifyRes.data;

    if (verifyData?.status !== 'active') {
      console.log('Still expired from Apple');
      return;
    }

    await axios.put(
      `${EXPO_PUBLIC_API_URL}/api/patients/update-storage-autorenewal-app`,
      {
        uuid: userId,
        autoRenewal: verifyData.autoRenewal,
        expiryDate: verifyData.expiryDate,
        currentPurchaseToken: storagePurchase.originalTransactionId,
        source: 'system',
      }
    );

    await getStoragePlanDetails(userEmail, dispatch);

    console.log('Storage renewed → DB updated');
  } catch (err) {
    console.log('Storage renewal check failed', err);
  }
};
