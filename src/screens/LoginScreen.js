// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   Image,
//   Keyboard,
//   Dimensions,
//   Modal,
//   StyleSheet,
// } from 'react-native';
// import { useDispatch } from 'react-redux';
// import { setCredentials } from '../state/slices/authSlice';
// import { showSnackbar, setLoading } from '../state/slices/uiSlice';
// import GlobalStyles from '../styles/GlobalStyles';
// import Colors from '../constants/Colors';
// import { useRouter } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { EXPO_PUBLIC_API_URL } from '@env';
// import Loader from '../components/Loader';
// import Snackbar from '../components/Snackbar';
// import babyflixLogo from '../../assets/logo.png';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import Constants from 'expo-constants';
// import CommonSVG from '../components/commonSvg';
// import axios from 'axios';
// import LiveStreamStatus from './LiveStreamStatus';
// import { logError } from '../components/logError';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useTranslation } from 'react-i18next';
// import LanguageModal from '../constants/LanguageModal';
// import sendDeviceUserInfo, { USERACTIONS } from '../components/deviceInfo';
// import { Video } from 'expo-av';
// import { Ionicons } from '@expo/vector-icons';

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// const LoginScreen = () => {
//   const router = useRouter();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [snackbarVisible, setSnackbarVisible] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState('');
//   const [snackbarType, setSnackbarType] = useState('success');
//   const [isPasswordVisible, setIsPasswordVisible] = useState(false);
//   const [timezone, setTimezone] = useState('');
//   const [token, setToken] = useState('');
//   const [svgColor, setSvgColor] = useState(Colors.primary);
//   const [isStreamStart, setIsStreamStart] = useState(false);
//   const [showLangModal, setShowLangModal] = useState(false);
//   const [showVideo, setShowVideo] = useState(false);
//   const [muted, setMuted] = useState(false);
//   const [videoEnded, setVideoEnded] = useState(false);

//   const dispatch = useDispatch();
//   const insets = useSafeAreaInsets();
//   const appVersion = Constants.expoConfig.version;
//   const { t } = useTranslation();

//   const adVideoUrl = "https://babyflix.ai/flixad.mp4"; 
//   const adImageUrl = "https://babyflix.ai/flix10klogo.png"; // Your static image

//   const videoStyle = {
//     width: SCREEN_WIDTH * 0.9,
//     height: (SCREEN_WIDTH * 0.9) * (16/9), 
//     borderRadius: 16,
//     backgroundColor: "black",
//   };

//   useEffect(() => {
//     const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
//     setTimezone(userTimezone);

//     AsyncStorage.setItem('timezone', userTimezone);
//   }, []);

//   useEffect(() => {
//   const checkFlixAdSeen = async () => {
//     try {
//       const adSeen = await AsyncStorage.getItem("flixAdSeen");
//       console.log("flixAdSeen:", adSeen);
//       if (adSeen === "true") {
//         setShowVideo(false); // 👈 Don't show video if already seen
//       } else {
//         setShowVideo(true);  // 👈 Show video if not seen or false
//       }
//     } catch (err) {
//       console.error("Error reading flixAdSeen:", err);
//     }
//   };

//   checkFlixAdSeen();
// }, []);


//   useEffect(() => {
//     const checkLanguage = async () => {
//       const lang = await AsyncStorage.getItem("appLanguage");
//       if (!lang) {
//         setShowLangModal(true);
//       } else {
//         i18n.changeLanguage(lang);
//       }
//     };
//     checkLanguage();
//   }, []);

