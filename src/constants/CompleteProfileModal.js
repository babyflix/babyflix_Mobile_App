import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Pressable,
} from "react-native";

import axios from "axios";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import { useDispatch, useSelector } from "react-redux";
import { EXPO_PUBLIC_API_URL } from "@env";
import { setCredentials } from "../state/slices/authSlice";

const CompleteProfileModal = ({ visible, onClose, onSkip, }) => {
  const user = useSelector((state) => state.auth);

  // =========================
  // STATES
  // =========================
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingCountries, setLoadingCountries] =
    useState(false);

  const [countries, setCountries] = useState([]);
  const [showCountries, setShowCountries] =
    useState(false);

  const [userData, setUserData] = useState(null);

  const [skipLeft, setSkipLeft] = useState(3);

  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] =
    useState("1");
  const [countryName, setCountryName] =
    useState("United States");

  const [phone, setPhone] = useState("");
  const [hasPhone, setHasPhone] = useState(false);

  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword,
    setShowConfirmPassword] =
    useState(false);

  const [successModal, setSuccessModal] =
    useState(false);

  // =========================
  // ERROR STATES
  // =========================
  const [emailError, setEmailError] =
    useState("");

  const [phoneError, setPhoneError] =
    useState("");

  const [passwordError,
    setPasswordError] =
    useState("");

  const [confirmPasswordError,
    setConfirmPasswordError] =
    useState("");

    const dispatch = useDispatch();

  // =========================
  // LOAD
  // =========================
  useEffect(() => {
    if (visible) {
      initialize();
    }
  }, [visible]);

  const initialize = async () => {
    setStep(1);

    setPassword("");
    setConfirmPassword("");

    clearErrors();

    const savedSkip =
      await AsyncStorage.getItem(
        "complete_profile_skip_count"
      );

    if (savedSkip !== null) {
      setSkipLeft(Number(savedSkip));
    }

    await getPatientData();
    await getCountries();
  };

  const clearErrors = () => {
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setConfirmPasswordError("");
  };

  // =========================
  // GET USER DATA
  // =========================
  const getPatientData = async () => {
    try {
      setLoadingUser(true);

      const res = await axios.get(
        EXPO_PUBLIC_API_URL +
          `/api/patients/getPatientByEmail?email=${user.email}`,
        {
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      if (res.status === 200) {
        const data = res.data;

        setUserData(data);

        //setEmail(data.email || "");

        if (data.phone) {
          setPhone(data.phone);
          setHasPhone(true);
        } else {
          setHasPhone(false);
        }

        if (data.countryCode) {
          setCountryCode(data.countryCode);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingUser(false);
    }
  };

  // =========================
  // GET COUNTRIES
  // =========================
  const getCountries = async () => {
    try {
      setLoadingCountries(true);

      const res = await axios.get(
        `${EXPO_PUBLIC_API_URL}/api/locations/getAllCountries`
      );

      setCountries(res.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingCountries(false);
    }
  };

  // =========================
  // PHONE FORMAT
  // =========================
  const formatPhone = (text) => {
    const cleaned =
      text.replace(/\D/g, "");

    if (cleaned.length <= 3)
      return cleaned;

    if (cleaned.length <= 6)
      return `(${cleaned.slice(
        0,
        3
      )}) ${cleaned.slice(3)}`;

    return `(${cleaned.slice(
      0,
      3
    )}) ${cleaned.slice(
      3,
      6
    )}-${cleaned.slice(
      6,
      10
    )}`;
  };

  // =========================
  // SKIP
  // =========================
  const handleSkip = async () => {
    if (skipLeft <= 0) {
      setPhoneError(
        "No skips left. Please complete profile."
      );
      return;
    }

    const left = skipLeft - 1;

    setSkipLeft(left);

    await AsyncStorage.setItem(
      "complete_profile_skip_count",
      String(left)
    );

    if (onSkip) {
        onSkip();   // ✅ call gallery callback
    } else {
        onClose();  // fallback
    }
  };

  // =========================
  // VALIDATE
  // =========================
  const validate = () => {
    let valid = true;

    clearErrors();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setEmailError(
        "Please enter email"
      );
      valid = false;
    } else if (
      !emailRegex.test(email)
    ) {
      setEmailError(
        "Invalid email"
      );
      valid = false;
    }

    if (
      !hasPhone &&
      !phone
    ) {
      setPhoneError(
        "Please enter phone number"
      );
      valid = false;
    }

    if (!password) {
      setPasswordError(
        "Please enter password"
      );
      valid = false;
    } else if (
      password.length < 6
    ) {
      setPasswordError(
        "Minimum 6 characters"
      );
      valid = false;
    }

    if (
      !confirmPassword
    ) {
      setConfirmPasswordError(
        "Please confirm password"
      );
      valid = false;
    } else if (
      password !==
      confirmPassword
    ) {
      setConfirmPasswordError(
        "Passwords do not match"
      );
      valid = false;
    }

    return valid;
  };

  const validateStepOne = () => {
  let valid = true;

  setEmailError("");
  setPhoneError("");

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email?.trim()) {
    setEmailError("Please enter email");
    valid = false;
  } else if (!emailRegex.test(email.trim())) {
    setEmailError("Please enter valid email");
    valid = false;
  }

  if (!hasPhone) {
    if (!phone?.trim()) {
      setPhoneError("Please enter phone number");
      valid = false;
    }
  }

  return valid;
};

  // =========================
  // SAVE
  // =========================
  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      // update credentials
      const updateCredentialsRes = await axios.patch(
        `${EXPO_PUBLIC_API_URL}/api/patients/update-credentials`,
        {
          uuid: userData.uuid,
          email,
          password,
          countryCode,
          phone:
            phone.replace(
              /\D/g,
              ""
            ),
        }
      );
      //console.log("updateCredentialsRes",updateCredentialsRes.data)

      // update email
      try {
        await axios.patch(
          `${EXPO_PUBLIC_API_URL}/update-email`,
          {
            firstName:
              userData.firstname,
            lastName:
              userData.lastname,
            machineId:
              userData.machineId,
            emailId: email,
            oldEmail:
              userData.email,
          }
        );
      } catch (error2) {
        //console.log("error in update-email",error2);
        const notifyRes = await axios.post(
          `${EXPO_PUBLIC_API_URL}/api/notify/upload-email-failed`,
          {
            firstName:
              userData.firstname,
            lastName:
              userData.lastname,
            machineId:
              userData.machineId,
            oldEmailId:
              userData.email,
            emailId: email,
            error:
              error2?.message ||
              "Network Error",
            source:
              "Patient credential update (gallery)",
          }
        );
        //console.log("notifyRes",notifyRes)
      }

      // login
      const loginRes =
        await axios.post(
          `${EXPO_PUBLIC_API_URL}/api/auth/applogin1`,
          {
            email,
            password,
          }
        );

        //console.log("loginRes",loginRes.data)

      if (
        loginRes.data?.token
      ) {
        await AsyncStorage.setItem(
          "token",
          loginRes.data.token
        );

        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(
            loginRes.data
          )
        );
        await AsyncStorage.setItem('tokenExpiry', loginRes.data.expiresIn);
        
        dispatch(setCredentials(loginRes.data));
      }

      setSuccessModal(true);
    } catch (error) {
      setPasswordError(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const restartApp = async () => {
    await Updates.reloadAsync();
  };

  // =========================
  // UI
  // =========================
  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
        >
          <View style={styles.modalBox}>
            {loadingUser ? (
              <ActivityIndicator
                size="large"
                color="#b04ab6"
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
              >
                {/* HEADER */}
                <Text style={styles.title}>
                  Complete Your
                  Profile
                </Text>

                <Text
                  style={
                    styles.subtitle
                  }
                >
                  Update your real
                  email and set a new
                  password to secure
                  your account.
                </Text>

                {/* STEP */}
                <View
                  style={
                    styles.stepWrap
                  }
                >
                  <View
                    style={
                      styles.activeCircle
                    }
                  >
                    <Text
                      style={
                        styles.circleText
                      }
                    >
                      {step === 1
                        ? "1"
                        : "✓"}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.line
                    }
                  />

                  <View
                    style={
                      step === 2
                        ? styles.activeCircle
                        : styles.grayCircle
                    }
                  >
                    <Text
                      style={
                        styles.circleText
                      }
                    >
                      2
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.labelRow
                  }
                >
                  <Text
                    style={
                      styles.stepLabel
                    }
                  >
                    Your Details
                  </Text>

                  <Text
                    style={
                      styles.stepLabel
                    }
                  >
                    Set Password
                  </Text>
                </View>

                <View
                  style={
                    styles.topBar
                  }
                />

                {/* STEP 1 */}
                {step === 1 && (
                  <>
                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      Your Real Email
                      Address
                    </Text>

                    <View
                      style={
                        styles.inputBox
                      }
                    >
                      <Icon
                        name="email"
                        size={22}
                        color="#777"
                      />

                      <TextInput
                        style={
                          styles.textInput
                        }
                        placeholder="Enter personal email"
                        placeholderTextColor="#999"
                        value={
                          email
                        }
                        onChangeText={(
                          text
                        ) => {
                          setEmail(
                            text
                          );
                          setEmailError(
                            ""
                          );
                        }}
                      />
                    </View>

                    {emailError ? (
                      <Text
                        style={
                          styles.errorText
                        }
                      >
                        {
                          emailError
                        }
                      </Text>
                    ) : null}

                    {!hasPhone && (
                      <>
                        <View
                          style={
                            styles.doubleRow
                          }
                        >
                          <View
                            style={
                              styles.countrySection
                            }
                          >
                            <Text
                              style={
                                styles.inputLabel
                              }
                            >
                              Country
                              Code
                            </Text>

                            <TouchableOpacity
                              style={
                                styles.countryBox
                              }
                              onPress={() =>
                                setShowCountries(
                                  true
                                )
                              }
                            >
                              <Icon
                                name="public"
                                size={
                                  22
                                }
                                color="#777"
                              />

                              <Text
                                style={
                                  styles.countryText
                                }
                              >
                               +{countryCode}
                              </Text>

                              <Icon
                                name="keyboard-arrow-down"
                                size={
                                  22
                                }
                              />
                            </TouchableOpacity>
                          </View>

                          <View
                            style={
                              styles.phoneSection
                            }
                          >
                            <Text
                              style={
                                styles.inputLabel
                              }
                            >
                              Phone
                              Number
                            </Text>

                            <View
                              style={
                                styles.inputBox
                              }
                            >
                              <Icon
                                name="phone"
                                size={
                                  22
                                }
                                color="#777"
                              />

                              <TextInput
                                style={
                                  styles.textInput
                                }
                                placeholder="(123) 456-7890"
                                placeholderTextColor="#999"
                                keyboardType="phone-pad"
                                value={
                                  phone
                                }
                                onChangeText={(
                                  text
                                ) => {
                                  setPhone(
                                    formatPhone(
                                      text
                                    )
                                  );
                                  setPhoneError(
                                    ""
                                  );
                                }}
                              />
                            </View>
                          </View>
                        </View>

                        {phoneError &&
                          <Text
                            style={
                              styles.errorText
                            }
                          >
                            {
                              phoneError
                            }
                          </Text>
                        }
                      </>
                    )}

                    <View
                      style={
                        styles.buttonRow
                      }
                    >
                      <TouchableOpacity
                        onPress={
                          handleSkip
                        }
                      >
                        <Text
                          style={
                            styles.skipText
                          }
                        >
                          SKIP (
                          {
                            skipLeft
                          }{" "}
                          LEFT)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={
                          styles.primaryBtn
                        }
                        onPress={() =>{
                         if (validateStepOne()) {
                            setStep(2);
                        }
                        }
                      }
                      >
                        <Text
                          style={
                            styles.primaryText
                          }
                        >
                          NEXT
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <>
                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      New Password
                    </Text>

                    <View
                      style={
                        styles.inputBox
                      }
                    >
                      <Icon
                        name="lock"
                        size={22}
                        color="#777"
                      />

                      <TextInput
                        style={
                          styles.textInput
                        }
                        secureTextEntry={
                          !showPassword
                        }
                        placeholder="Minimum 6 characters"
                        placeholderTextColor="#999"
                        value={
                          password
                        }
                        onChangeText={(
                          text
                        ) => {
                          setPassword(
                            text
                          );
                          setPasswordError(
                            ""
                          );
                        }}
                      />

                      <TouchableOpacity
                        onPress={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                      >
                        <Icon
                          name={
                            showPassword
                              ? "visibility"
                              : "visibility-off"
                          }
                          size={22}
                          color="#777"
                        />
                      </TouchableOpacity>
                    </View>

                    {passwordError ? (
                      <Text
                        style={
                          styles.errorText
                        }
                      >
                        {
                          passwordError
                        }
                      </Text>
                    ) : null}

                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      Confirm New
                      Password
                    </Text>

                    <View
                      style={
                        styles.inputBox
                      }
                    >
                      <Icon
                        name="lock"
                        size={22}
                        color="#777"
                      />

                      <TextInput
                        style={
                          styles.textInput
                        }
                        secureTextEntry={
                          !showConfirmPassword
                        }
                        placeholder="Re-enter your new password"
                        placeholderTextColor="#999"
                        value={
                          confirmPassword
                        }
                        onChangeText={(
                          text
                        ) => {
                          setConfirmPassword(
                            text
                          );
                          setConfirmPasswordError(
                            ""
                          );
                        }}
                      />

                      <TouchableOpacity
                        onPress={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                      >
                        <Icon
                          name={
                            showConfirmPassword
                              ? "visibility"
                              : "visibility-off"
                          }
                          size={22}
                          color="#777"
                        />
                      </TouchableOpacity>
                    </View>

                    {confirmPasswordError ? (
                      <Text
                        style={
                          styles.errorText
                        }
                      >
                        {
                          confirmPasswordError
                        }
                      </Text>
                    ) : null}

                    <Text
                      style={
                        styles.footerText
                      }
                    >
                      After saving,
                      use your new
                      email and
                      password for
                      future logins.
                    </Text>

                    <View
                      style={
                        styles.buttonRow
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.backBtn
                        }
                        onPress={() =>
                          setStep(
                            1
                          )
                        }
                      >
                        <Text
                          style={
                            styles.backText
                          }
                        >
                          BACK
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={
                          styles.primaryBtn
                        }
                        onPress={
                          handleSave
                        }
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text
                            style={
                              styles.primaryText
                            }
                          >
                            SAVE
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </ScrollView>
            )}
          </View>

          {/* COUNTRY MODAL */}
          <Modal
            visible={
              showCountries
            }
            transparent
            animationType="fade"
          >
            <Pressable
              style={
                styles.countryOverlay
              }
              onPress={() =>
                setShowCountries(
                  false
                )
              }
            >
              <View
                style={
                  styles.countryModal
                }
              >
                {loadingCountries ? (
                  <ActivityIndicator
                    size="large"
                    color="#b04ab6"
                  />
                ) : (
                  <FlatList
                    data={
                      countries
                    }
                    keyExtractor={(
                      item,
                      index
                    ) =>
                      index.toString()
                    }
                    renderItem={({
                      item,
                    }) => (
                      <TouchableOpacity
                        style={
                          styles.countryItem
                        }
                        onPress={() => {
                          setCountryCode(
                            item.phonecode
                          );
                          setCountryName(
                            item.country_name
                          );
                          setShowCountries(
                            false
                          );
                        }}
                      >
                        <Text>
                          {
                            item.country_name
                          }{" "}
                          (+
                          {
                            item.phonecode
                          }
                          )
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            </Pressable>
          </Modal>
        </KeyboardAvoidingView>
      </Modal>

      {/* SUCCESS */}
      <Modal
        visible={
          successModal
        }
        transparent
        animationType="fade"
      >
        <View
          style={
            styles.overlay
          }
        >
          <View
            style={
              styles.successBox
            }
          >
            <Icon
              name="check-circle"
              size={60}
              color="#4CAF50"
            />

            <Text
              style={
                styles.successTitle
              }
            >
              Success
            </Text>

            <Text
              style={
                styles.successDesc
              }
            >
              Profile completed
              successfully.
            </Text>

            <TouchableOpacity
              style={
                styles.primaryBtn
              }
              onPress={
                restartApp
              }
            >
              <Text
                style={
                  styles.primaryText
                }
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default CompleteProfileModal;

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.55)",
      justifyContent:
        "center",
      alignItems:
        "center",
      padding: 15,
    },

    modalBox: {
      width: "95%",
      backgroundColor:
        "#fff",
      borderRadius: 14,
      padding: 24,
      maxHeight: "92%",
    },

    title: {
      fontSize: 28,
      fontWeight: "700",
      color: "#222",
    },

    subtitle: {
      fontSize: 14,
      color: "#777",
      marginTop: 8,
      marginBottom: 22,
    },

    stepWrap: {
      flexDirection:
        "row",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    activeCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor:
        "#b04ab6",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    grayCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor:
        "#aaa",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    circleText: {
      color: "#fff",
      fontWeight: "700",
    },

    line: {
      width: 170,
      height: 1,
      backgroundColor:
        "#ccc",
    },

    labelRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      paddingHorizontal: 55,
      marginTop: 12,
    },

    stepLabel: {
      fontSize: 13,
      color: "#555",
    },

    topBar: {
      height: 4,
      backgroundColor:
        "#d7b2db",
      borderRadius: 5,
      marginTop: 18,
      marginBottom: 20,
    },

    inputLabel: {
      fontSize: 12,
      color: "#777",
      marginBottom: 5,
      marginLeft: 5,
    },

    inputBox: {
      height: 54,
      borderWidth: 1,
      borderColor:
        "#ddd",
      borderRadius: 8,
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 12,
      marginBottom: 10,
    },

    textInput: {
      flex: 1,
      marginLeft: 10,
      color: "#222",
    },

    doubleRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
    },

    countrySection: {
      width: "40%",
    },

    phoneSection: {
      width: "56%",
    },

    countryBox: {
      height: 54,
      borderWidth: 1,
      borderColor:
        "#ddd",
      borderRadius: 8,
      paddingHorizontal: 10,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    countryText: {
      flex: 1,
      fontSize: 13,
      marginHorizontal: 8,
    },

    helperText: {
      fontSize: 11,
      color: "#777",
      marginTop: -4,
      marginBottom: 8,
      marginLeft: 5,
    },

    footerText: {
      fontSize: 12,
      color: "#777",
      marginBottom: 20,
      marginTop: 5,
    },

    errorText: {
      color: "red",
      fontSize: 12,
      marginTop: -4,
      marginBottom: 8,
      marginLeft: 5,
    },

    buttonRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginTop: 18,
    },

    skipText: {
      color: "#555",
      fontSize: 16,
    },

    primaryBtn: {
      backgroundColor:
        "#b04ab6",
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 4,
    },

    primaryText: {
      color: "#fff",
      fontWeight: "700",
    },

    backBtn: {
      borderWidth: 1,
      borderColor:
        "#b04ab6",
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 4,
    },

    backText: {
      color: "#b04ab6",
      fontWeight: "600",
    },

    countryOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.45)",
      justifyContent:
        "center",
      padding: 20,
    },

    countryModal: {
      backgroundColor:
        "#fff",
      borderRadius: 12,
      maxHeight: 450,
    },

    countryItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        "#eee",
    },

    successBox: {
      width: "85%",
      backgroundColor:
        "#fff",
      borderRadius: 14,
      padding: 25,
      alignItems:
        "center",
    },

    successTitle: {
      fontSize: 24,
      fontWeight: "700",
      marginTop: 10,
    },

    successDesc: {
      color: "#666",
      marginVertical: 15,
      textAlign: "center",
    },
  });