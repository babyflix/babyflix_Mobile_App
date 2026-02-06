import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';

const FLIX10K_PRODUCTS = {
  1: 'flix10k_monthly',
  3: 'flix10k_quarterly',
  6: 'flix10k_halfyear',
  12: 'flix10k_yearly',
};

export const handleAppleFlix10KPayment = async ({
  months,
  user,
  setShowafterAdd,
  setShowPaymentSuccess,
  setShowPaymentFailure,
}) => {
  if (Platform.OS !== 'ios') return;

  const productId = FLIX10K_PRODUCTS[months];

  //Alert.alert('Flix10K IAP', `Starting payment\nMonths: ${months}\nProduct: ${productId}`);

   if (!productId) {
    //Alert.alert('Error', 'Invalid product selected');
    return;
  }

  try {
    //Alert.alert('Step 1', 'Initializing Apple IAP connection');
    await RNIap.initConnection();

    //Alert.alert('Step 2', 'Setting flix10KPaying flag');
    await AsyncStorage.setItem('flix10KPaying', 'true');

    //Alert.alert('Step 3', `Requesting subscription from Apple\nSKU: ${productId}`);
    const purchase = await RNIap.requestSubscription({
      sku: productId,
    });

    //  Alert.alert(
    //   'Purchase Result',
    //   JSON.stringify(
    //     {
    //       productId: purchase?.productId,
    //       transactionId: purchase?.transactionId,
    //       originalTransactionId: purchase?.originalTransactionIdentifier,
    //     },
    //     null,
    //     2
    //   )
    // );

    if (!purchase?.transactionReceipt) {
      //Alert.alert('Error', 'No receipt received from Apple');
      throw new Error('No receipt received');
    }

    //Alert.alert('Step 4', 'Verifying receipt with backend');
    // 🔐 Verify receipt with backend
    const verifyRes = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/subscription/verify-ios-flix10k-subscription`,
      {
        uuid: user.uuid,
        receipt: purchase.transactionReceipt,
        productId,
      }
    );

    const verifyData = verifyRes.data;

    // Alert.alert(
    //   'Verify Response',
    //   JSON.stringify(verifyRes.data, null, 2)
    // );


    if (verifyData.status !== 'active') {
       //Alert.alert('Error', 'Subscription not active after verification');
      throw new Error('Subscription not active');
    }

    await RNIap.finishTransaction({ purchase, isConsumable: false });

    //Alert.alert('Step 5', 'Saving subscription to database');
    // ✅ Update Flix10K subscription in DB
    const payload = {
      uuid: user.uuid,
      subscriptionId: 1,
      autoRenewal: verifyData.autoRenewal, // real Apple value
      subscribedMonths: months,
      stripeSessionId: `ios_iap_${Date.now()}`,
      status: 'SUCCESS',
      provider: 'ios_iap',
    };

    //Alert.alert('Subscription Payload', JSON.stringify(payload, null, 2));

    await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/subscription/subscription`,
      payload
    );

    //Alert.alert('Success', 'Flix10K subscription completed successfully');

    setShowafterAdd(true);
    setTimeout(() => {
      //Alert.alert('UI', 'Showing success modal');
      setShowPaymentSuccess(true)
    }, 800);
  } catch (err) {
    console.error('[Flix10K iOS IAP]', err);

    if (err?.code === 'E_USER_CANCELLED') {
      //Alert.alert('Cancelled', 'User cancelled Apple subscription');
      return;
    }

    // Alert.alert(
    //   'IAP Error',
    //   err?.message || JSON.stringify(err, null, 2)
    // );

    setShowafterAdd(true);
    setTimeout(() => {
      //Alert.alert('UI', 'Showing failure modal');
      setShowPaymentFailure(true);
    }, 800);
  } finally {
    //Alert.alert('Cleanup', 'Clearing local flags and closing IAP connection');
    await AsyncStorage.removeItem('flix10KPaying');
    // await RNIap.endConnection();
  }
};
