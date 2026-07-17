import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';
import { sendLog } from './logger';

let isProcessing = false;

export const handleIOSOneTimePayment = async ({
  amount,
  user,
  setShowPaymentSuccess,
  setShowPaymentFailure,
  onDone,
}) => {
  if (Platform.OS !== 'ios') return;

  const log = (msg, type = 'INFO') =>
    sendLog({
      message: msg,
      screen: 'OneTimePayment',
      log_type: type,
      user_id: user?.uuid,
    });

  if (isProcessing) {
    log('Blocked duplicate IAP call');
    return;
  }

  isProcessing = true;

  const productId = `payment_${Math.round(amount)}`;

  log(`IAP START | amount=${amount}, productId=${productId}`);

  try {
    await RNIap.initConnection();
    log('IAP connection initialized');

    const products = await RNIap.getProducts({ skus: [productId] });

    if (!products || products.length === 0) {
      throw new Error('Product not available in App Store');
    }

    await AsyncStorage.setItem('oneTimePaymentPaying', 'true');

    log(`Requesting purchase: ${productId}`);
    const purchase = await RNIap.requestPurchase({ sku: productId });
    const purchaseItem = Array.isArray(purchase) ? purchase[0] : purchase;

    log(`Purchase success: ${purchaseItem?.productId}`);

    const transactionId =
      purchaseItem?.transactionId || purchaseItem?.originalTransactionIdentifierIOS;

    if (!transactionId) {
      throw new Error('No transaction id received from Apple');
    }

    log('Recording payment with backend');
    await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/clinic-pay/record-app-payment`,
      {
        patientUuid: user.uuid,
        companyId: user.companyId,
        amount,
        transactionId: String(transactionId),
        platform: 'mobile',
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    log('Payment recorded successfully');

    await RNIap.finishTransaction({ purchase: purchaseItem, isConsumable: false });
    log('Transaction finished successfully');

    onDone?.(true);
    setTimeout(() => setShowPaymentSuccess(true), 500);
  } catch (err) {
    console.error('[OneTimePayment iOS IAP]', err);
    log(`ERROR: ${err?.message || JSON.stringify(err)}`, 'ERROR');

    if (err?.code === 'E_USER_CANCELLED') {
      log('User cancelled purchase');
      isProcessing = false;
      await AsyncStorage.removeItem('oneTimePaymentPaying');
      return;
    }

    onDone?.(false);
    setTimeout(() => setShowPaymentFailure(true), 500);
  } finally {
    await AsyncStorage.removeItem('oneTimePaymentPaying');
    isProcessing = false;
  }
};
