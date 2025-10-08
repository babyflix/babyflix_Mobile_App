import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking
} from 'react-native';
import Constants from 'expo-constants';
import Colors from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useDynamicTranslate } from '../constants/useDynamicTranslate';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

const AppUpdateModal = ({ serverUrl }) => {
  const [visible, setVisible] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [storeLinks, setStoreLinks] = useState({ android: '', ios: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const skippedDate = await AsyncStorage.getItem('skippedUpdateDate');
        const today = moment().format('YYYY-MM-DD');

        if (skippedDate === today) {
          return;
        }

        const response = await fetch(serverUrl);
        const data = await response.json();

        const latestVersion = Platform.OS === 'android' ? data.latestVersion : data.appleLatestVersion;
        const currentVersion = Constants.expoConfig.version;

        if (latestVersion && latestVersion !== currentVersion) {
          setStoreLinks({ android: data.androidUrl, ios: data.iosUrl });
          setForceUpdate(data.forceUpdate);
          setUpdateMessage(await useDynamicTranslate(`${data.message}`) || t('appUpdate.message'));
          setVisible(true);
        }
      } catch (err) {
        console.error("Failed to check update:", err);
      }
    };

    checkForUpdate();
  }, [serverUrl]);

  const openAppStore = () => {
    const url = Platform.OS === 'ios' ? storeLinks.ios : storeLinks.android;
    Linking.openURL(url).catch(err => console.error("Failed to open store", err));
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{forceUpdate ? t('appUpdate.title.force') : t('appUpdate.title.optional')}</Text>
          <Text style={styles.message}>{updateMessage}</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <View style={styles.buttons}>
              {forceUpdate && (
                <TouchableOpacity
                  style={[styles.button, styles.skip, !forceUpdate && {flex: 1}]}
                  onPress={async () => {
                    const today = moment().format('YYYY-MM-DD');
                    await AsyncStorage.setItem('skippedUpdateDate', today);
                    setVisible(false);
                  }}

                >
                  <Text style={styles.buttonText}>{t('appUpdate.buttons.skip')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setIsLoading(true);
                  openAppStore();
                  setTimeout(() => {
                    setIsLoading(false);
                    if (!forceUpdate) setVisible(false);
                  }, 2000);
                }}
                //style={!forceUpdate &&{ flex: 1, borderRadius: 12, marginHorizontal: 80 }}
              >
                <LinearGradient
                  colors={["#d63384", "#9b2c6f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.button,
                    styles.update,
                    {
                      paddingVertical: 12,
                      paddingHorizontal: 25,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      //minWidth: 100,
                    }, !forceUpdate && {flex: 1}
                  ]}
                >
                  <Text style={[styles.buttonText, { color: "#fff" }]}>
                    {t("appUpdate.buttons.updateNow")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default AppUpdateModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Nunito400',
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  skip: {
    backgroundColor: Colors.gray,
  },
  update: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Nunito700',
    zIndex: 1,
    textAlign: "center",
  },
});
