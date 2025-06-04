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

const AppUpdateModal = ({ serverUrl }) => {
  const [visible, setVisible] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [storeLinks, setStoreLinks] = useState({ android: '', ios: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const response = await fetch(serverUrl);
        const data = await response.json();

        const latestVersion = Platform.OS === 'android' ? data.latestVersion : data.appleLatestVersion;
        const currentVersion = Constants.expoConfig.version;

        console.log('latestVersion:', latestVersion);
        console.log('currentVersion:', currentVersion);
        console.log('forceUpdate',data)

        if (latestVersion && latestVersion !== currentVersion) {
          setStoreLinks({ android: data.androidUrl, ios: data.iosUrl });
          setForceUpdate(data.forceUpdate);
          setUpdateMessage(data.message || "A new version is available. Please update to continue.");
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
          <Text style={styles.title}>{forceUpdate ? "Update Now!" : "Update Available"}</Text>
          <Text style={styles.message}>{updateMessage}</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <View style={styles.buttons}>
              {!forceUpdate && (
                <TouchableOpacity
                  style={[styles.button, styles.skip]}
                  onPress={() => setVisible(false)}
                >
                  <Text style={styles.buttonText}>Skip</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, styles.update]}
                onPress={() => {
                  setIsLoading(true);
                  openAppStore();
                  // Note: Don't hide modal on click if forceUpdate is true
                  setTimeout(() => {
                    setIsLoading(false);
                    if (!forceUpdate) setVisible(false);
                  }, 2000);
                }}
              >
                <Text style={styles.buttonText}>Update Now</Text>
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
    backgroundColor: Colors.background,
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
    fontFamily: 'Poppins_700Bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
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
    flex: 1,
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
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
});
