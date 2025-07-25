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
import { useDownloadQueueHandler } from '../useDownloadQueueHandler';

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
  const [downloadQueue, setDownloadQueue] = useState([]);
   
  const resumeDownload = (item) => {
    if (item?.object_type === 'image') {
      downloadImageHandler(item, { resume: true });
    } else if (item?.object_type === 'video') {
      downloadVideoHandler(item, { resume: true });
    }
  };

  useDownloadQueueHandler(downloadQueue, resumeDownload);

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
  const loadAndResumeQueue = async () => {
    const savedQueue = await AsyncStorage.getItem('downloadQueue');
    if (savedQueue) {
      const parsedQueue = JSON.parse(savedQueue);
      setDownloadQueue(parsedQueue);

      parsedQueue.forEach(item => {
        resumeDownload(item);
      });

      await AsyncStorage.removeItem('downloadQueue');
    }
  };

  loadAndResumeQueue();
}, []);

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

      await AsyncStorage.setItem(
      'incompleteImageDownload',
      JSON.stringify({
        title,
        imageUrl,
      })
    );

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

      await showCompletionNotification(title, downloadedFile.uri, 'video/*');

      setSnackbarMessage(`${filename} downloaded successfully to your device.`);
      setSnackbarType('success');
      setSnackbarVisible(true);
      setDownloadQueue(prev => {
        const filteredQueue = prev.filter(q => q.id !== item.id);
        AsyncStorage.setItem('downloadQueue', JSON.stringify(filteredQueue));
        return filteredQueue;
      });
      onDownload();

      await AsyncStorage.removeItem('incompleteImageDownload');
    } catch (error) {
      console.error('Image Download Error:', error);
      setSnackbarMessage('Failed to download image. Please try again.');
      setSnackbarType('error');
      setSnackbarVisible(true);
      await AsyncStorage.removeItem('incompleteImageDownload');
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

  const showCompletionNotification = async (title, uri, mimeType = 'video/*') => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Download Complete",
        body: `${title} has been downloaded successfully.`,
        data: { uri },
      },
      trigger: null,
    });
  };

  const enqueueDownload = async (item) => {
    const isImage = item?.object_type === 'image';

    setDownloadQueue(prev => {
    const updatedQueue = [...prev, item];
    AsyncStorage.setItem('downloadQueue', JSON.stringify(updatedQueue)); 
    return updatedQueue;
  });

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

    await AsyncStorage.setItem(
    'pendingConversion',
    JSON.stringify({
      title: item.title,
      id: item.id,
      object_url: item.object_url,
      selectedQuality,
    })
  );

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
          ? 'https://fm-apis.babyflix.ai/convert/sd'
          : 'https://fm-apis.babyflix.ai/convert/hd';

      const fullUrl = `${endpoint}?path=${item.object_url}&id=${item.id}`;
      const response = await axios.get(fullUrl);
      const downloadUrl = response.data?.download_url;
      if (!downloadUrl) throw new Error('No download URL');

      await AsyncStorage.removeItem('pendingConversion');

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

      await showCompletionNotification(item.title, result.uri, 'image/*');

      setSnackbarMessage(`${item.title} downloaded successfully.`);
      setSnackbarType('success');
      setSnackbarVisible(true);
      setDownloadQueue(prev => {
        const filteredQueue = prev.filter(q => q.id !== item.id);
        AsyncStorage.setItem('downloadQueue', JSON.stringify(filteredQueue));
        return filteredQueue;
      });
      onDownload();
    } catch (err) {
      await AsyncStorage.removeItem('pendingConversion');
      throw err;
    } finally {
      setProgressValue(0);
      setDownloadingProgress(false);
      setActiveDownloads(prev => Math.max(0, prev - 1));
    }
  };


  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} presentationStyle="overFullScreen">
      <View style={styles.delModalOverlay}>
        <View style={styles.delModalContainer}>
          <MaterialIcons name="file-download" size={48} color={Colors.primary} />
          <Text style={styles.delModalTitle}>
            {isDownloading || isConverting ? 'Downloading Selected Media' : 'Download Selected Media'}
          </Text>

          {!isDownloading && !isConverting && (
            <>
              <Text style={styles.delModalMessage}>
                {selectedItems.length > 1 ? (
                  <>
                    Are you sure you want to download{' '}
                    <Text style={{ fontWeight: 'bold' }}>{selectedItems.length}</Text> items?
                  </>
                ) : (
                  <>
                    Are you sure you want to download{' '}
                    <Text style={{ fontWeight: 'bold' }}>{selectedItems[0]?.title}</Text>{' '}
                    ({selectedItems[0]?.object_type})?
                  </>
                )}
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

