import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking, Alert, AppState } from 'react-native';
import Colors from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_API_URL } from '@env';
import { useDispatch, useSelector } from 'react-redux';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { clearOpenStorage2, setForceOpenStorageModals } from '../state/slices/storageUISlice';
import { getStoragePlanDetails } from './getStoragePlanDetails';
import moment from 'moment';
import { setPlanExpired, setUpgradeReminder } from '../state/slices/expiredPlanSlice';
import { useRouter } from 'expo-router';

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

  const user = useSelector((state) => state.auth);
  const { skippedPlanCount, storagePlanId, storagePlanPayment, isPlanDeleted,storagePlanPrice } =
    useSelector((state) => state.storagePlan || {});
  const openStorage2Directly = useSelector(state => state.storageUI.openStorage2Directly);
  const forceOpenStorageModals = useSelector((state) => state.storageUI.forceOpenStorageModals);
  const isPlanExpired = useSelector((state) => state.expiredPlan.isPlanExpired);
  const showUpgradeReminder = useSelector((state) => state.expiredPlan.showUpgradeReminder);
  const dispatch = useDispatch();
   const triggeredRef = useRef(false);
   const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
   const router = useRouter();

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/getAllPlans`);
      const json = await response.json();
      if (json.actionStatus === 'success') {
        setPlans(json.data);
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
    const fetchStatusFromStorage = async () => {
      const storedStatus = await AsyncStorage.getItem('payment_status');
      const storedPaying = await AsyncStorage.getItem('paying');
  
       if (!storedStatus && storedPaying === 'true') {
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

      if (visited === 'true') {
        await AsyncStorage.setItem('visited_after_redirect', 'false');
        return;
      }

      const status = await AsyncStorage.getItem('payment_status 1');
      const storedPaying = await AsyncStorage.getItem('paying');
      if (status === 'fail') {
        if (storedPaying === 'false') {
          setIsVisible(true);
        }
      } else if (storageModalKey) {
        setShowStorage2(true);
      } else {
        if (!storagePlanId || storagePlanId === "null") {
          await AsyncStorage.removeItem('closePlans');
          setShowStorage1(true);
        }
      }
    };

    if (!openStorage2Directly) {
      checkPaymentStatus();
    }
  }, []);

 
  useEffect(() => {
    const checkIfTriggered = async () => {
      if (triggeredRef.current) return;

      const triggered = await AsyncStorage.getItem('storage_modal_triggered');

      if (openStorage2Directly && triggered !== 'true') {
        triggeredRef.current = true;
        setShowStorage1(false);
        setIsVisible(false);
        setShowStorage2(true);
        await AsyncStorage.setItem('closePlans', 'true');
        setClosePlans(true);

        dispatch(clearOpenStorage2());
        await AsyncStorage.setItem('storage_modal_triggered', 'true');
      }
    };

    if (openStorage2Directly) {
      checkIfTriggered();
    }
  }, [openStorage2Directly]);

  useEffect(() => {
    let hasChecked = false;
    const checkPaymentStatus = async () => {
      if (hasChecked) return;
      hasChecked = true;

      const status = await AsyncStorage.getItem('payment_status');

      if (status === 'fail') {
        await AsyncStorage.setItem('payment_status 1', 'fail');
        await AsyncStorage.removeItem('payment_status');
        await AsyncStorage.setItem('storage_modal_triggered', 'false');
        triggeredRef.current = false;
        dispatch(setForceOpenStorageModals(false));
        setShowStorage1(false);
        setShowStorage2(false);
        setShowPaymentFailure(true);
      } else if (status === 'done') {
        await AsyncStorage.setItem('payment_status 1', 'done');
        const storedPlanId = await AsyncStorage.getItem('selected_plan_id');
        const planIdToUse = storedPlanId ? parseInt(storedPlanId) : null;

        try {
          //const storagePlanIdToSend = (planIdToUse === 3) ? 2 : planIdToUse;
          await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/updatePlan`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uuid,
              storagePlanId: planIdToUse,
              storagePlanPayment: 1,
            }),
          });
          setShowStorage1(false);
          setShowStorage2(false);
          setShowPaymentSuccess(true);
          dispatch(setForceOpenStorageModals(false));
          dispatch(setPlanExpired(false));
          dispatch(setUpgradeReminder(false));
        } catch (e) {
        }

        await AsyncStorage.removeItem('payment_status');
        await AsyncStorage.setItem('storage_modal_triggered', 'false');
        triggeredRef.current = false;
        setShowStorage1(false);
      } else if (storageModalKey) {
        setShowStorage2(true);
        await AsyncStorage.setItem('closePlans', 'true');
        setClosePlans(true);
      } else {
       if (!storagePlanId || storagePlanId === "null") {
          await AsyncStorage.removeItem('closePlans');
          setShowStorage1(true);
        }
      }
    };
    

    if (!openStorage2Directly) {
      checkPaymentStatus();
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkPaymentStatus();
      }
    });

    return () => subscription.remove();
  }, []);

  const handleProceedNow = () => {
    //setShowStorage1(false);
    setShowStorage2(true);
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
        Alert.alert('Failed to Skip', data.message);
      }
    } catch (error) {
      console.error('Error skipping plan:', error);
      Alert.alert('Error', 'Something went wrong while skipping the plan.');
    }
  };

  const handleBack = () => {
    setShowStorage2(false);
    
    setTimeout(() => {
    setShowStorage1(true);
  }, 2000);
    //setShowStorage1(false);
  };

  const handlePayment = async () => {
    try {
      await AsyncStorage.setItem('selected_plan_id', selectedPlan.toString());
      onClose();
      dispatch(clearOpenStorage2());
      await AsyncStorage.setItem('storage_modal_triggered', 'false');
      await AsyncStorage.setItem('paying', 'true');

      const sessionRes = await axios.post(`${EXPO_PUBLIC_API_URL}/api/create-checkout-session-app`, {
        planId: selectedPlan,
        email: user.email,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const sessionData = sessionRes.data;

      if (!sessionData.sessionId) throw new Error("No session ID returned");

      const stripeUrl = sessionData.sessionUrl;

      setShowStorage2(false);
      const result = await WebBrowser.openAuthSessionAsync(stripeUrl, "babyflix://");
      
      if (result.type === "cancel") {
       if (isAuthenticated) {
        router.push('/gallary');
      }
    }

    } catch (error) {
      console.error("Payment error:", error);
      await AsyncStorage.setItem('payment_status 1', 'fail');
      setShowStorage2(false);
      setShowPaymentFailure(true);
    }
  };

  return (
    <>
      <Modal visible={showStorage1} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            {/* <TouchableOpacity
              onPress={() => {
                setShowStorage1(false);
                setWasTriggered(false)
                triggeredRef.current = false;
              }}
              style={styles.closeModel}
            >
              <MaterialIcons name="close" size={24} color="black" />
            </TouchableOpacity> */}
            <Text style={[styles.title]}>Storage Management</Text>
            <Text style={[styles.planBox, styles.subtitleTextBox, styles.subtitleText]}>
              Please select an option for managing your storage.
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
                    <Text style={styles.outlinedText}>SKIP FOR LATER</Text>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[
                styles.filledButton,
                skippedPlanCount >= 3 && { width: '60%' }
              ]}
                onPress={handleProceedNow}>
                <View style={styles.iconButtonContent}>
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.filledText}>PROCEED NOW</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showStorage2} transparent animationType="fade">
        <View style={styles.modalBackground}>
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
              <Text style={[styles.title, { textAlign: 'center' }]}>Select Your Plan</Text>
            </View>
            {plans
            .filter((plan) => {
              if (isPlanExpired) {
                // Only show plan 3 when expired
                return plan.id === 3;
              }
              // When NOT expired → hide plan 3
              if (plan.id === 3) {
                return false;
              }
              // Your original filter for other plans
              return !(
                (showUpgradeReminder ||
                  storagePlanId ||
                  storagePlanPayment == 1 ||
                  isPlanDeleted == 1) &&
                plan.id === 1
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

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.outlinedButton} onPress={handleBack}>
                <View style={styles.iconButtonContent}>
                  <MaterialIcons name="arrow-back" size={20} color="#b53bb7" style={{ marginRight: 6 }} />
                  <Text style={styles.outlinedText}>BACK</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filledButton}
                onPress={handlePayment}
              >
                <View style={styles.iconButtonContent}>
                  <MaterialIcons name="payment" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.filledText}>CONTINUE TO PAYMENT</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPaymentSuccess} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainerStatus, { borderColor: "green" }]}>
            <Text style={[styles.title, { color: "green", textAlign: 'center' }]}>🎉 Payment Successful</Text>
            <Text style={[styles.subtitle, {}]}>Thank you for your payment.</Text>
            <TouchableOpacity
              style={[styles.filledButton, { paddingHorizontal: 20 }]}
              onPress={async () => {
                setShowPaymentSuccess(false);
                AsyncStorage.removeItem('payment_status 1');
                await getStoragePlanDetails(user.email, dispatch);
              }}
            >
              <Text style={styles.filledText}>OK GOT IT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPaymentFailure} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainerStatus, { borderColor: Colors.error, }]}>
            <Text style={[styles.title, { color: Colors.error, textAlign: 'center' }]}>❌ Payment Failed</Text>
            <Text style={styles.subtitleFailed}>Something went wrong with your Payment</Text>
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
              <Text style={styles.filledText}>OK I GOT IT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={[styles.title]}>Storage Management - Payment Pending</Text>
            <Text style={[styles.planBox, styles.subtitleTextBox, styles.subtitleText]}>
              Looks like your payment to purchase plan was unsuccessful.
            </Text>

            <View style={[styles.buttonRow, { justifyContent: 'flex-end', gap: 10 }]}>
              <TouchableOpacity style={styles.outlinedButton} onPress={() => { setShowStorage1(true), setIsVisible(false) }}>
                <Text style={styles.outlinedText}>← GO BACK</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.filledButton} onPress={() => { setShowStorage2(true) }}>
                <Text style={styles.filledText}>▶ PROCEED NOW</Text>
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
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
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
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 20,
    marginTop: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#444',
    textAlign: 'left',
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'left',

  },
  subtitleFailed: {
    fontSize: 15,
    marginTop: 10,
    marginBottom: 20,
    fontFamily: 'Poppins_400Regular',
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
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins_500Medium',
  },
  planPrice: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.primary,
    fontFamily: 'Poppins_500Medium',
  },
  planSubtitle: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
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
    fontWeight: 'bold',
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
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
    fontWeight: 'bold',
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
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
