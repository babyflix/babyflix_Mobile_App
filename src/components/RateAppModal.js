import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';
import { useTranslation } from 'react-i18next';

const APP_OPEN_KEY = 'APP_OPEN_COUNT';
const RATED_KEY = 'ALREADY_RATED';
const APP_OPEN_THRESHOLD = 3; // Show after 3 opens

// ⚡ Replace with your actual Play Store & App Store URLs
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.babyflix.app';
const APP_STORE_URL = 'https://apps.apple.com/app/idXXXXXXXXX';

const RateUsModal = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleRateNow = async () => {
    try {
      const storeUrl = Platform.OS === 'android' ? PLAY_STORE_URL : APP_STORE_URL;
      await Linking.openURL(storeUrl);
      await AsyncStorage.setItem(RATED_KEY, 'true');
      onClose();
    } catch (err) {
      console.log('Error opening store link:', err);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
          <Text style={styles.title}>{t("rateUs.title")}</Text>
          <Text style={styles.subtitle}>{t("rateUs.message")} 💖</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.laterButton]} onPress={onClose}>
              <Text style={styles.buttonTextLater}>{t("rateUs.maybeLater")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.rateButton]} onPress={handleRateNow}>
              <Text style={styles.buttonTextRate}>{t("rateUs.rateNow")}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// 🧠 Helper function — tracks open count and shows modal after threshold
export const checkAndShowRateModal = async () => {
  try {
    const rated = await AsyncStorage.getItem(RATED_KEY);
    console.log("rated",rated)
    if (rated === 'true') return false; // user already rated

    const openCount = parseInt((await AsyncStorage.getItem(APP_OPEN_KEY)) || '0', 10);
    const newCount = openCount + 1;
    await AsyncStorage.setItem(APP_OPEN_KEY, String(newCount));

    if (newCount >= APP_OPEN_THRESHOLD) {
      // setShowModal(true);
      await AsyncStorage.setItem(APP_OPEN_KEY, '0'); // reset
      return true; // ✅ REQUEST rate modal
    }
    return false;
  } catch (err) {
    console.log('Error tracking app opens:', err);
    return false;
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
     justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalContainer: {
     backgroundColor: '#fdf2f8',
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontFamily: 'Nunito700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 25,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito400',
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButton: {
    backgroundColor: '#f1f1f1',
    borderWidth: 1,
    borderColor: Colors.black,
  },
  rateButton: {
    backgroundColor: Colors.primary,
  },
  buttonTextLater: {
    color: '#333',
     fontSize: 16,
    fontFamily: 'Nunito700',
    zIndex: 1,
    textAlign: "center",
  },
  buttonTextRate: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito700',
    zIndex: 1,
    textAlign: "center",
  },
});

export default RateUsModal;