//   const handleLogin = async () => {
//     if (!email || !password) {
//       setSnackbarMessage(t('loginPage.messages.fillAllFields'));
//       setSnackbarType('error');
//       setSnackbarVisible(true);
//       return;
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!email || !emailRegex.test(email)) {
//       setSnackbarMessage(t('loginPage.messages.invalidEmail'));
//       setSnackbarType('error');
//       setSnackbarVisible(true);
//       return;
//     }

//     const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]).{6,}$/;
//     if (!password || !passwordRegex.test(password)) {
//       setSnackbarMessage(t('loginPage.messages.invalidPassword'));
//       setSnackbarType('error');
//       setSnackbarVisible(true);
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const timezone = await AsyncStorage.getItem('timezone');

//       console.log('EXPO_PUBLIC_API_URL',EXPO_PUBLIC_API_URL,email,password)

//       const res = await axios.post(
//         `${EXPO_PUBLIC_API_URL}/api/auth/applogin1`,
//         {
//           email,
//           password,
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Cookie': `Timezone=${timezone || 'UTC'}`,
//           }
//         }
//       );

//       console.log('Login response:', res.data);

//       if (res.data.token) {
//         setIsStreamStart(true);
//         await AsyncStorage.setItem('token', res.data.token);
//         await AsyncStorage.setItem('userData', JSON.stringify(res.data));
//         await AsyncStorage.setItem('tokenExpiry', res.data.expiresIn);
//         dispatch(setCredentials(res.data));
//         setToken(res.data.token);

//         setSnackbarMessage(t('loginPage.messages.loginSuccess'));
//         setSnackbarType('success');
//         setSnackbarVisible(true);

//         sendDeviceUserInfo({
//           action_type: USERACTIONS.LOGIN,
//           action_description: USERACTIONS.LOGINDESC,
//         });

//         setTimeout(() => {
//           router.replace('/gallery');
//         }, 1000);
//       } else {
//         setSnackbarMessage(res.data.error || t('loginPage.messages.loginFailed'));
//         setSnackbarType('error');
//         setSnackbarVisible(true);
//       }
//     } catch (error) {
//       console.log("❌ Login failed:", error);
//       setSnackbarMessage(error.res?.data?.error || t('loginPage.messages.loginFailedTryAgain'));
//       setSnackbarType('error');
//       setSnackbarVisible(true);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const togglePasswordVisibility = () => {
//     setIsPasswordVisible(!isPasswordVisible);
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
//       style={[GlobalStyles.container]}
//     >
//       <View style={[GlobalStyles.container]}>
//         <CommonSVG color={svgColor} />

//         <ScrollView contentContainerStyle={[GlobalStyles.screenPadding, { flexGrow: 1, justifyContent: 'center', alignItems: 'center', }]}
//           keyboardShouldPersistTaps="handled"
//         >
//           <View style={{ width: '100%' }}>
//             <LanguageModal visible={showLangModal} onClose={() => setShowLangModal(false)} />
//             <View style={{ alignItems: 'center' }}>
//               <Image source={babyflixLogo} style={{ width: 180, height: 40, marginBottom: 50 }} />
//             </View>

//             <View style={{ position: 'relative' }}>
//               <TextInput
//                 style={[GlobalStyles.input]}
//                 placeholder={t('loginPage.email')}
//                 value={email}
//                 onChangeText={setEmail}
//                 keyboardType="email-address"
//                 autoCapitalize="none"
//               />
//               <Icon
//                 name="email"
//                 size={20}
//                 color={Colors.gray}
//                 style={{ position: 'absolute', left: 10, top: 17 }}
//               />
//             </View>

//             <View style={{ position: 'relative', marginTop: 0 }}>
//               <TextInput
//                 style={[GlobalStyles.input]}
//                 placeholder={t('loginPage.password')}
//                 value={password}
//                 onChangeText={setPassword}
//                 secureTextEntry={!isPasswordVisible}
//               />
//               <Icon
//                 name="lock"
//                 size={20}
//                 color={Colors.gray}
//                 style={{ position: 'absolute', left: 10, top: 16 }}
//               />
//               <TouchableOpacity
//                 onPress={togglePasswordVisibility}
//                 style={{ position: 'absolute', right: 10, top: 16 }}
//               >
//                 <Icon
//                   name={!isPasswordVisible ? 'visibility-off' : 'visibility'}
//                   size={20}
//                   color={Colors.gray}
//                 />
//               </TouchableOpacity>
//             </View>

//             <TouchableOpacity onPress={() => router.push('forgot-password')}>
//               <Text style={[GlobalStyles.link, { textAlign: 'right' }]}>
//                 {t('loginPage.forgotPassword')}
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[GlobalStyles.button]}
//               onPress={handleLogin}
//             >
//               <Icon name="login" size={20} color={Colors.white} style={{ marginRight: 10 }} />
//               <Text style={GlobalStyles.buttonText}>{t('loginPage.loginButton')}</Text>
//             </TouchableOpacity>

