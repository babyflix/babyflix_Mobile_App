import * as RNIap from 'react-native-iap';

let isInitialized = false;
let purchaseUpdateSubscription = null;
let purchaseErrorSubscription = null;

/**
 * Initialize Apple IAP connection
 */
export const initAppleIAP = async () => {
  try {
    if (isInitialized) return;

    await RNIap.initConnection();
    isInitialized = true;

    console.log('✅ Apple IAP Connected');
  } catch (error) {
    console.log('❌ IAP init failed:', error);
  }
};

/**
 * Setup purchase listeners
 */
export const setupApplePurchaseListener = ({ onSuccess, onFailure }) => {
  try {
    // Prevent duplicate listeners
    if (purchaseUpdateSubscription || purchaseErrorSubscription) return;

    purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(async (purchase) => {
      try {
        if (purchase?.transactionReceipt) {
          onSuccess?.(purchase);
        }
      } catch (e) {
        console.log('Purchase update error:', e);
        onFailure?.(e);
      }
    });

    purchaseErrorSubscription = RNIap.purchaseErrorListener((error) => {
      console.log('Purchase error:', error);
      onFailure?.(error);
    });

    console.log('✅ IAP listeners attached');
  } catch (error) {
    console.log('Listener setup failed:', error);
  }
};

/**
 * Remove listeners (optional cleanup)
 */
export const removeApplePurchaseListener = () => {
  purchaseUpdateSubscription?.remove();
  purchaseErrorSubscription?.remove();

  purchaseUpdateSubscription = null;
  purchaseErrorSubscription = null;

  console.log('🧹 IAP listeners removed');
};
