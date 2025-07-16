import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export const checkForPendingDownload = async () => {
  try {
    const data = await AsyncStorage.getItem('incompleteDownload');
    if (data) {
      const { downloadUrl, title } = JSON.parse(data);

      Alert.alert(
        'Incomplete Download',
        `You were downloading "${title}". Do you want to resume?`,
        [
          { text: 'Cancel', onPress: () => AsyncStorage.removeItem('incompleteDownload') },
          {
            text: 'Resume',
            onPress: async () => {
              try {
                const fileUri = FileSystem.documentDirectory + `${title || 'video'}.mp4`;

                const downloadResumable = FileSystem.createDownloadResumable(
                  downloadUrl,
                  fileUri,
                  {},
                  (progress) => {
                    const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
                    console.log(`Resumed Progress: ${Math.round(percent * 100)}%`);
                  }
                );

                const downloadResult = await downloadResumable.downloadAsync();

                const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
                await MediaLibrary.createAlbumAsync('Download', asset, false);

                await AsyncStorage.removeItem('incompleteDownload');
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: 'Download Complete',
                    body: `${title} has been downloaded successfully.`,
                  },
                  trigger: null,
                });
              } catch (error) {
                console.error('Resume download error:', error);
              }
            },
          },
        ]
      );
    }
  } catch (error) {
    console.error('Error checking for pending downloads:', error);
  }
};
