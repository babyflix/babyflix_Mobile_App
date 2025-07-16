import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, Alert, AppState } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { modalStyles as styles } from '../../styles/GlobalStyles';
import * as Progress from 'react-native-progress';
import Colors from '../../constants/Colors';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DownloadQueue from '../DownloadQueue';

const DownloadItemModal = ({
  visible,
  selectedItems,
  onCancel,
  onDownload,
  setSnackbarVisible,
  setSnackbarMessage,
  setSnackbarType,
  setDownloadingProgress,
  setProgressValue,
  setDownloadTitle,
  setActiveDownloads,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showSizeInfo, setShowSizeInfo] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('hd');
  const [showConvertingMessage, setShowConvertingMessage] = useState(false);
  const [downloadResumable, setDownloadResumable] = useState(null);

  const hasLargeFiles = selectedItems?.some(item => item?.size > 5 * 1024 * 1024);

  useEffect(() => {
    const initNotifications = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          console.warn('Notification permission denied');
          return;
        }
      }

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    };

    initNotifications();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'background' && downloadResumable) {
        try {
          await downloadResumable.pauseAsync();
          await AsyncStorage.setItem(
            'pausedDownload',
            JSON.stringify({
              url: downloadResumable._url,
              fileUri: downloadResumable._fileUri,
              title: downloadResumable?._fileUri?.split('/').pop() || 'file',
            })
          );
          console.log('Download paused and saved to storage');
        } catch (err) {
          console.error('Failed to pause download', err);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [downloadResumable]);

  useEffect(() => {
    const resumePausedDownload = async () => {
      const saved = await AsyncStorage.getItem('pausedDownload');
      if (saved) {
        const { url, fileUri, title } = JSON.parse(saved);
        const resumed = FileSystem.createDownloadResumable(
          url,
          fileUri,
          {},
          (progress) => {
            const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
            setProgressValue(percent);
          }
        );

        setDownloadResumable(resumed);

        try {
          const result = await resumed.resumeAsync();
          const asset = await MediaLibrary.createAssetAsync(result.uri);
          await MediaLibrary.createAlbumAsync('Download', asset, false);

          await AsyncStorage.removeItem('pausedDownload');

          setSnackbarMessage(`${title} resumed and downloaded successfully.`);
          setSnackbarType('success');
          setSnackbarVisible(true);
          setDownloadingProgress(false);
          setProgressValue(0);
          setDownloadTitle('');
        } catch (err) {
          console.log('Resume failed:', err);
        }
      }
    };

    resumePausedDownload();
  }, []);

  const downloadImageHandler = async (item, options) => {
    const {
      setSnackbarMessage,
      setSnackbarType,
      setSnackbarVisible,
      setDownloadTitle,
      setProgressValue,
      setDownloadingProgress,
      onDownload,
    } = options;

    const imageUrl = item.object_url;
    const title = item.title || 'image';

    try {
      onCancel();
      setProgressValue(0);
      setDownloadTitle(title);
      setDownloadingProgress(true);

      const { status: existingStatus } = await MediaLibrary.getPermissionsAsync();
      if (existingStatus !== 'granted') {
        const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Permission Required', 'Please allow access to save the image.');
          setDownloadingProgress(false);
          return;
        }
      }

      const filename = `${title}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadResumable = FileSystem.createDownloadResumable(
        imageUrl,
        fileUri,
        {},
        (progress) => {
          const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
          setProgressValue(percent);
        }
      );

      setDownloadResumable(downloadResumable);

      const downloadedFile = await downloadResumable.downloadAsync();

      await MediaLibrary.createAssetAsync(downloadedFile.uri);

      await showCompletionNotification(title);

      setSnackbarMessage(`${filename} downloaded successfully to your device.`);
      setSnackbarType('success');
      setSnackbarVisible(true);
      onDownload();
    } catch (error) {
      console.error('Image Download Error:', error);
      setSnackbarMessage('Failed to download image. Please try again.');
      setSnackbarType('error');
      setSnackbarVisible(true);
    } finally {
      setDownloadingProgress(false);
      setProgressValue(0);
      setDownloadTitle('');
      setActiveDownloads(prev => Math.max(0, prev - 1));
    }
  };



  const saveDownloadState = async (info) => {
    await AsyncStorage.setItem('incompleteDownload', JSON.stringify(info));
  };

  const clearDownloadState = async () => {
    await AsyncStorage.removeItem('incompleteDownload');
  };

  const showCompletionNotification = async (title) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Download Complete",
        body: `${title} has been downloaded successfully.`,
      },
      trigger: null,
    });
  };

  const enqueueDownload = (item) => {
    const isImage = item?.object_type === 'image';

    DownloadQueue.addToQueue(item, {
      selectedQuality,
      downloadHandler: isImage ? downloadImageHandler : downloadVideoHandler,
      setSnackbarMessage,
      setSnackbarType,
      setSnackbarVisible,
      setDownloadTitle,
      setProgressValue,
      setDownloadingProgress,
      onDownload,
    });

    setSnackbarMessage(`"${item.title}" added to download queue.`);
    setSnackbarType('info');
    setSnackbarVisible(true);
    setActiveDownloads(prev => prev + 1);

    if (!isImage) {
      setIsConverting(true);
      setIsDownloading(false);

      setTimeout(() => {
        setIsConverting(false);
        onCancel();
      }, 3000);
    } else {
      setTimeout(() => {
        onCancel();
      }, 3000);
    }
  };

  const downloadVideoHandler = async (item, options) => {
    const {
      selectedQuality,
      setSnackbarMessage,
      setSnackbarType,
      setSnackbarVisible,
      setDownloadTitle,
      setProgressValue,
      setDownloadingProgress,
      onDownload,
    } = options;

    setIsConverting(true);
    setIsDownloading(false);
    setDownloadProgress(0);
    setShowSizeInfo(false);
    setShowConvertingMessage(true);

    setDownloadingProgress(false);
    setProgressValue(0);
    setDownloadTitle('');

    setTimeout(() => {
      setIsConverting(false);
      onCancel();
      setDownloadingProgress(true);
    }, 3000);

    try {

      const endpoint =
        selectedQuality === 'sd'
          ? 'https://dev-fm-apis.babyflix.net/convert/sd'
          : 'https://dev-fm-apis.babyflix.net/convert/hd';

      const fullUrl = `${endpoint}?path=${encodeURIComponent(item.object_url)}&id=${item.id}`;
      const response = await axios.get(fullUrl);
      const downloadUrl = response.data?.download_url;
      if (!downloadUrl) throw new Error('No download URL');

      const { status: existingStatus } = await MediaLibrary.getPermissionsAsync();
      if (existingStatus !== 'granted') {
        const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
        if (newStatus !== 'granted') throw new Error('Permission denied');
      }

      const fileUri = FileSystem.documentDirectory + `${item.title || 'video'}.mp4`;

      setDownloadTitle(item.title);
      setProgressValue(0);
      setDownloadingProgress(true);

      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        fileUri,
        {},
        (progress) => {
          const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
          setProgressValue(percent);
        }
      );
      setDownloadResumable(downloadResumable);

      const result = await downloadResumable.downloadAsync();
      await MediaLibrary.createAssetAsync(result.uri);

      await showCompletionNotification(item.title);

      setSnackbarMessage(`${item.title} downloaded successfully.`);
      setSnackbarType('success');
      setSnackbarVisible(true);
      onDownload();
    } catch (err) {
      throw err;
    } finally {
      setProgressValue(0);
      setDownloadingProgress(false);
      setActiveDownloads(prev => Math.max(0, prev - 1));
    }
  };


  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.delModalOverlay}>
        <View style={styles.delModalContainer}>
          <MaterialIcons name="file-download" size={48} color={Colors.primary} />
          <Text style={styles.delModalTitle}>
            {isDownloading || isConverting ? 'Downloading Selected Media' : 'Download Selected Media'}
          </Text>

          {/* Show confirmation only before download */}
          {!isDownloading && !isConverting && (
            <>
              <Text style={styles.delModalMessage}>
                Are you sure you want to download{' '}
                <Text style={{ fontWeight: 'bold' }}>{selectedItems[0]?.title}</Text>{' '}
                ({selectedItems[0]?.object_type})?
              </Text>

              {selectedItems[0]?.object_type === 'video' && (
                <>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 17, fontWeight: 'bold' }}>
                    Choose Quality
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
                    <TouchableOpacity
                      onPress={() => setSelectedQuality('sd')}
                      style={{
                        backgroundColor: selectedQuality === 'sd' ? Colors.primary : '#ddd',
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        borderTopLeftRadius: 10,
                        borderBottomLeftRadius: 10,
                        marginHorizontal: 0,
                      }}
                    >
                      <Text style={{ color: selectedQuality === 'sd' ? 'white' : 'black' }}>SD</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedQuality('hd')}
                      style={{
                        backgroundColor: selectedQuality === 'hd' ? Colors.primary : '#ddd',
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        borderTopRightRadius: 10,
                        borderBottomRightRadius: 10,
                        marginHorizontal: 0,
                      }}
                    >
                      <Text style={{ color: selectedQuality === 'hd' ? 'white' : 'black' }}>HD</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}

          {isDownloading && showSizeInfo && (
            <Text style={[styles.delModalMessage, { color: 'gray', marginTop: 5 }]}>
              {hasLargeFiles
                ? 'Files are larger than 5MB. Please be patient, downloading may take some time.'
                : 'Selected file are being downloading. Please wait...'}
            </Text>
          )}

          {/* Progress bar when downloading */}
          {/* {isDownloading ? (
            <View style={{ alignItems: 'center', marginVertical: 20, width: '100%' }}>
              <Progress.Bar
                progress={downloadProgress}
                width={200}
                height={10}
                color="green"
                unfilledColor="#e0e0e0"
                borderWidth={0}
                borderRadius={5}
              />
              <Text style={{ marginTop: 10, fontSize: 16, color: 'green', fontWeight: '600' }}>
                {Math.round(downloadProgress * 100)}% Downloaded
              </Text>
            </View>
          ) : (
            <View style={styles.delModalButtons}>
              <TouchableOpacity
                onPress={onCancel}
                style={[styles.delModalButton, { backgroundColor: '#ccc', flexDirection: 'row' }]}
              >
                <Ionicons name="close-circle" size={20} color="white" style={{ marginRight: 5 }} />
                <Text style={styles.delModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDownload}
                style={[styles.delModalButton, { backgroundColor: Colors.primary, flexDirection: 'row' }]}
              >
                <MaterialIcons name="file-download" size={20} color="white" style={{ marginRight: 5 }} />
                <Text style={styles.delModalButtonText}>Download</Text>
              </TouchableOpacity>
            </View>
          )} */}
          {isConverting ? (
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={{ marginTop: 10, fontSize: 16, color: Colors.primary, fontWeight: '600' }}>
                Converting video. Please wait do not close app...
              </Text>
            </View>
          ) : isDownloading ? (
            <View style={{ alignItems: 'center', marginVertical: 20, width: '100%' }}>
              <Progress.Bar
                progress={downloadProgress}
                width={200}
                height={10}
                color="green"
                unfilledColor="#e0e0e0"
                borderWidth={0}
                borderRadius={5}
              />
              <Text style={{ marginTop: 10, fontSize: 16, color: 'green', fontWeight: '600' }}>
                {Math.round(downloadProgress * 100)}% Downloaded
              </Text>
            </View>
          ) : (
            <View style={styles.delModalButtons}>
              <TouchableOpacity
                onPress={onCancel}
                style={[styles.delModalButton, { backgroundColor: '#ccc', flexDirection: 'row' }]}
              >
                <Ionicons name="close-circle" size={20} color="white" style={{ marginRight: 5 }} />
                <Text style={styles.delModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  selectedItems.forEach((item) => {
                    enqueueDownload(item);
                  });
                }}
                style={[styles.delModalButton, { backgroundColor: Colors.primary, flexDirection: 'row' }]}
              >
                <MaterialIcons name="file-download" size={20} color="white" style={{ marginRight: 5 }} />
                <Text style={styles.delModalButtonText}>Download</Text>
              </TouchableOpacity>

            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default DownloadItemModal;
