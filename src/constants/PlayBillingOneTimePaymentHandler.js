import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';

export const handlePlayOneTimePayment = async ({ amount, user }) => {
  try {
    await AsyncStorage.setItem('oneTimePaymentPaying', 'true');

    const productId = `payment-${Math.round(amount)}`; // ✅ must match Play Console (flat one-time product)

    console.log('Starting Play Billing one-time payment flow for productId:', productId);

    await RNIap.flushFailedPurchasesCachedAsPendingAndroid();

    const connected = await RNIap.initConnection();
    if (!connected) throw new Error('Billing connection failed.');

    const products = await RNIap.getProducts({ skus: [productId] });
    if (!products || products.length === 0) {
      throw new Error(`Product ${productId} not found in Play Store.`);
    }

    const purchase = await RNIap.requestPurchase({ skus: [productId] });
    const purchaseItem = Array.isArray(purchase) ? purchase[0] : purchase;

    const token = purchaseItem?.purchaseToken;
    if (!token) throw new Error('No purchase token');

    console.log('Recording payment with backend');
    await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/clinic-pay/record-app-payment`,
      {
        patientUuid: user.uuid,
        companyId: user.companyId,
        amount,
        transactionId: token,
        platform: 'mobile',
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!purchaseItem?.isAcknowledgedAndroid) {
      try {
        await RNIap.acknowledgePurchaseAndroid({ token });
        console.log('✅ Purchase acknowledged successfully');
      } catch (ackErr) {
        console.warn('⚠️ Acknowledge failed:', ackErr);
        await AsyncStorage.setItem('pendingAckToken', token);
      }
    }

    return { success: true, purchase };
  } catch (err) {
    console.error('Play Billing One-Time Payment Error:', err);

    if (err?.code === 'E_USER_CANCELLED') {
      return { success: false, cancelled: true };
    }

    return { success: false, error: err.message || 'Payment failed' };
  } finally {
    await RNIap.endConnection();
    await AsyncStorage.removeItem('oneTimePaymentPaying');
  }
};
