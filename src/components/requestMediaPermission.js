// src/utils/requestMediaPermission.js
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

export const requestMediaLibraryPermission = async () => {
  const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status === 'granted') {
    return true;
  }

  if (!canAskAgain) {
    // User denied permanently
    return new Promise((resolve) => {
      Alert.alert(
        'Permission Needed',
        'To upload media, please enable access from your device settings.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Open Settings', onPress: () => {
              Linking.openSettings();
              resolve(false);
            }
          },
        ]
      );
    });
  } else {
    Alert.alert(
      'Permission Needed',
      'Media access is needed to upload files. Please allow it in the next prompt.'
    );
    return false;
  }
};
