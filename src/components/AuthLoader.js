import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setCredentials, logout } from '../state/slices/authSlice';

const AuthLoader = ({ children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userDataStr = await AsyncStorage.getItem('userData');
        const userData = userDataStr ? JSON.parse(userDataStr) : null;

        if (token && userData) {
          dispatch(setCredentials(userData));
        } else {
          await AsyncStorage.multiRemove(['token', 'userData']);
          dispatch(logout());
        }
      } catch {
        await AsyncStorage.multiRemove(['token', 'userData']);
        dispatch(logout());
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  if (checkingAuth) return null;

  return children;
};

export default AuthLoader;
