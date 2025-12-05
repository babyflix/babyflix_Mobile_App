import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Platform,
  FlatList,
  Pressable,
  ScrollView,
  Dimensions,
  PanResponder,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { EXPO_PUBLIC_API_URL } from "@env";
import Colors from "../constants/Colors";
import Snackbar from "../components/Snackbar";
import { useDynamicTranslate } from "../constants/useDynamicTranslate";
import GlobalStyles from "../styles/GlobalStyles";
import { useTranslation } from "react-i18next";
import i18n from "./i18n";
import { useSelector } from "react-redux";
import sendDeviceUserInfo, { USERACTIONS } from "../components/deviceInfo";

const PhoneNumberModal = ({ visible, onClose, userEmail, data, setRefreshData }) => {
  const { t } = useTranslation();

  const PAGE_WIDTH = Dimensions.get("window").width * 1; 

  const [currentPage, setCurrentPage] = useState(0); // 0 = Phone, 1 = DOB

  // phone states (unchanged)
  const [phone, setPhone] = useState("");
  const [phoneNoAPI, setPhoneNoAPI] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [countries, setCountries] = useState([]);
  const [FormattedCountries, setFormattedCountries] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // messages
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");

  // DOB states
  const [dob, setDob] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [dateField, setDateField] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorMessageDates, setErrorMessageDates] = useState('');

  const [showPhonePageOnly, setShowPhonePageOnly] = useState(false);
  const [showDatePageOnly, setShowDatePageOnly] = useState(false);
  const [showBothPages, setShowBothPages] = useState(false);


  const user = useSelector((state) => state.auth);

   const hasPhone = !!data?.phone;
  const hasDates = !!data?.dob && !!data?.dueDate;

useEffect(() => {

  if (!hasPhone && hasDates) {
    // ONLY date missing → show DATE PAGE ONLY
    setShowPhonePageOnly(true);
    setShowDatePageOnly(false);
    setShowBothPages(false);
    setCurrentPage(0);
  } 
  
  else if (hasPhone && !hasDates) {
    // ONLY phone missing → show PHONE PAGE ONLY
    setShowPhonePageOnly(false);
    setShowDatePageOnly(true);
    setShowBothPages(false);
    setCurrentPage(1);
  }

  else if (!hasPhone && !hasDates) {
    // BOTH missing → allow 2-page swipe
    setShowPhonePageOnly(false);
    setShowDatePageOnly(false);
    setShowBothPages(true);
    setCurrentPage(0);
  }

  else {
    // everything filled → don't show modal
    onClose();
  }
}, [data]);

