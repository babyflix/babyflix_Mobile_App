import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Linking,
  Platform,
  AppState,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Colors from "../constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MonthSelector from "../constants/MonthSelector";
import * as WebBrowser from "expo-web-browser";
import axios from "axios";
import { useTranslation } from "react-i18next";
import * as Updates from "expo-updates";
import { useFocusEffect } from "expo-router";
import Snackbar from "../components/Snackbar";
import sendDeviceUserInfo, { USERACTIONS } from "../components/deviceInfo";
import { EXPO_PUBLIC_API_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DisableAutoRenewModal from "../constants/DisableAutoRenewModal";
import moment from "moment";
import MonthSelectorStorage from "../constants/MonthSelectorStorage";
import { getStoragePlanDetails } from "../components/getStoragePlanDetails";
import { handlePlayStorageSubscription } from "../constants/PlayBillingStorageHandler";
import { clearOpenStorage2, setForceOpenStorageModals } from "../state/slices/storageUISlice";
import { setPlanExpired, setUpgradeReminder } from "../state/slices/expiredPlanSlice";
import * as RNIap from 'react-native-iap';
import { handleIOSStorageSubscription } from "../constants/iosStorageIAP";
//import { restoreIOSStoragePurchase } from "../constants/iosRestoreStorageIAP";

const StorageTab = () => {
  const user = useSelector((state) => state.auth);
  const { t } = useTranslation();

  const {
    storagePlan,
    storagePlanId,
    storagePlanPrice,
    storagePlanName,
    storagePlanDescription,
    storagePlanPayment,
    storagePlanExpired,
    storagePlanRemainingDays,
    storagePlanWarning,
    storagePlanDeleted,
    storagePlanAutoRenewal,
    storageCurrentPurchaseToken,
  } = useSelector((state) => state.auth);

  // const storagePlanExpired = true;
  // const storagePlanPrice = "0.00";

  const plans = useSelector((state) => state.subscription.plans);

  function formatDateToDDMMYYYY(date) {
    return moment(date).format("DD/MM/YYYY");
  }

  let calculatedSubscribedMonths = 1;

  if (storagePlan?.planDate && storagePlan?.planExpiryDate) {
    // planDate = "MM/DD/YYYY"
    const start = moment(storagePlan.planDate, "MM/DD/YYYY");

    // planExpiryDate = "YYYY/MM/DD"
    const end = moment(storagePlan.planExpiryDate, "YYYY/MM/DD");

    // whole months difference
    let monthsDiff = end.diff(start, "months");

    // at least 1 month
    calculatedSubscribedMonths = Math.max(1, monthsDiff);

    console.log("Start (formatted):", formatDateToDDMMYYYY(start));
    console.log("End   (formatted):", formatDateToDDMMYYYY(end));
    console.log("Months Diff:", calculatedSubscribedMonths);
  }
  const storageActive = storagePlanPayment;
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [autoRenew, setAutoRenew] = useState(storagePlanAutoRenewal);
  const [months, setMonths] = useState(storagePlanExpired ? 1 : calculatedSubscribedMonths || 0);
  const [showAutoRenewMsg, setShowAutoRenewMsg] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  const [error, setError] = useState("");
  const [showAutoRenewModal, setShowAutoRenewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState((storagePlanExpired && storagePlanPrice === '0.00') ? 3 : 2);
  const [translatedCurrentPlan, setTranslatedCurrentPlan] = useState('');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentFailure, setShowPaymentFailure] = useState(false);

  const PLAY_STORE_SUBS_URL = "https://play.google.com/store/account/subscriptions";

  const dispatch = useDispatch();

  useEffect(() => {
    if (storagePlanExpired) setError("Storage Plan Expired");
  }, [storagePlanExpired]);

    //  useEffect(() => {
    //   const checkAndVerify = async () => {
    //     try {
    //       const today = new Date();
    //       const expiry = new Date(storagePlan?.planExpiryDate);
  
    //       // ✅ Run verification only if subscription is expired or just expired
    //       if (today > expiry) {
    //         console.log("⏰ Subscription expired, verifying renewal status...");
    //         await verifyAutoRenewStatus(user.uuid);
            
    //         restoreIOSStoragePurchase({
    //           userId: user.uuid,
    //           userEmail: user.email,
    //           dispatch,
    //           getStoragePlanDetails,
    //           silent: true,
    //         });
    //       } else {
    //         console.log("✅ Subscription still active, no verification needed.");
    //       }
    //     } catch (err) {
    //       console.error("Error verifying auto-renewal:", err);
    //     }
    //   };
  
    //   checkAndVerify();
    // }, [storagePlan.expiryDate, user.uuid]);

  const handleUnsubscribe = () => setShowModal(true);
  const handleUpgradeSubscribtion = () => setUpgradeModal(true);

  const handleRestart = async () => {
    try { await Updates.reloadAsync(); }
    catch (e) { console.error("Failed to reload app:", e); }
  };

  useEffect(() => {
    const translateDynamicTexts = async () => {
      if (storagePlanName) {
        const translatedPlan = await useDynamicTranslate(storagePlanName);
        setTranslatedCurrentPlan(translatedPlan);
      }
    };

    translateDynamicTexts();
  }, [user, snackbarMessage]);

  const confirmUnsubscribe = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/updatePlan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uuid,
          storagePlanId: null,
          storagePlanPayment: null,
          storagePlanDeleteDate: moment().format('DD-MM-YYYY hh:mm'),
          isPlanDeleted: 1,
        }),
      });


      const data = await response.json();

      if (response.ok && data.actionStatus === 'success') {

        setSnackbarMessage(t('storage.deletedSuccessfully', { planName: translatedCurrentPlan }));
        setSnackbarType('success');
        setSnackbarVisible(true);

        await getStoragePlanDetails(user.email, dispatch);
        //setPlanModalVisible(false)
        setIsUnsubscribed(true);
        setShowModal(false);
        sendDeviceUserInfo({
          action_type: USERACTIONS.UNSUBSCRIBE,
          action_description: `User Unsubscribe storage plan`,
        });

        setTimeout(async () => {
          handleRestart();
        }, 3000);
      } else {
        console.error('❌ Failed to delete plan:', data.message);

        setSnackbarMessage(t('storage.failedToDeletePlan'));
        setSnackbarType('error');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('❌ Error deleting plan:', error);

      setSnackbarMessage(t('storage.somethingWentWrong'));
      setSnackbarType('error');
      setSnackbarVisible(true);
    }
  };

  const cancelUnsubscribe = () => setShowModal(false);
  const cancelUpgradeSubscribtion = () => setUpgradeModal(false);

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  const expiryDate = new Date(storagePlan?.planExpiryDate);
  const today = new Date();
  const remainingDays = storagePlanRemainingDays || Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

  // const handleSubscribe = async () => {
  //   await AsyncStorage.setItem("storagePaying", "true");
  //   setUpgradeModal(false);
  //   try {
  //     //  await AsyncStorage.setItem('selected_plan_id', selectedPlan.toString());
  //     //onClose();
  //     //dispatch(clearOpenStorage2());
  //     await AsyncStorage.setItem('storage_modal_triggered', 'false');
  //     await AsyncStorage.setItem('paying', 'true');
  //     //console.log('platform.os',Platform.OS);

  //     const sessionRes = await axios.post(`${EXPO_PUBLIC_API_URL}/api/create-checkout-session-app`, {
  //       planId: 2,
  //       autoRenewal: false,
  //       months: 2,
  //       platform: Platform.OS,
  //     }, {
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     });

  //     const sessionData = sessionRes.data;

  //     if (!sessionData.sessionId) throw new Error("No session ID returned");

  //     const stripeUrl = sessionData.sessionUrl;

  //     setShowStorage2(false);
  //     //const result = await WebBrowser.openAuthSessionAsync(stripeUrl, "babyflix://");

  //     if (Platform.OS === 'ios') {
  //       await Linking.openURL(stripeUrl);
  //       // const result = await WebBrowser.openAuthSessionAsync(
  //       //   stripeUrl, // Stripe checkout URL
  //       //   "babyflix://payment/redirect"
  //       // );

  //     } else {
  //       const result = await WebBrowser.openAuthSessionAsync(
  //         stripeUrl,
  //         "babyflix://"
  //       );

  //       if (result.type === "cancel") {
  //         if (isAuthenticated) {
  //           router.push('/gallary');
  //         }
  //       }
  //     }

  //   } catch (error) {
  //     console.error("Payment error:", error);
  //     await AsyncStorage.setItem('payment_status 1', 'fail');
  //   }
  // };

  const getPlanPrice = (planId) => {
    const plan = plans.find((p) => p.id === planId);
    return plan ? plan.price_per_month : null; // returns string like "3.99" or null if not found
  };

   const verifyAutoRenewStatus = async (uuid) => {
  try {
    await RNIap.initConnection();
    const purchases = await RNIap.getAvailablePurchases();

    const sub = purchases.find(p => p.productId === "storage_pro");
    if (!sub) {
      console.log("No subscription found for user.");
      return;
    }

    const newStatus = sub.autoRenewing;

    const expiryTimestamp =
      sub.expirationDate ||      // Android (some versions return this)
      sub.expirationDateAndroid || // Some builds define this
      sub.expirationDateIos ||   // iOS field
      null;

    const expiryDate = expiryTimestamp
    ? new Date(Number(expiryTimestamp)).toISOString()
    : null;

    console.log("Play Store autoRenew:", newStatus, "Expiry:", expiryDate);

    // Sync with backend only if changed
    await axios.post(`${EXPO_PUBLIC_API_URL}/api/patients/update-storage-autorenewal-app`, {
      uuid,
      autoRenewal: newStatus,
      expiryDate,
      currentPurchaseToken: sub.purchaseToken, // Android token
    });

    console.log("✅ Auto-renewal synced with backend:", { newStatus, expiryDate });

    await RNIap.endConnection();
  } catch (err) {
    console.error("verifyAutoRenewStatus error:", err);
  }
};

  const handleSubscribe = async () => {

    const isAutoRenewToggleOnly = calculatedSubscribedMonths === months && storagePlanAutoRenewal !== autoRenew;
    await AsyncStorage.setItem("storagePaying", "true");
    setUpgradeModal(false);

    try {
      await AsyncStorage.setItem("storage_modal_triggered", "false");
      await AsyncStorage.setItem("paying", "true");
      await AsyncStorage.setItem('closePlans', 'true');

      // ✅ Special case: free expired plan
      let planIdToSend = selectedPlan;
      let monthsToSend = months;

      if (storagePlanExpired && storagePlanPrice === "0.00") {
        planIdToSend = 3;   // force free plan
        monthsToSend = 1;   // only 1 month
      }

      if (Platform.OS === 'android') {
        // Use Google Play Billing for Android
        if (isAutoRenewToggleOnly) {
            console.log("User only toggled auto-renew — opening Play Store...");
            await Linking.openURL(PLAY_STORE_SUBS_URL);
        
            const subscriptionListener = AppState.addEventListener("change", async (state) => {
              if (state === "active") {
                console.log("Returned from Play Store — verifying auto-renewal...");
                await verifyAutoRenewStatus(user.uuid);
                subscriptionListener.remove();
              }
            });
            return;
          }

          const currentPurchaseToken = storageCurrentPurchaseToken;

          const result = await handlePlayStorageSubscription({
            planType: planIdToSend,              // 'basic' or 'pro'
            months: monthsToSend,  // number of months
            autoRenew: autoRenew,             // true/false
            setShowModal: setUpgradeModal,
            currentPurchaseToken,
            //hasPurchasedBasic: false,
          });

          console.log('result', result);

          if (result.success) {

          const purchaseItem = Array.isArray(result.purchase)
          ? result.purchase[0]
          : result.purchase;
          
          //setShowPaymentSuccess(true);
          await AsyncStorage.setItem('payment_status 1', 'done');

          // ✅ Now call your backend updatePlan API
          const currentPurchaseToken = purchaseItem.purchaseToken;

          const payload = {
            userId: user.uuid,
            storagePlanId: selectedPlan,
            storagePlanPayment: 1,
            autoRenewal: autoRenew,
            months: monthsToSend,
            session_id: "play_billing_" + Date.now(),
            status: "SUCCESS",
            provider: "play_billing",
            currentPurchaseToken,
          };

          console.log("[StorageModals] Updating plan with payload:", payload);

          await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/updatePlan`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          // setShowStorage1(false);
          // setShowStorage2(false);

          sendDeviceUserInfo({
            action_type: USERACTIONS.PAYMENT,
            action_description: `User payment success for storage plan`,
          });

          dispatch(setForceOpenStorageModals(false));
          dispatch(setPlanExpired(false));
          dispatch(setUpgradeReminder(false));

          setTimeout(() => {
            setShowPaymentSuccess(true);
          }, 200);

        } else {
          console.error("Android payment failed:", result.error);
          await AsyncStorage.setItem('payment_status 1', 'fail');
          await AsyncStorage.removeItem('payment_status');
          await AsyncStorage.setItem('storage_modal_triggered', 'false');
          //triggeredRef.current = false;
          dispatch(setForceOpenStorageModals(false));
          // setShowStorage1(false);
          // setShowStorage2(false);
          // if(!modalShown){
          setTimeout(() => {
            setShowPaymentFailure(true);
          }, 200);
          //modalShown = true;

          sendDeviceUserInfo({
            action_type: USERACTIONS.PAYMENT,
            action_description: `User payment failed for Storage plan`,
          });
        }

      } else if (Platform.OS === 'ios') {

        if (isAutoRenewToggleOnly) {
            Alert.alert(
            'Manage Subscription',
            'Auto-renewal is managed by Apple. Changes may take some time to reflect.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Subscriptions',
                onPress: () =>
                  Linking.openURL('https://apps.apple.com/account/subscriptions'),
              },
            ]
          );
          return;
        }

        await handleIOSStorageSubscription({
          planId: planIdToSend,       // 2 or 3
          months: monthsToSend,       // selected months
          userId: user.uuid,

          onSuccess: async ({ autoRenewal, expiryDate, originalTransactionId }) => {
            // ✅ Update backend
            await AsyncStorage.setItem('payment_status 1', 'done');
            const payload = {
              userId: user.uuid,
              storagePlanId: planIdToSend,
              storagePlanPayment: 1,
              autoRenewal: autoRenew,
              months: monthsToSend,
              session_id: "ios_iap_" + originalTransactionId,
              status: 'SUCCESS',
              provider: 'ios_iap',
              productId,
            };

            await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/updatePlan`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            sendDeviceUserInfo({
              action_type: USERACTIONS.PAYMENT,
              action_description: 'User payment success for storage plan (iOS IAP)',
            });

            dispatch(setForceOpenStorageModals(false));
            dispatch(setPlanExpired(false));
            dispatch(setUpgradeReminder(false));

            setTimeout(() => {
              setShowPaymentSuccess(true);
            }, 200);
          },

          onFailure: async () => {
            await AsyncStorage.setItem('payment_status 1', 'fail');
            await AsyncStorage.removeItem('payment_status');
            await AsyncStorage.setItem('storage_modal_triggered', 'false');

            dispatch(setForceOpenStorageModals(false));

            setTimeout(() => {
              setShowPaymentFailure(true);
            }, 200);

            sendDeviceUserInfo({
              action_type: USERACTIONS.PAYMENT,
              action_description: 'User payment failed for storage plan (iOS IAP)',
            });
          },
        });

        return;
      }
    } catch (error) {
      console.error("Payment error:", error);
      await AsyncStorage.setItem("payment_status", "fail");
    }
  };

  const expiryDateCal = new Date(storagePlan?.planExpiryDate);
  const todayCal = new Date();
  const allowDate = new Date(expiryDateCal); allowDate.setDate(expiryDateCal.getDate() - 15);

  const formatFullDate = (date) => date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const canUpdateAutoRenew = storagePlanExpired || todayCal >= allowDate;
  const handleAutoRenewPress = () => {
    if (!canUpdateAutoRenew && !storagePlanExpired) {
      setShowAutoRenewMsg(true);
      return;
    }
    setAutoRenew(!autoRenew);
  };

  // const additionalMonths = storagePlanExpired ? (months >= 1 ? months : 0) : (months > calculatedSubscribedMonths ? months - calculatedSubscribedMonths : 0);
  // const amountToPay = (additionalMonths * storagePlan?.storagePlanPrice).toFixed(2);

  // let newExpiryDate = storagePlanExpired ? new Date() : new Date(storagePlan?.planExpiryDate);
  // if ((storagePlanExpired ? months : additionalMonths) > 0) newExpiryDate.setMonth(newExpiryDate.getMonth() + (storagePlanExpired ? months : additionalMonths));

  let additionalMonths;
  let amountToPay = 0;
  let newExpiryDate;

  // Special recovery plan case
  if (storagePlanExpired && storagePlanPrice === "0.00") {
    additionalMonths = 1; // always 1 month recovery plan
    amountToPay = getPlanPrice(3);  // fixed price for recovery
    newExpiryDate = new Date();
    newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
  } else {
    // Normal logic
    additionalMonths = storagePlanExpired
      ? (months >= 1 ? months : 0)
      : (months > calculatedSubscribedMonths ? months - calculatedSubscribedMonths : 0);

    if (storagePlanPrice === "0.00") {
      amountToPay = (additionalMonths * parseFloat(getPlanPrice(2) || 0)).toFixed(2);
    } else {
      amountToPay = (additionalMonths * parseFloat(storagePlanPrice || 0)).toFixed(2);
    }

    newExpiryDate = storagePlanExpired ? new Date() : new Date(storagePlan?.planExpiryDate);
    if ((storagePlanExpired ? months : additionalMonths) > 0) {
      newExpiryDate.setMonth(
        newExpiryDate.getMonth() + (storagePlanExpired ? months : additionalMonths)
      );
    }
  }

  const status = autoRenew ? "enabled" : "disabled";

  useFocusEffect(useCallback(() => { return () => { setShowAutoRenewMsg(false); setMonths(storagePlanExpired ? 1 : calculatedSubscribedMonths || 1); }; }, []));

  if (!storageActive && !storagePlanId && !storagePlanPrice) {
    return (
      <View style={styles.lockedContainer}>
        <MaterialCommunityIcons name="lock" size={40} color={Colors.gray} />
        <Text style={styles.lockedText}>{isUnsubscribed ? t("flix10k.unsubscribed") : t("flix10k.subscriptionNotActive")}</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileCardWrapper}>
          <LinearGradient colors={["rgb(252,231,243)", "rgb(243,232,255)", "rgb(224,242,254)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileCard}>
            <Text style={styles.cardTitle}>{storagePlanName || t("flix10k.title")}</Text>
            <Text style={styles.price}>${storagePlanPrice} / {t("flix10k.month")}</Text>
            <Text style={styles.nextBilling}>{t("flix10k.nextBilling")}: {formatDate(storagePlan?.planExpiryDate)}</Text>
            {!storagePlanExpired && <Text style={[styles.nextBilling, { color: "#e96b04" }]}>{t('storage.remainingDays')}: {remainingDays}</Text>}

            <TouchableOpacity
              style={styles.autoRenewRow}
              onPress={handleAutoRenewPress}
            >
              <Text style={styles.autoRenewText}>{t("flix10k.autoRenew")}</Text>
              <View
                style={[
                  styles.toggleSwitch,
                  autoRenew ? styles.toggleOn : styles.toggleOff,
                ]}
              >
                <View
                  style={[
                    styles.toggleCircle,
                    autoRenew ? styles.circleOn : styles.circleOff,
                  ]}
                />
              </View>
            </TouchableOpacity>

            {showAutoRenewMsg && (
              <Text
                style={{
                  fontFamily: "Nunito400",
                  fontSize: 12,
                  color: "red",
                  marginBottom: 10,
                }}
              >
                {t("flix10k.autoRenewUpdate", { date: formatFullDate(allowDate) })}
              </Text>
            )}
            {error && <Text style={styles.error}>{error}</Text>}

            <MonthSelectorStorage months={months} setMonths={setMonths} autoRenew={autoRenew} mode={"dropdown"} />
            {console.log('additionalMonths', additionalMonths)}
            {/* { additionalMonths > 0 && (
                <View style={{ marginTop: 10 }}>
                <Text style={{ fontFamily: "Nunito400", fontSize: 12, color: "#333", marginBottom: 4 }}>
                    {t("flix10k.additionalMonths")}
                </Text>

                <Text style={{ fontFamily: "Nunito700", fontSize: 14, color: Colors.black, marginVertical: 4 }}>
                    {t("flix10k.amountToPay", { amount: amountToPay })}
                </Text>

                <Text style={{ fontFamily: "Nunito700", fontSize: 14, color: Colors.black }}>
                    {t("flix10k.newExpiry", { date: formatFullDate(newExpiryDate) })}
                </Text>
                </View>
            )} */}

            {storagePlanExpired && storagePlanPrice === "0.00" ? (
              <View style={{ marginTop: 10 }}>
                <Text
                  style={{
                    fontFamily: "Nunito700",
                    fontSize: 14,
                    color: "red",
                    marginBottom: 6,
                  }}
                >
                  {t('storage.sdExpired', { price: `$${getPlanPrice(2)}` })}
                </Text>

                <Text
                  style={{
                    fontFamily: "Nunito700",
                    fontSize: 14,
                    color: Colors.black,
                    marginVertical: 4,
                  }}
                >
                  {t("flix10k.amountToPay", { amount: amountToPay })}
                </Text>

                <Text
                  style={{
                    fontFamily: "Nunito700",
                    fontSize: 14,
                    color: Colors.black,
                  }}
                >
                  {t("flix10k.newExpiry", { date: formatFullDate(newExpiryDate) })}
                </Text>
              </View>
            ) : (
              additionalMonths > 0 && (
                <View style={{ marginTop: 10 }}>
                  {/* <Text
                    style={{
                      fontFamily: "Nunito400",
                      fontSize: 12,
                      color: "#333",
                      marginBottom: 4,
                    }}
                  >
                    {t("flix10k.additionalMonths")}
                  </Text> */}

                  {storagePlanPrice === "0.00" ? (
                    <Text
                      style={{
                        fontFamily: "Nunito400",
                        fontSize: 12,
                        color: "#333",
                        marginBottom: 4,
                      }}
                    >
                      {t('storage.selectedMonths', { price: `$${getPlanPrice(2)}` })}
                    </Text>
                  ) : (
                    <Text
                      style={{
                        fontFamily: "Nunito400",
                        fontSize: 12,
                        color: "#333",
                        marginBottom: 4,
                      }}
                    >
                      {t("flix10k.additionalMonths")}
                    </Text>
                  )}

                  <Text
                    style={{
                      fontFamily: "Nunito700",
                      fontSize: 14,
                      color: Colors.black,
                      marginVertical: 4,
                    }}
                  >
                    {(Platform.OS === "android") ? t("flix10k.amountToPay", { amount: amountToPay }) : t("flix10k.amountToPay", { amount: amountToPay })}
                  </Text>

                  <Text
                    style={{
                      fontFamily: "Nunito700",
                      fontSize: 14,
                      color: Colors.black,
                    }}
                  >
                    {(Platform.OS === "android") ? t("flix10k.newExpiry", { date: formatFullDate(newExpiryDate) }) : t("flix10k.newExpiry", { date: formatFullDate(newExpiryDate) })}
                  </Text>
                </View>
              )
            )}

            <View style={{ flexDirection: "row", marginTop: 16 }}>
              <TouchableOpacity
                style={[
                  styles.button,
                  //additionalMonths <= 0 && { backgroundColor: Colors.gray } // make it gray when disabled
                ]}
                onPress={handleUpgradeSubscribtion}
                //disabled={additionalMonths <= 0} // disables the button
              >
                <Text style={styles.buttonText}>{t("flix10k.upgrade")}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, { backgroundColor: Colors.danger, borderWidth: 1, borderColor: Colors.primary }]} onPress={handleUnsubscribe}><Text style={[styles.buttonText, { color: Colors.primary }]}>{t("flix10k.unsubscribe")}</Text></TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

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
                AsyncStorage.removeItem('forAdd');
                await getStoragePlanDetails(user.email, dispatch);
                setTimeout(() => {
                  handleRestart();
                }, 1000);
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
                dispatch(clearOpenStorage2());
                await AsyncStorage.removeItem('closePlans');
                AsyncStorage.removeItem('forAdd');
              }}
            >
              <Text style={styles.filledText}>{t('storage.okIGotIt')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={cancelUnsubscribe}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t("flix10k.unsubscribeWarning")}</Text>
            <Text style={styles.modalMessage}>{t("flix10k.unsubscribeMessage", { days: remainingDays })}</Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={cancelUnsubscribe}>
                <Text style={styles.modalCancelText}>{t("flix10k.unsubscribeCancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmUnsubscribe} activeOpacity={0.8}>
                <LinearGradient
                  colors={["#d63384", "#9b2c6f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.modalConfirmBtn, { paddingHorizontal: 20, }]}
                >
                  <Text style={styles.modalConfirmText}>
                    {String(t("flix10k.unsubscribeConfirm"))}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={upgradeModal}
        transparent
        animationType="fade"
        onRequestClose={cancelUpgradeSubscribtion}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t("flix10k.confirmUpgrade")}</Text>
            <Text style={styles.modalMessage}>{t("flix10k.upgradeMessage")}</Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={cancelUpgradeSubscribtion}>
                <Text style={styles.modalCancelText}>{t("flix10k.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubscribe} activeOpacity={0.8}>
                <LinearGradient
                  colors={["#d63384", "#9b2c6f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.modalConfirmBtn, { paddingHorizontal: 30, }]}
                >
                  <Text style={styles.modalConfirmText}>
                    {String(t("flix10k.upgrade"))}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={successModal}
        transparent
        animationType="fade"
        onRequestClose={cancelUnsubscribe}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t("flix10k.success")}</Text>
            <Text style={styles.modalMessage}>{t("flix10k.autoRenewStatus", { status })}</Text>

            <View style={styles.modalOkRow}>
              <TouchableOpacity
                onPress={() => {
                  if (!autoRenew === (storagePlanAutoRenewal === 1 ? true : false) && !months === calculatedSubscribedMonths) {
                    handleRestart();
                  }
                  setSuccessModal(false);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#d63384", "#9b2c6f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.modalOkBtn, { paddingHorizontal: 20 }]}
                >
                  <Text style={styles.modalConfirmText}>
                    {String(t("flix10k.ok"))}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* <DisableAutoRenewModal visible={showAutoRenewModal} onClose={() => setShowAutoRenewModal(false)} /> */}

      <Snackbar visible={snackbarVisible} message={snackbarMessage} type={snackbarType} onDismiss={() => setSnackbarVisible(false)} />
    </>
  );
};

export default StorageTab;

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 65, marginBottom: 65 },
  profileCardWrapper: { borderRadius: 16, overflow: "hidden", marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3 },
  profileCard: { padding: 20 },
  cardTitle: { fontFamily: "Nunito700", fontSize: 20, color: Colors.primary, marginBottom: 12 },
  price: { fontFamily: "Nunito700", fontSize: 16, color: Colors.textPrimary },
  nextBilling: { fontFamily: "Nunito400", color: Colors.gray, marginBottom: 4 },
  autoRenewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  autoRenewText: { fontFamily: "Nunito600", color: Colors.primary },
  button: { flex: 1, backgroundColor: Colors.primary, padding: 10, borderRadius: 8, marginRight: 8, alignItems: "center" },
  buttonText: { fontFamily: "Nunito700", color: "#fff" },
  lockedContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  lockedText: { fontFamily: "Nunito700", marginTop: 8, color: Colors.gray },
  toggleSwitch: {
    width: 40,
    height: 20,
    borderRadius: 12,
    justifyContent: "center",
    marginLeft: 20,
    padding: 2,
  },
  toggleOn: {
    backgroundColor: "#d63384",
  },

  toggleOff: {
    backgroundColor: "#ccc",
  },

  toggleCircle: {
    width: 15,
    height: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  circleOn: {
    alignSelf: "flex-end",
  },

  circleOff: {
    alignSelf: "flex-start",
  },

  autoRenewText: {
    fontFamily: "Nunito700",
    fontSize: 14,
    color: "#333",
  },
  error: {
    fontFamily: 'Nunito400',
    color: Colors.error,
    marginBottom: 15,
  },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: "center", alignItems: "center" },
  modalContainer: { backgroundColor: '#fdf2f8', padding: 30, paddingTop: 50, borderRadius: 16, width: '80%' },
  modalTitle: { fontFamily: 'Nunito700', fontSize: 20, marginBottom: 30, color: Colors.primary, textAlign: 'center', },
  modalMessage: { fontFamily: 'Nunito400', fontSize: 16, marginBottom: 30, color: Colors.textPrimary, textAlign: 'center' },
  modalBtnRow: { flexDirection: "row", justifyContent: "space-between" },
  modalCancelBtn: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: Colors.primary, marginRight: 8, alignItems: "center" },
  modalCancelText: { fontSize: 15, fontFamily: 'Nunito700', color: Colors.primary },
  modalConfirmBtn: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: Colors.error, marginLeft: 8, alignItems: "center" },
  modalConfirmText: { fontSize: 15, fontFamily: 'Nunito700', color: Colors.white },
  modalOkRow: { justifyContent: "center" },
  modalOkBtn: { padding: 12, borderRadius: 12, backgroundColor: Colors.primary, marginHorizontal: '35%', alignItems: "center" },
  modalContainerStatus: {
    width: "90%",
    backgroundColor: "#fff",
    borderWidth: 3,
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: "Nunito700",
    marginBottom: 10,
    color: Colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    marginTop: 10,
    fontFamily: "Nunito400",
    color: "#444",
    textAlign: "center",
  },
  subtitleFailed: {
    fontSize: 15,
    marginTop: 10,
    marginBottom: 20,
    fontFamily: "Nunito400",
    color: "#b00020",
    textAlign: "center",
  },
  filledButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  filledText: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "Nunito400",
    fontSize: 14,
  },
});
