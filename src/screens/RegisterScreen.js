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
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useRouter } from 'expo-router';
import GlobalStyles from '../styles/GlobalStyles';
import Colors from '../constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Checkbox } from 'react-native-paper';
import { EXPO_PUBLIC_API_URL } from '@env';
import axios from 'axios';
import CommonSVG from '../components/commonSvg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { closeDropdown } from '../state/slices/headerSlice';
import Loader from '../components/Loader';
import Snackbar from '../components/Snackbar';

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

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/locations/getAllCountries`);
        setCountries(response.data);
      } catch (err) {
        setError('Failed to fetch countries: ' + err);
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
        value: `${country.phonecode}`,
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
          countryCode: formData.countryCode,
          phone: formData.phone,
          dob: formData.dob,
          dueDate: formData.dueDate,
          agree: termsAccepted,
        },
        {
          headers: {
            'Content-Type': 'application/json',
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
        setSnackbarMessage(res.data.error || 'Registration failed. Please try again.');
        setSnackbarType('error');
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage(res.data.error || 'An error occurred. Please try again later.');
      setSnackbarType('error');
      setSnackbarVisible(true);
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      style={GlobalStyles.container}
    >
      <View style={styles.container}>
        <CommonSVG color={svgColor} />


        <View style={{ alignItems: 'center' }}>
          <Text style={[GlobalStyles.title, { marginTop: 100 }]}>Create Account</Text>
        </View>

        <ScrollView contentContainerStyle={[GlobalStyles.registrationScreenPadding, { position: 'relative' }]}>
          <View >

            {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}

            <View style={[GlobalStyles.row, { marginBottom: 15 }]}>
              <View style={[styles.textInputIconView, styles.allMarginRight, { position: 'relative', justifyContent: 'center' }]}>
                <TextInput
                  //allowFontScaling={false}
                  style={[{ paddingLeft: 38,fontFamily: 'Poppins_400Regular', color: 'black' }]}
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
                  //allowFontScaling={false}
                  style={[{ paddingLeft: 38,fontFamily: 'Poppins_400Regular',color: 'black' }]}
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
                //allowFontScaling={false}
                style={[GlobalStyles.input, { paddingLeft: 38,color: 'black'  }]}
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
                style={[
                  styles.textInputIconView,
                  { marginBottom: 15, width: '100%', justifyContent: 'center', paddingLeft: 22,height: 55, position: 'relative'},
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

                <RNPickerSelect
                  placeholder={{
                    label: 'Account Type',
                    value: null,
                  }}
                  items={accountType}
                  onValueChange={(value) => handleAccountTypeChange(value)}
                  value={formData.accountType}
                  style={{
                    inputIOS: {
                      height: 50,
                      paddingRight: 30,
                      paddingLeft: 15,
                      fontSize: 14,
                      fontFamily: 'Poppins_400Regular',
                      textAlign: 'left',
                      alignItems:'center',
                      color: 'black' 
                    },
                    inputAndroid: {
                      height: 50,
                      paddingRight: 30,
                      paddingLeft: 15,
                      fontSize: 14,
                      fontFamily: 'Poppins_400Regular',                      
                      textAlign: 'left',
                      alignItems:'center',
                      color: 'black' 
                    },
                    placeholder: {
                      fontSize: 14,
                      fontFamily: 'Poppins_400Regular',
                      color: 'gray',
                    },
                  }}
                  useNativeAndroidPickerStyle={false}
                />
                <Icon
                  name="keyboard-arrow-down"
                  size={20}
                  color={Colors.gray}
                  style={{
                    position: 'absolute',
                    right: '5%',
                    top: 15,
                    zIndex: 1,
                  }}
                />
              </View>
            </View>

            {formData.accountType === 'patient' && (
              <View style={[GlobalStyles.row, { marginBottom: 15 }]}>

                <View style={[styles.textInputIconView, styles.allMarginRight]}>
                  <TextInput
                    //allowFontScaling={false}
                    style={[GlobalStyles.textInputIcon,{color: 'black' }]}
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
                    style={{ position: 'absolute', left: '7%', top: 15 }}
                  />
                </View>

                <View style={[styles.textInputIconView, styles.allMarginLeft]}>
                  <TextInput
                    //allowFontScaling={false}
                    style={[GlobalStyles.textInputIcon,{color: 'black' }]}
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
                    style={{ position: 'absolute', left: '7%', top: 15 }}
                  />
                </View>
              </View>
            )}

            {formData.accountType === 'patient-family' && (
              <View style={{ position: 'relative' }}>
                <TextInput
                  //allowFontScaling={false}
                  style={[GlobalStyles.input, { paddingLeft: 38,color: 'black'  }]}
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
                  style={{ position: 'absolute', left: 10, top: 15 }}
                />
              </View>
            )}

            <View style={[GlobalStyles.row, { marginBottom: 15 }]}>
              <View style={[styles.textInputIconView, styles.allMarginRight, { justifyContent: 'center' }]}>
                <TextInput
                  //allowFontScaling={false}
                  style={[GlobalStyles.textInputIcon,{ paddingLeft: 37,fontFamily: 'Poppins_400Regular',marginTop:5,color: 'black'}]}
                  placeholder="Password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry
                />
                <Icon
                  name="lock"
                  size={20}
                  color={Colors.gray}
                  style={{ position: 'absolute', left: '6%', top: 15 }}
                />
              </View>

              <View style={[styles.textInputIconView, styles.allMarginLeft, { justifyContent: 'center' }]}>
                <TextInput
                  //allowFontScaling={false}
                  style={[GlobalStyles.textInputIcon,{ paddingLeft: 35,fontFamily: 'Poppins_400Regular',marginTop:5,color: 'black'  }]}
                  placeholder="Confirm Pass.."
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  secureTextEntry
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
              <View style={[styles.textInputIconView, styles.allMarginRight, { width: '30%', height: 55, position: 'relative' }]}>
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
                <RNPickerSelect
                  placeholder={{
                    label: 'Country Code',
                    value: null,

                  }}
                  items={FormattedCountries}
                  onValueChange={(value) => setFormData({ ...formData, countryCode: value })}
                  value={formData.countryCode}
                  style={{
                    inputIOS: {
                      height: 50,
                      paddingRight: 30,
                      paddingLeft: 35,
                      fontSize: 13.5,
                      fontFamily: 'Poppins_400Regular',
                      textAlign: 'left',
                      alignItems:'center',
                      color: 'black'
                    },
                    inputAndroid: {
                      height: 50,
                      paddingRight: 30,
                      paddingLeft: 35,
                      fontSize: 13.5,
                      fontFamily: 'Poppins_400Regular',
                      textAlign: 'left',
                      alignItems:'center',
                      color: 'black'
                    },
                    placeholder: {
                      fontSize: 13.5,
                      fontFamily: 'Poppins_400Regular',
                      color: 'gray',
                    },
                  }}
                  useNativeAndroidPickerStyle={false}
                />
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
              </View>

              <View style={[styles.textInputIconView, styles.allMarginLeft, { width: '70%' }]}>
                <Icon
                  name="phone"
                  size={20}
                  color={Colors.gray}
                  style={{
                    position: 'absolute', left: '7%', top: 15,
                  }}
                />
                <TextInput
                  //allowFontScaling={false}
                  style={[GlobalStyles.textInputIcon,{color: 'black'}]}
                  placeholder="Phone No"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: formatPhoneNumber(text) })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* <View style={styles.termsContainer}>
              <View style={[styles.checkbox]}>
                <Checkbox
                  status={termsAccepted ? 'checked' : 'unchecked'}
                  onPress={() => setTermsAccepted(prevState => !prevState)}
                  color={Colors.primary}
                />
                <Text style={[styles.termsText,{fontFamily: 'Poppins_400Regular'}]}>
                I accept the{' '}
                <Text
                  style={[styles.termsLink,{fontFamily: 'Poppins_400Regular'}]}
                  onPress={() => Linking.openURL('https://babyflix.ai/terms')}
                >
                  Terms and Conditions
                </Text>
              </Text>

              </View>
            </View> */}

            <View style={styles.termsContainer}>
              <View style={styles.checkbox}>
                <Checkbox
                  status={termsAccepted ? 'checked' : 'unchecked'}
                  onPress={() => setTermsAccepted(prevState => !prevState)}
                  color={Colors.primary}
                />
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
              <Text style={{ color: Colors.textSecondary,fontFamily: 'Poppins_400Regular' }}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('login')}>
                <Text style={[GlobalStyles.link,{fontFamily: 'Poppins_400Regular'}]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              themeVariant="light"
            />
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
    </KeyboardAvoidingView>
    </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  accountTypeButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    //alignItems: 'left',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    height: 55,
  },
  textInputIconView: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    //alignItems: 'Left',
    alignItems: 'flex-start',
    justifyContent:'center',
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
  // termsContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   marginBottom: 15,
  // },
  // checkbox: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   color: Colors.primary
  // },
  // checkboxBox: {
  //   width: 20,
  //   height: 20,
  //   borderWidth: 1,
  //   borderColor: Colors.border,
  //   borderRadius: 3,
  //   marginRight: 10,
  // },
  // checkboxChecked: {
  //   backgroundColor: Colors.primary,
  // },
  // termsText: {
  //   color: Colors.textSecondary,
  // },
  // termsLink: {
  //   color: Colors.primary,
  //   textDecorationLine: 'underline',
  // },

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
});

export default RegisterScreen;
