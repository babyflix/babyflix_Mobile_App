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
import { useDispatch } from 'react-redux';
import { setCredentials } from '../state/slices/authSlice';
import { showSnackbar, setLoading } from '../state/slices/uiSlice';
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
import LiveStreamStatus from './LiveStreamStatus';
import { logError } from '../components/logError';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import LanguageModal from '../constants/LanguageModal';
import sendDeviceUserInfo, { USERACTIONS } from '../components/deviceInfo';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('success');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [timezone, setTimezone] = useState('');
  const [token, setToken] = useState('');
  const [svgColor, setSvgColor] = useState(Colors.primary);
  const [isStreamStart, setIsStreamStart] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [muted, setMuted] = useState(false);

  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const appVersion = Constants.expoConfig.version;
  const { t } = useTranslation();

  const adVideoUrl = "https://babyflix.ai/flixad.mp4"; 

  const videoStyle = {
    width: SCREEN_WIDTH * 0.9,
    height: (SCREEN_WIDTH * 0.9) * (16/9), 
    borderRadius: 16,
    backgroundColor: "black",
  };

  useEffect(() => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(userTimezone);

    AsyncStorage.setItem('timezone', userTimezone);
  }, []);

  useEffect(() => {
    const checkLanguage = async () => {
      const lang = await AsyncStorage.getItem("appLanguage");
      if (!lang) {
        setShowLangModal(true);
      } else {
        i18n.changeLanguage(lang);
      }
    };
    checkLanguage();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setSnackbarMessage(t('loginPage.messages.fillAllFields'));
      setSnackbarType('error');
      setSnackbarVisible(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setSnackbarMessage(t('loginPage.messages.invalidEmail'));
      setSnackbarType('error');
      setSnackbarVisible(true);
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]).{6,}$/;
    if (!password || !passwordRegex.test(password)) {
      setSnackbarMessage(t('loginPage.messages.invalidPassword'));
      setSnackbarType('error');
      setSnackbarVisible(true);
      return;
    }

    setIsLoading(true);

    try {
      const timezone = await AsyncStorage.getItem('timezone');

      console.log('EXPO_PUBLIC_API_URL',EXPO_PUBLIC_API_URL)

      const res = await axios.post(
        `${EXPO_PUBLIC_API_URL}/api/auth/applogin1`,
        {
          email,
          password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `Timezone=${timezone || 'UTC'}`,
          }
        }
      );

      console.log('Login response:', res.data);

      if (res.data.token) {
        setIsStreamStart(true);
        await AsyncStorage.setItem('token', res.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(res.data));
        await AsyncStorage.setItem('tokenExpiry', res.data.expiresIn);
        dispatch(setCredentials(res.data));
        setToken(res.data.token);

        setSnackbarMessage(t('loginPage.messages.loginSuccess'));
        setSnackbarType('success');
        setSnackbarVisible(true);

        sendDeviceUserInfo({
          action_type: USERACTIONS.LOGIN,
          action_description: USERACTIONS.LOGINDESC,
        });

        setTimeout(() => {
          router.replace('/gallery');
        }, 1000);
      } else {
        setSnackbarMessage(res.data.error || t('loginPage.messages.loginFailed'));
        setSnackbarType('error');
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage(error.res?.data?.error || t('loginPage.messages.loginFailedTryAgain'));
      setSnackbarType('error');
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
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
      style={[GlobalStyles.container]}
    >
      <View style={[GlobalStyles.container]}>
        <CommonSVG color={svgColor} />

        <ScrollView contentContainerStyle={[GlobalStyles.screenPadding, { flexGrow: 1, justifyContent: 'center', alignItems: 'center', }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: '100%' }}>
            <LanguageModal visible={showLangModal} onClose={() => setShowLangModal(false)} />
            <View style={{ alignItems: 'center' }}>
              <Image source={babyflixLogo} style={{ width: 180, height: 40, marginBottom: 50 }} />
            </View>

            <View style={{ position: 'relative' }}>
              <TextInput
                style={[GlobalStyles.input]}
                placeholder={t('loginPage.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Icon
                name="email"
                size={20}
                color={Colors.gray}
                style={{ position: 'absolute', left: 10, top: 17 }}
              />
            </View>

            <View style={{ position: 'relative', marginTop: 0 }}>
              <TextInput
                style={[GlobalStyles.input]}
                placeholder={t('loginPage.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
              />
              <Icon
                name="lock"
                size={20}
                color={Colors.gray}
                style={{ position: 'absolute', left: 10, top: 16 }}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={{ position: 'absolute', right: 10, top: 16 }}
              >
                <Icon
                  name={!isPasswordVisible ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={Colors.gray}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => router.push('forgot-password')}>
              <Text style={[GlobalStyles.link, { textAlign: 'right' }]}>
                {t('loginPage.forgotPassword')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[GlobalStyles.button]}
              onPress={handleLogin}
            >
              <Icon name="login" size={20} color={Colors.white} style={{ marginRight: 10 }} />
              <Text style={GlobalStyles.buttonText}>{t('loginPage.loginButton')}</Text>
            </TouchableOpacity>

            <View style={[GlobalStyles.row, GlobalStyles.center, { marginTop: 20 }]}>
              <Text style={{ color: Colors.textSecondary, fontFamily: 'Nunito400' }}>
                {t('loginPage.dontHaveAccount')}{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('register')}>
                <Text style={GlobalStyles.link}>{t('loginPage.signUp')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={{ marginTop: 20, color: 'white', fontFamily: 'Nunito400', fontSize: 12, position: 'absolute', bottom: 15 }}>
            {t('loginPage.version')}: {appVersion}
          </Text>
        </ScrollView>

        {isLoading && <Loader loading={true} />}

        <Snackbar
          visible={snackbarVisible}
          message={snackbarMessage}
          type={snackbarType}
          onDismiss={() => setSnackbarVisible(false)}
        />
      </View>

      <Modal visible={showVideo} transparent animationType="fade">
        <View style={styles.overlay}>
          <Video
            source={{ uri: adVideoUrl }}
            style={videoStyle}
            resizeMode="cover"  
            shouldPlay
            isLooping
            isMuted={muted}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowVideo(false)}
          >
            <Ionicons name="close-circle" size={38} color="white" />
          </TouchableOpacity>

           <TouchableOpacity
            style={styles.muteButton}
            onPress={() => setMuted(!muted)}
          >
            <Ionicons
              name={muted ? "volume-mute" : "volume-high"}
              size={28}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 999,
  },
   muteButton: {
    position: "absolute",
    top: 40,
    left: 22,
    zIndex: 999,
  },
});

export default LoginScreen;