//             <View style={[GlobalStyles.row, GlobalStyles.center, { marginTop: 20 }]}>
//               <Text style={{ color: Colors.textSecondary, fontFamily: 'Nunito400' }}>
//                 {t('loginPage.dontHaveAccount')}{' '}
//               </Text>
//               <TouchableOpacity onPress={() => router.push('register')}>
//                 <Text style={GlobalStyles.link}>{t('loginPage.signUp')}</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//           <Text style={{ marginTop: 20, color: 'white', fontFamily: 'Nunito400', fontSize: 12, position: 'absolute', bottom: 15 }}>
//             {t('loginPage.version')}: {appVersion}
//           </Text>
//         </ScrollView>

//         {isLoading && <Loader loading={true} />}

//         <Snackbar
//           visible={snackbarVisible}
//           message={snackbarMessage}
//           type={snackbarType}
//           onDismiss={() => setSnackbarVisible(false)}
//         />
//       </View>

//      <Modal visible={showVideo} transparent animationType="fade">
//   <View
//     style={[
//       styles.overlay,
//       { backgroundColor: "rgba(0,0,0,0.7)" },
//     ]}
//   >
//     {!videoEnded ? (
//       <Video
//         source={{ uri: adVideoUrl }}
//         style={videoStyle}
//         resizeMode="cover"
//         shouldPlay
//         isLooping={false}
//         isMuted={muted}
//         useNativeControls={true}
//         onPlaybackStatusUpdate={(status) => {
//           if (status.didJustFinish) setVideoEnded(true); // show promo content after video ends
//         }}
//       />
//     ) : (
//       <View style={styles.adContent}>
//         <Image
//           source={{ uri: adImageUrl }} // your static image
//           style={styles.adImage}
//           resizeMode="contain"
//         />
//         <Text style={styles.priceText}>Only at $19.99 🎉</Text>
//         <Text style={styles.descText}>Subscribe today and unlock full access.</Text>
//         <TouchableOpacity
//           style={styles.loginNowBtn}
//           onPress={() => setShowVideo(false)} // same as close
//         >
//           <Text style={styles.loginNowText}>Login Now</Text>
//         </TouchableOpacity>
//       </View>
//     )}

//     {/* Close icon */}
//     <TouchableOpacity
//       style={[
//         styles.closeButton,
//         videoEnded
//           ? { top: insets.top + 140, right: 60 }
//           : { top: insets.top + 10, right: 20 },
//       ]}
//       onPress={() => setShowVideo(false)}
//     >
//       <Ionicons name="close-circle" size={38} color={"white"} />
//     </TouchableOpacity>

//     {/* Mute button only during video */}
//     {!videoEnded && (
//       <TouchableOpacity
//         style={[styles.muteButton, { top: insets.top + 15 }]}
//         onPress={() => setMuted(!muted)}
//       >
//         <Ionicons
//           name={muted ? "volume-mute" : "volume-high"}
//           size={28}
//           color="white"
//         />
//       </TouchableOpacity>
//     )}
//   </View>
// </Modal>

