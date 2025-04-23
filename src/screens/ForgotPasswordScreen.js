import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import GlobalStyles from '../styles/GlobalStyles';
import Colors from '../constants/Colors';
import { useRouter } from 'expo-router';
import { EXPO_PUBLIC_API_URL } from '@env';
import Loader from '../components/Loader';
import Snackbar from '../components/Snackbar';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CommonSVG from '../components/commonSvg';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ForgotPasswordScreen = ({ navigation }) => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('success');
  const [svgColor, setSvgColor] = useState(Colors.primary);

  const handleSubmit = async () => {
    if (!email) {
      setSnackbarMessage('Please enter your email');
      setSnackbarType('error');
      setSnackbarVisible(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setSnackbarMessage('Please enter a valid email');
      setSnackbarType('error');
      setSnackbarVisible(true);
      return;
    }

    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const timezone = await AsyncStorage.getItem('timezone');

      const res = await axios.post(
        `${EXPO_PUBLIC_API_URL}/api/auth/forgot-password`,
        {
          email,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `Timezone=${timezone || 'UTC'}; token=${token || ''}`,
          },
        }
      );

      if (res.status === 200) {
        const data = res.data;

        if (data.actionStatus === "success") {
          setSnackbarMessage('Reset password link sent to your email');
          setSnackbarType('success');
          setSnackbarVisible(true);

          setTimeout(() => {
            router.replace('login');
          }, 1000);
        } else {
          setSnackbarMessage(data.error || 'Failed to send reset link');
          setSnackbarType('error');
          setSnackbarVisible(true);
        }
      } else {
        setSnackbarMessage('Failed to send reset link. Please try again.');
        setSnackbarType('error');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setSnackbarMessage('Failed to send reset link. Please try again.');
      setSnackbarType('error');
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
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
      style={GlobalStyles.container}
    >
      <View style={GlobalStyles.container}>
        <CommonSVG color={svgColor} />
        <ScrollView contentContainerStyle={GlobalStyles.screenPadding}>
          <View style={{ marginTop: 100 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={GlobalStyles.title}>Forgot Password</Text>
            </View>
            <Text style={GlobalStyles.subtitle}>
              Enter your email to receive password reset instructions
            </Text>

            <View style={{ position: 'relative' }}>
              <TextInput
                style={[GlobalStyles.input, { paddingLeft: 40 }]}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Icon
                name="email"
                size={20}
                color={Colors.gray}
                style={{ position: 'absolute', left: 10, top: 16 }}
              />
            </View>
            <TouchableOpacity
              style={[GlobalStyles.button, { backgroundColor: Colors.primary, marginTop: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
              onPress={handleSubmit}
            >
              <Icon name="link" size={20} color={Colors.white} style={{ marginRight: 5 }} />
              <Text style={GlobalStyles.buttonText}>Send Reset Link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[GlobalStyles.button, { backgroundColor: Colors.white, marginTop: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
              onPress={() => router.replace('login')}
            >
              <Icon name="arrow-back" size={20} color={Colors.primary} style={{ marginRight: 5 }} />
              <Text style={[GlobalStyles.buttonText, { color: Colors.primary }]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
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
  );
};

export default ForgotPasswordScreen;
