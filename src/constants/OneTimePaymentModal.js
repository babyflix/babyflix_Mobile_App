import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Colors from './Colors';
import { setPaymentJustCompleted } from '../state/slices/authSlice';
import { getPatientPaymentDetails } from '../components/getPatientPaymentDetails';
import { handleIOSOneTimePayment } from './iosOneTimePaymentIAP';
import { handlePlayOneTimePayment } from './PlayBillingOneTimePaymentHandler';
import PaymentStatusModal from './PaymentStatusModal';

const FEATURE_ICONS = {
  gallery: 'photo-library',
  download: 'file-download',
  video: 'videocam',
  ai: 'auto-awesome',
};

const HEADER_GRADIENT = ['#a23586', '#d16ba5'];
const CTA_GRADIENT = ['#d63384', '#9b2c6f'];

const OneTimePaymentModal = ({ visible, blocking = false, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth);
  const {
    payAmount,
    payBaseAmount,
    payDiscountAmount,
    payModalContent,
  } = user;

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentFailure, setShowPaymentFailure] = useState(false);

  const content = payModalContent || {};
  const features = Array.isArray(content.features) ? content.features : [];
  const showDiscount = payDiscountAmount != null && payBaseAmount != null && payAmount !== payBaseAmount;
  const savings = showDiscount ? Math.max(Number(payBaseAmount) - Number(payAmount), 0) : 0;

  const finishPurchase = async (success) => {
    setIsPurchasing(false);
    if (success) {
      dispatch(setPaymentJustCompleted(true));
      if (user.email) {
        getPatientPaymentDetails(user.email, dispatch);
      }
    }
  };

  const handlePurchase = async () => {
    if (isPurchasing || payAmount == null) return;
    setIsPurchasing(true);

    if (Platform.OS === 'ios') {
      await handleIOSOneTimePayment({
        amount: payAmount,
        user,
        setShowPaymentSuccess,
        setShowPaymentFailure,
        onDone: finishPurchase,
      });
    } else {
      const result = await handlePlayOneTimePayment({ amount: payAmount, user });
      if (result.success) {
        await finishPurchase(true);
        setShowPaymentSuccess(true);
      } else if (!result.cancelled) {
        await finishPurchase(false);
        setShowPaymentFailure(true);
      } else {
        setIsPurchasing(false);
      }
    }
  };

  const handleStatusClose = (type) => {
    setShowPaymentSuccess(false);
    setShowPaymentFailure(false);
    if (type === 'success') {
      onClose?.();
    }
  };

  return (
    <>
      <Modal
        visible={visible && !showPaymentSuccess && !showPaymentFailure}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!blocking) onClose?.();
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <LinearGradient
              colors={HEADER_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              {!blocking && (
                <TouchableOpacity style={styles.closeButton} onPress={() => onClose?.()}>
                  <Ionicons name="close" size={20} color={Colors.white} />
                </TouchableOpacity>
              )}

              <View style={styles.headerIconWrap}>
                <Ionicons name="lock-open" size={26} color={Colors.white} />
              </View>

              <Text style={styles.title}>
                {content.title || t('oneTimePayment.title', 'Unlock Full BabyFlix Access')}
              </Text>

              {!!content.description && (
                <Text style={styles.description}>{content.description}</Text>
              )}
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.priceCard}>
                {showDiscount && (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>
                      {t('oneTimePayment.save', 'SAVE')} ${savings.toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={styles.priceRow}>
                  {showDiscount && (
                    <Text style={styles.priceStrike}>${Number(payBaseAmount).toFixed(2)}</Text>
                  )}
                  <Text style={styles.price}>
                    ${payAmount != null ? Number(payAmount).toFixed(2) : '--'}
                  </Text>
                </View>
                <Text style={styles.priceSubtext}>
                  {t('oneTimePayment.oneTime', 'One-time payment')}
                </Text>
              </View>

              {features.length > 0 && (
                <View style={styles.featureList}>
                  {features.map((feature, index) => (
                    <View style={styles.featureRow} key={`${feature.icon}-${index}`}>
                      <View style={styles.featureIconWrap}>
                        <MaterialIcons
                          name={FEATURE_ICONS[feature.icon] || 'check-circle'}
                          size={18}
                          color={Colors.primary}
                        />
                      </View>
                      <Text style={styles.featureText}>{feature.text}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePurchase}
                disabled={isPurchasing || payAmount == null}
                style={styles.ctaWrapper}
              >
                <LinearGradient
                  colors={CTA_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.ctaButton, isPurchasing && styles.ctaButtonDisabled]}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.ctaText}>
                      {content.ctaText || t('oneTimePayment.cta', 'Unlock Now')}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {!!content.footerNote && (
                <View style={styles.footerRow}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={Colors.gray} />
                  <Text style={styles.footerNote}>{content.footerNote}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PaymentStatusModal
        visibleSuccess={showPaymentSuccess}
        visibleFailure={showPaymentFailure}
        onClose={handleStatusClose}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    fontFamily: 'Nunito400',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 19,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  priceCard: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#FBF3F8',
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 20,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  saveBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: 'Nunito700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 36,
    fontFamily: 'Nunito700',
    color: Colors.primary,
  },
  priceStrike: {
    fontSize: 16,
    fontFamily: 'Nunito400',
    color: Colors.gray,
    textDecorationLine: 'line-through',
    marginRight: 8,
    marginBottom: 6,
  },
  priceSubtext: {
    fontSize: 12,
    fontFamily: 'Nunito400',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  featureList: {
    width: '100%',
    marginBottom: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FBF3F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Nunito400',
    color: Colors.textPrimary,
    flex: 1,
  },
  ctaWrapper: {
    width: '100%',
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: Colors.white,
    fontFamily: 'Nunito700',
    fontSize: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerNote: {
    fontSize: 12,
    fontFamily: 'Nunito400',
    color: Colors.gray,
    textAlign: 'center',
    marginLeft: 6,
  },
});

export default OneTimePaymentModal;