// If only one page should show → lock current page
// useEffect(() => {
//   if (showDatePageOnly) {
//     setCurrentPage(1);
//   } else if (showPhonePageOnly) {
//     setCurrentPage(0);
//   }
// }, [showDatePageOnly, showPhonePageOnly]);


  // ---------------------------------------------
  // SWIPE HANDLING
  // ---------------------------------------------
  const panResponder = useRef(
  PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => {
      if (!showBothPages) return false;   // disable swipe
      return Math.abs(gesture.dx) > 20;
    },

    onPanResponderRelease: (_, gesture) => {
      if (!showBothPages) return; // disable swipe

      if (gesture.dx < -40 && currentPage === 0) setCurrentPage(1);
      if (gesture.dx > 40 && currentPage === 1) setCurrentPage(0);
    },
  })
).current;

  // ---------------------------------------------
  // FETCH COUNTRIES (unchanged)
  // ---------------------------------------------
  useEffect(() => {
    let mounted = true;
    axios
      .get(`${EXPO_PUBLIC_API_URL}/api/locations/getAllCountries`)
      .then((res) => mounted && setCountries(res.data))
      .catch(() => {});

    return () => (mounted = false);
  }, []);

  useEffect(() => {
    if (!countries.length) return;
    let mounted = true;

    const format = async () => {
      const list = await Promise.all(
        countries.map(async (c) => ({
          label: `+${c.phonecode} ${await useDynamicTranslate(c.country_name)}`,
          value: `${c.phonecode}_${c.country_name}`,
        }))
      );

      if (mounted) setFormattedCountries(list);
    };
    format();

    return () => (mounted = false);
  }, [countries]);

  // ---------------------------------------------
  // PHONE FORMATTER
  // ---------------------------------------------
    // Phone number formatter ---------------------------------------
 const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length < 4) {
      return cleaned;
    } else if (cleaned.length < 7) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (text) => {
    setPhone(formatPhoneNumber(text));
    setPhoneNoAPI(text);
  };

  // ---------------------------------------------
  // SEND PHONE API → AUTO SCROLL
  // ---------------------------------------------

   const handleSaveChanges = async (mode) => {

     if (mode === "date") {
    if (!dueDate) {
      setErrorMessageDates(t("profileSettings.snackbar.pleaseSelectDueDate"));
      return;
    }

    if (!dob) {
      setErrorMessageDates(t("profileSettings.snackbar.pleaseSelectDob"));
      return;
    }

    // Due Date cannot be in past
    const today = new Date();
    if (dueDate) {
      const [d, m, y] = dueDate.split("/");
      const formatted = new Date(`${y}-${m}-${d}`);
      if (formatted < today) {
        setErrorMessageDates(t("profileSettings.snackbar.dueDateCannotBePast"));
        return;
      }
    }

    // DOB cannot be in future
    if (dob) {
      const [d, m, y] = dob.split("/");
      const formatted = new Date(`${y}-${m}-${d}`);
      if (formatted > today) {
        setErrorMessageDates(t("profileSettings.snackbar.birthDateCannotBeFuture"));
        return;
      }
    }
  }

  if (mode === "phone") {
    if (!phone) {
      setErrorMessage(t("phoneDobModal.errors.enterPhone"));
      return;
    }
    if (!countryCode) {
      setErrorMessage(t("phoneDobModal.errors.selectCountryCode"));
      return;
    }
  }

  setLoading(true);

    try {
        const res = await axios.get(`${EXPO_PUBLIC_API_URL}/api/patients/getPatientByEmail`, {
          params: { email: user.email },
          headers: { 'Content-Type': 'application/json' }
        });

      const result = res.data;

      console.log("getPatientByEmail Result",result);

      const response = await axios.put(`${EXPO_PUBLIC_API_URL}/api/patients/update`,
        {
          firstName: result.firstname,
          lastName: result.lastname,
          email: user.email,
          phone: result.phone || phoneNoAPI.replace(/\D/g, ""),
          countryCode: result.countryCode || countryCode.split("_")[0],
          dueDate: result.dueDate || dueDate,
          dob: result.dob || dob,
          companyId: result.companyId,
          locationId: result.locationId,
          machineId: result.machineId,
          userGroups: result.userGroups,
          spouseFirstName: result.spouseFirstName,
          babyName: result.babyName,
          babySex: result.babySex,
          uuid: result.uuid
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      console.log("Update Api result",response.data)

      if (response.status === 200) {
      // SUCCESS MESSAGES BASED ON MODE
      setErrorMessage('');
      setErrorMessageDates('');
      if (mode === "phone") {
        setSnackbarMessage(t("phoneDobModal.snackbar.phoneUpdated"));
      } else if (mode === "date") {
        setSnackbarMessage(t("phoneDobModal.snackbar.datesUpdated"));
      }

      setSnackbarType("success");
      setSnackbarVisible(true);

      sendDeviceUserInfo({
        action_type: USERACTIONS.EDIT,
        action_description:
          mode === "phone"
            ? "User updated phone No successfully"
            : "User updated DOB and DueDate successfully",
      });
    if (mode === "phone") {
      if (!hasDates) {
        // after saving phone → move to dates page
        setCurrentPage(1);
        setShowDatePageOnly(true);
        setShowBothPages(false);
        setRefreshData(prev => !prev);
      } else {
        onClose();
      }
    }

    if (mode === "date") {
      if (!hasPhone) {
        // after saving dates → move to phone page
        setErrorMessage(t("phoneModal.errors.phoneRequiredShort"));
        setCurrentPage(0);
        setShowPhonePageOnly(true);
        setShowBothPages(false);
        setRefreshData(prev => !prev);
      } else {
        onClose();
      }
    }

    }
  } catch (error) {
    // ERROR MESSAGES BASED ON MODE
    if (mode === "phone") {
      setSnackbarMessage(t("phoneDobModal.errors.updatePhoneFailed"));
      setErrorMessage(t("phoneDobModal.errors.updatePhoneFailed"));
    } else {
      setSnackbarMessage(t("phoneDobModal.errors.updateDatesFailed"));
      setErrorMessageDates(t("phoneDobModal.errors.updateDatesFailed"));
      console.log("Error in dates", error);
    }

    setSnackbarType("error");
    setSnackbarVisible(true);

    await logError({
      error: error,
      data: error.response?.data.error,
      details:
        mode === "phone"
          ? "Error updating phone number"
          : "Error updating date fields",
    });
  } finally {
    setLoading(false);
  }
};

const handleSkip = () => {
  if (!hasPhone) {
    setCurrentPage(0);
    setErrorMessage(t("phoneModal.errors.phoneRequiredLong"));
  } else {
    onClose();
  }
};

  // ---------------------------------------------
  // DATE PICKER
  // ---------------------------------------------

   const formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const formattedMonth = month < 10 ? `0${month}` : month;
    const formattedDay = day < 10 ? `0${day}` : day;
    return `${formattedMonth}/${formattedDay}/${year}`;
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || tempDate;
    setShowDatePicker(false);
    const formattedDate = formatDate(currentDate);
    if (dateField === 'dob') {
      setTempDate(currentDate);
      setDob(formattedDate);
    } else if (dateField === 'dueDate') {
      setDueDate(formattedDate);
    }
  };

  const handleLater = async () => {
    if (showPhonePageOnly) {
      onClose();
    } else {
    setCurrentPage(1);
    }
  }

  // ---------------------------------------------
  // PAGE UI SELECTION
  // ---------------------------------------------
  const renderPage = () => {
    if (showPhonePageOnly) return renderPhonePage();
    if (showDatePageOnly) return renderDOBPage();

    return currentPage === 0 ? renderPhonePage() : renderDOBPage();
  };

  // ---------------------------------------------
  // PHONE PAGE
  // ---------------------------------------------
  const renderPhonePage = () => (
    <View style={styles.modalBox}>
      <Text style={styles.title}>{t("phoneDobModal.titles.phone")}</Text>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.phoneRow}>
        <TouchableOpacity
          style={styles.countryBox}
          onPress={() => setShowDropdown(true)}
        >
          <Text style={[styles.countryCodeText, { color: countryCode ? "black" : "#777" }]}>
            {countryCode ? `+${countryCode.split("_")[0]}` : "+ 1"}
          </Text>

          <Icon name="keyboard-arrow-down" size={20} color={Colors.gray} style={styles.arrowIcon} />
        </TouchableOpacity>

        <View style={styles.phoneInputWrapper}>
          <Icon name="phone" size={20} color={Colors.gray} style={styles.phoneIcon} />
          <TextInput
            style={styles.phoneInput}
            placeholder={t("phoneDobModal.placeholders.phone")}
            placeholderTextColor="#777"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={handlePhoneChange}
          />
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>{t("phoneDobModal.info.phone")}</Text>
      </View>

      <View style={styles.buttonRow}>
        {/* <TouchableOpacity style={[styles.button, styles.skip]} onPress={() => handleLater()}>
          <Text style={styles.buttonText}>{t("phoneDobModal.buttons.later")}</Text>
        </TouchableOpacity> */}

        <TouchableOpacity onPress={() => handleSaveChanges("phone")} disabled={loading}>
          <LinearGradient colors={["#d63384", "#9b2c6f"]} style={[styles.button, styles.sendBtn]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, { color: "#fff" }]}>{t("phoneDobModal.buttons.save")}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>

                {/* COUNTRY DROPDOWN */}
          <Modal visible={showDropdown} transparent animationType="fade">
            <Pressable
              style={styles.dropdownOverlay}
              onPress={() => setShowDropdown(false)}
            >
              <View style={styles.dropdownBox}>
                <FlatList
                  data={FormattedCountries}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setCountryCode(item.value);
                        setShowDropdown(false);
                      }}
                      style={styles.countryItem}
                    >
                      <Text style={styles.countryItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </Pressable>
          </Modal>
    </View>
  );

  // ---------------------------------------------
  // DOB PAGE
  // ---------------------------------------------
  const renderDOBPage = () => (
    <View style={{ width: PAGE_WIDTH, alignItems: "center" }}>
    <View style={styles.modalBox}>
      <Text style={styles.title}>{t("phoneDobModal.titles.dob")}</Text>

      {errorMessageDates ? <Text style={styles.errorText}>{errorMessageDates}</Text> : null}

      {/* EXACT DESIGN YOU GAVE */}
      <View style={[GlobalStyles.row, { marginBottom: 0 }]}>
        {/* DOB */}
        <View style={{ flex: 1, marginRight: 5 }}>
          <View style={styles.inputRow}>
            <Icon name="calendar-today" size={20} color={Colors.gray} style={styles.leftIcon} />

            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => {
                setDateField("dob");
                setTempDate(new Date());
                setShowDatePicker(true);
              }}
            >
              <Text
                style={[
                  styles.textInput,
                  { color: dob ? "black" : "gray" },
                ]}
              >
                {dob || t("phoneDobModal.placeholders.dob")}
              </Text>
            </TouchableOpacity>

            <View style={styles.rightIconPlaceholder} />
          </View>
        </View>

        {/* Due Date */}
        <View style={{ flex: 1, marginLeft: 5 }}>
          <View style={styles.inputRow}>
            <Icon name="calendar-today" size={20} color={Colors.gray} style={styles.leftIcon} />

            <TouchableOpacity
              style={{ flex: 1, justifyContent:'center' }}
              onPress={() => {
                setDateField("dueDate");
                setTempDate(new Date());
                setShowDatePicker(true);
              }}
            >
              <Text
                style={[
                  styles.textInput,
                  { color: dueDate ? "black" : "gray" },
                ]}
              >
                {dueDate || t("phoneDobModal.placeholders.dueDate")}
              </Text>
            </TouchableOpacity>

            <View style={styles.rightIconPlaceholder} />
          </View>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>{t("phoneDobModal.info.dob")}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.skip]} onPress={() => handleSkip()}>
          <Text style={styles.buttonText}>{t("phoneDobModal.buttons.skip")}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleSaveChanges("date")}>
          <LinearGradient colors={["#d63384", "#9b2c6f"]} style={[styles.button, styles.sendBtn]}>
            <Text style={[styles.buttonText, { color: "#fff" }]}>{t("phoneDobModal.buttons.save")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
    </View>
  );

  // ---------------------------------------------
  // MAIN RETURN
  // ---------------------------------------------
  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay} {...panResponder.panHandlers}>

          {/* TOP BUTTONS */}
          {showBothPages && (
          <View style={styles.topNav}>
            {currentPage > 0 ? (
              <TouchableOpacity onPress={() => setCurrentPage(0)}>
                <Text style={styles.topBtn}>{t("phoneDobModal.buttons.previous")}</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            {currentPage < 1 ? (
              <TouchableOpacity onPress={() => setCurrentPage(1)}>
                <Text style={styles.topBtn}>{t("phoneDobModal.buttons.next")}</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
          </View>
          )}

          {/* Only ONE PAGE SHOWN */}
          {renderPage()}

          {/* DOTS */}
          {showBothPages && (
          <View style={styles.dotsRow}>
            {[0, 1].map((i) => (
              <View
                key={i}
                style={[styles.dot, currentPage === i && styles.activeDot]}
              />
            ))}
          </View>
          )}

           {/* Date pickers */}
              {Platform.OS === 'ios' ? (
                showDatePicker && (
                  <View style={styles.iosPickerWrapper}>
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) setTempDate(selectedDate);
                      }}
                      style={styles.iosPicker}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        handleDateChange(null, tempDate);
                        setShowDatePicker(false);
                      }}
                      style={styles.doneButton}
                    >
                      <Text style={styles.doneText}>{t('registration.done')}</Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                showDatePicker && (
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    locale={i18n.language === 'es' ? 'es-ES' : 'en-US'}
                  />
                )
              )}
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

