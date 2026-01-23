import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import Colors from "../constants/Colors"; // adjust path as needed
import { useTranslation } from "react-i18next";

const PaymentStatusModal = ({
  visibleSuccess,
  visibleFailure,
  onClose,
  subscriptionAmount,
  subscriptionIsActive,
}) => {
  const { t } = useTranslation();

  const handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      console.error("Failed to reload app:", e);
    }
  };

  const handlePaymentClose = async (type) => {
    if (type === "success") {
      await AsyncStorage.removeItem("flix10k_payment_status");
      await AsyncStorage.removeItem("flix10kPaymentForAdd");
      onClose("success");
      handleRestart();
    } else if (type === "failure") {
      await AsyncStorage.removeItem("flix10k_payment_status");
      await AsyncStorage.removeItem("flix10kPaymentForAdd");
      onClose("failure");
    }
  };

  return (
    <>
      {/* ✅ Payment Success Modal */}
      <Modal
        visible={visibleSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => handlePaymentClose("success")}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainerStatus, { borderColor: "green" }]}>
            <Text style={[styles.title, { color: "green" }]}>
              {t("storage.paymentSuccess")}
            </Text>

            {subscriptionAmount !== "" && subscriptionAmount !== null && subscriptionIsActive ? (
              <Text style={styles.subtitle}>{t("flix10k.upgradeSuccess")}</Text>
            ) : (
              <Text style={styles.subtitle}>{t("flix10k.subscriptionSuccess")}</Text>
            )}

            <TouchableOpacity
              style={[styles.filledButton, { paddingHorizontal: 20 }]}
              onPress={() => handlePaymentClose("success")}
            >
              <Text style={styles.filledText}>{t("storage.okGotIt")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ❌ Payment Failure Modal */}
      <Modal
        visible={visibleFailure}
        transparent
        animationType="fade"
        onRequestClose={() => handlePaymentClose("failure")}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainerStatus, { borderColor: Colors.error }]}>
            <Text style={[styles.title, { color: Colors.error }]}>
              {t("storage.paymentFailed")}
            </Text>
            <Text style={styles.subtitleFailed}>{t("storage.paymentError")}</Text>

            <TouchableOpacity
              style={[styles.filledButton, { paddingHorizontal: 20 }]}
              onPress={() => handlePaymentClose("failure")}
            >
              <Text style={styles.filledText}>{t("storage.okIGotIt")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
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

export default PaymentStatusModal;