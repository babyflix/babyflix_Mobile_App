import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking, Alert, AppState } from 'react-native';
import Colors from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_API_URL } from '@env';
import { useDispatch, useSelector } from 'react-redux';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { clearOpenStorage2 } from '../state/slices/storageUISlice';

const StorageModals = () => {
  const [showStorage1, setShowStorage1] = useState(false);
  const [showStorage2, setShowStorage2] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(1); // or null initially
  const [selectedPrice, setSelectedPrice] = useState(10); // $10 for basic
  const [skipCount, setSkipCount] = useState(0);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentFailure, setShowPaymentFailure] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [planPressed, setPlanPressed] = useState(false)
  const [plans, setPlans] = useState([]);
  const [closePlanes, setClosePlans] = useState(false);

  const user = useSelector((state) => state.auth);
  const { skippedPlanCount, storagePlanId, storagePlanPayment } =
    useSelector((state) => state.storagePlan || {});
  const openStorage2Directly = useSelector(state => state.storageUI.openStorage2Directly);
  const dispatch = useDispatch();

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/getAllPlans`);
      const json = await response.json();
      if (json.actionStatus === 'success') {
        console.log("getAllPlans 1", json)
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

  // useEffect(() => {
  //   setShowStorage1(true);
  // }, []);

  useEffect(() => {
  const checkPaymentStatus = async () => {
    const status = await AsyncStorage.getItem('payment_status 1');
    console.log('status',status)
    if (status === 'fail') {
      setIsVisible(true); // Show pending payment modal
    } else {
      console.log('calling')
      setShowStorage1(true); // Show normal storage modal
    }
  };
  if(openStorage2Directly == false){
  checkPaymentStatus();
}
}, []);

  useEffect(() => {
    console.log('openStorage2Directly',openStorage2Directly)
  if (openStorage2Directly) {
    setShowStorage1(false); // skip first modal
    setIsVisible(false);
    setShowStorage2(true);  // show second modal
    setClosePlans(true);
    dispatch(clearOpenStorage2()); // reset flag
  }
}, [openStorage2Directly]);

// useEffect(() => {
//   const handleUrl = async ({ url }) => {
//     console.log('Received deep link URL:', url);
//     const parsed = Linking.parse(url);
//     const status = parsed.queryParams?.status;

//     if (status === 'success') {
//       try {
//         await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/updatePlan`, {
//           method: 'PUT',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             userId: user.uuid,
//             storagePlanId: selectedPlan,
//             storagePlanPayment: 1,
//           }),
//         });

//         await AsyncStorage.setItem('payment_status 1', 'done');
//         setShowPaymentSuccess(true);
//       } catch (e) {
//         console.log('Update plan error', e);
//         await AsyncStorage.setItem('payment_status 1', 'fail');
//         setShowPaymentFailure(true);
//       }
//     } else if (status === 'failed') {
//       await AsyncStorage.setItem('payment_status 1', 'fail');
//       setShowPaymentFailure(true);
//     }
//   };

//   const subscription = Linking.addEventListener('url', handleUrl);

//   return () => subscription.remove();
// }, []);

// useEffect(() => {
//   const checkPaymentStatus = async () => {
//     const status = await AsyncStorage.getItem('payment_status');
//     console.log('Payment status from storage:', status);

//     if (status === 'fail') {
//       setShowPaymentFailure(true);
//       await AsyncStorage.setItem('payment_status 1', 'fail');
//       await AsyncStorage.removeItem('payment_status');
//     } else if (status === 'done') {
//       setShowPaymentSuccess(true);
//       await AsyncStorage.setItem('payment_status 1', 'done');
//       // ✅ Optionally update backend only once here
//       try {
//         await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/updatePlan`, {
//           method: 'PUT',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             userId: user.uuid,
//             storagePlanId: selectedPlan,
//             storagePlanPayment: 1,
//           }),
//         });
//         console.log('Plan updated after success');
//       } catch (e) {
//         console.log('Error updating plan after success', e);
//       }

//       await AsyncStorage.removeItem('payment_status');
//     } else {
//       setShowStorage1(true);
//     }
//   };

//   if (!openStorage2Directly) {
//     checkPaymentStatus(); // Initial call
//   }

//   const subscription = AppState.addEventListener('change', (state) => {
//     if (state === 'active') {
//       checkPaymentStatus(); // Call again when app resumes
//     }
//   });

//   return () => subscription.remove();
// }, []);

  useEffect(() => {
  const checkPaymentStatus = async () => {
    const status = await AsyncStorage.getItem('payment_status');
    console.log('Payment status:', status);
    
    if (status === 'fail') {
      setShowPaymentFailure(true);
      await AsyncStorage.setItem('payment_status 1', 'fail');
      await AsyncStorage.removeItem('payment_status');
      setShowStorage1(false);
    } else if (status === 'done') {
      setShowPaymentSuccess(true);
      await AsyncStorage.setItem('payment_status 1', 'done');

      try {
        await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/updatePlan`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uuid,
            storagePlanId: selectedPlan,
            storagePlanPayment: 1,
          }),
        });
        console.log('Plan updated after success');
      } catch (e) {
        console.log('Plan update error after success', e);
      }

      await AsyncStorage.removeItem('payment_status');
      setShowStorage1(false);
    } else {
      setShowStorage1(true); // Only show this if no status is stored
    }
  };

  if (!openStorage2Directly) {
    checkPaymentStatus(); // initial load
  }

  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      checkPaymentStatus(); // run again on resume
    }
  });

  return () => subscription.remove();
}, []);

  const handleProceedNow = () => {
    setShowStorage1(false);
    setShowStorage2(true);
  };

  const handleSkip = async () => {
    if (skippedPlanCount < 3) {
      setShowStorage1(false);
    }

    console.log('userId', user.uuid)
    try {
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
      console.log('raw response:', response);

      const data = await response.json();
      console.log('parsed response:', data);

      if (data.actionStatus === 'success') {
        console.log('Plan skipped successfully');
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
    setShowStorage1(true);
    //setShowPaymentFailure(true)
  };

  const handlePayment = async () => {
    try {
      //await AsyncStorage.setItem('payment_status 1', 'paying');
      console.log('selectedPlan', selectedPlan)

      const sessionRes = await axios.post(`${EXPO_PUBLIC_API_URL}/api/create-checkout-session-app`, {
        planId: selectedPlan,
        email: user.email,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const sessionData = sessionRes.data;
      console.log('sessionData', sessionData);

      if (!sessionData.sessionId) throw new Error("No session ID returned");

      const stripeUrl = sessionData.sessionUrl;

      //const result = await WebBrowser.openBrowserAsync(stripeUrl);
      const result = await WebBrowser.openAuthSessionAsync(stripeUrl, "babyflix://");

      console.log("Browser result:", result);
      setShowStorage2(false);

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
            <TouchableOpacity
              onPress={() => {
                setShowStorage1(false);
              }}
              style={styles.closeModel}
            >
              <MaterialIcons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={[styles.title]}>Storage Management</Text>
            <Text style={[styles.planBox, styles.subtitleTextBox, styles.subtitleText]}>
              Please select an option for managing your storage.
            </Text>
            <View style={[
              styles.buttonRow,
              skippedPlanCount >= 3 && { justifyContent: 'center' } // center when skip is hidden
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
                skippedPlanCount >= 3 && { width: '60%' } // make button bigger when centered (optional)
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
              onPress={() => {
                setShowStorage2(false);
                setClosePlans(false);
              }}
              style={styles.closeModel}
            >
              <MaterialIcons name="close" size={24} color="black" />
            </TouchableOpacity>
          )}

            <View style={styles.modalHeader}>
              <Text style={[styles.title, { textAlign: 'center' }]}>Select Your Plan</Text>
            </View>

            {plans.map((plan) => (
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
                  setSelectedPrice(plan.price_per_month); // use price from backend
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
                // onPress={() => {
                //   console.log("Selected Price for API:", selectedPrice, selectedPlan);
                //   setShowStorage2(false);
                //   //setShowPaymentSuccess(true);
                //   setShowPaymentFailure(true);
                //   //setIsVisible(true);
                // }}
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
              onPress={() => {
                setShowPaymentSuccess(false);
                AsyncStorage.removeItem('payment_status 1');
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
              onPress={() => {
                setShowPaymentFailure(false);
                //setShowStorage2(true);
                setIsVisible(true);
              }}
            >
              <Text style={styles.filledText}>TRY AGAIN</Text>
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

              <TouchableOpacity style={styles.filledButton} onPress={() => { setShowStorage2(true), setIsVisible(false) }}>
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
    //padding:20,
    marginTop: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#444',
    textAlign: 'left',
    // borderColor: Colors.primary,
    // borderWidth: 1.5,
    // borderRadius: 8,
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
    //backgroundColor: Colors.lightGray,
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
    gap: 10,
  },
  filledButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
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
    paddingHorizontal: 12,
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
