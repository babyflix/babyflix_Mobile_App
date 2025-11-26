// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Keyboard,
//   Linking,
//   TouchableWithoutFeedback,
//   Modal,
//   Pressable,
//   FlatList,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import GlobalStyles from '../styles/GlobalStyles';
// import Colors from '../constants/Colors';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { EXPO_PUBLIC_API_URL } from '@env';
// import axios from 'axios';
// import CommonSVG from '../components/commonSvg';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Loader from '../components/Loader';
// import Snackbar from '../components/Snackbar';
// import { logError } from '../components/logError';
// import { useTranslation } from 'react-i18next';
// import i18n from '../constants/i18n';
// import { useDynamicTranslate } from '../constants/useDynamicTranslate';

// const IconInput = ({
//   iconName,
//   placeholder,
//   value,
//   onChangeText,
//   secureTextEntry,
//   keyboardType,
//   autoCapitalize,
//   onFocus,
//   rightIcon,
//   onRightIconPress,
// }) => (
//   <View style={styles.inputRow}>
//     <Icon name={iconName} size={20} color={Colors.gray} style={styles.leftIcon} />

//     <TextInput
//       style={styles.textInput}
//       placeholder={placeholder}
//       placeholderTextColor="#777"
//       value={value}
//       onChangeText={onChangeText}
//       secureTextEntry={secureTextEntry}
//       keyboardType={keyboardType}
//       autoCapitalize={autoCapitalize}
//       onFocus={onFocus}
//     />

//     {rightIcon && (
//       <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
//         <Icon name={rightIcon} size={22} color={Colors.gray} />
//       </TouchableOpacity>
//     )}
//   </View>
// );

// const RegisterScreen = () => {
//   const router = useRouter();
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     familyOf: '',
//     countryCode: '',
//     phone: '',
//     accountType: '',
//     dob: '',
//     dueDate: '',
//   });

//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [dateField, setDateField] = useState(null);
//   const [termsAccepted, setTermsAccepted] = useState(false);
//   const [error, setError] = useState('');
//   const [countries, setCountries] = useState([]);
//   const [FormattedCountries, setFormattedCountries] = useState([]);
//   const [svgColor, setSvgColor] = useState(Colors.primary);
//   const [isLoading, setIsLoading] = useState(false);
//   const [snackbarVisible, setSnackbarVisible] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState('');
//   const [snackbarType, setSnackbarType] = useState('success');
//   const [showAccountTypeOptions, setShowAccountTypeOptions] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [tempDate, setTempDate] = useState(new Date());
//   const [showPhoneInfo, setShowPhoneInfo] = useState(false);

//   const { t } = useTranslation();

//   useEffect(() => {
//     const fetchCountries = async () => {
//       try {
//         const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/locations/getAllCountries`);
//         setCountries(response.data);
//       } catch (err) {
//         setError(t('registration.failedFetchCountries') + err);
//         await logError({
//           error: err,
//           data: err.response?.data.error || response.data.error,
//           details: "Error in getAllCountries API call on  RegisterScreen"
//         });
//       }
//     };
//     fetchCountries();
//   }, []);

//   useEffect(() => {
//     if (formData.accountType === 'patient') {
//       setFormData({ ...formData, familyOf: "" });
//     }

//     if (formData.accountType === 'patient-family') {
//       setFormData({ ...formData, dob: '', dueDate: '' });
//     }
//   }, [formData.accountType]);

//   useEffect(() => {
//     if (countries.length > 0) {
//       const translateCountries = async () => {
//         const formatted = await Promise.all(
//           countries.map(async (country) => {
//             const translatedName = await useDynamicTranslate(country.country_name);
//             return {
//               label: `+${country.phonecode} ${translatedName}`,
//               value: `${country.phonecode}_${country.country_name}`,
//             };
//           })
//         );
//         setFormattedCountries(formatted);
//       };

//       translateCountries();
//     }
//   }, [countries]);

//   const accountType = [
//     { label: t('registration.patient'), value: 'patient' },
//     { label: t('registration.patient-family'), value: 'patient-family' },
//   ];

//   const handleRegister = async () => {
//     const { firstName, lastName, email, password, confirmPassword, phone, dueDate, familyOf, accountType, dob } = formData;

//     setError('');

//     if (!firstName || !lastName || !email || !password || !confirmPassword) {
//       setError(t('registration.pleaseFillAllFields'));
//       return;
//     }

//     const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
//     if (!emailRegex.test(email)) {
//       setError(t('registration.invalidEmail'));
//       return;
//     }

//     const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]).{6,}$/;
//     if (!passRegex.test(password)) {
//       setError(t('registration.invalidPassword'));
//       return;
//     }

//     if (password !== confirmPassword) {
//       setError(t('registration.passwordsDoNotMatch'));
//       return;
//     }

//     if (!termsAccepted) {
//       setError(t('registration.acceptTerms'));
//       return;
//     }

//     const phoneRegex = /^(?:\+1\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
//     // if (!phoneRegex.test(phone)) {
//     //   setError('Please enter a valid USA phone number.');
//     //   return;
//     // }

//     // if (accountType === 'patient' && !dob) {
//     //   setError('Please select a date of birth');
//     //   return;
//     // }

//     if (accountType === 'patient' && !dueDate) {
//       setError(t('registration.selectDueDate'));
//       return;
//     }

//     const currentDueDate = new Date();
//     if (dueDate) {
//       const [dueMonth, dueDay, dueYear] = dueDate.split('/');
//       const formattedDueDate = new Date(`${dueYear}-${dueMonth}-${dueDay}`);

//       if (formattedDueDate < currentDueDate) {
//         setError(t('registration.dueDatePast'));
//         return;
//       }
//     }

//     const currentDate = new Date();
//     if (dob) {
//       const [dobMonth, dobDay, dobYear] = dob.split('/');
//       const formattedDobDate = new Date(`${dobYear}-${dobMonth}-${dobDay}`);

