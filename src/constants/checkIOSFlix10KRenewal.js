import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';

export const checkIOSFlix10KRenewal = async ({
  userId,
  userEmail,
  dispatch,
  getFlix10KPlanApi,
}) => {
  if (Platform.OS !== 'ios') return;

  try {
    await RNIap.initConnection();

    const purchases = await RNIap.getAvailablePurchases();

    const flixPurchase = purchases.find(
      p => p.productId && p.productId.startsWith('flix10k_')
    );

    if (!flixPurchase?.transactionReceipt) {
      console.log('No Flix10K purchase found in Apple');
      return;
    }

    // verify with backend
    const verifyRes = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/subscription/verify-ios-flix10k-subscription`,
      {
        uuid: userId,
        receipt: flixPurchase.transactionReceipt,
        productId: flixPurchase.productId,
      }
    );

    const verifyData = verifyRes.data;

    if (verifyData?.status !== 'active') {
      console.log('Still expired from Apple');
      return;
    }

    // update DB
    await axios.put(
      `${EXPO_PUBLIC_API_URL}/api/subscription/update-flix10k-autorenewal-app`,
      {
        uuid: userId,
        autoRenewal: verifyData.autoRenewal,
        expiryDate: verifyData.expiryDate,
        currentPurchaseToken: flixPurchase.originalTransactionId,
        source: 'system',
      }
    );

    // refresh redux
    await getFlix10KPlanApi(userEmail, dispatch);

    console.log('Flix10K renewed → DB updated');
  } catch (err) {
    console.log('Flix10K renewal check failed', err);
  }
};
