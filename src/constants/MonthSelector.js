import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

const MonthSelector = ({ months, setMonths, autoRenew, mode = "dropdown" }) => {

  console.log('months, setMonths, autoRenew, mode', months, autoRenew, mode)
  const { subscriptionExpired, subscription } = useSelector((state) => state.auth);
  const [showDropdown, setShowDropdown] = useState(false);
  const { t } = useTranslation();

  let options = [];
  if (Platform.OS === "android") {
    options = [1, 3, 6, 9, 12];
  } else {
    options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }

  const increase = () => setMonths((prev) => (prev ? prev + 1 : 1));

  // const decrease = () =>
  //   setMonths((prev) => {
  //     return prev > subscription.subscribedMonths ? prev - 1 : prev;
  //   });

  const decrease = () =>
    setMonths((prev) => {
      if (subscriptionExpired) {
        return prev > 1 ? prev - 1 : 1;
      }
      return prev > subscription.subscribedMonths ? prev - 1 : prev;
    });

  return (
    <View>
      {mode === "dropdown" ? (
        <>
          <TouchableOpacity
            style={styles.dropdownBox}
            onPress={() => !autoRenew && setShowDropdown(true)}
            activeOpacity={0.7}
          >
            <TextInput
              style={[styles.dropdownInput, autoRenew && styles.disabledInput]}
              placeholder={t("flix10k.selectMonths")}
              value={
                months
                  ? `${months} ${months === 1 ? t("flix10k.month") : t("flix10k.months")
                  }`
                  : ""
              }
              editable={false}
              pointerEvents="none"
            />
            <Ionicons
              name="chevron-down"
              size={20}
              color={autoRenew ? "#aaa" : "#333"}
              style={styles.dropdownIcon}
            />
          </TouchableOpacity>

          <Modal
            visible={showDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDropdown(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDropdown(false)}
            >
              {/* <View style={styles.dropdownList}>
                {options.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setMonths(opt);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>
                      {opt}{" "}
                      {opt === 1 ? t("flix10k.month") : t("flix10k.months")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View> */}
               <View style={styles.dropdownList}>
                {options
                  .filter((opt) => opt >= (subscription?.subscribedMonths || 0)) // 👈 show only values greater than current
                  .map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setMonths(opt);
                        setShowDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownText}>
                        {opt} {opt === 1 ? t("flix10k.month") : t("flix10k.months")}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </>
      ) : (
        <TouchableOpacity
          activeOpacity={1}
          disabled={!!autoRenew}
          style={[styles.counterBox, autoRenew && styles.disabledBox]}
        >
          <TextInput
            style={styles.counterInput}
            value={months?.toString() || ""}
            editable={!autoRenew}
            keyboardType="numeric"
            onChangeText={(val) => {
              const num = parseInt(val, 10);
              if (!isNaN(num)) {
                if (subscriptionExpired) {
                  setMonths(num < 1 ? 1 : num);
                } else {
                  setMonths(num < subscription.subscribedMonths ? subscription.subscribedMonths : num);
                }
              } else if (val === "") {
                setMonths("");
              }
            }}

            // onBlur={() => {
            //   if (!months || months < subscription.subscribedMonths) {
            //     setMonths(subscription.subscribedMonths);
            //   }
            // }}
            onBlur={() => {
              if (subscriptionExpired) {
                if (!months || months < 1) setMonths(1);
              } else {
                if (!months || months < subscription.subscribedMonths) {
                  setMonths(subscription.subscribedMonths);
                }
              }
            }}
          />

          <View style={styles.rightSide}>
            <View style={styles.counterButtons}>
              <TouchableOpacity onPress={increase} disabled={!!autoRenew} style={styles.counterBtn}>
                <Ionicons name="chevron-up" size={16} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity onPress={decrease} disabled={!!autoRenew} style={styles.counterBtn}>
                <Ionicons name="chevron-down" size={16} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.monthsLabel}>
              {months === "1" || months === 1 ? "month" : "months"}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 45,
    width: "100%",
    backgroundColor: "#fff",
  },
  dropdownInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontFamily: "Nunito700",
  },
  dropdownIcon: {
    marginLeft: 6,
  },
  disabledInput: {
    backgroundColor: "#f0f0f0",
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: 200,
    paddingVertical: 8,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: "Nunito700",
    color: "#333",
  },
  counterBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    height: 45,
    //backgroundColor: "#fff",
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  counterInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Nunito700",
    textAlign: "left",
    color: "#333",
  },
  rightSide: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterButtons: {
    flexDirection: "column",
    marginRight: 6,
  },
  counterBtn: {
    padding: 2,
  },
  monthsLabel: {
    fontSize: 16,
    fontFamily: "Nunito700",
    color: "#333",
  },
  disabledBox: {
    opacity: 0.5,
  },
});

export default MonthSelector;