//       if (formattedDobDate > currentDate) {
//         setError(t('registration.dobFuture'));
//         return;
//       }
//     }

//     if (accountType === 'family' && !familyOf) {
//       setError(t('registration.enterFamilyEmail'));
//       return;
//     }

//     if (accountType === 'family' && !emailRegex.test(familyOf)) {
//       setError(t('registration.invalidFamilyEmail'));
//       return;
//     }

//     setError('');
//     setIsLoading(true);

//     try {
//       const timezone = await AsyncStorage.getItem('timezone');
//       const token = await AsyncStorage.getItem('token');

//       const response = await axios.post(
//         `${EXPO_PUBLIC_API_URL}/api/auth/register`,
//         {
//           accountFor: formData.accountType,
//           firstName: formData.firstName,
//           lastName: formData.lastName,
//           email: formData.email,
//           password: formData.password,
//           confirmPassword: formData.confirmPassword,
//           familyOf: formData.familyOf,
//           countryCode: formData.countryCode?.split('_')[0],
//           phone: formData.phone,
//           dob: formData.dob,
//           dueDate: formData.dueDate,
//           agree: termsAccepted,
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Cookie': `Timezone=${timezone || 'UTC'}; Token=${token || ''}`,
//           },
//         }
//       );
//       if (response.data.actionStatus == "success") {
//         setSnackbarMessage(t('registration.registrationSuccess'));
//         setSnackbarType('success');
//         setSnackbarVisible(true);
//         setTimeout(() => {
//           router.replace('/login');
//         }, 3000)
//       } else {
//         setSnackbarMessage(response.data.error || t('registration.registrationFailed'));
//         setSnackbarType('error');
//         setSnackbarVisible(true);
//         await logError({
//           error: response.data.error,
//           data: response?.data.error || error,
//           details: "Error in register API call on RegisterScreen"
//         });
//       }
//     } catch (error) {
//       setSnackbarMessage(response.data.error || t('registration.genericError'));
//       setSnackbarType('error');
//       setSnackbarVisible(true);
//       await logError({
//         error: error,
//         data: error.response?.data.error || response.data.error,
//         details: "Error in register API call on RegisterScreen"
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleAccountTypeChange = (type) => {
//     setFormData({ ...formData, accountType: type });
//   };

//   const formatDate = (date) => {
//     const month = date.getMonth() + 1;
//     const day = date.getDate();
//     const year = date.getFullYear();

//     const formattedMonth = month < 10 ? `0${month}` : month;
//     const formattedDay = day < 10 ? `0${day}` : day;

//     return `${formattedMonth}/${formattedDay}/${year}`;
//   };

//   const handleDateChange = (event, selectedDate) => {
//     const currentDate = selectedDate || formData.dob;
//     setShowDatePicker(false);

//     const formattedDate = formatDate(currentDate);

//     if (dateField === 'dob' && formattedDate !== formData.dob) {
//       setTempDate(currentDate);
//       setFormData({ ...formData, dob: formattedDate });
//     } else if (dateField === 'dueDate' && formattedDate !== formData.dueDate) {
//       setFormData({ ...formData, dueDate: formattedDate });
//     }
//   };

//   const handleReset = () => {
//     setFormData({
//       firstName: '',
//       lastName: '',
//       email: '',
//       password: '',
//       confirmPassword: '',
//       familyOf: '',
//       countryCode: '',
//       phone: '',
//       accountType: '',
//       dob: '',
//       dueDate: '',
//     });
//     setTermsAccepted(false);
//     setError('');
//   };

//   const formatPhoneNumber = (text) => {
//     const cleaned = text.replace(/\D/g, '');

//     if (cleaned.length < 4) {
//       return cleaned;
//     } else if (cleaned.length < 7) {
//       return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
//     } else {
//       return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
//     }
//   };

//   useEffect(() => {
//     const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
//       setSvgColor(Colors.white);
//     });

//     const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
//       setSvgColor(Colors.primary);
//     });

//     return () => {
//       keyboardDidHideListener.remove();
//       keyboardDidShowListener.remove();
//     };
//   }, []);

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
//       style={GlobalStyles.container}
//     >
//       <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
//         <View style={{ flex: 1 }} pointerEvents="box-none">
//           <View style={styles.container}>
//             <CommonSVG color={svgColor} />


//             <View style={{ alignItems: 'center' }}>
//               <Text style={[GlobalStyles.title, { marginTop: 100 }]}>{t('registration.title')}</Text>
//             </View>

//             <ScrollView
//               keyboardShouldPersistTaps="handled"
//               contentContainerStyle={[GlobalStyles.registrationScreenPadding, { position: 'relative' }]}
//             >
//               <View >

//                 {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}

//                 <View style={[GlobalStyles.row, { marginBottom: 15 }]}>
//   <View style={[styles.allMarginRight, { flex: 1 }]}>
//     <IconInput
//       iconName="person"
//       placeholder={t('registration.placeholders.firstName')}
//       value={formData.firstName}
//       onChangeText={(text) => setFormData({ ...formData, firstName: text })}
//     />
//   </View>

//   <View style={[styles.allMarginLeft, { flex: 1 }]}>
//     <IconInput
//       iconName="person"
//       placeholder={t('registration.placeholders.lastName')}
//       value={formData.lastName}
//       onChangeText={(text) => setFormData({ ...formData, lastName: text })}
//     />
//   </View>
// </View>


//                 <View style={{ position: 'relative' }}>
//                   <TextInput
//                     style={[GlobalStyles.input, { paddingLeft: 38, color: 'black' }]}
//                     placeholder={t('registration.placeholders.email')}
//                     value={formData.email}
//                     onChangeText={(text) => setFormData({ ...formData, email: text })}
//                     keyboardType="email-address"
//                     autoCapitalize="none"
//                   />
//                   <Icon
//                     name="email"
//                     size={20}
//                     color={Colors.gray}
//                     style={{ position: 'absolute', left: '3%', top: 15 }}
//                   />
//                 </View>

//                 <View style={[GlobalStyles.row]}>
//                   <View
//                     pointerEvents="box-none"
//                     style={[
//                       styles.textInputIconView,
//                       {
//                         marginBottom: 15,
//                         width: '100%',
//                         justifyContent: 'center',
//                         paddingLeft: 22,
//                         height: 55,
//                         zIndex: 10,
//                       },
//                     ]}
//                   >
//                     <Icon
//                       name="account-circle"
//                       size={20}
//                       color={Colors.gray}
//                       style={{
//                         position: 'absolute',
//                         left: '3%',
//                         top: 15,
//                         zIndex: 1,
//                       }}
//                     />

//                     <TouchableOpacity
//                       onPress={() => setShowAccountTypeOptions(!showAccountTypeOptions)}
//                       style={{
//                         height: 50,
//                         width: '100%',
//                         paddingLeft: 15,
//                         justifyContent: 'center',
//                       }}
//                     >
//                       <Text
//                         style={{
//                           fontSize: 14,
//                           fontFamily: 'Nunito400',
//                           color: formData.accountType ? 'black' : 'gray',
//                         }}
//                       >
//                         {formData.accountType
//                           ? accountType.find((opt) => opt.value === formData.accountType)?.label
//                           : t('registration.placeholders.accountType')}
//                       </Text>
//                     </TouchableOpacity>

//                     <Icon
//                       name={showAccountTypeOptions ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
//                       size={20}
//                       color={Colors.gray}
//                       style={{
//                         position: 'absolute',
//                         right: '5%',
//                         top: 15,
//                         zIndex: 1,
//                       }}
//                     />

//                     {showAccountTypeOptions && (
//                       <View
//                         style={{
//                           position: 'absolute',
//                           top: 55,
//                           left: 0,
//                           right: 0,
//                           backgroundColor: 'white',
//                           borderRadius: 5,
//                           elevation: 5,
//                           zIndex: 999,
//                         }}
//                       >
//                         {accountType.map((option) => (
//                           <TouchableOpacity
//                             key={option.value}
//                             onPress={() => {
//                               handleAccountTypeChange(option.value);
//                               setShowAccountTypeOptions(false);
//                             }}
//                             style={{
//                               paddingVertical: 12,
//                               paddingHorizontal: 22,
//                               borderBottomWidth: 1,
//                               borderBottomColor: '#eee',
//                             }}
//                           >
//                             <Text style={{ fontFamily: 'Nunito400' }}>{option.label}</Text>
//                           </TouchableOpacity>
//                         ))}
//                       </View>
//                     )}
//                   </View>
//                 </View>


//                 {formData.accountType === 'patient' && (
//                   <View style={[GlobalStyles.row, { marginBottom: 15 }]}>

//                     <View style={[styles.textInputIconView, styles.allMarginRight]}>
//                       <TextInput
//                         style={[GlobalStyles.textInputIcon, { color: 'black', marginTop: 6 }]}
//                         placeholder={t('registration.placeholders.dob')}
//                         value={formData.dob}
//                         onFocus={() => {
//                           setDateField('dob');
//                           setShowDatePicker(true);
//                         }}
//                       />
//                       <Icon
//                         name="calendar-today"
//                         size={20}
//                         color={Colors.gray}
//                         style={{ position: 'absolute', left: '7%', top: 15, }}
//                       />
//                     </View>

//                     <View style={[styles.textInputIconView, styles.allMarginLeft]}>
//                       <TextInput
//                         style={[GlobalStyles.textInputIcon, { color: 'black', marginTop: 5 }]}
//                         placeholder={t('registration.placeholders.dueDate')}
//                         value={formData.dueDate}
//                         onFocus={() => {
//                           setDateField('dueDate');
//                           setShowDatePicker(true);
//                         }}
//                       />
//                       <Icon
//                         name="calendar-today"
//                         size={20}
//                         color={Colors.gray}
//                         style={{ position: 'absolute', left: '7%', top: 15, }}
//                       />
//                     </View>
//                   </View>
//                 )}

//                 {formData.accountType === 'patient-family' && (
//                   <View style={{ position: 'relative' }}>
//                     <TextInput
//                       style={[GlobalStyles.input, { paddingLeft: 38, color: 'black', marginTop: 3 }]}
//                       placeholder={t('registration.placeholders.patientEmail')}
//                       value={formData.familyOf}
//                       onChangeText={(text) => setFormData({ ...formData, familyOf: text })}
//                       keyboardType="email-address"
//                       autoCapitalize="none"
//                     />
//                     <Icon
//                       name="email"
//                       size={20}
//                       color={Colors.gray}
//                       style={{ position: 'absolute', left: 10, top: 18, }}
//                     />
//                   </View>
//                 )}

//                 <View style={[GlobalStyles.row, { marginBottom: 15 }]}>
//                   <View style={[styles.textInputIconView, styles.allMarginRight, { justifyContent: 'center' }]}>
//                     <TextInput
//                       style={[GlobalStyles.textInputIcon, { paddingLeft: 37, fontFamily: Platform.OS === 'android' ? 'Nunito400' : undefined, marginTop: 5, color: 'black' }]}
//                       placeholder={t('registration.placeholders.password')}
//                       value={formData.password}
//                       onChangeText={(text) => setFormData({ ...formData, password: text })}
//                       secureTextEntry
//                       autoCapitalize="none"
//                       autoCorrect={false}
//                     />
//                     <Icon
//                       name="lock"
//                       size={20}
//                       color={Colors.gray}
//                       style={{ position: 'absolute', left: '6%', top: 15, }}
//                     />
//                   </View>

//                   <View style={[styles.textInputIconView, styles.allMarginLeft, { justifyContent: 'center' }]}>
//                     <TextInput
//                       style={[GlobalStyles.textInputIcon, { paddingLeft: 35, fontFamily: Platform.OS === 'android' ? 'Nunito400' : undefined, marginTop: 5, color: 'black' }]}
//                       placeholder={t('registration.placeholders.confirmPassword')}
//                       value={formData.confirmPassword}
//                       onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
//                       secureTextEntry
//                       autoCapitalize="none"
//                       autoCorrect={false}
//                     />
//                     <Icon
//                       name="lock"
//                       size={20}
//                       color={Colors.gray}
//                       style={{
//                         position: 'absolute', left: '6%', top: 15,
//                       }}
//                     />
//                   </View>
//                 </View>

//                 <View style={[GlobalStyles.row, { marginBottom: 10 }]}>

//                   <View
//                     style={[
//                       styles.textInputIconView,
//                       styles.allMarginRight,
//                       {
//                         flex: 4.76,
//                         height: 55,
//                         justifyContent: 'center',
//                         paddingLeft: 35,
//                         position: 'relative',
//                         zIndex: 8,
//                       },
//                     ]}
//                   >
//                     <Icon
//                       name="public"
//                       size={20}
//                       color={Colors.gray}
//                       style={{
//                         position: 'absolute',
//                         left: '6%',
//                         top: 15,
//                         zIndex: 1,
//                       }}
//                     />

//                     <TouchableOpacity
//                       onPress={() => setShowDropdown(true)}
//                       style={{
//                         height: 50,
//                         justifyContent: 'center',
//                         paddingRight: 0,
//                       }}
//                     >
//                       <Text
//                         style={{
//                           fontSize: 13.5,
//                           fontFamily: 'Nunito400',
//                           color: formData.countryCode ? 'black' : 'gray',
//                         }}
//                       >
//                         {
//                           formData.countryCode
//                             ? FormattedCountries.find((c) => c.value === formData.countryCode)?.label
//                             : t('registration.placeholders.countryCode')
//                         }
//                       </Text>
//                     </TouchableOpacity>

//                     <Icon
//                       name="keyboard-arrow-down"
//                       size={20}
//                       color={Colors.gray}
//                       style={{
//                         position: 'absolute',
//                         right: '7%',
//                         top: 15,
//                         zIndex: 1,
//                       }}
//                     />

//                     <Modal visible={showDropdown} transparent animationType="fade">
//                       <Pressable
//                         style={{
//                           flex: 1,
//                           backgroundColor: 'rgba(0,0,0,0.3)',
//                           justifyContent: 'center',
//                           paddingHorizontal: 20,
//                         }}
//                         onPress={() => setShowDropdown(false)}
//                       >
//                         <View
//                           style={{
//                             backgroundColor: 'white',
//                             borderRadius: 8,
//                             maxHeight: 300,
//                             padding: 10,
//                           }}
//                         >
//                           <FlatList
//                             data={FormattedCountries}
//                             keyExtractor={(item) => `${item.value}`}
//                             renderItem={({ item }) => (
//                               <TouchableOpacity
//                                 onPress={() => {
//                                   setFormData({ ...formData, countryCode: item.value });
//                                   setShowDropdown(false);
//                                 }}
//                                 style={{ paddingVertical: 12 }}
//                               >
//                                 <Text style={{ fontFamily: 'Nunito400' }}>{item.label}</Text>
//                               </TouchableOpacity>
//                             )}
//                           />
//                         </View>
//                       </Pressable>
//                     </Modal>
//                   </View>

//                   <View style={[styles.textInputIconView, styles.allMarginLeft, {
//                     flex: 6,
//                     height: 55,
//                     justifyContent: 'center',
//                     backgroundColor: '#fff',
//                     borderRadius: 8,
//                   }]}>
//                     <Icon
//                       name="phone"
//                       size={20}
//                       color={Colors.gray}
//                       style={{
//                         position: 'absolute',
//                         left: '7%',
//                         top: 15,
//                       }}
//                     />
//                     <TextInput
//                       style={[GlobalStyles.textInputIcon, { color: 'black', marginTop: 5 }]}
//                       placeholder={t('registration.placeholders.phone')}
//                       value={formData.phone}
//                       onChangeText={(text) => setFormData({ ...formData, phone: formatPhoneNumber(text) })}
//                       keyboardType="phone-pad"
//                       onFocus={() => setShowPhoneInfo(true)}
//                       onBlur={() => setShowPhoneInfo(false)}
//                     />
//                   </View>
//                 </View>

//                 {showPhoneInfo && (
//                   <View style={{
//                     backgroundColor: 'lightyellow',
//                     padding: 8,
//                     borderRadius: 5,
//                     marginTop: 5,
//                     marginBottom: 5,
//                   }}>
//                     <Text style={{ fontFamily: 'Nunito400', fontSize: 12, color: 'black' }}>
//                       {t('registration.phoneInfo')}
//                     </Text>
//                   </View>
//                 )}

//                 <View style={styles.termsContainer}>
//                   <View style={styles.checkbox}>
//                     <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)} style={styles.checkboxBox}>
//                       {termsAccepted && <View style={styles.checkboxChecked} />}
//                     </TouchableOpacity>

//                   </View>

//                   <Text style={[styles.termsText, { fontFamily: 'Nunito400' }]}>
//                     {t('registration.terms.accept')}{" "}
//                     <Text
//                       style={[styles.termsLink, { fontFamily: 'Nunito400' }]}
//                       onPress={() => Linking.openURL('https://babyflix.ai/terms')}
//                     >
//                       {t('registration.terms.link')}
//                     </Text>
//                   </Text>
//                 </View>


//                 <View style={[GlobalStyles.row, { marginBottom: 15 }]}>
//                   <TouchableOpacity
//                     style={[GlobalStyles.resetButton, GlobalStyles.allMarginRight]}
//                     onPress={handleReset}
//                   >
//                     <Icon name="refresh" size={20} color={Colors.black} style={{ marginRight: 5 }} />
//                     <Text style={[GlobalStyles.buttonText, { color: Colors.black }]}>
//                       {t('registration.buttons.reset')}
//                     </Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={[GlobalStyles.registerButton, GlobalStyles.allMarginLeft]}
//                     onPress={handleRegister}
//                   >
//                     <Icon name="done" size={20} color={Colors.white} style={{ marginRight: 5 }} />
//                     <Text style={GlobalStyles.buttonText}>{t('registration.buttons.register')}</Text>
//                   </TouchableOpacity>
//                 </View>

//                 <View style={[GlobalStyles.row, GlobalStyles.center, { marginTop: 0 }]}>
//                   <Text style={{ color: Colors.textSecondary, fontFamily: 'Nunito400' }}>
//                     {t('registration.alreadyHaveAccount')}{' '}
//                   </Text>
//                   <TouchableOpacity onPress={() => router.push('login')}>
//                     <Text style={[GlobalStyles.link, { fontFamily: 'Nunito400' }]}>{t('registration.signIn')}</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>

//               {/* {showDatePicker && (
//                 <DateTimePicker
//                   value={new Date()}
//                   mode="date"
//                   display="default"
//                   onChange={handleDateChange}
//                   themeVariant="light"
//                 />
//               )} */}

//               {/* {Platform.OS === 'ios' ? (
//               <Modal
//                 transparent={true}
//                 animationType="slide"
//                 visible={showDatePicker}
//                 onRequestClose={() => setShowDatePicker(false)}
//               >
//                 <View style={styles.modalContainer}>
//                   <View style={styles.pickerContainer}>
//                     <DateTimePicker
//                       value={tempDate}
//                       mode="date"
//                       display="spinner"
//                       onChange={(event, selectedDate) => {
//                         if (selectedDate) handleDateChange(event, selectedDate);
//                         setShowDatePicker(false);
//                       }}
//                     />
//                     <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.doneButton}>
//                       <Text style={{ color: Colors.primary, fontWeight: '600' }}>Done</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               </Modal>
//             ) : (
//               showDatePicker && (
//                 <DateTimePicker
//                   value={tempDate}
//                   mode="date"
//                   display="default"
//                   onChange={handleDateChange}
//                 />
//               )
//             )} */}

//               {Platform.OS === 'ios' ? (
//                 showDatePicker && (
//                   <View style={styles.iosPickerWrapper}>
//                     <DateTimePicker
//                       value={tempDate}
//                       mode="date"
//                       display="spinner"
//                       onChange={(event, selectedDate) => {
//                         if (selectedDate) setTempDate(selectedDate);
//                       }}
//                       style={styles.iosPicker}
//                     />
//                     <TouchableOpacity
//                       onPress={() => {
//                         handleDateChange(null, tempDate);
//                         setShowDatePicker(false);
//                       }}
//                       style={styles.doneButton}
//                     >
//                       <Text style={styles.doneText}>{t('registration.done')}</Text>
//                     </TouchableOpacity>
//                   </View>
//                 )
//               ) : (
//                 showDatePicker && (
//                   <DateTimePicker
//                     value={tempDate}
//                     mode="date"
//                     display="default"
//                     onChange={handleDateChange}
//                     locale={i18n.language === 'es' ? 'es-ES' : 'en-US'}
//                   />
//                 )
//               )}


//             </ScrollView>
//             {isLoading && <Loader loading={true} />}

//             <Snackbar
//               visible={snackbarVisible}
//               message={snackbarMessage}
//               type={snackbarType}
//               onDismiss={() => setSnackbarVisible(false)}
//             />
//           </View>
//         </View>
//       </TouchableWithoutFeedback>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   accountTypeButton: {
//     flex: 1,
//     padding: 15,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     borderRadius: 8,
//     alignItems: 'flex-start',
//     backgroundColor: Colors.white,
//     height: 55,
//   },
//   textInputIconView: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     borderRadius: 8,
//     alignItems: 'flex-start',
//     justifyContent: 'center',
//     height: 55,
//     position: 'relative',
//     backgroundColor: Colors.white,
//   },
//   registerButton: {
//     flex: 1,
//     padding: 15,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     borderRadius: 8,
//     alignItems: 'center',
//     backgroundColor: Colors.primary,
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   resetButton: {
//     flex: 1,
//     padding: 15,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     borderRadius: 8,
//     alignItems: 'center',
//     backgroundColor: Colors.white,
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   termsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   checkbox: {
//     width: 24,
//     height: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 8,
//   },
//   termsText: {
//     fontFamily: 'Nunito400',
//     fontSize: 14,
//     color: 'black',
//   },
//   termsLink: {
//     color: Colors.primary,
//     textDecorationLine: 'underline',
//   },

//   activeAccountType: {
//     backgroundColor: Colors.primary,
//     borderColor: Colors.primary,
//   },
//   activeText: {
//     color: Colors.white,
//     fontWeight: '600',
//   },
//   inactiveText: {
//     color: Colors.textSecondary,
//   },
//   dropdownContainer: {
//     borderWidth: 1,
//     borderColor: Colors.border,
//     borderRadius: 8,
//     width: '40%',
//     backgroundColor: Colors.white,
//     alignItems: 'right',
//   },
//   allMarginLeft: {
//     marginLeft: 3,
//   },
//   allMarginRight: {
//     marginRight: 3,
//   },
//   svgTop: {
//     position: 'absolute',
//     width: "100%",
//     top: 0,
//     marginBottom: 100,
//   },
//   svgBottom: {
//     position: 'absolute',
//     width: "100%",
//     bottom: 0,
//   },
//   container: {
//     flex: 1,
//   },
//   checkboxBox: {
//     width: 21,
//     height: 21,
//     borderWidth: 1,
//     borderColor: Colors.gray,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 10,
//     marginLeft: 10
//   },
//   checkboxChecked: {
//     width: 13,
//     height: 13,
//     backgroundColor: Colors.primary,
//     borderRadius: 12,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     backgroundColor: 'rgba(0,0,0,0.3)',
//   },
//   pickerContainer: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 10,
//     borderTopRightRadius: 10,
//     paddingBottom: 10,
//   },
//   doneButton: {
//     padding: 15,
//     alignItems: 'center',
//     borderTopWidth: 1,
//     borderColor: '#eee',
//   },
//   iosPickerWrapper: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: [{ translateX: -150 }, { translateY: -100 }],
//     width: 300,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 5,
//     alignItems: 'center',
//     zIndex: 99999,
//   },
//   iosPicker: {
//     width: '100%',
//     height: 150,
//   },
//   doneButton: {
//     marginTop: 10,
//     backgroundColor: '#f0f0f0',
//     paddingHorizontal: 20,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   doneText: {
//     color: '#007AFF',
//     fontFamily: 'Nunito700',
//     fontSize: 16,
//   },
//   inputRow: {
//   flexDirection: "row",
//   alignItems: "center",
//   height: 55,
//   borderWidth: 1,
//   borderColor: Colors.border,
//   borderRadius: 8,
//   backgroundColor: "#FFF",
//   paddingHorizontal: 12,
//   marginBottom: 15,
// },

// leftIcon: {
//   marginRight: 10,
// },

// textInput: {
//   flex: 1,
//   fontFamily: "Nunito400",
//   fontSize: 15,
//   paddingVertical: 0,
//   color: "#000",
// },

// rightIcon: {
//   paddingHorizontal: 6,
//   marginLeft: 6,
// },

// });

// export default RegisterScreen;

// RegisterScreen.js — Full optimized (keeps all original functionality + pixel-perfect inputs)
import React, { useState, useEffect, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import i18n from '../constants/i18n';
import { useDynamicTranslate } from '../constants/useDynamicTranslate';

const IconInput = ({
  iconName,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  onFocus,
  onBlur,
  rightIcon,
  onRightIconPress,
  placeholderTextColor = '#777',
}) => {
  return (
    <View style={styles.inputRow}>
      <Icon name={iconName} size={20} color={Colors.gray} style={styles.leftIcon} />

      <TextInput
        style={[styles.textInput,{color: value ? 'black' : 'gray'}]}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      {rightIcon ? (
        <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name={rightIcon} size={22} color={Colors.gray} />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightIconPlaceholder} />
      )}
    </View>
  );
};

const RegisterScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();

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
  const [tempDate, setTempDate] = useState(new Date());
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
  const [showPhoneInfo, setShowPhoneInfo] = useState(false);

  // accountType options (translated)
  const accountType = [
    { label: t('registration.patient'), value: 'patient' },
    { label: t('registration.patient-family'), value: 'patient-family' },
  ];

  // Fetch countries
  useEffect(() => {
    let mounted = true;
    const fetchCountries = async () => {
      try {
        const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/locations/getAllCountries`);
        if (!mounted) return;
        setCountries(response.data || []);
      } catch (err) {
        setError(t('registration.failedFetchCountries') + (err.message || ''));
        await logError({
          error: err,
          data: err.response?.data || {},
          details: 'Error in getAllCountries API call on RegisterScreen',
        });
      }
    };
    fetchCountries();
    return () => { mounted = false; };
  }, []);

  // Translate countries for dropdown label
  useEffect(() => {
    let mounted = true;
    if (!countries || countries.length === 0) return;
    const translateCountries = async () => {
      try {
        const formatted = await Promise.all(
          countries.map(async (country) => {
            const translatedName = await useDynamicTranslate(country.country_name);
            return {
              label: `+${country.phonecode} ${translatedName}`,
              value: `${country.phonecode}_${country.country_name}`,
            };
          })
        );
        if (mounted) setFormattedCountries(formatted);
      } catch (err) {
        await logError({ error: err, details: 'Error translating countries' });
      }
    };
    translateCountries();
    return () => { mounted = false; };
  }, [countries]);

  // Reset dependent fields on account type change
  useEffect(() => {
    if (formData.accountType === 'patient') {
      setFormData(prev => ({ ...prev, familyOf: '' }));
    }
    if (formData.accountType === 'patient-family') {
      setFormData(prev => ({ ...prev, dob: '', dueDate: '' }));
    }
  }, [formData.accountType]);

  // keyboard color toggles svg color
  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => setSvgColor(Colors.white));
    const hideListener = Keyboard.addListener('keyboardDidHide', () => setSvgColor(Colors.primary));
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Helpers
  const formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const formattedMonth = month < 10 ? `0${month}` : month;
    const formattedDay = day < 10 ? `0${day}` : day;
    return `${formattedMonth}/${formattedDay}/${year}`;
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

  // Validation (same as original)
  const validateForm = () => {
    const { firstName, lastName, email, password, confirmPassword, phone, dueDate, familyOf, accountType, dob } = formData;
    setError('');
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError(t('registration.pleaseFillAllFields'));
      return false;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError(t('registration.invalidEmail'));
      return false;
    }

    const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]).{6,}$/;
    if (!passRegex.test(password)) {
      setError(t('registration.invalidPassword'));
      return false;
    }

    if (password !== confirmPassword) {
      setError(t('registration.passwordsDoNotMatch'));
      return false;
    }

    if (!termsAccepted) {
      setError(t('registration.acceptTerms'));
      return false;
    }

    if (accountType === 'patient' && !dueDate) {
      setError(t('registration.selectDueDate'));
      return false;
    }

    if (dueDate) {
      const [dueMonth, dueDay, dueYear] = dueDate.split('/');
      const formattedDueDate = new Date(`${dueYear}-${dueMonth}-${dueDay}`);
      if (formattedDueDate < new Date()) {
        setError(t('registration.dueDatePast'));
        return false;
      }
    }

    if (dob) {
      const [dobMonth, dobDay, dobYear] = dob.split('/');
      const formattedDobDate = new Date(`${dobYear}-${dobMonth}-${dobDay}`);
      if (formattedDobDate > new Date()) {
        setError(t('registration.dobFuture'));
        return false;
      }
    }

    if (accountType === 'family' && !familyOf) {
      setError(t('registration.enterFamilyEmail'));
      return false;
    }

    if (accountType === 'family' && familyOf && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(familyOf)) {
      setError(t('registration.invalidFamilyEmail'));
      return false;
    }

    return true;
  };

  // Register API call (keeps cookie header)
  const handleRegister = async () => {
    if (!validateForm()) return;
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
            Cookie: `Timezone=${timezone || 'UTC'}; Token=${token || ''}`,
          },
        }
      );

      if (response.data?.actionStatus === 'success') {
        setSnackbarMessage(t('registration.registrationSuccess'));
        setSnackbarType('success');
        setSnackbarVisible(true);
        setTimeout(() => router.replace('/login'), 3000);
      } else {
        console.log("response.data?.error",response.data)
        setSnackbarMessage(response.data?.message || t('registration.registrationFailed'));
        setSnackbarType('error');
        setSnackbarVisible(true);
        await logError({
          error: response.data?.error,
          data: response?.data || {},
          details: 'Error in register API call on RegisterScreen',
        });
      }
    } catch (err) {
      setSnackbarMessage(t('registration.genericError'));
      setSnackbarType('error');
      setSnackbarVisible(true);
      await logError({
        error: err,
        data: err?.response?.data || {},
        details: 'Exception in register API call on RegisterScreen',
      });
    } finally {
      setIsLoading(false);
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

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || tempDate;
    setShowDatePicker(false);
    const formattedDate = formatDate(currentDate);
    if (dateField === 'dob') {
      setTempDate(currentDate);
      setFormData(prev => ({ ...prev, dob: formattedDate }));
    } else if (dateField === 'dueDate') {
      setFormData(prev => ({ ...prev, dueDate: formattedDate }));
    }
  };

  const handleAccountTypeChange = (type) => {
    setFormData(prev => ({ ...prev, accountType: type }));
    setShowAccountTypeOptions(false);
  };

  const accountTypeLabel = useMemo(() => {
    return formData.accountType ? accountType.find(opt => opt.value === formData.accountType)?.label : '';
  }, [formData.accountType]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      style={GlobalStyles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }} pointerEvents="auto">
          <View style={styles.container}>
            <CommonSVG color={svgColor} />

            <View style={{ alignItems: 'center' }}>
              <Text style={[GlobalStyles.title, { marginTop: 100 }]}>{t('registration.title')}</Text>
            </View>

            <ScrollView 
            keyboardShouldPersistTaps="handled" 
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            contentContainerStyle={[GlobalStyles.registrationScreenPadding, { position: 'relative' }]}
            >
              <View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* First + Last */}
                <View style={[GlobalStyles.row, { marginBottom: 0 }]}>
                  <View style={{ flex: 1, marginRight: 5 }}>
                    <IconInput
                      iconName="person"
                      placeholder={t('registration.placeholders.firstName')}
                      value={formData.firstName}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 5 }}>
                    <IconInput
                      iconName="person"
                      placeholder={t('registration.placeholders.lastName')}
                      value={formData.lastName}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Email */}
                <IconInput
                  iconName="email"
                  placeholder={t('registration.placeholders.email')}
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {/* Account Type Dropdown */}
                <View style={{ marginBottom: 0 }}>
                  <View style={styles.inputRow}>
                    <Icon name="account-circle" size={20} color={Colors.gray} style={styles.leftIcon} />
                    <TouchableOpacity onPress={() => setShowAccountTypeOptions(s => !s)} style={{ flex: 1 }}>
                      <Text style={[styles.textInput, { color: formData.accountType ? 'black' : 'gray', paddingTop: 15 }]}>
                        {formData.accountType ? accountTypeLabel : t('registration.placeholders.accountType')}
                      </Text>
                    </TouchableOpacity>
                    <Icon name={showAccountTypeOptions ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color={Colors.gray} style={styles.rightIcon} />
                  </View>

                  
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
                            <Text style={{ fontFamily: 'Nunito400' }}>{option.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                </View>

                {/* DOB & DueDate (if patient) */}
                {formData.accountType === 'patient' && (
                  <View style={[GlobalStyles.row, { marginBottom: 0 }]}>
                    <View style={{ flex: 1, marginRight: 5 }}>
                      <View style={styles.inputRow}>
                        <Icon name="calendar-today" size={20} color={Colors.gray} style={styles.leftIcon} />
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => { setDateField('dob'); setTempDate(new Date()); setShowDatePicker(true); }}>
                          <Text style={[styles.textInput, { color: formData.dob ? 'black' : 'gray', paddingTop: 15}]}>{formData.dob || t('registration.placeholders.dob')}</Text>
                        </TouchableOpacity>
                        <View style={styles.rightIconPlaceholder} />
                      </View>
                    </View>

                    <View style={{ flex: 1, marginLeft: 5 }}>
                      <View style={styles.inputRow}>
                        <Icon name="calendar-today" size={20} color={Colors.gray} style={styles.leftIcon} />
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => { setDateField('dueDate'); setTempDate(new Date()); setShowDatePicker(true); }}>
                          <Text style={[styles.textInput, { color: formData.dueDate ? 'black' : 'gray',paddingTop: 15 }]}>{formData.dueDate || t('registration.placeholders.dueDate')}</Text>
                        </TouchableOpacity>
                        <View style={styles.rightIconPlaceholder} />
                      </View>
                    </View>
                  </View>
                )}

                {/* Patient-family email */}
                {formData.accountType === 'patient-family' && (
                  <IconInput
                    iconName="email"
                    placeholder={t('registration.placeholders.patientEmail')}
                    value={formData.familyOf}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, familyOf: text }))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}

                {/* Passwords */}
                <View style={[GlobalStyles.row, { marginBottom: 0 }]}>
                  <View style={{ flex: 1, marginRight: 5 }}>
                    <IconInput
                      iconName="lock"
                      placeholder={t('registration.placeholders.password')}
                      value={formData.password}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 5 }}>
                    <IconInput
                      iconName="lock"
                      placeholder={t('registration.placeholders.confirmPassword')}
                      value={formData.confirmPassword}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Country + Phone */}
                <View style={[GlobalStyles.row, { marginBottom: 0 }]}>
                  <View style={{ flex: 6, marginRight: 10 }}>
                    <View style={styles.inputRow}>
                      <Icon name="public" size={20} color={Colors.gray} style={styles.leftIcon} />
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDropdown(true)}>
                        <Text style={[styles.textInput, { color: formData.countryCode ? 'black' : 'gray',paddingTop: 15 }]}>
                          {formData.countryCode ? FormattedCountries.find(c => c.value === formData.countryCode)?.label : t('registration.placeholders.countryCode')}
                        </Text>
                      </TouchableOpacity>
                      <Icon name="keyboard-arrow-down" size={20} color={Colors.gray} style={styles.rightIcon} />
                    </View>
                  </View>

                  <View style={{ flex: 6 }}>
                    <View style={styles.inputRow}>
                      <Icon name="phone" size={20} color={Colors.gray} style={styles.leftIcon} />
                      <TextInput
                        style={[styles.textInput, { color: 'black' }]}
                        placeholder={t('registration.placeholders.phone')}
                        placeholderTextColor="#777"
                        value={formData.phone}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, phone: formatPhoneNumber(text) }))}
                        keyboardType="phone-pad"
                        onFocus={() => setShowPhoneInfo(true)}
                        onBlur={() => setShowPhoneInfo(false)}
                      />
                      <View style={styles.rightIconPlaceholder} />
                    </View>
                  </View>
                </View>

                {showPhoneInfo && (
                  <View style={styles.phoneInfo}>
                    <Text style={{ fontFamily: 'Nunito400', fontSize: 12, color: 'black' }}>{t('registration.phoneInfo')}</Text>
                  </View>
                )}

                {/* Terms */}
                <View style={styles.termsRow}>
                  <TouchableOpacity onPress={() => setTermsAccepted(prev => !prev)} style={styles.checkboxBox}>
                    {termsAccepted && <View style={styles.checkboxChecked} />}
                  </TouchableOpacity>

                  <Text style={styles.termsText}>
                    {t('registration.terms.accept')}{" "}
                    <Text style={styles.termsLink} onPress={() => Linking.openURL('https://babyflix.ai/terms')}>
                      {t('registration.terms.link')}
                    </Text>
                  </Text>
                </View>

                {/* Buttons */}
                <View style={[GlobalStyles.row, { marginBottom: 0 }]}>
                  <TouchableOpacity style={[GlobalStyles.resetButton, GlobalStyles.allMarginRight]} onPress={handleReset}>
                    <Icon name="refresh" size={20} color={Colors.black} style={{ marginRight: 5 }} />
                    <Text style={[GlobalStyles.buttonText, { color: Colors.black }]}>{t('registration.buttons.reset')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[GlobalStyles.registerButton, GlobalStyles.allMarginLeft]} onPress={handleRegister}>
                    <Icon name="done" size={20} color={Colors.white} style={{ marginRight: 5 }} />
                    <Text style={GlobalStyles.buttonText}>{t('registration.buttons.register')}</Text>
                  </TouchableOpacity>
                </View>

                {/* Already have account */}
                <View style={[GlobalStyles.row, GlobalStyles.center, { marginTop: 20 }]}>
                  <Text style={{ color: Colors.textSecondary, fontFamily: 'Nunito400' }}>
                    {t('registration.alreadyHaveAccount')}{' '}
                  </Text>
                  <TouchableOpacity onPress={() => router.push('login')}>
                    <Text style={[GlobalStyles.link, { fontFamily: 'Nunito400' }]}>{t('registration.signIn')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

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
            </ScrollView>

            {isLoading && <Loader loading={true} />}

            <Snackbar visible={snackbarVisible} message={snackbarMessage} type={snackbarType} onDismiss={() => setSnackbarVisible(false)} />

            {/* Country modal */}
            <Modal visible={showDropdown} transparent animationType="fade">
              <Pressable style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
                <View style={styles.modalBox}>
                  <FlatList
                    data={FormattedCountries}
                    keyExtractor={(item) => `${item.value}`}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setFormData(prev => ({ ...prev, countryCode: item.value }));
                          setShowDropdown(false);
                        }}
                        style={styles.countryItem}
                      >
                        <Text style={{ fontFamily: 'Nunito400' }}>{item.label}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </Pressable>
            </Modal>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

// Styles — inputs now match First Name field exactly: iconLeft=8, iconToText=8, height=55
const styles = StyleSheet.create({
  container: { flex: 1 },
  errorText: { color: 'red', marginBottom: 0 },

  // Input row: total height 55, padding horizontal used to position icon & right area
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    height: 55,
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
    flex: 1,
    paddingVertical: 0,
    paddingLeft: 0, // icon gap already handled by leftIcon marginRight
    paddingRight: 0,
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

  optionsContainer: {
    backgroundColor: 'white',
    borderRadius: 6,
    elevation: 4,
    marginTop: 8,
    overflow: 'hidden',
  },

  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  optionText: { fontFamily: 'Nunito400' },

  phoneInfo: {
    backgroundColor: 'lightyellow',
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 5,
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
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
    marginLeft: 10,
  },

  checkboxChecked: {
    width: 13,
    height: 13,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },

  termsText: {
    fontFamily: 'Nunito400',
    fontSize: 14,
    color: 'black',
    flex: 1,
  },

  termsLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  modalBox: {
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: 300,
    padding: 10,
  },

  countryItem: {
    paddingVertical: 12,
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
});

export default RegisterScreen;
