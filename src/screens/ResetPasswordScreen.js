import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { showSnackbar, setLoading } from '../state/slices/uiSlice';
import GlobalStyles from '../styles/GlobalStyles';
import { useRouter } from 'expo-router';

const ResetPasswordScreen = ({ navigation, route }) => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const dispatch = useDispatch();

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      dispatch(
        showSnackbar({
          message: 'Please fill in all fields',
          type: 'error',
        })
      );
      return;
    }

    if (password !== confirmPassword) {
      dispatch(
        showSnackbar({
          message: 'Passwords do not match',
          type: 'error',
        })
      );
      return;
    }

    dispatch(setLoading(true));
    try {
      dispatch(
        showSnackbar({
          message: 'Password reset successful',
          type: 'success',
        })
      );
      router.replace('Login');
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error.message || 'Failed to reset password',
          type: 'error',
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={GlobalStyles.container}
    >
      <ScrollView contentContainerStyle={GlobalStyles.screenPadding}>
        <View style={{ marginTop: 60 }}>
          <Text style={GlobalStyles.title}>Reset Password</Text>
          <Text style={GlobalStyles.subtitle}>Enter your new password</Text>

          <TextInput
            style={GlobalStyles.input}
            placeholder="New Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={GlobalStyles.input}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[GlobalStyles.button, { marginTop: 20 }]}
            onPress={handleResetPassword}
          >
            <Text style={GlobalStyles.buttonText}>Reset Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ResetPasswordScreen;