//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.7)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   closeButton: {
//     position: "absolute",
//     //top: 40,
//     //right: 20,
//     zIndex: 999,
//   },
//    muteButton: {
//     position: "absolute",
//     //top: 40,
//     left: 22,
//     zIndex: 999,
//   },
//   adContent: {
//   width: SCREEN_WIDTH * 0.7,
//   height: SCREEN_HEIGHT * 0.4,
//   borderRadius: 16,
//   backgroundColor: "#fff",
//   justifyContent: "center",
//   alignItems: "center",
//   padding: 15,
// },
// adImage: {
//   width: "60%",
//   height: "35%",
//   //marginBottom: 15,
// },
// priceText: {
//   fontSize: 20,
//   fontWeight: "bold",
//   color: "#000",
//   marginBottom: 30,
//   textAlign: "center",
// },
// descText: {
//   fontSize: 14,
//   color: "#333",
//   textAlign: "center",
//   marginBottom: 20,
// },
// loginNowBtn: {
//   backgroundColor: "#FF6B6B",
//   paddingVertical: 10,
//   paddingHorizontal: 30,
//   borderRadius: 8,
//   marginTop: 10,
// },
// loginNowText: {
//   color: "white",
//   fontSize: 16,
//   fontWeight: "bold",
// },
// });

// export default LoginScreen;


// ===========================
//  FULL OPTIMIZED LOGIN SCREEN (FINAL FIXED VERSION)
// ===========================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Keyboard,
  Dimensions,
  Modal,
  StyleSheet,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../state/slices/authSlice';

import GlobalStyles from '../styles/GlobalStyles';
import Colors from '../constants/Colors';
import { useRouter } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_API_URL } from '@env';

import Loader from '../components/Loader';
import Snackbar from '../components/Snackbar';
import babyflixLogo from '../../assets/logo.png';

import Icon from 'react-native-vector-icons/MaterialIcons';
import Constants from 'expo-constants';
import CommonSVG from '../components/commonSvg';
import axios from 'axios';

import LanguageModal from '../constants/LanguageModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import sendDeviceUserInfo, { USERACTIONS } from '../components/deviceInfo';

import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


