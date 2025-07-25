import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, logout } from '../state/slices/authSlice';
import { EXPO_PUBLIC_API_URL } from '@env';

const AuthLoader = ({ children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const dispatch = useDispatch();
  const isLoggingOut = useSelector((state) => state.auth.isLoggingOut);

  // const refreshToken = async () => {
  //   const timeout = setTimeout(() => {
  //     console.warn('Auth check timed out');
  //     setCheckingAuth(false); // Avoid blocking the app forever
  //   }, 5000); // 5 seconds max

  //   try {
  //     const token = await AsyncStorage.getItem('token');
  //     const userDataStr = await AsyncStorage.getItem('userData');
  //     const userData = userDataStr ? JSON.parse(userDataStr) : null;

  //     if (token && userData) {
  //       const res = await axios.post(
  //         `${EXPO_PUBLIC_API_URL}/api/auth/apprefreshtoken`,
  //         { token },
  //         { headers: { 'Content-Type': 'application/json' } }
  //       );

  //       console.log('apprefreshtoken', res.data?.newtoken);

  //       if (res.data?.newtoken) {
  //         const updatedData = {
  //           ...res.data,
  //           token: res.data.newtoken,
  //         };

  //         await AsyncStorage.setItem('token', updatedData.token);
  //         await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
  //         dispatch(setCredentials(updatedData));
  //       } else {
  //         throw new Error('Token refresh failed');
  //       }
  //     } else {
  //       throw new Error('Missing token or userData');
  //     }
  //   } catch (err) {
  //     console.warn('AuthLoader error:', err.message);
  //     await AsyncStorage.removeItem('token');
  //     await AsyncStorage.removeItem('userData');
  //     dispatch(logout());
  //   } finally {
  //     clearTimeout(timeout);
  //     setCheckingAuth(false);
  //   }
  // };

  const refreshToken = async () => {
  const timeout = setTimeout(() => {
    setCheckingAuth(false);
  }, 5000);

  try {
     const logoutFlag = await AsyncStorage.getItem('logoutInProgress');
    if (logoutFlag === 'true' || isLoggingOut) {
      setCheckingAuth(false);
      clearTimeout(timeout);
      return;
    }

    const token = await AsyncStorage.getItem('token');
    const userDataStr = await AsyncStorage.getItem('userData');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;

    if (!token || !userData) {
      dispatch(logout());
      setCheckingAuth(false);
      clearTimeout(timeout);
      return;
    }

    if (token && userData) {
      const res = await axios.post(
        `${EXPO_PUBLIC_API_URL}/api/auth/apprefreshtoken`,
        { token },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data?.newtoken) {
        const updatedData = {
          ...res.data,
          token: res.data.newtoken,
        };

        await AsyncStorage.setItem('token', updatedData.token);
        await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
        dispatch(setCredentials(updatedData));
      } else {
        throw new Error('Token refresh failed');
      }
    } else {
      throw new Error('Missing token or userData');
    }
  } catch (err) {
    await AsyncStorage.multiRemove(['token', 'userData']);
    dispatch(logout());
  } finally {
    clearTimeout(timeout);
    setCheckingAuth(false);
    await AsyncStorage.removeItem('logoutInProgress'); // ✅ clear flag after
  }
};

  useEffect(() => {
    refreshToken();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshToken();
      }
    });

    return () => subscription.remove();
  }, []);

  if (checkingAuth) return null;

  return children;
};

export default AuthLoader;
