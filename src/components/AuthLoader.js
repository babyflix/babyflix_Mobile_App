// import React, { useEffect, useState } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useDispatch } from 'react-redux';
// import { setCredentials, logout } from '../state/slices/authSlice';

// const AuthLoader = ({ children }) => {
//   const [checkingAuth, setCheckingAuth] = useState(true);
//   const dispatch = useDispatch();

//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         const userDataStr = await AsyncStorage.getItem('userData');
//         const userData = userDataStr ? JSON.parse(userDataStr) : null;

//         if (token && userData) {
//           dispatch(setCredentials(userData));
//         } else {
//           await AsyncStorage.multiRemove(['token', 'userData']);
//           dispatch(logout());
//         }
//       } catch {
//         await AsyncStorage.multiRemove(['token', 'userData']);
//         dispatch(logout());
//       } finally {
//         setCheckingAuth(false);
//       }
//     };

//     checkAuth();
//   }, []);

//   if (checkingAuth) return null;

//   return children;
// };

// export default AuthLoader;


import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setCredentials, logout } from '../state/slices/authSlice'; // update path if different
import { EXPO_PUBLIC_API_URL } from '@env';

const AuthLoader = ({ children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const dispatch = useDispatch();

  const refreshToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      if (token && userData) {
        const res = await axios.post(
          `${EXPO_PUBLIC_API_URL}/api/auth/apprefreshtoken`,
          { token },
          { headers: { 'Content-Type': 'application/json' } }
        );

        console.log('apprefreshtoken',res.data?.newtoken)
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
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userData');
      dispatch(logout());
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    refreshToken(); // on initial app open

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshToken(); // when app comes back from background
      }
    });

    return () => subscription.remove();
  }, []);

  if (checkingAuth) return null;

  return children;
};

export default AuthLoader;

