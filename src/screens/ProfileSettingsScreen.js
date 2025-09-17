import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import GlobalStyles from '../styles/GlobalStyles';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setLoggingOut } from '../state/slices/authSlice';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRouter } from 'expo-router';
import Loader from '../components/Loader';
import Snackbar from '../components/Snackbar';
import { logError } from '../components/logError';
import CustomDropdown from '../components/CustomDropdown';
import { closeDropdown } from '../state/slices/headerSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearOpenStorage2, setForceOpenStorageModals } from '../state/slices/storageUISlice';
import { useTranslation } from 'react-i18next';
import { useDynamicTranslate } from '../constants/useDynamicTranslate';
import Colors from '../constants/Colors.js';
import ManageSubscriptions from '../screens/ManageSubscriptions.js';
import { TabView, TabBar } from 'react-native-tab-view';
import { Gesture } from 'react-native-gesture-handler';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { CommonActions, useRoute } from '@react-navigation/native';
import sendDeviceUserInfo, { USERACTIONS } from '../components/deviceInfo.js';


const ProfileSettingsScreen = ({ route }) => {
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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');
  const [translatedData, setTranslatedData] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [tab, setTab] = useState('Profile');

  const modalContentHeight = showAdditionalInfo ? '95%' : '85%';
  const user = useSelector((state) => state.auth);
  const { subscriptionAmount, subscriptionId, subscriptionIsActive } = useSelector(
    (state) => state.auth
  );
  const expired = useSelector((state) => state.subscription.expired);
  const subscriptionActive = subscriptionIsActive
  const insets = useSafeAreaInsets();
  //const route = useRoute();
  const navigation = useNavigation();

  //const initialTab = route?.params?.screen ?? "Subscriptions";
  const initialTab = route?.params?.screen ?? "Subscriptions";
  const { t } = useTranslation();

  const Tab = createMaterialTopTabNavigator();

  console.log('expired', expired)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/locations/getAllCountries`);
        setCountries(response.data);
      } catch (err) {
        setErrorMessage(t('registration.failedFetchCountries') + err);
        await logError({
          error: err,
          data: err.response?.data || {},
          details: "Error in getAllCountries API call on ProfileSettingScreen"
        });
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (countries.length > 0 && Array.isArray(countries)) {
      const translateCountries = async () => {
        const formatted = await Promise.all(
          countries.map(async (country) => {
            const translatedName = await useDynamicTranslate(country.country_name);
            return {
              label: `+${country.phonecode} ${translatedName}`,
              value: `${country.phonecode}`,
            };
          })
        );
        setFormattedCountries(formatted);
      };
      translateCountries();
    }
  }, [countries]);

  const BabySex = [
    { label: t('profileSettings.gender.male'), value: 'male' },
    { label: t('profileSettings.gender.female'), value: 'female' },
    { label: t('profileSettings.gender.other'), value: 'other' },
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/patients/getPatientByEmail`, {
          params: { email: user.email },
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.data) {
          setResult(response.data);
          const translatedName = await useDynamicTranslate(response.data.firstname + ' ' + response.data.lastname);
          const translatedDueDate = await useDynamicTranslate(response.data.dueDate);
          const translatedDob = await useDynamicTranslate(response.data.dob);
          const translatedEmail = await useDynamicTranslate(response.data.email);
          const translatedPhone = await useDynamicTranslate(response.data.countryCode + ' ' + response.data.phone);
          const translatedBabyName = await useDynamicTranslate(response.data.babyName);
          const translatedBabySex = await useDynamicTranslate(response.data.babySex);
          const translatedCompanyName = await useDynamicTranslate(response.data.companyName);
          const translatedLocationName = await useDynamicTranslate(response.data.locationName);
          const translatedMachineName = await useDynamicTranslate(response.data.machineName);
          setTranslatedData({
            translatedName,
            translatedDueDate,
            translatedDob,
            translatedEmail,
            translatedPhone,
            translatedBabyName,
            translatedBabySex,
            translatedCompanyName,
            translatedLocationName,
            translatedMachineName
          });
          setFirstName(response.data.firstname || '');
          setLastName(response.data.lastname || '');
          setDueDate(response.data.dueDate || '');
          setDob(response.data.dob || '');
          setEmail(response.data.email || '');
          setCountryCode(response.data.countryCode || 1);
          setPhone(response.data.phone || '');
          setSpouseName(response.data.spouseFirstName || '');
          setBabyName(response.data.babyName || '');
          setBabySex(response.data.babySex || '');
        } else {
          setSnackbarMessage(t('profileSettings.snackbar.dataFetchFailed'));
          setSnackbarType('error');
          setSnackbarVisible(true);
        }
      } catch (error) {
        setSnackbarMessage(t('profileSettings.snackbar.dataFetchFailed'));
        setSnackbarType('error');
        setSnackbarVisible(true);
        await logError({
          error: error,
          data: error.response?.data.error || {},
          details: "Error in getPatientByEmail API call on ProfileSettingScreen"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [isEditProfileModalVisible]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.setItem('logoutInProgress', 'true');
      dispatch(setLoggingOut(true));
      await AsyncStorage.multiRemove([
        'token', 'userData', 'tokenExpiry', 'storage_modal_triggered',
        'payment_status', 'payment_status 1', 'paying', 'last_skipped_plan_date',
        'notifications'
      ]);
      dispatch(clearOpenStorage2());
      dispatch(setForceOpenStorageModals(false));
      dispatch(closeDropdown());
      dispatch(logout());
      setTimeout(() => { router.replace('/login'); }, 100);
    } catch (error) {
      dispatch(setLoggingOut(false));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dob;
    setShowDatePicker(false);
    const formattedDate = currentDate.toLocaleDateString("en-US");
    if (dateField === 'dob' && formattedDate !== dob) setDob(formattedDate);
    else if (dateField === 'dueDate' && formattedDate !== dueDate) setDueDate(formattedDate);
  };

  const handleResetPassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage(t('profileSettings.snackbar.missingFields'));
      return;
    }
    const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]).{6,}$/;
    if (!passRegex.test(newPassword)) {
      setErrorMessage(t('profileSettings.snackbar.passwordInvalid'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage(t('profileSettings.snackbar.passwordMismatch'));
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.post(`${EXPO_PUBLIC_API_URL}/api/auth/change-password`, {
        currentPassword: oldPassword,
        newPassword: newPassword,
      }, { headers: { 'Content-Type': 'application/json' } });
      if (response.data.actionStatus === "success") {
        setResetPasswordModalVisible(false);
        setErrorMessage('');
        setSnackbarMessage(useDynamicTranslate(response.data.message));
        setSnackbarType('success');
        setSnackbarVisible(true);

        sendDeviceUserInfo({
          action_type: USERACTIONS.RESETPASSWORD,
          action_description: `User Reset Password Successfully`,
        });
      } else {
        setResetPasswordModalVisible(false);
        setErrorMessage('');
        setSnackbarMessage(useDynamicTranslate(response.data.message));
        setSnackbarType('error');
        setSnackbarVisible(true);
      }
    } catch (error) {
      setErrorMessage(t('profileSettings.snackbar.resetPasswordFailed'));
      setSnackbarMessage(t('profileSettings.snackbar.resetPasswordFailed'));
      setSnackbarType('error');
      setSnackbarVisible(true);
      await logError({
        error: error,
        data: error.response?.data?.error || {},
        details: "Error in change-password API call on ProfileSettingScreen"
      });
    } finally {
      setIsLoading(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleSaveChanges = async () => {

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      setErrorMessage(t('profileSettings.snackbar.invalidEmail'));
      return;
    }

    const phoneRegex = /^(?:\+1\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
    if (!dueDate) {
      setErrorMessage(t('profileSettings.snackbar.pleaseSelectDueDate'));
      return;
    }

    const currentDueDate = new Date();
    if (dueDate) {
      const [dueDay, dueMonth, dueYear] = dueDate.split('/');
      const formattedDueDate = new Date(`${dueYear}-${dueMonth}-${dueDay}`);

      if (formattedDueDate < currentDueDate) {
        setErrorMessage(t('profileSettings.snackbar.dueDateCannotBePast'));
        return;
      }
    }

    const currentDate = new Date();
    if (dob) {
      const [dobDay, dobMonth, dobYear] = dob.split('/');
      const formattedDueDate = new Date(`${dobYear}-${dobMonth}-${dobDay}`);

      if (formattedDueDate > currentDate) {
        setErrorMessage(t('profileSettings.snackbar.birthDateCannotBeFuture'));
        return;
      }
    }

    if (!firstName || !lastName) {
      setErrorMessage(t('profileSettings.snackbar.missingFields'));
      return;
    }

    try {
      const response = await axios.put(`${EXPO_PUBLIC_API_URL}/api/patients/update`,
        {
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phone,
          countryCode: selectedCountry || countryCode,
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
        setSnackbarMessage(t('profileSettings.snackbar.editProfileSuccess'));
        setSnackbarType('success');
        setSnackbarVisible(true);

        sendDeviceUserInfo({
          action_type: USERACTIONS.EDIT,
          action_description: `User edit profile Successfully`,
        });
      }
    } catch (error) {
      setErrorMessage(t('profileSettings.snackbar.editProfileFailed'));
      setSnackbarMessage(t('profileSettings.snackbar.editProfileFailed'));
      setSnackbarType('error');
      setSnackbarVisible(true);
      await logError({
        error: error,
        data: error.response?.data.error || response.data.error,
        details: "Error in patients/update API call on ProfileSettingScreen"
      });
    } finally {
      setIsLoading(false);
    }
    setEditProfileModalVisible(false);
  };

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length < 4) return cleaned;
    else if (cleaned.length < 7) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    else return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const closeResetPassword = () => { setResetPasswordModalVisible(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); setErrorMessage(''); }
  const cancelEditProfile = () => { setEditProfileModalVisible(false); setFirstName(result.firstname || ''); setLastName(result.lastname || ''); setDueDate(result.dueDate || ''); setDob(result.dob || ''); setEmail(result.email || ''); setCountryCode(result.countryCode || ''); setPhone(result.phone || ''); setSpouseName(result.spouseFirstName || ''); setBabyName(result.babyName || ''); setBabySex(result.babySex || ''); }

  const handleDeleteAccount = async () => {
    try {
      const response = await axios.delete(`${EXPO_PUBLIC_API_URL}/api/patients/delete`, { data: { uuid: user.uuid }, headers: { 'Content-Type': 'application/json' } });
      if (response.data.actionStatus === 'success') {
        await AsyncStorage.removeItem('token');
        dispatch(logout());
        setModalTitle(t('profileSettings.snackbar.accountDeleted'));
        setModalMessage(t('profileSettings.snackbar.accountDeletionSuccess'));
        setModalType('success');
        setStatusModalVisible(true);

        sendDeviceUserInfo({
          action_type: USERACTIONS.DELETE,
          action_description: `User Delete account Successfully`,
        });
      } else {
        setModalTitle(t('profileSettings.snackbar.deletionFailed'));
        setModalMessage(t('profileSettings.snackbar.accountDeletionFailed'));
        setModalType('error');
        setStatusModalVisible(true);
        setSnackbarMessage(t('profileSettings.snackbar.accountDeletionFailed'));
        setSnackbarType('error');
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage(t('profileSettings.snackbar.accountDeletionFailed'));
      setSnackbarType('error');
      setSnackbarVisible(true);
      await logError({ error, details: 'Error in delete account API' });
    } finally { setDeleteModalVisible(false); }
  };

  const ProfileTab = () => (
    <ScrollView style={[GlobalStyles.container, { padding: 10, marginBottom: 65 }]}>
      <View style={styles.profileCardWrapper}>
        <LinearGradient
          colors={['rgb(252, 231, 243)', 'rgb(243, 232, 255)', 'rgb(224, 242, 254)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={64} color={Colors.gray} />
          </View>
          <Text style={styles.profileName}>{result.firstname + ' ' + result.lastname || 'N/A'}</Text>
          <TouchableOpacity
            style={[styles.actionButton]}
            onPress={() => setResetPasswordModalVisible(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="key-outline" size={18} color={Colors.primary} />
              <Text style={[styles.actionButtonText, { marginLeft: 6 }]}>
                {t('profileSettings.resetPassword')}
              </Text>
            </View>
          </TouchableOpacity>

          <LinearGradient
            colors={["#d63384", "#9b2c6f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.actionButton]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setEditProfileModalVisible(true)}
              style={styles.editButton}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={[styles.actionButtonText, styles.editButtonText]}>
                {String(t("profileSettings.editProfile"))}
              </Text>
            </TouchableOpacity>
          </LinearGradient>


        </LinearGradient>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t('profileSettings.personalInfo')}</Text>
        <View style={styles.line} />


        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={20} color={Colors.primary} style={styles.infoIcon} />
          <Text style={styles.infoLabel}>{t('profileSettings.name')}:</Text>
          <Text style={styles.infoValue}>{result.firstname + ' ' + result.lastname || 'N/A'}</Text>
        </View>


        <View style={styles.infoRow}>
          <MaterialIcons name="event" size={20} color={Colors.error} style={styles.infoIcon} />
          <Text style={styles.infoLabel}>{t('profileSettings.dueDate')}:</Text>
          <Text style={styles.infoValue}>{result.dueDate || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="cake" size={20} color='blue' style={styles.infoIcon} />
          <Text style={styles.infoLabel}>{t('profileSettings.dob')}:</Text>
          <Text style={styles.infoValue}>{result.dob || 'N/A'}</Text>
        </View>


        <View style={styles.infoRow}>
          <MaterialIcons name="email" size={20} color={Colors.primary} style={styles.infoIcon} />
          <Text style={styles.infoLabel}>{t('profileSettings.email')}:</Text>
          <Text style={styles.infoValue}>{result.email || 'N/A'}</Text>
        </View>


        <View style={styles.infoRow}>
          <MaterialIcons name="phone" size={20} color='green' style={styles.infoIcon} />
          <Text style={styles.infoLabel}>{t('profileSettings.phone')}:</Text>
          <Text style={styles.infoValue}>{result.countryCode + ' ' + result.phone || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="favorite" size={20} color='red' style={styles.infoIcon} />
          <Text style={styles.infoLabel}>{t('profileSettings.spouseName')}:</Text>
          <Text style={styles.infoValue}>{result.spouseFirstName || 'N/A'}</Text>
        </View>
        {/* </View>  */}

        {result.dob && (
          <View>
            <View style={styles.line} />
            <Text style={styles.babyInfoTitle}>{t('profileSettings.babyInfo')}</Text>
            <View style={styles.line} />

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="baby-face" size={20} color='rgba(241, 28, 170, 1)' style={styles.infoIcon} />
              <Text style={styles.infoLabel}>{t('profileSettings.babyName')}:</Text>
              <Text style={styles.infoValue}>{translatedData.translatedBabyName || "N/A"}</Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="gender-male-female" size={20} color={Colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoLabel}>{t('profileSettings.babySex')}:</Text>
              <Text style={styles.infoValue}>{translatedData.translatedBabySex || "N/A"}</Text>
            </View>
          </View>
        )}

        <View style={styles.line} />
        <Text style={styles.companyInfoTitle}>{t('profileSettings.clinicInfo')}</Text>
        <View style={styles.line} />

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="office-building" size={20} color='rgb(220, 0, 78)' style={styles.infoIcon} />
          <Text style={styles.infoLabel}>{t('profileSettings.companyName')}:</Text>
          <Text style={styles.infoValue}>{translatedData.translatedCompanyName || "N/A"}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker" size={20} color={Colors.primary} style={styles.infoIcon} />
          <Text style={styles.infoLabel}>{t('profileSettings.locationName')}:</Text>
          <Text style={styles.infoValue}>{translatedData.translatedLocationName || "N/A"}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="stethoscope" size={20} color='blue' style={styles.infoIcon} />
          <Text style={styles.infoLabel}>{t('profileSettings.machineName')}:</Text>
          <Text style={styles.infoValue}>{translatedData.translatedMachineName || "N/A"}</Text>
        </View>
      </View>


      <TouchableOpacity activeOpacity={0.8} onPress={handleLogout}>
        <LinearGradient
          colors={["#d63384", "#9b2c6f"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[GlobalStyles.button, styles.logoutButton, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
        >
          <Ionicons name="log-out" size={20} color="#fff" />
          <Text style={[GlobalStyles.buttonText, { marginLeft: 6 }]}>
            {t("profileSettings.logout")}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.8} onPress={() => setDeleteModalVisible(true)}>
        <LinearGradient
          colors={["#d63384", "#9b2c6f"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[GlobalStyles.button, styles.deleteButton, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
        >
          <Ionicons name="trash-bin" size={20} color="#fff" />
          <Text style={[GlobalStyles.buttonText, { marginLeft: 6 }]}>
            {t("profileSettings.deleteAccount")}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  const ManageSubscriptionsTab = () => {
    return <ManageSubscriptions />;
  };

  return (
    <View style={[GlobalStyles.container, Platform.OS === 'android' ? { paddingTop: insets.top } : null]}>
      <Header title={t('profileSettings.title')} showMenu={false} />
      <Loader loading={isLoading} />

      <Tab.Navigator
        initialRouteName={subscriptionActive ? "Subscriptions" : "Profile"}
        //initialRouteName=  {initialTab}
        screenOptions={{
          tabBarIndicatorStyle: { backgroundColor: Colors.primary },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.gray,
          tabBarLabelStyle: { fontFamily: 'Nunito700', fontSize: 16 },
          swipeEnabled: true,
          tabBarStyle: !subscriptionActive && { display: "none" },
        }}
      >
        <Tab.Screen
          name="Profile"
          options={{
            tabBarLabel: ({ color }) => (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="person-circle" size={20} color={color} />
                <Text style={{ color, marginLeft: 6, fontFamily: "Nunito700" }}>
                  {t("flix10k.profile")}
                </Text>
              </View>
            ),
          }}
          component={ProfileTab}
        />
        {(subscriptionActive && subscriptionId) && (
          <Tab.Screen
            name="Subscriptions"
            options={{
              tabBarLabel: ({ color }) => (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="card-outline" size={20} color={color} />
                  <Text style={{ color, marginLeft: 6, fontFamily: "Nunito700" }}>
                    {t("flix10k.subscriptions")}
                  </Text>
                </View>
              ),
            }}
            component={ManageSubscriptions}
          />
        )}
      </Tab.Navigator>

      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={48} color={Colors.error} />
              <Text style={styles.modalTitle}>{t('profileSettings.confirmDeletionTitle')}</Text>
              <Text style={styles.modalMessage}>
                {t('profileSettings.confirmDeletionMessage')}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('profileSettings.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setDeleteModalVisible(false);
                  handleDeleteAccount();
                }}
              >
                <LinearGradient
                  colors={["#dc3545", "#f86977ff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deleteButtonModel}
                >
                  <Text style={styles.deleteButtonText}>
                    {String(t("profileSettings.delete"))}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.successModalContainer}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={modalType === 'success' ? 'checkmark-circle' : 'close-circle'}
                size={60}
                color={modalType === 'success' ? 'green' : 'red'}
              />
              <Text style={styles.successTitle}>{modalTitle}</Text>
              <Text style={styles.successMessage}>{modalMessage}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.okButton,
                { backgroundColor: modalType === 'success' ? 'green' : 'red' },
              ]}
              onPress={() => {
                setStatusModalVisible(false);
                if (modalType === 'success') router.replace('login');
              }}
            >
              <Text style={styles.okButtonText}>{t('profileSettings.ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isResetPasswordModalVisible} transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('profileSettings.resetPasswordModalTitle')}</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[GlobalStyles.input, { fontFamily: Platform.OS === 'android' ? 'Nunito400' : undefined }]}
                  placeholder={t('profileSettings.oldPasswordPlaceholder')}
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Ionicons name="lock-open-outline" size={20} color={Colors.gray} style={styles.icon} />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[GlobalStyles.input, { fontFamily: Platform.OS === 'android' ? 'Nunito400' : undefined }]}
                  placeholder={t('profileSettings.newPasswordPlaceholder')}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Ionicons name="key-outline" size={20} color={Colors.gray} style={styles.icon} />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[GlobalStyles.input, { fontFamily: Platform.OS === 'android' ? 'Nunito400' : undefined }]}
                  placeholder={t('profileSettings.confirmPasswordPlaceholder')}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Ionicons name="lock-closed-outline" size={20} color={Colors.gray} style={styles.icon} />
              </View>

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <View style={[GlobalStyles.row, { marginBottom: 5, marginTop: 10 }]}>
                <TouchableOpacity
                  onPress={closeResetPassword}
                  style={[GlobalStyles.resetButton, GlobalStyles.allMarginRight, { marginBottom: 15, padding: 12, borderRadius: 20 }]}
                >
                  <Ionicons name="close-circle-outline" size={20} color={Colors.black} style={{ marginRight: 5 }} />
                  <Text style={[GlobalStyles.buttonText, { color: Colors.black }]}>{t('profileSettings.close')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleResetPassword}
                  style={[GlobalStyles.allMarginLeft, { marginBottom: 15 }]}
                >
                  <LinearGradient
                    colors={["#d63384", "#9b2c6f"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[GlobalStyles.registerButton, { padding: 12, paddingHorizontal: 30, flexDirection: "row", alignItems: "center", borderRadius: 20 }]}
                  >
                    <Ionicons name="refresh" size={20} color={Colors.white} style={{ marginRight: 5 }} />
                    <Text style={GlobalStyles.buttonText}>
                      {String(t("profileSettings.reset"))}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
        {isLoading && <Loader loading={true} />}
      </Modal>

      <Modal visible={isEditProfileModalVisible} transparent>
        <View style={styles.modalContainer}>
          <ScrollView style={[styles.modalContent, { maxHeight: modalContentHeight }]}>
            <Text style={styles.modalTitle}>{t('profileSettings.editProfileModalTitle')}</Text>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <View style={styles.inputContainer}>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('profileSettings.firstNamePlaceholder')}
                style={GlobalStyles.input}
              />
              <Ionicons name="person-outline" size={20} color="#888" style={styles.icon} />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('profileSettings.lastNamePlaceholder')}
                style={GlobalStyles.input}
              />
              <Ionicons name="id-card-outline" size={20} color="#888" style={styles.icon} />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                value={dueDate}
                onChangeText={setDueDate}
                placeholder={t('profileSettings.dueDatePlaceholder')}
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
                placeholder={t('profileSettings.dobPlaceholder')}
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
                placeholder={t('profileSettings.emailPlaceholder')}
                keyboardType="email-address"
                style={GlobalStyles.input}
              />
              <Ionicons name="mail-outline" size={20} color="#888" style={styles.icon} />
            </View>

            <CustomDropdown
              selectedValue={selectedCountry}
              onSelect={(item) => {
                setSelectedCountry(item);
              }}
              options={FormattedCountries}
              placeholder={t('profileSettings.countryCodePlaceholder')}
              iconName="globe-outline"
            />

            <View style={styles.inputContainer}>
              <TextInput
                value={phone}
                onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                placeholder={t('profileSettings.phonePlaceholder')}
                keyboardType="phone-pad"
                style={GlobalStyles.input}
              />
              <Ionicons name="phone-portrait-outline" size={20} color="#888" style={styles.icon} />
            </View>

            <TouchableOpacity onPress={() => setShowAdditionalInfo(!showAdditionalInfo)}>
              <Text style={styles.showAdditionalInfoText}>
                {showAdditionalInfo ? t('profileSettings.hideAdditionalInfo') : t('profileSettings.showAdditionalInfo')}
              </Text>
            </TouchableOpacity>

            {showAdditionalInfo && (
              <>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={spouseName}
                    onChangeText={setSpouseName}
                    placeholder={t('profileSettings.spouseNamePlaceholder')}
                    style={GlobalStyles.input}
                  />
                  <Ionicons name="person-outline" size={20} color="#888" style={styles.icon} />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    value={babyName}
                    onChangeText={setBabyName}
                    placeholder={t('profileSettings.babyNamePlaceholder')}
                    style={GlobalStyles.input}
                  />
                  <Ionicons name="person-add-outline" size={20} color="#888" style={styles.icon} />
                </View>

                <CustomDropdown
                  selectedValue={babySex}
                  onSelect={setBabySex}
                  options={BabySex}
                  placeholder={t('profileSettings.babySexPlaceholder')}
                  iconName="male-female"
                />
              </>
            )}

            <View style={[GlobalStyles.row, { marginBottom: 15, marginTop: 10 }]}>
              <TouchableOpacity
                onPress={cancelEditProfile}
                style={[GlobalStyles.resetButton, GlobalStyles.allMarginRight, { marginBottom: 15, padding: 12, borderRadius: 20 }]}
              >
                <Ionicons name="close-circle-outline" size={20} color={Colors.black} style={{ marginRight: 5 }} />
                <Text style={[GlobalStyles.buttonText, { color: Colors.black }]}>{t('profileSettings.cancelButton')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveChanges}
                style={[GlobalStyles.allMarginLeft, { marginBottom: 15 }]}
              >
                <LinearGradient
                  colors={["#d63384", "#9b2c6f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[GlobalStyles.registerButton, { padding: 12, paddingHorizontal: 32, flexDirection: "row", alignItems: "center", borderRadius: 20 }]}
                >
                  <Ionicons name="checkmark" size={20} color={Colors.white} style={{ marginRight: 5 }} />
                  <Text style={GlobalStyles.buttonText}>
                    {String(t("profileSettings.save"))}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
        {isLoading && <Loader loading={true} />}
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
    fontFamily: 'Nunito400',
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    width: "100%",
    //height: 50,
    borderRadius: 30
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
    fontFamily: 'Nunito700',
    color: Colors.profileText,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Nunito400',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  insideInfoText: {
    fontSize: 14,
    fontFamily: 'Nunito700',
    color: Colors.textPrimary,
  },
  logoutButton: {
    backgroundColor: Colors.primary,
    //marginVertical: 0,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 45,
    paddingVertical: 10,
    //marginVertical: 6,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.primary,
    marginBottom: 30,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 45,
    paddingVertical: 10,
    //marginVertical: 6,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.primary,
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
    backgroundColor: '#fdf2f8',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    overflow: 'scroll',
  },
  modalMessage: {
    fontFamily: 'Nunito700',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
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
    fontFamily: 'Nunito400',
  },
  closeText: {
    marginTop: 10,
    color: 'red',
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito700',
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
    fontFamily: 'Nunito700',
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
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'Nunito700',
  },
  deleteButtonModel: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: 10,
    paddingHorizontal: 35,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito700',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successModalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  successTitle: {
    marginTop: 12,
    fontSize: 20,
    fontFamily: 'Nunito700',
  },
  successMessage: {
    textAlign: 'center',
    marginTop: 6,
    color: '#666',
    fontSize: 15,
    fontFamily: 'Nunito400',
  },
  okButton: {
    backgroundColor: 'green',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 20,
  },
  okButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito700',
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
    alignItems: "center",
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileName: {
    fontFamily: 'Nunito700',
    fontSize: 20,
    //fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  actionButton: {
    width: "70%",
    paddingVertical: 10,
    marginVertical: 6,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontFamily: 'Nunito700',
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  editButtonText: {
    fontFamily: 'Nunito700',
    color: "#fff",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  infoTitle: {
    fontFamily: 'Nunito700',
    fontSize: 22,
    //fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 16,
  },
  babyInfoTitle: {
    fontFamily: 'Nunito700',
    fontSize: 18,
    //fontWeight: "bold",
    color: Colors.gray,
    marginBottom: 16,
    //marginTop: 10,
  },
  companyInfoTitle: {
    fontFamily: 'Nunito700',
    fontSize: 18,
    //fontWeight: "bold",
    color: Colors.gray,
    marginBottom: 16,
    //marginTop: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontFamily: 'Nunito700',
    fontWeight: "600",
    color: "#444",
    width: 100,
  },
  infoValue: {
    fontFamily: 'Nunito400',
    flex: 1,
    color: "#666",
  },
  tabBar: {
    backgroundColor: Colors.white,
  },
  tabLabel: {
    color: Colors.black,
    fontWeight: 'bold',
  },
  tabIndicator: {
    backgroundColor: Colors.primary,
    height: 3,
  },
});

export default ProfileSettingsScreen;
