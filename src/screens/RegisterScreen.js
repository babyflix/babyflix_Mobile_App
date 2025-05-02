import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Keyboard,
  Linking,
  TouchableWithoutFeedback,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useRouter } from 'expo-router';
import GlobalStyles from '../styles/GlobalStyles';
import Colors from '../constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { EXPO_PUBLIC_API_URL } from '@env';
import axios from 'axios';
import CommonSVG from '../components/commonSvg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from '../components/Loader';
import Snackbar from '../components/Snackbar';
import { logError } from '../components/logError';

const RegisterScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    familyOf: '',
    countryCode: '',
    phone: '',
    accountType: '',
    dob: '',
    dueDate: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState([]);
  const [FormattedCountries, setFormattedCountries] = useState([]);
  const [svgColor, setSvgColor] = useState(Colors.primary);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('success');
  const [showAccountTypeOptions, setShowAccountTypeOptions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());


  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/locations/getAllCountries`);
        setCountries(response.data);
      } catch (err) {
        setError('Failed to fetch countries: ' + err);
         await logError({
          error: err,
          data: err.response?.data.error || response.data.error,
          details: "Error in getAllCountries API call on  RegisterScreen"
        });
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (formData.accountType === 'patient') {
      setFormData({ ...formData, familyOf: "" });
    }

    if (formData.accountType === 'patient-family') {
      setFormData({ ...formData, dob: '', dueDate: '' });
    }
  }, [formData.accountType]);

  useEffect(() => {
    if (countries.length > 0) {

      const formatted = countries.map((country) => ({
        label: `+${country.phonecode} ${country.country_name}`,
        value: `${country.phonecode}_${country.country_name}`,
      }));

      setFormattedCountries(formatted);
    }
  }, [countries]);

  const accountType = [
    { label: 'Patient', value: 'patient' },
    { label: 'patient-family', value: 'patient-family' },
  ];

  const handleRegister = async () => {
    const { firstName, lastName, email, password, confirmPassword, phone, dueDate, familyOf, accountType, dob } = formData;

    setError('');

    if (!firstName || !lastName || !email || !password || !confirmPassword || !phone) {
      setError('Please fill in all fields');
      return;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]).{6,}$/;
    if (!passRegex.test(password)) {
      setError('Password must be at least 6 characters, include one uppercase letter, one number, and one special character');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the Terms and Conditions');
      return;
    }

    const phoneRegex = /^(?:\+1\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
    if (!phoneRegex.test(phone)) {
      setError('Please enter a valid USA phone number.');
      return;
    }

    if (accountType === 'patient' && !dob) {
      setError('Please select a date of birth');
      return;
    }

    if (accountType === 'patient' && !dueDate) {
      setError('Please select a due date');
      return;
    }

    const currentDueDate = new Date();
    if (dueDate) {
      const [dueMonth, dueDay, dueYear] = dueDate.split('/');
      const formattedDueDate = new Date(`${dueYear}-${dueMonth}-${dueDay}`);

      if (formattedDueDate < currentDueDate) {
        setError('Due date cannot be in the past');
        return;
      }
    }

    const currentDate = new Date();
    if (dob) {
      const [dobMonth, dobDay, dobYear] = dob.split('/');
      const formattedDobDate = new Date(`${dobYear}-${dobMonth}-${dobDay}`);

      if (formattedDobDate > currentDate) {
        setError('Birth date cannot be in the future');
        return;
      }
    }

    if (accountType === 'family' && !familyOf) {
      setError('Please enter a family email address');
      return;
    }

    if (accountType === 'family' && !emailRegex.test(familyOf)) {
      setError('Please enter a valid family email address');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const timezone = await AsyncStorage.getItem('timezone');
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${EXPO_PUBLIC_API_URL}/api/auth/register`,
        {
          accountFor: formData.accountType,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          familyOf: formData.familyOf,
          countryCode: formData.countryCode?.split('_')[0],
          phone: formData.phone,
          dob: formData.dob,
          dueDate: formData.dueDate,
          agree: termsAccepted,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `Timezone=${timezone || 'UTC'}; Token=${token || ''}`,
          },
        }
      );
      if (response.data.actionStatus == "success") {
        setSnackbarMessage('Registration successful!');
        setSnackbarType('success');
        setSnackbarVisible(true);
        setTimeout(() => {
          router.replace('/login');
        }, 3000)
      } else {
        setSnackbarMessage(response.data.error || 'Registration failed. Please try again.');
        setSnackbarType('error');
        setSnackbarVisible(true);
        await logError({
          error: response.data.error,
          data: response?.data.error || error,
          details: "Error in register API call on RegisterScreen"
        });
      }
    } catch (error) {
      setSnackbarMessage(response.data.error || 'An error occurred. Please try again later.');
      setSnackbarType('error');
      setSnackbarVisible(true);
      await logError({
        error: error,
        data: error.response?.data.error || response.data.error,
        details: "Error in register API call on RegisterScreen"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountTypeChange = (type) => {
    setFormData({ ...formData, accountType: type });
  };

  const formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();

    const formattedMonth = month < 10 ? `0${month}` : month;
    const formattedDay = day < 10 ? `0${day}` : day;

    return `${formattedMonth}/${formattedDay}/${year}`;
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || formData.dob;
    setShowDatePicker(false);

    const formattedDate = formatDate(currentDate);

    if (dateField === 'dob' && formattedDate !== formData.dob) {
      setTempDate(currentDate);
      setFormData({ ...formData, dob: formattedDate });
    } else if (dateField === 'dueDate' && formattedDate !== formData.dueDate) {
      setFormData({ ...formData, dueDate: formattedDate });
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      familyOf: '',
      countryCode: '',
      phone: '',
      accountType: '',
      dob: '',
      dueDate: '',
    });
    setTermsAccepted(false);
    setError('');
  };

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

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setSvgColor(Colors.white);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setSvgColor(Colors.primary);
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      style={GlobalStyles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }} pointerEvents="box-none">
          <View style={styles.container}>
            <CommonSVG color={svgColor} />


            <View style={{ alignItems: 'center' }}>
              <Text style={[GlobalStyles.title, { marginTop: 100 }]}>Create Account</Text>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[GlobalStyles.registrationScreenPadding, { position: 'relative' }]}
            >
              <View >

                {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}

                <View style={[GlobalStyles.row, { marginBottom: 15 }]}>
                  <View style={[styles.textInputIconView, styles.allMarginRight, { position: 'relative', justifyContent: 'center' }]}>
                    <TextInput
                      style={[{ paddingLeft: 38, fontFamily: 'Poppins_400Regular', color: 'black' }]}
                      placeholder="First Name"
                      value={formData.firstName}
                      onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                    />
                    <Icon
                      name="person"
                      size={20}
                      color={Colors.gray}
                      style={{ position: 'absolute', left: '6%', top: 15 }}
                    />
                  </View>

                  <View style={[styles.textInputIconView, styles.allMarginLeft, { position: 'relative', justifyContent: 'center' }]}>
                    <TextInput
                      style={[{ paddingLeft: 38, fontFamily: 'Poppins_400Regular', color: 'black' }]}
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                    />
                    <Icon
                      name="person"
                      size={20}
                      color={Colors.gray}
                      style={{ position: 'absolute', left: '6%', top: 15 }}
                    />
                  </View>
                </View>

                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={[GlobalStyles.input, { paddingLeft: 38, color: 'black' }]}
                    placeholder="Email"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Icon
                    name="email"
                    size={20}
                    color={Colors.gray}
                    style={{ position: 'absolute', left: '3%', top: 15 }}
                  />
                </View>

                <View style={[GlobalStyles.row]}>
                  <View
                    pointerEvents="box-none"
                    style={[
                      styles.textInputIconView,
                      {
                        marginBottom: 15,
                        width: '100%',
                        justifyContent: 'center',
                        paddingLeft: 22,
                        height: 55,
                        zIndex: 10,
                      },
                    ]}
                  >
                    <Icon
                      name="account-circle"
                      size={20}
                      color={Colors.gray}
                      style={{
                        position: 'absolute',
                        left: '3%',
                        top: 15,
                        zIndex: 1,
                      }}
                    />

                    <TouchableOpacity
                      onPress={() => setShowAccountTypeOptions(!showAccountTypeOptions)}
                      style={{
                        height: 50,
                        width: '100%',
                        paddingLeft: 15,
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins_400Regular',
                          color: formData.accountType ? 'black' : 'gray',
                        }}
                      >
                        {formData.accountType
                          ? accountType.find((opt) => opt.value === formData.accountType)?.label
                          : 'Account Type'}
                      </Text>
                    </TouchableOpacity>

                    <Icon
                      name={showAccountTypeOptions ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                      size={20}
                      color={Colors.gray}
                      style={{
                        position: 'absolute',
                        right: '5%',
                        top: 15,
                        zIndex: 1,
                      }}
                    />

                    {showAccountTypeOptions && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 55,
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          borderRadius: 5,
                          elevation: 5,
                          zIndex: 999,
                        }}
                      >
                        {accountType.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            onPress={() => {
                              handleAccountTypeChange(option.value);
                              setShowAccountTypeOptions(false);
                            }}
                            style={{
                              paddingVertical: 12,
                              paddingHorizontal: 22,
                              borderBottomWidth: 1,
                              borderBottomColor: '#eee',
                            }}
                          >
                            <Text style={{ fontFamily: 'Poppins_400Regular' }}>{option.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>


                {formData.accountType === 'patient' && (
                  <View style={[GlobalStyles.row, { marginBottom: 15 }]}>

                    <View style={[styles.textInputIconView, styles.allMarginRight]}>
                      <TextInput
                        style={[GlobalStyles.textInputIcon, { color: 'black', marginTop: 6 }]}
                        placeholder="Date of Birth"
                        value={formData.dob}
                        onFocus={() => {
                          setDateField('dob');
                          setShowDatePicker(true);
                        }}
                      />
                      <Icon
                        name="calendar-today"
                        size={20}
                        color={Colors.gray}
                        style={{ position: 'absolute', left: '7%', top: 15, }}
                      />
                    </View>

                    <View style={[styles.textInputIconView, styles.allMarginLeft]}>
                      <TextInput
                        style={[GlobalStyles.textInputIcon, { color: 'black', marginTop: 6 }]}
                        placeholder="Due Date"
                        value={formData.dueDate}
                        onFocus={() => {
                          setDateField('dueDate');
                          setShowDatePicker(true);
                        }}
                      />
                      <Icon
                        name="calendar-today"
                        size={20}
                        color={Colors.gray}
                        style={{ position: 'absolute', left: '7%', top: 15, }}
                      />
                    </View>
                  </View>
                )}

                {formData.accountType === 'patient-family' && (
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      style={[GlobalStyles.input, { paddingLeft: 38, color: 'black', marginTop: 3 }]}
                      placeholder="Patient Email id"
                      value={formData.familyOf}
                      onChangeText={(text) => setFormData({ ...formData, familyOf: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <Icon
                      name="email"
                      size={20}
                      color={Colors.gray}
                      style={{ position: 'absolute', left: 10, top: 18, }}
                    />
                  </View>
                )}

                <View style={[GlobalStyles.row, { marginBottom: 15 }]}>
                  <View style={[styles.textInputIconView, styles.allMarginRight, { justifyContent: 'center' }]}>
                    <TextInput
                      style={[GlobalStyles.textInputIcon, { paddingLeft: 37, fontFamily: Platform.OS === 'android' ? 'Poppins_400Regular' : undefined, marginTop: 5, color: 'black' }]}
                      placeholder="Password"
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Icon
                      name="lock"
                      size={20}
                      color={Colors.gray}
                      style={{ position: 'absolute', left: '6%', top: 15, }}
                    />
                  </View>

                  <View style={[styles.textInputIconView, styles.allMarginLeft, { justifyContent: 'center' }]}>
                    <TextInput
                      style={[GlobalStyles.textInputIcon, { paddingLeft: 35, fontFamily: Platform.OS === 'android' ? 'Poppins_400Regular' : undefined, marginTop: 5, color: 'black' }]}
                      placeholder="Confirm Pass.."
                      value={formData.confirmPassword}
                      onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Icon
                      name="lock"
                      size={20}
                      color={Colors.gray}
                      style={{
                        position: 'absolute', left: '6%', top: 15,
                      }}
                    />
                  </View>
                </View>

                <View style={[GlobalStyles.row, { marginBottom: 10 }]}>

                  <View
                    style={[
                      styles.textInputIconView,
                      styles.allMarginRight,
                      {
                        flex: 4.76,
                        height: 55,
                        justifyContent: 'center',
                        paddingLeft: 35,
                        position: 'relative',
                        zIndex: 8,
                      },
                    ]}
                  >
                    <Icon
                      name="public"
                      size={20}
                      color={Colors.gray}
                      style={{
                        position: 'absolute',
                        left: '6%',
                        top: 15,
                        zIndex: 1,
                      }}
                    />

                    <TouchableOpacity
                      onPress={() => setShowDropdown(true)}
                      style={{
                        height: 50,
                        justifyContent: 'center',
                        paddingRight: 0,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13.5,
                          fontFamily: 'Poppins_400Regular',
                          color: formData.countryCode ? 'black' : 'gray',
                        }}
                      >
                        {
                          formData.countryCode
                            ? FormattedCountries.find((c) => c.value === formData.countryCode)?.label
                            : 'Country Code'
                        }
                      </Text>
                    </TouchableOpacity>

                    <Icon
                      name="keyboard-arrow-down"
                      size={20}
                      color={Colors.gray}
                      style={{
                        position: 'absolute',
                        right: '7%',
                        top: 15,
                        zIndex: 1,
                      }}
                    />

                    <Modal visible={showDropdown} transparent animationType="fade">
                      <Pressable
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          justifyContent: 'center',
                          paddingHorizontal: 20,
                        }}
                        onPress={() => setShowDropdown(false)}
                      >
                        <View
                          style={{
                            backgroundColor: 'white',
                            borderRadius: 8,
                            maxHeight: 300,
                            padding: 10,
                          }}
                        >
                          <FlatList
                            data={FormattedCountries}
                            keyExtractor={(item) => `${item.value}`}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                onPress={() => {
                                  setFormData({ ...formData, countryCode: item.value });
                                  setShowDropdown(false);
                                }}
                                style={{ paddingVertical: 12 }}
                              >
                                <Text style={{ fontFamily: 'Poppins_400Regular' }}>{item.label}</Text>
                              </TouchableOpacity>
                            )}
                          />
                        </View>
                      </Pressable>
                    </Modal>
                  </View>

                  <View style={[styles.textInputIconView, styles.allMarginLeft, {
                    flex: 6,
                    height: 55,
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    borderRadius: 8,
                  }]}>
                    <Icon
                      name="phone"
                      size={20}
                      color={Colors.gray}
                      style={{
                        position: 'absolute',
                        left: '7%',
                        top: 15,
                      }}
                    />
                    <TextInput
                      style={[GlobalStyles.textInputIcon, { color: 'black', marginTop: 5 }]}
                      placeholder="Phone No"
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: formatPhoneNumber(text) })}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
                <View style={styles.termsContainer}>
                  <View style={styles.checkbox}>
                    <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)} style={styles.checkboxBox}>
                      {termsAccepted && <View style={styles.checkboxChecked} />}
                    </TouchableOpacity>

                  </View>

                  <Text style={[styles.termsText, { fontFamily: 'Poppins_400Regular' }]}>
                    I accept the{' '}
                    <Text
                      style={[styles.termsLink, { fontFamily: 'Poppins_400Regular' }]}
                      onPress={() => Linking.openURL('https://babyflix.ai/terms')}
                    >
                      Terms and Conditions
                    </Text>
                  </Text>
                </View>


                <View style={[GlobalStyles.row, { marginBottom: 15 }]}>
                  <TouchableOpacity
                    style={[GlobalStyles.resetButton, GlobalStyles.allMarginRight]}
                    onPress={handleReset}
                  >
                    <Icon name="refresh" size={20} color={Colors.black} style={{ marginRight: 5 }} />
                    <Text style={[GlobalStyles.buttonText, { color: Colors.black }]}>
                      Reset
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[GlobalStyles.registerButton, GlobalStyles.allMarginLeft]}
                    onPress={handleRegister}
                  >
                    <Icon name="done" size={20} color={Colors.white} style={{ marginRight: 5 }} />
                    <Text style={GlobalStyles.buttonText}>Register</Text>
                  </TouchableOpacity>
                </View>

                <View style={[GlobalStyles.row, GlobalStyles.center, { marginTop: 0 }]}>
                  <Text style={{ color: Colors.textSecondary, fontFamily: 'Poppins_400Regular' }}>
                    Already have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => router.push('login')}>
                    <Text style={[GlobalStyles.link, { fontFamily: 'Poppins_400Regular' }]}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* {showDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  themeVariant="light"
                />
              )} */}

            {Platform.OS === 'ios' ? (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) handleDateChange(event, selectedDate);
                        setShowDatePicker(false);
                      }}
                    />
                    <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.doneButton}>
                      <Text style={{ color: Colors.primary, fontWeight: '600' }}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            ) : (
              showDatePicker && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )
            )}

            </ScrollView>
            {isLoading && <Loader loading={true} />}

            <Snackbar
              visible={snackbarVisible}
              message={snackbarMessage}
              type={snackbarType}
              onDismiss={() => setSnackbarVisible(false)}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  accountTypeButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    height: 55,
  },
  textInputIconView: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'flex-start',
    justifyContent: 'center',
    height: 55,
    position: 'relative',
    backgroundColor: Colors.white,
  },
  registerButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resetButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.white,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  termsText: {
    fontSize: 14,
    color: 'black',
  },
  termsLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  activeAccountType: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  activeText: {
    color: Colors.white,
    fontWeight: '600',
  },
  inactiveText: {
    color: Colors.textSecondary,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    width: '40%',
    backgroundColor: Colors.white,
    alignItems: 'right',
  },
  allMarginLeft: {
    marginLeft: 3,
  },
  allMarginRight: {
    marginRight: 3,
  },
  svgTop: {
    position: 'absolute',
    width: "100%",
    top: 0,
    marginBottom: 100,
  },
  svgBottom: {
    position: 'absolute',
    width: "100%",
    bottom: 0,
  },
  container: {
    flex: 1,
  },
  checkboxBox: {
    width: 21,
    height: 21,
    borderWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: 10
  },
  checkboxChecked: {
    width: 13,
    height: 13,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingBottom: 10,
  },
  doneButton: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  
});

export default RegisterScreen;
