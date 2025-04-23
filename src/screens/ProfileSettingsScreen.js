import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import GlobalStyles from '../styles/GlobalStyles';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../state/slices/authSlice';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import bcrypt from 'react-native-bcrypt';
import { useRouter } from 'expo-router';
import Loader from '../components/Loader';
import Snackbar from '../components/Snackbar';

const ProfileSettingsScreen = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isResetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [isEditProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [phone, setPhone] = useState('');

  const [spouseName, setSpouseName] = useState('');
  const [babyName, setBabyName] = useState('');
  const [babySex, setBabySex] = useState('');

  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('success');

  const [countries, setCountries] = useState([]);
  const [FormattedCountries, setFormattedCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const modalContentHeight = showAdditionalInfo ? '95%' : '85%';

  const user = useSelector((state) => state.auth);

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
    if (countries.length > 0 && Array.isArray(countries)) {

      const formatted = countries.map((country) => ({
        label: `+${country.phonecode} ${country.country_name}`,
        value: `${country.phonecode}`,
      }));

      setFormattedCountries(formatted);
    } else {
      console.log("contries not array")
    }
  }, [countries]);


  const BabySex = [
    { label: 'Male', value: '1' },
    { label: 'Female', value: '3' },
    { label: 'Other', value: '4' },
  ]

  const timezone = AsyncStorage.getItem('timezone');
  const token = AsyncStorage.getItem('token');

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/patients/getPatientByEmail`, {
          params: {
            email: user.email,
          },
          headers: {
            'Content-Type': 'application/json',
            'Cookies': `Timezone=${timezone || 'UTC'}; Token=${token || ''}`,
          },
        })
        if (response.data) {
          setResult(response.data)
          setFirstName(response.data.firstname || '');
          setLastName(response.data.lastname || '');
          setDueDate(response.data.dueDate || '');
          setDob(response.data.dob || '');
          setEmail(response.data.email || '')
          setCountryCode(response.data.countryCode || '');
          setPhone(response.data.phone || '');
          setSpouseName(response.data.spouseFirstName || '');
          setBabyName(response.data.babyName || '');
          setBabySex(response.data.babySex || '');

        } else {
          setSnackbarMessage(response.data.error || 'Data Fatching failed');
          setSnackbarType('error');
          setSnackbarVisible(true);
        }
      } catch (error) {
        setSnackbarMessage(error.response?.data?.error || 'Data Fatching failed. Please try again.');
        setSnackbarType('error');
        setSnackbarVisible(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [isEditProfileModalVisible]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');

      dispatch(logout());

      setTimeout(() => {
        router.replace('login');
      }, 100);

    } catch (error) {

    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dob;
    setShowDatePicker(false);

    const formattedDate = currentDate.toLocaleDateString();

    if (dateField === 'dob' && formattedDate !== dob) {
      setDob(formattedDate);
    } else if (dateField === 'dueDate' && formattedDate !== dueDate) {
      setDueDate(formattedDate);
    }
  };

  const handleResetPassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]).{6,}$/;
    if (!passRegex.test(newPassword)) {
      setErrorMessage('Password must be at least 6 characters, include one uppercase letter, one number, and one special character');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match!');
      return;
    }

    const checkPassword = async (enteredPassword, storedHash) => {
      return new Promise((resolve, reject) => {
        bcrypt.compare(enteredPassword, storedHash, (err, isMatch) => {
          if (err) {
            reject("Error comparing passwords");
          }
          resolve(isMatch);
        });
      });
    };

    try {
      const enteredPassword = oldPassword;
      const storedHash = result.password;
      const isMatch = await checkPassword(enteredPassword, storedHash);

      if (!isMatch) {
        setErrorMessage("Old Password is incorrect!");
        return;
      }

      setIsLoading(true);
      const response = await axios.post(`${EXPO_PUBLIC_API_URL}/api/auth/change-password`, {
        currentPassword: oldPassword,
        newPassword: newPassword,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `Timezone=${timezone || 'UTC'}; Token=${token || ''}`,
        },
      });

      if (response.status === 200) {
        setResetPasswordModalVisible(false);
        setErrorMessage('');
        setSnackbarMessage('Password reset successful');
        setSnackbarType('success');
        setSnackbarVisible(true);
      }
    } catch (error) {
      if (error === "Error comparing passwords") {
        setErrorMessage("Error comparing passwords");
        setSnackbarMessage(response.data.error || 'Error comparing passwords');
        setSnackbarType('error');
        setSnackbarVisible(true);
      } else {
        setErrorMessage('Failed to reset password. Please try again.');
        setSnackbarMessage(error.response?.data?.error || 'Failed to reset password. Please try again.');
        setSnackbarType('error');
        setSnackbarVisible(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email');
      return;
    }

    const phoneRegex = /^(?:\+1\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
    if (!phoneRegex.test(phone)) {
      setErrorMessage('Please enter a valid USA phone number.');
      return;
    }

    if (!dob) {
      setErrorMessage('Please select a date of birth');
      return;
    }

    if (!dueDate) {
      setErrorMessage('Please select a due date');
      return;
    }

    const currentDueDate = new Date();
    if (dueDate) {
      const [dueDay, dueMonth, dueYear] = dueDate.split('/');
      const formattedDueDate = new Date(`${dueYear}-${dueMonth}-${dueDay}`);

      if (formattedDueDate < currentDueDate) {
        setErrorMessage('Due date cannot be in the past');
        return;
      }
    }

    const currentDate = new Date();
    if (dob) {
      const [dobDay, dobMonth, dobYear] = dob.split('/');
      const formattedDueDate = new Date(`${dobYear}-${dobMonth}-${dobDay}`);

      if (formattedDueDate > currentDate) {
        setErrorMessage('Birth date cannot be in the future');
        return;
      }
    }

    if (!firstName || !lastName || !countryCode) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    try {
      const response = await axios.put(`${EXPO_PUBLIC_API_URL}/api/patients/update`,
        {
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phone,
          countryCode: countryCode,
          dueDate: dueDate,
          dob: dob,
          companyId: result.companyId,
          locationId: result.locationId,
          machineId: result.machineId,
          userGroups: result.userGroups,
          spouseFirstName: spouseName,
          babyName: babyName,
          babySex: babySex,
          uuid: result.uuid
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (response.status === 200) {
        setResetPasswordModalVisible(false);
        setErrorMessage('');
        setSnackbarMessage('Edit Profile successful');
        setSnackbarType('success');
        setSnackbarVisible(true);
      }
    } catch (error) {
      setErrorMessage('Failed to reset password. Please try again.');
      setSnackbarMessage(error.response?.data?.error || 'Failed to reset password. Please try again.');
      setSnackbarType('error');
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
    setEditProfileModalVisible(false);
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

  const closeResetPassword = () => {
    setResetPasswordModalVisible(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
  }

  const cancelEditProfile = () => {
    setEditProfileModalVisible(false)
    setFirstName(result.firstname || '');
    setLastName(result.lastname || '');
    setDueDate(result.dueDate || '');
    setDob(result.dob || '');
    setEmail(result.email || '')
    setCountryCode(result.countryCode || '');
    setPhone(result.phone || '');
    setSpouseName(result.spouseFirstName || '');
    setBabyName(result.babyName || '');
    setBabySex(result.babySex || '');
  }

  return (
    <View style={GlobalStyles.container}>
      <Header title="Profile Settings" showMenu={false} />
      <ScrollView style={[GlobalStyles.container, { padding: 10, }]}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Ionicons name="person" size={50} color={Colors.gray} />
          </View>
          <Text style={styles.name}>{result.firstname + ' ' + result.lastname || "N/A"}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[GlobalStyles.button, styles.resetButton]}
              onPress={() => setResetPasswordModalVisible(true)}
            >
              <Ionicons name="lock-closed" size={16} color={Colors.gray} />
              <Text style={[GlobalStyles.buttonText, { color: Colors.primary }]}>Reset Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[GlobalStyles.button, styles.editButton]}
              onPress={() => setEditProfileModalVisible(true)}
            >
              <Ionicons name="create" size={16} color={Colors.white} />
              <Text style={[GlobalStyles.buttonText]}> Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSectionAll}>
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.line} />
            <Text style={styles.infoText}><Text style={styles.insideInfoText}>Name :</Text> {result.firstname + ' ' + result.lastname || "N/A"}</Text>
            <Text style={styles.infoText}><Text style={styles.insideInfoText}>Due Date :</Text> {result.dueDate || "N/A"}</Text>
            <Text style={styles.infoText}><Text style={styles.insideInfoText}>Date of Birth :</Text> {result.dob || "N/A"}</Text>
            <Text style={styles.infoText}><Text style={styles.insideInfoText}>Email :</Text> {result.email || "N/A"}</Text>
            <Text style={styles.infoText}><Text style={styles.insideInfoText}>Phone :</Text> {result.countryCode + ' ' + result.phone || "N/A"}</Text>
          </View>

          {result.dob && (
            <View style={styles.infoSection}>
              <View style={styles.line} />
              <Text style={styles.sectionTitle}>Baby Information</Text>
              <View style={styles.line} />
              <Text style={styles.infoText}><Text style={styles.insideInfoText}>Baby Name :</Text> {result.babyName || "N/A"} </Text>
              <Text style={styles.infoText}><Text style={styles.insideInfoText}>Baby Sex :</Text> {result.babySex || "N/A"}</Text>
            </View>)}

          <View style={styles.infoSection}>
            <View style={styles.line} />
            <Text style={styles.sectionTitle}>Clinic Information</Text>
            <View style={styles.line} />
            <Text style={styles.infoText}><Text style={styles.insideInfoText}>Name :</Text> {result.companyName || "N/A"}</Text>
            <Text style={styles.infoText}><Text style={styles.insideInfoText}>Location :</Text> {result.locationName || "N/A"}</Text>
            <Text style={styles.infoText}><Text style={styles.insideInfoText}>Machine Name :</Text> {result.machineName || "N/A"}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[GlobalStyles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color={Colors.white} />
          <Text style={[GlobalStyles.buttonText]}> Logout</Text>
        </TouchableOpacity>

        <Modal visible={isResetPasswordModalVisible} transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reset Password</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[GlobalStyles.input]}
                  placeholder="Old Password"
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
                <Ionicons name="lock-open-outline" size={20} color={Colors.gray} style={styles.icon} />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={GlobalStyles.input}
                  placeholder="New Password"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <Ionicons name="key-outline" size={20} color={Colors.gray} style={styles.icon} />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={GlobalStyles.input}
                  placeholder="Confirm New Password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Ionicons name="lock-closed-outline" size={20} color={Colors.gray} style={styles.icon} />
              </View>

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <View style={[GlobalStyles.row, { marginBottom: 15, marginTop: 10 }]}>
                <TouchableOpacity
                  onPress={closeResetPassword}
                  style={[GlobalStyles.resetButton, GlobalStyles.allMarginRight, { marginBottom: 15, padding: 12 }]}
                >
                  <Ionicons name="close-circle-outline" size={20} color={Colors.black} style={{ marginRight: 5 }} />
                  <Text style={[GlobalStyles.buttonText, { color: Colors.black }]}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleResetPassword}
                  style={[GlobalStyles.registerButton, GlobalStyles.allMarginLeft, { marginBottom: 15, padding: 12 }]}
                >
                  <Ionicons name="refresh" size={20} color={Colors.white} style={{ marginRight: 5 }} />
                  <Text style={GlobalStyles.buttonText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={isEditProfileModalVisible} transparent>
          <View style={styles.modalContainer}>
            <ScrollView style={[styles.modalContent, { maxHeight: modalContentHeight }]}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <View style={styles.inputContainer}>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                  style={GlobalStyles.input}
                />
                <Ionicons name="person-outline" size={20} color="#888" style={styles.icon} />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  style={GlobalStyles.input}
                />
                <Ionicons name="id-card-outline" size={20} color="#888" style={styles.icon} />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="Due Date"
                  style={GlobalStyles.input}
                  onFocus={() => {
                    setDateField('dueDate');
                    setShowDatePicker(true);
                  }}
                />
                <Ionicons name="today-outline" size={20} color="#888" style={styles.icon} />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  value={dob}
                  onChangeText={setDob}
                  placeholder="Date of Birth"
                  style={GlobalStyles.input}
                  onFocus={() => {
                    setDateField('dob');
                    setShowDatePicker(true);
                  }}
                />
                <Ionicons name="calendar-outline" size={20} color="#888" style={styles.icon} />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  keyboardType="email-address"
                  style={GlobalStyles.input}
                />
                <Ionicons name="mail-outline" size={20} color="#888" style={styles.icon} />
              </View>

              <View style={[styles.inputContainer, styles.picker]}>
                <Ionicons name="globe-outline" size={20} color="#888" style={styles.icon} />
                <RNPickerSelect
                  placeholder={{
                    label: 'Country Code',
                    value: null,

                  }}
                  items={FormattedCountries}
                  onValueChange={(value) => setSelectedCountry(value)}
                  value={selectedCountry}
                  style={{
                    inputIOS: {
                      paddingRight: 30,
                      paddingLeft: 38,
                      fontSize: 14.5,
                      fontWeight: '400',
                      paddingVertical: 10,
                      textAlign: 'left',
                      height: 55,
                    },
                    inputAndroid: {
                      paddingRight: 30,
                      paddingLeft: 38,
                      fontSize: 14.5,
                      fontWeight: '400',
                      paddingVertical: 10,
                      textAlign: 'left',
                      height: 55,
                    },
                    placeholder: {
                      fontSize: 14.5,
                      fontWeight: '350',
                      color: 'gray',
                    },
                  }}
                  useNativeAndroidPickerStyle={false}
                />
                <Ionicons name="chevron-down-outline" size={20} color="#888" style={styles.iconC} />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  value={phone}
                  onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  style={GlobalStyles.input}
                />
                <Ionicons name="phone-portrait-outline" size={20} color="#888" style={styles.icon} />
              </View>

              <TouchableOpacity onPress={() => setShowAdditionalInfo(!showAdditionalInfo)}>
                <Text style={styles.showAdditionalInfoText}>
                  {showAdditionalInfo ? 'Hide Additional Info' : 'Show Additional Info'}
                </Text>
              </TouchableOpacity>

              {showAdditionalInfo && (
                <>
                  <View style={styles.inputContainer}>
                    <TextInput
                      value={spouseName}
                      onChangeText={setSpouseName}
                      placeholder="Spouse Name"
                      style={GlobalStyles.input}
                    />
                    <Ionicons name="person-outline" size={20} color="#888" style={styles.icon} />
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      value={babyName}
                      onChangeText={setBabyName}
                      placeholder="Baby Name"
                      style={GlobalStyles.input}
                    />
                    <Ionicons name="person-add-outline" size={20} color="#888" style={styles.icon} />
                  </View>

                  <View style={[styles.inputContainer, styles.picker]}>
                    <Ionicons name="male-female" size={20} color="#888" style={styles.icon} />
                    <RNPickerSelect
                      placeholder={{
                        label: 'Baby Sex',
                        value: null,

                      }}
                      items={BabySex}
                      onValueChange={(value) => setBabySex(value)}
                      value={babySex}
                      style={{
                        inputIOS: {
                          paddingRight: 30,
                          paddingLeft: 38,
                          fontSize: 14.5,
                          fontWeight: '400',
                          paddingVertical: 10,
                          textAlign: 'left',
                          height: 55,
                        },
                        inputAndroid: {
                          paddingRight: 30,
                          paddingLeft: 38,
                          fontSize: 14.5,
                          fontWeight: '400',
                          paddingVertical: 10,
                          textAlign: 'left',
                          height: 55,
                        },
                        placeholder: {
                          fontSize: 14.5,
                          fontWeight: '350',
                          color: 'gray',
                        },
                      }}
                      useNativeAndroidPickerStyle={false}
                    />
                    <Ionicons name="chevron-down-outline" size={20} color="#888" style={styles.iconC} />
                  </View>

                </>
              )}

              {/* Buttons */}
              <View style={[GlobalStyles.row, { marginBottom: 15, marginTop: 10 }]}>
                <TouchableOpacity
                  onPress={cancelEditProfile}
                  style={[GlobalStyles.resetButton, GlobalStyles.allMarginRight, { marginBottom: 15, padding: 12 }]}
                >
                  <Ionicons name="close-circle-outline" size={20} color={Colors.black} style={{ marginRight: 5 }} />
                  <Text style={[GlobalStyles.buttonText, { color: Colors.black }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveChanges}
                  style={[GlobalStyles.registerButton, GlobalStyles.allMarginLeft, { marginBottom: 15 }]}
                >
                  <Ionicons name="checkmark" size={20} color={Colors.white} style={{ marginRight: 5 }} />
                  <Text style={GlobalStyles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            themeVariant="light"
          />
        )}

        {isLoading && <Loader loading={true} />}
      </ScrollView>
      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  resetButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    padding: 10,
    width: '50%',
    borderRadius: 8,
    height: 50,
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: '50%',
    height: 50,
    borderRadius: 8,
  },
  infoSection: {
    marginBottom: 10,
  },
  infoSectionAll: {
    marginBottom: 10,
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily:'Poppins_600SemiBold',
    color: Colors.profileText,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    fontFamily:'Poppins_400Regular',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  insideInfoText: {
    fontSize: 14,
    fontFamily:'Poppins_600SemiBold',
    color: Colors.textPrimary,
  },
  logoutButton: {
    backgroundColor: Colors.primary,
    marginVertical: 30,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 50,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.lightGray,
    marginBottom: 12,
    marginLeft: -10,
    marginRight: -10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    overflow: 'scroll',
  },
  input: {
    height: 85,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontFamily:'Poppins_400Regular',
  },
  closeText: {
    marginTop: 10,
    color: 'red',
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 40,
    borderRadius: 5,
  },
  showAdditionalInfoText: {
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
  },
  cancelButtontext: {
    color: Colors.primary,
    fontWeight: 'bold',
    paddingLeft: 8,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    paddingLeft: 28,
  },
  icon: {
    position: 'absolute',
    left: 10,
    top: 18,
  },
  iconC: {
    marginRight: 10,
    position: 'absolute',
    right: 10,
    top: 18,
  },
  inputContainer: {
    position: 'relative'
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: Colors.lightGray,
    marginBottom: 15
  }
});

export default ProfileSettingsScreen;
