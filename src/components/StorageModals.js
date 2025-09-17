import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking, Alert, AppState, Platform, BackHandler } from 'react-native';
import Colors from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_API_URL } from '@env';
import { useDispatch, useSelector } from 'react-redux';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { clearOpenStorage2, setDeepLinkHandled, setForceOpenStorageModals } from '../state/slices/storageUISlice';
import { getStoragePlanDetails } from './getStoragePlanDetails';
import moment from 'moment';
import { setPlanExpired, setUpgradeReminder } from '../state/slices/expiredPlanSlice';
import { useRouter } from 'expo-router';
import { useDynamicTranslate } from '../constants/useDynamicTranslate';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import sendDeviceUserInfo, { USERACTIONS } from './deviceInfo';

const StorageModals = ({ onClose, storageModalKey }) => {
  const [showStorage1, setShowStorage1] = useState(false);
  const [showStorage2, setShowStorage2] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(2);
  const [selectedPrice, setSelectedPrice] = useState(10);
  const [skipCount, setSkipCount] = useState(0);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentFailure, setShowPaymentFailure] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [planPressed, setPlanPressed] = useState(false)
  const [plans, setPlans] = useState([]);
  const [closePlanes, setClosePlans] = useState(false);
  const [wasTriggered, setWasTriggered] = useState(false);
  const [ShowStorage1Call, setShowStorage1Call] = useState(false);

  const user = useSelector((state) => state.auth);
  const { skippedPlanCount, storagePlanId, storagePlanPayment, isPlanDeleted, storagePlanPrice } =
    useSelector((state) => state.storagePlan || {});
  const openStorage2Directly = useSelector(state => state.storageUI.openStorage2Directly);
  const forceOpenStorageModals = useSelector((state) => state.storageUI.forceOpenStorageModals);
  const isPlanExpired = useSelector((state) => state.expiredPlan.isPlanExpired);
  const showUpgradeReminder = useSelector((state) => state.expiredPlan.showUpgradeReminder);
  const dispatch = useDispatch();
  const triggeredRef = useRef(false);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const router = useRouter();
  const { t } = useTranslation();
  const handledRef = useRef(false);
  const showStorage1Ref = useRef(false);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/getAllPlans`);
      const json = await response.json();
      if (json.actionStatus === 'success') {
        const plan = json.data;
        const translatedPlans = await Promise.all(
          plan.map(async (plan) => ({
            ...plan,
            name: await useDynamicTranslate(plan.name),
            description: await useDynamicTranslate(plan.description),
          }))
        );
        setPlans(translatedPlans);
      } else {
        console.warn('Failed to fetch plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          //console.log('Back button pressed in StorageModals');
          return true;
        }
      );

      return () => backHandler.remove();
    }
  }, []);

  useEffect(() => {
    const fetchStatusFromStorage = async () => {
      const storedStatus = await AsyncStorage.getItem('payment_status');
      const storedPaying = await AsyncStorage.getItem('paying');

      //console.log('[StorageModals] fetchStatusFromStorage:', storedStatus, storedPaying );

      if (!storedStatus && storedPaying === 'true') {
        //console.log('[StorageModals] Clearing openStorage2 due to paying:true but no status');
        dispatch(clearOpenStorage2());
        await AsyncStorage.setItem('storage_modal_triggered', 'false');
        triggeredRef.current = false;
      }
    };

    fetchStatusFromStorage();
  }, [user]);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const visited = await AsyncStorage.getItem('visited_after_redirect');
      //console.log('[StorageModals] visited_after_redirect:', visited);

      if (visited === 'true') {
        //console.log('[StorageModals] Visited after redirect - skipping modal show');
        await AsyncStorage.setItem('visited_after_redirect', 'false');
        return;
      }

      const status = await AsyncStorage.getItem('payment_status 1');
      const storedPaying = await AsyncStorage.getItem('paying');
      //console.log('[StorageModals] Initial checkPaymentStatus:', { status, storedPaying });
      if (status === 'fail') {
        if (storedPaying === 'false') {
          //console.log('[StorageModals] Showing payment failure modal due to fail status');
          setIsVisible(true);
        }
      } else if (storageModalKey) {
        //console.log('[StorageModals] Showing storage2 directly due to storageModalKey');
        setShowStorage2(true);
      } else {
        if (!storagePlanId || storagePlanId === "null") {
          //console.log('[StorageModals] No plan found, showing storage1');
          showStorage1Ref.current = true;
          await AsyncStorage.removeItem('closePlans');
          setShowStorage1(true);
        }
      }
    };

    if (!openStorage2Directly) {
      //console.log('[StorageModals] Checking payment status because openStorage2Directly is false');
      //console.log('showStorage1Ref.current',{showStorage1Ref});
      checkPaymentStatus();
    }
  }, []);


  useEffect(() => {
    const checkIfTriggered = async () => {
      if (Platform.OS === 'android' && triggeredRef.current) {
        //console.log('[StorageModals] Already triggered. Skipping... (Android only)');
        return;
      }

      const triggered = await AsyncStorage.getItem('storage_modal_triggered');
      //console.log('[StorageModals] openStorage2Directly:', openStorage2Directly, 'triggered:', triggered);

      if (openStorage2Directly && triggered !== 'true') {
        //console.log('[StorageModals] Triggering storage2 modal');
        triggeredRef.current = true;
        setShowStorage1(false);
        setIsVisible(false);
        setTimeout(() => {
          //console.log("Opening second modal now 3");
          setShowStorage2(true);
        }, 200);
        await AsyncStorage.setItem('closePlans', 'true');
        setClosePlans(true);

        dispatch(clearOpenStorage2());
        await AsyncStorage.setItem('storage_modal_triggered', 'true');
      }
    };

    if (openStorage2Directly) {
      //console.log('[StorageModals] Running checkIfTriggered because openStorage2Directly is true');
      checkIfTriggered();
    }
  }, [openStorage2Directly]);

  useEffect(() => {
    let hasChecked = false;
    const checkPaymentStatus = async () => {
      if (hasChecked) return;
      hasChecked = true;

      setTimeout(async () => {
        const status = await AsyncStorage.getItem('payment_status');
        //console.log('[StorageModals] Final checkPaymentStatus:', status);

        if (status === 'fail') {
          //console.log('[StorageModals] Status is fail');
          await AsyncStorage.setItem('payment_status 1', 'fail');
          await AsyncStorage.removeItem('payment_status');
          await AsyncStorage.setItem('storage_modal_triggered', 'false');
          triggeredRef.current = false;
          dispatch(setForceOpenStorageModals(false));
          setShowStorage1(false);
          setShowStorage2(false);
          setTimeout(() => {
            //console.log("PaymentFailure modal now");
            setShowPaymentFailure(true);
          }, 200);

          sendDeviceUserInfo({
            action_type: USERACTIONS.PAYMENT,
            action_description: `User payment failed for Storage plan`,
          });

        } else if (status === 'done') {
          //console.log('[StorageModals] Status is done. Updating plan...');
          await AsyncStorage.setItem('payment_status 1', 'done');
          const storedPlanId = await AsyncStorage.getItem('selected_plan_id');
          const planIdToUse = storedPlanId ? parseInt(storedPlanId) : null;

          try {
            await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/updatePlan`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.uuid,
                storagePlanId: planIdToUse,
                storagePlanPayment: 1,
              }),
            });
            //console.log('[StorageModals] Plan updated successfully');
            setShowStorage1(false);
            setShowStorage2(false);
            setTimeout(() => {
              //console.log("PaymentSuccess modal now");
              setShowPaymentSuccess(true);
            }, 200);

            sendDeviceUserInfo({
              action_type: USERACTIONS.PAYMENT,
              action_description: `User payment success for storage plan`,
            });

            dispatch(setForceOpenStorageModals(false));
            dispatch(setPlanExpired(false));
            dispatch(setUpgradeReminder(false));
          } catch (e) {
            //console.log('[StorageModals] Error updating plan:', e);
          }

          await AsyncStorage.removeItem('payment_status');
          await AsyncStorage.setItem('storage_modal_triggered', 'false');
          triggeredRef.current = false;
          setShowStorage1(false);
        } else if (storageModalKey) {
          //console.log('[StorageModals] Showing storage2 due to storageModalKey in final check');
          setShowStorage2(true);
          await AsyncStorage.setItem('closePlans', 'true');
          setClosePlans(true);
        } else {
          const status = await AsyncStorage.getItem('payment_status 1');
          const storedPaying = await AsyncStorage.getItem('paying');
          setTimeout(async () => {
            //console.log('[StorageModals] Rechecking storagePlanId and paying status:', { storagePlanId, status, storedPaying, showStorage1Ref });
            if ((!storagePlanId || storagePlanId === "null") && status !== 'fail' && storedPaying !== 'false' && !showStorage1Ref.current) {
              //console.log('[StorageModals] No plan id - showing storage1 in final check');
              await AsyncStorage.removeItem('closePlans');
              setShowStorage1(true);
            }
          }, 2000);
        }
      }, 1000);
    };


    if (!openStorage2Directly) {
      //console.log('[StorageModals] Final payment status check starting...');
      checkPaymentStatus();
    }

    const subscription = AppState.addEventListener('change', (state) => {
      //console.log('[StorageModals] AppState changed:', state);
      if (state === 'active') {
        //console.log('[StorageModals] App resumed - rechecking payment status');
        setTimeout(checkPaymentStatus, 1000);
      }
    });

    return () => {
      subscription.remove();
      //console.log('[StorageModals] Cleaned up AppState subscription');
    };
  }, []);

  const handleProceedNow = () => {
    //console.log("PROCEED NOW tapped 1");
    if (Platform.OS === 'ios') {
      setShowStorage1(false);
    }
    setTimeout(() => {
      //console.log("Opening second modal now");
      setShowStorage2(true);
    }, 200);
  };

  const handleSkip = async () => {
    if (skippedPlanCount < 3) {
      setShowStorage1(false);
    }

    try {
      const currentDate = moment().format('DD-MM-YYYY');
      await AsyncStorage.setItem('last_skipped_plan_date', currentDate);

      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/updateSkipPlan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uuid,
          skippedPlanCount: skippedPlanCount + 1,
        }),
      });

      const data = await response.json();

      if (data.actionStatus === 'success') {
        setShowStorage2(false);
      } else {
        console.error('Skip failed:', data.message);
      }
    } catch (error) {
      console.error('Error skipping plan:', error);
    }
  };

  const handleBack = () => {
    setShowStorage2(false);

    setTimeout(() => {
      setShowStorage1(true);
    }, 1000);
    //setShowStorage1(false);
    //setIsVisible(true);
  };

  const handlePayment = async () => {
    dispatch(setDeepLinkHandled(false));
    try {
      await AsyncStorage.setItem('selected_plan_id', selectedPlan.toString());
      onClose();
      dispatch(clearOpenStorage2());
      await AsyncStorage.setItem('storage_modal_triggered', 'false');
      await AsyncStorage.setItem('paying', 'true');
      //console.log('platform.os',Platform.OS);

      const sessionRes = await axios.post(`${EXPO_PUBLIC_API_URL}/api/create-checkout-session-app`, {
        planId: selectedPlan,
        email: user.email,
        platform: Platform.OS,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const sessionData = sessionRes.data;

      if (!sessionData.sessionId) throw new Error("No session ID returned");

      const stripeUrl = sessionData.sessionUrl;

      setShowStorage2(false);
      //const result = await WebBrowser.openAuthSessionAsync(stripeUrl, "babyflix://");

      if (Platform.OS === 'ios') {
        await Linking.openURL(stripeUrl);
        // const result = await WebBrowser.openAuthSessionAsync(
        //   stripeUrl, // Stripe checkout URL
        //   "babyflix://payment/redirect"
        // );

      } else {
        const result = await WebBrowser.openAuthSessionAsync(
          stripeUrl,
          "babyflix://"
        );

        if (result.type === "cancel") {
          if (isAuthenticated) {
            router.push('/gallary');
          }
        }
      }

    } catch (error) {
      console.error("Payment error:", error);
      await AsyncStorage.setItem('payment_status 1', 'fail');
      setShowStorage2(false);
      setShowPaymentFailure(true);
    }
  };

  //console.log('Rendering showStorage2 modal:', showStorage2);

  return (
    <>
      <Modal visible={showStorage1} transparent animationType="fade" {...(Platform.OS === 'ios' ? { onRequestClose: () => setShowStorage1(false) } : {})}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={[styles.title]}>{t('storage.title')}</Text>
            <Text style={[styles.planBox, styles.subtitleTextBox, styles.subtitleText]}>
              {t('storage.subtitle')}
            </Text>
            <View style={[
              styles.buttonRow,
              skippedPlanCount >= 3 && { justifyContent: 'center' }
            ]}
            >
              {skippedPlanCount < 3 && (
                <TouchableOpacity style={styles.outlinedButton} onPress={handleSkip}>
                  <View style={styles.iconButtonContent}>
                    <MaterialIcons name="skip-next" size={20} color={Colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.outlinedText}>{t('storage.skip')}</Text>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  skippedPlanCount >= 3 && { width: "60%" },
                ]}
                onPress={handleProceedNow}
              >
                <LinearGradient
                  colors={["#d63384", "#9b2c6f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.filledButton,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                      paddingVertical: 12,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="arrow-forward"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.filledText, { color: "#fff" }]}>
                    {t("storage.proceed")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showStorage2} transparent animationType="fade">
        <View style={[styles.modalBackground, { zIndex: 999 }]}>
          <View style={styles.modalContainer}>

            {closePlanes && (
              <TouchableOpacity
                onPress={async () => {
                  setShowStorage2(false);
                  setClosePlans(false);
                  await AsyncStorage.removeItem('closePlans');
                  setWasTriggered(false);
                  triggeredRef.current = false;
                }}
                style={styles.closeModel}
              >
                <MaterialIcons name="close" size={24} color="black" />
              </TouchableOpacity>
            )}

            <View style={styles.modalHeader}>
              <Text style={[styles.title, { textAlign: 'center' }]}>{t('storage.selectPlan')}</Text>
            </View>
            {plans
              .filter((plan) => {
                const planId = Number(plan.id);
                const payment = Number(storagePlanPayment);
                const deleted = Number(isPlanDeleted);

                if (isPlanExpired) {
                  return planId === 3;
                }
                if (planId === 3) {
                  return false;
                }
                return !(
                  (showUpgradeReminder ||
                    storagePlanId ||
                    payment === 1 ||
                    deleted === 1) &&
                  planId === 1
                );
              })
              .map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  onPressIn={() => setPlanPressed(true)}
                  onPressOut={() => setPlanPressed(false)}
                  style={[
                    styles.planBox,
                    selectedPlan === plan.id && styles.planBoxSelected,
                    planPressed && { transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={() => {
                    setSelectedPlan(plan.id);
                    setSelectedPrice(plan.price_per_month);
                  }}
                >
                  <View style={styles.planRow}>
                    <View style={styles.planTitleRow}>
                      {selectedPlan === plan.id && (
                        <MaterialIcons
                          name="check-circle"
                          size={20}
                          color="green"
                          style={{ marginRight: 8 }}
                        />
                      )}
                      <Text style={styles.planTitleBold}>{plan.name}</Text>
                    </View>
                    <Text style={styles.planPrice}>${plan.price_per_month}</Text>
                  </View>
                  <Text style={styles.planSubtitle}>{plan.description}</Text>
                </TouchableOpacity>
              ))}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.outlinedButton} onPress={handleBack}>
                <View style={styles.iconButtonContent}>
                  <MaterialIcons name="arrow-back" size={20} color="#b53bb7" style={{ marginRight: 6 }} />
                  <Text style={styles.outlinedText}>{t('storage.back')}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePayment}
              >
                <LinearGradient
                  colors={["#d63384", "#9b2c6f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.filledButton,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                      paddingVertical: 12,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="payment"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.filledText, { color: "#fff" }]}>
                    {t("storage.continuePayment")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPaymentSuccess} transparent animationType="fade" onRequestClose={() => setShowStorage2(false)}>
        <View style={[styles.modalBackground, { zIndex: 999 }]}>
          <View style={[styles.modalContainerStatus, { borderColor: "green" }]}>
            <Text style={[styles.title, { color: "green", textAlign: 'center' }]}>{t('storage.paymentSuccess')}</Text>
            <Text style={[styles.subtitle, {}]}>{t('storage.thankYou')}</Text>
            <TouchableOpacity
              style={[styles.filledButton, { paddingHorizontal: 20 }]}
              onPress={async () => {
                setShowPaymentSuccess(false);
                AsyncStorage.removeItem('payment_status 1');
                await getStoragePlanDetails(user.email, dispatch);
              }}
            >
              <Text style={styles.filledText}>{t('storage.okGotIt')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPaymentFailure} transparent animationType="fade">
        <View style={[styles.modalBackground, { zIndex: 999 }]}>
          <View style={[styles.modalContainerStatus, { borderColor: Colors.error, }]}>
            <Text style={[styles.title, { color: Colors.error, textAlign: 'center' }]}>{t('storage.paymentFailed')}</Text>
            <Text style={styles.subtitleFailed}>{t('storage.paymentError')}</Text>
            <TouchableOpacity
              style={[styles.filledButton, { paddingHorizontal: 20 }]}
              onPress={async () => {
                setShowPaymentFailure(false);
                const value = await AsyncStorage.getItem('closePlans');
                if (!value) {
                  setIsVisible(true);
                }
                dispatch(clearOpenStorage2());
                await AsyncStorage.removeItem('closePlans');
              }}
            >
              <Text style={styles.filledText}>{t('storage.okIGotIt')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={[styles.title]}>{t('storage.pendingTitle')}</Text>
            <Text style={[styles.planBox, styles.subtitleTextBox, styles.subtitleText]}>
              {t('storage.pendingMessage')}
            </Text>

            <View style={[styles.buttonRow, { justifyContent: 'flex-end', gap: 10 }]}>
              <TouchableOpacity style={styles.outlinedButton} onPress={() => {
                setIsVisible(false)
                setTimeout(() => {
                  setShowStorage1(true)
                }, 2000);
              }} >
                <Text style={styles.outlinedText}>{t('storage.goBack')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setIsVisible(false);
                  setTimeout(() => {
                    setShowStorage2(true);
                  }, 2000);
                }}
              >
                <LinearGradient
                  colors={["#d63384", "#9b2c6f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.filledButton,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                    },
                  ]}
                >
                  <Text style={[styles.filledText, { color: "#fff" }]}>
                    ▶ {t("storage.proceed")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({

  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  modalContainer: {
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    width: '90%',
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    zIndex: 99
  },
  modalContainerStatus: {
    width: '90%',
    backgroundColor: '#fff',
    borderWidth: 3,
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito700',
    //fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 20,
    marginTop: 10,
    fontFamily: 'Nunito400',
    color: '#444',
    textAlign: 'left',
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: 'Nunito400',
    textAlign: 'left',

  },
  subtitleFailed: {
    fontSize: 15,
    marginTop: 10,
    marginBottom: 20,
    fontFamily: 'Nunito400',
    color: '#b00020',
    textAlign: 'center',
  },
  planBox: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    backgroundColor: '#fff',
  },
  planBoxSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#f1f5ff',
  },
  subtitleTextBox: {
    borderColor: Colors.gray,
    borderWidth: 2,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTitleBold: {
    //fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
    fontFamily: 'Nunito700',
  },
  planPrice: {
    //fontWeight: 'bold',
    fontSize: 16,
    color: Colors.primary,
    fontFamily: 'Nunito700',
  },
  planSubtitle: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Nunito400',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 6,
  },
  filledButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  filledText: {
    color: '#fff',
    //fontWeight: 'bold',
    fontFamily: 'Nunito700',
    fontSize: 13.5,
  },
  outlinedButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 8,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  outlinedText: {
    color: Colors.primary,
    //fontWeight: 'bold',
    fontFamily: 'Nunito700',
    fontSize: 13.5,
  },
  iconButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeModel: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 5,
  }
});

export default StorageModals;