export default PhoneNumberModal;


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "87%",
    backgroundColor: "#fdf2f8",
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontFamily: "Nunito700",
    color: "#d63384",
    textAlign: "center",
    marginBottom: 20,
  },

   errorText: {
    color: 'red',
    marginBottom: 10,
    fontFamily: 'Nunito400',
  },

  /* COUNTRY + PHONE ROW */
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  /* COUNTRY BOX — UPDATED → 30% WIDTH */
 countryBox: {
    width: "23%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    position: "relative",
 },

  countryCodeText: {
    fontFamily: "Nunito600",
    fontSize: 15,
  },

  arrowIcon: {
    position: "absolute",
    right: 8,
    top: "100%",
    transform: [{ translateY: -10 }],
  },

  /* PHONE INPUT WRAPPER WITH ICON */
  phoneInputWrapper: {
    width: "74%", 
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  phoneIcon: {
    marginRight: 6,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Nunito600",
    color: "#000",
  },

  infoBox: {
    backgroundColor: "#fff8dc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#ffd700",
  },
  infoText: {
    fontFamily: "Nunito400",
    fontSize: 13,
    color: "#333",
    textAlign: "center",
    lineHeight: 18,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  button: {
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
  },
  skip: {
    backgroundColor: "#e5e5e5",
  },
  sendBtn: {
    width: 120,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Nunito700",
  },

  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  dropdownBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    maxHeight: 300,
    maxWidth: 250,
    padding: 10,
    margin: 20,
    marginTop: 250
  },
  countryItem: {
    paddingVertical: 12,
  },
  countryItemText: {
    fontFamily: "Nunito400",
    fontSize: 15,
  },
  topNav: {
  width: "88%",
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 70,
  paddingHorizontal: 10,
},
topBtn: {
  color: "#fff",
  fontSize: 16,
  fontFamily: "Nunito700",
},

dotsRow: {
  flexDirection: "row",
  marginTop: 70,
},
dot: {
  width: 8,
  height: 8,
  marginHorizontal: 4,
  borderRadius: 4,
  backgroundColor: "#aaa",
},
activeDot: {
  backgroundColor: "#d63384",
},

  iosPickerWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -100 }],
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    zIndex: 99999,
  },

  iosPicker: { width: '100%', height: 150 },

  doneButton: {
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },

  doneText: {
    color: '#007AFF',
    fontFamily: 'Nunito700',
    fontSize: 16,
  },
   inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 12,
      backgroundColor: Colors.white,
      height: 50,
      paddingHorizontal: 12, // overall horizontal padding
      marginBottom: 15,
    },
  
    // icon left placed 8px from left border (achieved by paddingHorizontal + explicit margin)
    leftIcon: {
      marginLeft: 0, // requested 8px from left border
      marginRight: 8, // gap between icon and text = 8px
    },
  
    // text input placed immediately after left icon gap
    textInput: {
      marginBottom: 2,
      fontFamily: 'Nunito400',
      fontSize: 15,
      color: Colors.textSecondary,
    },
  
    // right icon flush toward right; we use negative margin to nudge to edge, and placeholder keeps 4px right padding
    rightIcon: {
      marginLeft: 0,
      marginRight: -6,
      padding: 2,
      zIndex: 2,
    },
  
    // placeholder box to keep spacing when no right icon
    rightIconPlaceholder: { width: 10 },
});