// =============================
//   UNIVERSAL SAFE INPUT COMPONENT (FINAL FIXED VERSION)
// =============================
const IconInput = ({
  iconName,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightIcon,
  onRightIconPress,
}) => {
  return (
    <View style={styles.inputRow}>

      {/* LEFT ICON (pulled inward) */}
      <Icon
        name={iconName}
        size={20}
        color={Colors.gray}
        style={styles.leftIcon}
      />

      {/* TEXT INPUT (placeholder closer to left icon) */}
      <TextInput
        style={[styles.textInput, {color: value ? 'black' : 'gray'}]}
        placeholder={placeholder}
        placeholderTextColor="#777"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />

      {/* RIGHT ICON (pushed fully right, touch issue fixed) */}
      {rightIcon && (
        <TouchableOpacity
          onPress={onRightIconPress}
          style={styles.rightIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name={rightIcon} size={22} color={Colors.gray} />
        </TouchableOpacity>
      )}
    </View>
  );
};


const LoginScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('success');

  const [svgColor, setSvgColor] = useState(Colors.primary);
  const [showLangModal, setShowLangModal] = useState(false);

  // Video Modal
  const [showVideo, setShowVideo] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [languageChecked, setLanguageChecked] = useState(false);

  const planData = useSelector((state) => state.plan.planData);

  const adVideoUrl = "https://babyflix.ai/flixad.mp4";
  const adImageUrl = "https://babyflix.ai/flix10klogo.png";

  const videoStyle = {
    width: SCREEN_WIDTH * 0.9,
    height: (SCREEN_WIDTH * 0.9) * (16 / 9),
    borderRadius: 16,
    backgroundColor: "black",
  };


  // ===============================
  //            EFFECTS
  // ===============================

  useEffect(() => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    AsyncStorage.setItem('timezone', userTimezone);
  }, []);

  useEffect(() => {
    const checkLanguage = async () => {
      const lang = await AsyncStorage.getItem("appLanguage");
      if (!lang) setShowLangModal(true);
      else i18n.changeLanguage(lang);
      setLanguageChecked(true);
    };
    checkLanguage();
  }, []);

  // Video display
  useEffect(() => {
  if (!languageChecked) return;

   console.log("languageChecked, showLangModal, showVideo:",languageChecked, showLangModal, showVideo);
    const checkFlixAdSeen = async () => {
      const adSeen = await AsyncStorage.getItem("flixAdSeen");
      // setShowVideo(adSeen !== "true");
      if (
        adSeen !== "true" &&
        !showLangModal &&
        !showVideo
      ) {
        console.log("video paying")
        setShowVideo(true);
      }
    };
    checkFlixAdSeen();

  }, [showLangModal, languageChecked]);

  // SVG color change on keyboard open/close
  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => setSvgColor(Colors.white));
    const hideListener = Keyboard.addListener('keyboardDidHide', () => setSvgColor(Colors.primary));
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);



  // ===============================
  //         LOGIN FUNCTION
  // ===============================
  const handleLogin = async () => {
    if (!email || !password) {
      setSnackbarMessage(t('loginPage.messages.fillAllFields'));
      setSnackbarType('error');
      setSnackbarVisible(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSnackbarMessage(t('loginPage.messages.invalidEmail'));
      setSnackbarType('error');
      setSnackbarVisible(true);
      return;
    }

    const pwRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]).{6,}$/;
    if (!pwRegex.test(password)) {
      setSnackbarMessage(t('loginPage.messages.invalidPassword'));
      setSnackbarType('error');
      setSnackbarVisible(true);
      return;
    }

    setIsLoading(true);

    try {
      const timezone = await AsyncStorage.getItem('timezone');

      const res = await axios.post(
        `${EXPO_PUBLIC_API_URL}/api/auth/applogin1`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `Timezone=${timezone || 'UTC'}`,
          },
        }
      );

      if (res.data.token) {
        await AsyncStorage.setItem('token', res.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(res.data));
        await AsyncStorage.setItem('tokenExpiry', res.data.expiresIn);

        dispatch(setCredentials(res.data));

        setSnackbarMessage(t('loginPage.messages.loginSuccess'));
        setSnackbarType('success');
        setSnackbarVisible(true);

        sendDeviceUserInfo({
          action_type: USERACTIONS.LOGIN,
          action_description: USERACTIONS.LOGINDESC,
        });

        setTimeout(() => router.replace('/gallery'), 800);
      } else {
        setSnackbarMessage(res.data.error || t('loginPage.messages.loginFailed'));
        setSnackbarType('error');
        setSnackbarVisible(true);
      }
    } catch (err) {
      setSnackbarMessage(t('loginPage.messages.loginFailedTryAgain'));
      setSnackbarType('error');
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const closeAd = async () => {
    //await AsyncStorage.setItem("flixAdSeen", "true");
    setShowVideo(false);
  };


  // ===============================
  //              UI
  // ===============================
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={GlobalStyles.container}
    >
      <View style={GlobalStyles.container}>
        <CommonSVG color={svgColor} />

        <ScrollView
          contentContainerStyle={[
            GlobalStyles.screenPadding,
            { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: '100%' }}>

            <LanguageModal visible={showLangModal} onClose={() => setShowLangModal(false)} />

            {/* Logo */}
            <View style={{ alignItems: 'center' }}>
              <Image source={babyflixLogo} style={{ width: 180, height: 40, marginBottom: 50 }} />
            </View>

            {/* EMAIL */}
            <IconInput
              iconName="email"
              placeholder={t('loginPage.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* PASSWORD */}
            <IconInput
              iconName="lock"
              placeholder={t('loginPage.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
              rightIcon={isPasswordVisible ? "visibility" : "visibility-off"}
              onRightIconPress={() => setIsPasswordVisible(prev => !prev)}
            />

            {/* Forgot Password */}
            <TouchableOpacity onPress={() => router.push('forgot-password')}>
              <Text style={[GlobalStyles.link, { textAlign: 'right' }]}>
                {t('loginPage.forgotPassword')}
              </Text>
            </TouchableOpacity>

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              style={[GlobalStyles.button]}
              onPress={handleLogin}
            >
              <Icon name="login" size={20} color={Colors.white} style={{ marginRight: 10 }} />
              <Text style={GlobalStyles.buttonText}>{t('loginPage.loginButton')}</Text>
            </TouchableOpacity>

            {/* SIGNUP */}
            <View style={[GlobalStyles.row, GlobalStyles.center, { marginTop: 20 }]}>
              <Text style={{ color: Colors.textSecondary, fontFamily: 'Nunito400' }}>
                {t('loginPage.dontHaveAccount')}{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('register')}>
                <Text style={GlobalStyles.link}>{t('loginPage.signUp')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text
              style={{
                marginTop: 20,
                color: 'white',
                fontFamily: 'Nunito400',
                fontSize: 12,
                position: 'absolute',
                bottom: 20,
              }}
            >
              {t('loginPage.version')}: {Constants.expoConfig.version}
            </Text>
        </ScrollView>

        {isLoading && <Loader loading={true} />}

        <Snackbar
          visible={snackbarVisible}
          message={snackbarMessage}
          type={snackbarType}
          onDismiss={() => setSnackbarVisible(false)}
        />

        {/* VIDEO MODAL */}
        <Modal visible={showVideo} transparent animationType="fade" statusBarTranslucent>
          <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>

            {!videoEnded ? (
              <View
                style={{
                  width: SCREEN_WIDTH * 0.9,
                  height: (SCREEN_WIDTH * 0.9) * (16 / 9),
                  backgroundColor: "black",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
              <Video
                source={{ uri: adVideoUrl }}
                style={videoStyle}
                resizeMode="contain"
                shouldPlay
                isLooping={false}
                isMuted={muted}
                useNativeControls={false}
                onPlaybackStatusUpdate={(status) => {
                  if (status.didJustFinish) {
                    setVideoEnded(true);
                    //AsyncStorage.setItem("flixAdSeen", "true");
                  }
                }}
              />
              </View>
            ) : (
              <View style={styles.adContent}>
                <Image source={{ uri: adImageUrl }} style={styles.adImage} resizeMode="contain" />
                <Text style={styles.priceText}>{t('flix10k.onlyAt')} ${planData.amount} 🎉</Text>
                <Text style={styles.descText}>{t('flix10k.subscriptionNow')}</Text>
                <TouchableOpacity
                  style={styles.loginNowBtn}
                  onPress={() => setShowVideo(false)}
                >
                  <Text style={styles.loginNowText}>Login Now</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Close */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                videoEnded ? { top: insets.top + 140, right: 60 } : { top: insets.top + 10, right: 20 },
              ]}
              onPress={closeAd}
            >
              <Ionicons name="close-circle" size={38} color="white" />
            </TouchableOpacity>

            {/* Mute */}
            {!videoEnded && (
              <TouchableOpacity
                style={[styles.muteButton, { top: insets.top + 15 }]}
                onPress={() => setMuted(prev => !prev)}
              >
                <Ionicons name={muted ? "volume-mute" : "volume-high"} size={28} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
};


// ===============================
//           STYLES
// ===============================
const styles = StyleSheet.create({

  // FIXED INPUT ROW
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    height: 55,
    paddingHorizontal: 12,
    marginBottom: 15,
  },

  // LEFT ICON pulled inward
  leftIcon: {
    marginLeft: 8,
    marginRight: 8,
  },

  // TEXT INPUT closer to left icon
  textInput: {
    flex: 1,
    paddingVertical: 0,
    paddingLeft: 4,
    paddingRight: 4,
    fontFamily: 'Nunito400',
    fontSize: 15,
    color: Colors.textSecondary,
  },

  // RIGHT ICON fully to the right, no click blocking
  rightIcon: {
    marginLeft: 4,
    marginRight: -4,
    padding: 5,
    zIndex: 2,
  },

  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  closeButton: {
    position: "absolute",
    zIndex: 999,
  },

  muteButton: {
    position: "absolute",
    left: 22,
    zIndex: 999,
  },

  adContent: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },

  adImage: {
    width: "60%",
    height: "35%",
  },

  priceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 30,
    textAlign: "center",
  },

  descText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },

  loginNowBtn: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
  },

  loginNowText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LoginScreen;
