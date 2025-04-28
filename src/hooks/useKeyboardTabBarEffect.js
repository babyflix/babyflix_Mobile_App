// hooks/useKeyboardTabBarEffect.js
import { useEffect } from 'react';
import { Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../constants/Colors';

const useKeyboardTabBarEffect = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const parent = navigation.getParent();

    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' }
        });
      }
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            display: 'flex',
            position: 'absolute',
            backgroundColor: 'white',
            height: 65,
            paddingBottom: 5,
            paddingTop: 5,
            borderTopColor: Colors.border,
          },
        });
      }
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
};

export default useKeyboardTabBarEffect;
