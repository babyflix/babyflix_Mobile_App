import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Switch, StyleSheet, ScrollView, Modal, Alert, Linking, Platform } from "react-native";
import { useSelector } from "react-redux";
import Colors from "../constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MonthSelector from "../constants/MonthSelector";
import * as WebBrowser from 'expo-web-browser';
import axios from "axios";
import { useTranslation } from "react-i18next";
import * as Updates from 'expo-updates';
import { useFocusEffect } from "expo-router";
import Snackbar from "../components/Snackbar";
import sendDeviceUserInfo, { USERACTIONS } from "../components/deviceInfo";
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLOUD_API_URL } from '@env';
import AsyncStorage from "@react-native-async-storage/async-storage";

const ManageSubscriptions = () => {
  const user = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const { subscriptionAmount, subscriptionId, subscriptionIsActive, subscriptionExpired, subscription } = useSelector(
    (state) => state.auth
  );
  const subscriptionActive = subscriptionIsActive
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [autoRenew, setAutoRenew] = useState(subscription ? subscription.autoRenewal === 1 : false);
  const [months, setMonths] = useState(() =>
    subscriptionExpired ? 1 : subscription?.subscribedMonths || 0
  );
  const [showAutoRenewMsg, setShowAutoRenewMsg] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('success');
  const [error, setError] = useState('');

  useEffect(() => {
    if (subscriptionExpired) {
      setError('Subscription Expired');
      return;
    }
  }, [subscriptionExpired])

  const handleUnsubscribe = () => {
    setShowModal(true);
  };

  const handleUpgradeSubscribtion = () => {
    setUpgradeModal(true);
  };


  const handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      console.error("Failed to reload app:", e);
    }
  };

  const confirmUnsubscribe = async () => {
    try {
      const payload = {
        uuid: user.uuid,
        subscriptionId: subscriptionId,
      };

      const response = await axios.post(
        `${EXPO_PUBLIC_API_URL}/api/subscription/unsubscribe`,
        payload
      );

      if (response.status === 200) {
        console.log("Unsubscribe response:", response.data);

        setSnackbarMessage(t("flix10k.unsubscribeSuccess"));
        setSnackbarType('success');
        setSnackbarVisible(true);

        setIsUnsubscribed(true);
        setShowModal(false);
        sendDeviceUserInfo({
          action_type: USERACTIONS.UNSUBSCRIBE,
          action_description: `User Unsubscribe Flox10K plan`,
        });

        setTimeout(async () => {
          handleRestart();
        }, 3000);
      } else {
        console.log("Error", "Failed to unsubscribe. Please try again.");
      }
    } catch (error) {
      console.error("Unsubscribe error:", error);
      setSnackbarMessage(t("flix10k.unsubscribeError"));
      setSnackbarType('error');
      setSnackbarVisible(true);
    }
  };

  const cancelUnsubscribe = () => {
    setShowModal(false);
  };

  const cancelUpgradeSubscribtion = () => {
    setUpgradeModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const expiryDate = new Date(subscription.expiryDate);
  const today = new Date();

  const diffTime = expiryDate - today;

  const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  console.log(`Remaining days: ${remainingDays > 0 ? remainingDays : 0}`);

  const handleSubscribe = async () => {
    await AsyncStorage.setItem('flix10KPaying', 'true');
    setUpgradeModal(false);
    try {
      const payload = {
        subscriptionId: 1,
        autoRenewal: autoRenew,
        subscribedMonths: months,
        platform: Platform.OS,
      };

      console.log("Subscription Payload:", payload);

      const response = await axios.post(
        `${EXPO_PUBLIC_API_URL}/api/subscription/create-checkout-session-subscription-app`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Subscription Response:", response.data);

      const sessionData = response.data;

      if (sessionData.success && sessionData.message) {
        setSnackbarMessage(t("flix10k.autoRenewalStatus", { status: autoRenew ? "enabled" : "disabled" }));
        setSnackbarType('success');
        setSnackbarVisible(true);
        setSuccessModal(true);
        return;
      }

      if (!sessionData.sessionId) throw new Error("No session ID returned");

      const stripeUrl = sessionData.sessionUrl;

      //const result = await WebBrowser.openAuthSessionAsync(stripeUrl, "babyflix://");
      let result;

      if (Platform.OS === 'ios') {
        await Linking.openURL(stripeUrl);
        // const result = await WebBrowser.openAuthSessionAsync(
        //   stripeUrl, // Stripe checkout URL
        //   "babyflix://payment/redirect"
        // );
      } else {
        // Android (or fallback): use WebBrowser
        result = await WebBrowser.openAuthSessionAsync(
          stripeUrl,
          "babyflix://"
        );
      }

      await WebBrowser.dismissBrowser();
      
      if (result?.type === 'success') {
        console.log("Payment success");
        setShowModal(false);
      } else if (result?.type === 'cancel') {
        console.log("Payment canceled or failed");
        setShowModal(false);
      }

      setShowModal(false);
    } catch (error) {
      console.error("Subscription error:", error.response?.data || error.message);
    }
  };

  const expiryDateCal = new Date(subscription.expiryDate);
  const todayCal = new Date();

  const allowDate = new Date(expiryDateCal);
  allowDate.setDate(expiryDateCal.getDate() - 15);

  const formatFullDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const canUpdateAutoRenew =
    subscription.subscriptionExpired || todayCal >= allowDate;

  const handleAutoRenewPress = () => {
    if (!canUpdateAutoRenew && !subscription.subscriptionExpired) {
      setShowAutoRenewMsg(true);
      return;
    }
    setAutoRenew(!autoRenew);
  };

  // Calculate additional months
  // const additionalMonths =
  //   months > subscription.subscribedMonths
  //     ? months - subscription.subscribedMonths
  //     : 0;

  const additionalMonths = subscriptionExpired
    ? (months >= 1 ? months : 0)
    : (months > subscription.subscribedMonths
      ? months - subscription.subscribedMonths
      : 0);

  console.log('additionalMonths', additionalMonths)

  const amountToPay = (additionalMonths * subscriptionAmount).toFixed(2);

  // Calculate new expiry date
  // const newExpiryDate = new Date(subscription.expiryDate);
  // if (additionalMonths > 0) {
  //   newExpiryDate.setMonth(newExpiryDate.getMonth() + additionalMonths);
  // }
  let newExpiryDate;

  if (subscriptionExpired) {
    newExpiryDate = new Date();
    if (months > 0) {
      newExpiryDate.setMonth(newExpiryDate.getMonth() + months);
    }
  } else {
    newExpiryDate = new Date(subscription.expiryDate);
    if (additionalMonths > 0) {
      newExpiryDate.setMonth(newExpiryDate.getMonth() + additionalMonths);
      console.log('newExpiryDate.', additionalMonths)
    }
  }


  const status = autoRenew ? "enabled" : "disabled";

  useFocusEffect(
    useCallback(() => {
      return () => {
        setShowAutoRenewMsg(false);
        setMonths(subscriptionExpired ? 1 : subscription?.subscribedMonths || 1);
      }
    }, [])
  );


  if (!subscriptionActive && !subscriptionId && !subscriptionAmount) {
    return (
      <View style={styles.lockedContainer}>
        <MaterialCommunityIcons name="lock" size={40} color={Colors.gray} />
        <Text style={styles.lockedText}>
          {isUnsubscribed ? t("flix10k.unsubscribed") : t("flix10k.subscriptionNotActive")}
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileCardWrapper}>
          <LinearGradient
            colors={['rgb(252, 231, 243)', 'rgb(243, 232, 255)', 'rgb(224, 242, 254)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCard}
          >
            <Text style={styles.cardTitle}>{t("flix10k.title")}</Text>
            <Text style={styles.price}>${subscriptionAmount} / {t("flix10k.month")}</Text>
            <Text style={styles.nextBilling}>{t("flix10k.nextBilling")}: {formatDate(subscription.expiryDate)}</Text>
            {/* <View style={styles.line} /> */}

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

            <MonthSelector months={months} setMonths={setMonths} autoRenew={autoRenew} mode="counter" />

            {additionalMonths > 0 && (
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
            )}

            <View style={styles.btnRow}>
              <TouchableOpacity onPress={handleUpgradeSubscribtion} activeOpacity={0.8}>
                <LinearGradient
                  colors={["#d63384", "#9b2c6f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upgradeBtn}
                >
                  <Text style={styles.upgradeText}>
                    {t("flix10k.upgradeSubscription")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.unsubscribeBtn} onPress={handleUnsubscribe} >
                <Text style={styles.unsubscribeText}>{t("flix10k.unsubscribe")}</Text>
              </TouchableOpacity>
            </View>

          </LinearGradient>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("flix10k.whyTitle")}</Text>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="star-four-points" size={20} color={Colors.primary} style={styles.icon} />
            <Text style={styles.infoText}>{t("flix10k.reason1")}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="heart" size={20} color={Colors.primary} style={styles.icon} />
            <Text style={styles.infoText}>{t("flix10k.reason2")}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="camera" size={20} color={Colors.primary} style={styles.icon} />
            <Text style={styles.infoText}>{t("flix10k.reason3")}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="image-multiple" size={20} color={Colors.primary} style={styles.icon} />
            <Text style={styles.infoText}>{t("flix10k.reason4")}</Text>
          </View>
        </View>
      </ScrollView>

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
                  if(!autoRenew === (subscription.autoRenewal === 1 ? true : false) && !months === subscription?.subscribedMonths){
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

      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </>
  );
};

export default ManageSubscriptions;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 65,
    marginBottom: 65,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    paddingBottom: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: 'Nunito700',
    fontSize: 20,
    //fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 12,
  },
  profileCardWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },

  profileCard: {
    padding: 20,
    //alignItems: "center",
  },
  price: {
    fontFamily: 'Nunito700',
    fontSize: 16,
    //fontWeight: "bold",
    color: Colors.textPrimary,
  },
  nextBilling: {
    fontFamily: 'Nunito400',
    color: Colors.gray,
    marginBottom: 15,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.lightGray,
    marginBottom: 8,
    marginLeft: -10,
    marginRight: -10,
  },
  error: {
    fontFamily: 'Nunito400',
    color: Colors.error,
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  autoRenew: {
    fontFamily: 'Nunito700',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  input: {
    fontFamily: 'Nunito400',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  btnRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: 'space-between',
  },
  upgradeBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 12,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginRight: 8,
    alignItems: "center",
    justifyContent: 'center',
  },
  upgradeText: {
    fontSize: 15,
    fontFamily: 'Nunito700',
    color: Colors.white,
    //fontWeight: "bold",
  },
  unsubscribeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: 12,
    borderRadius: 16,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: 'center',
  },
  unsubscribeText: {
    fontSize: 15,
    fontFamily: 'Nunito700',
    color: Colors.error,
    //fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Nunito400',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  lockedText: {
    fontFamily: 'Nunito700',
    marginTop: 8,
    color: Colors.gray,
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

  autoRenewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },

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
});
