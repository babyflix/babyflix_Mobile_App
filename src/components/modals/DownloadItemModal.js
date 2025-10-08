import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, Alert, AppState, Platform } from 'react-native';
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
import { useSelector } from 'react-redux';
import { useDynamicTranslate } from '../../constants/useDynamicTranslate';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import sendDeviceUserInfo, { USERACTIONS } from '../deviceInfo';

const DownloadItemModal = ({
  visible,
  setVisible,
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
  storagePlanPrice,
  storagePlanExpired,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showSizeInfo, setShowSizeInfo] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('');
  const [showConvertingMessage, setShowConvertingMessage] = useState(false);
  const [downloadResumable, setDownloadResumable] = useState(null);
  const [downloadQueue, setDownloadQueue] = useState([]);
  const { storagePlanId } = useSelector((state) => state.storagePlan || {});
  const [mediaData, setMediaData] = useState({ convertedTitle: [], convertedType: [] });

  const { t } = useTranslation();

  const resumeDownload = (item) => {
    if (item?.object_type === 'image') {
      downloadImageHandler(item, { resume: true });
    } else if (item?.object_type === 'video') {
      downloadVideoHandler(item, { resume: true });
    }
  };

  //useDownloadQueueHandler(downloadQueue, resumeDownload);

  const hasLargeFiles = selectedItems?.some(item => item?.size > 5 * 1024 * 1024);

  const titles = useMemo(() => selectedItems?.map(item => item.title) || [], [selectedItems]);
  const types = useMemo(() => selectedItems?.map(item => item.object_type) || [], [selectedItems]);

  useEffect(() => {
    const handleSelectedItems = async () => {
      const convertedTitle = await Promise.all(
        titles.map(title => useDynamicTranslate(title))
      );
      const convertedType = await Promise.all(
        types.map(type => useDynamicTranslate(type))
      );

      setMediaData({ convertedTitle, convertedType });
    };

    if (titles.length || types.length) {
      handleSelectedItems();
    }
  }, [titles, types]);

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
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    };

    initNotifications();
  }, []);

  useEffect(() => {
    if (storagePlanId === 1 && storagePlanPrice === '0.00') {
      setSelectedQuality('sd');
    } else if (storagePlanId > 1 && storagePlanPrice > '0.00' && !storagePlanExpired) {
      setSelectedQuality('hd');
    } else if (storagePlanExpired){
      setSelectedQuality('sd');
    }
  }, [storagePlanId, storagePlanPrice]);


  //   useEffect(() => {
  //   const loadAndResumeQueue = async () => {
  //     const savedQueue = await AsyncStorage.getItem('downloadQueue');
  //     if (savedQueue) {
  //       const parsedQueue = JSON.parse(savedQueue);
  //       setDownloadQueue(parsedQueue);

  //       parsedQueue.forEach(item => {
  //         resumeDownload(item);
  //       });

  //       await AsyncStorage.removeItem('downloadQueue');
  //     }
  //   };

  //   loadAndResumeQueue();
  // }, []);

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

          setSnackbarMessage(t('downloadModal.snackbar.downloadResume', { title: await useDynamicTranslate(`${item.title}`) }));
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
      setVisible(false);
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
          Alert.alert(t('downloadModal.permissionRequired'), t('downloadModal.allowAccess'));
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
      // const asset = await MediaLibrary.createAssetAsync(downloadedFile.uri);
      // await MediaLibrary.createAlbumAsync("Download", asset, false);

      await showCompletionNotification(title, downloadedFile.uri, 'video/*');

      setSnackbarMessage(t('downloadModal.snackbar.downloadSuccess', { title: await useDynamicTranslate(`${filename}`) }));
      setSnackbarType('success');
      setSnackbarVisible(true);
      sendDeviceUserInfo({
        action_type: USERACTIONS.DOWNLOAD,
        action_description: `User downloaded ${item}`,
      });
      setDownloadQueue(prev => {
        const filteredQueue = prev.filter(q => q.id !== item.id);
        AsyncStorage.setItem('downloadQueue', JSON.stringify(filteredQueue));
        return filteredQueue;
      });
      onDownload();
      onCancel()

      await AsyncStorage.removeItem('incompleteImageDownload');
    } catch (error) {
      console.error('Image Download Error:', error);
      setSnackbarMessage(t('downloadModal.snackbar.downloadFail'));
      setSnackbarType('error');
      setSnackbarVisible(true);
      await AsyncStorage.removeItem('incompleteImageDownload');
    } finally {
      setDownloadingProgress(false);
      setProgressValue(0);
      setDownloadTitle('');
      setActiveDownloads(prev => Math.max(0, prev - 1));
      onCancel()
      setIsConverting(false);
    }
  };

  const showCompletionNotification = async (title, uri, mimeType = 'image/*') => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('downloadModal.downloadComplete'),
        body: t("downloadModal.downloadSuccess", { title: title }),
        data: { uri },
      },
      trigger: null,
    });
  };

  const enqueueDownload = async (item) => {
    const isImage = (item?.object_type === 'image' || item?.object_type === 'predictiveBabyImage');

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

    setSnackbarMessage(t('downloadModal.snackbar.addedQueue', { title: await useDynamicTranslate(`${item.title}`) }));
    setSnackbarType('info');
    setSnackbarVisible(true);
    setActiveDownloads(prev => prev + 1);

    if (!isImage) {
      setIsConverting(true);
      setIsDownloading(false);

      setTimeout(() => {
        setIsConverting(false);
        setVisible(false);
      }, 3000);
    } else {
      setIsConverting(false);
      setTimeout(() => {
        setVisible(false);
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
      setDownloadingProgress(true);
    }, 3000);

    try {

      const endpoint =
        selectedQuality === 'sd'
          ? 'https://fm-apis.babyflix.ai/convert/sd' : 'https://fm-apis.babyflix.ai/convert/hd';

      const encodedPath =
        Platform.OS === 'ios'
          ? encodeURIComponent(item.object_url)
          : item.object_url;

      //const fullUrl = `${endpoint}?path=${item.object_url}&id=${item.id}`;
      const fullUrl = `${endpoint}?path=${encodedPath}&id=${item.id}`;
      const response = await axios.get(fullUrl);
      const downloadUrl = response.data?.download_url;
      if (!downloadUrl) throw new Error(t('downloadModal.noDownloadUrl'));

      await AsyncStorage.removeItem('pendingConversion');

      const { status: existingStatus } = await MediaLibrary.getPermissionsAsync();
      if (existingStatus !== 'granted') {
        const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
        if (newStatus !== 'granted') throw new Error(t('downloadModal.permissionDenied'));
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
      // const asset = await MediaLibrary.createAssetAsync(result.uri);
      // await MediaLibrary.createAlbumAsync("Download", asset, false);

      await showCompletionNotification(item.title, result.uri, 'video/*');

      setSnackbarMessage(t('downloadModal.snackbar.downloadSuccess', { title: await useDynamicTranslate(`${item.title}`) }));
      setSnackbarType('success');
      setSnackbarVisible(true);
      sendDeviceUserInfo({
        action_type: USERACTIONS.DOWNLOAD,
        action_description: `User downloaded ${item}`,
      });
      setDownloadQueue(prev => {
        const filteredQueue = prev.filter(q => q.id !== item.id);
        AsyncStorage.setItem('downloadQueue', JSON.stringify(filteredQueue));
        return filteredQueue;
      });
      onDownload();
      onCancel()
    } catch (err) {
      await AsyncStorage.removeItem('pendingConversion');
      throw err;
    } finally {
      setProgressValue(0);
      setDownloadingProgress(false);
      setActiveDownloads(prev => Math.max(0, prev - 1));
      onCancel()
      setIsConverting(false);
    }
  };


  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} presentationStyle="overFullScreen">
      <View style={styles.delModalOverlay}>
        <View style={styles.delModalContainer}>
          <MaterialIcons name="file-download" size={48} color={Colors.primary} />
          <Text style={styles.delModalTitle}>
            {isDownloading || isConverting ? t('downloadModal.titleDownloading') : t('downloadModal.titleDownload')}
          </Text>

          {!isDownloading && !isConverting && (
            <>
              <Text style={styles.delModalMessage}>
                {selectedItems.length > 1 ? (
                  <>
                    {t('downloadModal.confirmDownload')}{' '}
                    <Text style={{ fontWeight: 'bold' }}>{selectedItems.length}</Text> {t("deleteModal.items")}
                  </>
                ) : (
                  <>
                    {t('downloadModal.confirmDownload')}{' '}
                    <Text style={{ fontWeight: 'bold' }}>{mediaData.convertedTitle.join(", ")}</Text>{' '}
                    {mediaData.convertedType.join(", ")}?
                  </>
                )}
              </Text>

              {selectedItems[0]?.object_type === 'video' && (
                <>
                  <Text style={{ fontFamily: 'Nunito400', fontSize: 17, fontWeight: 'bold' }}>
                    {t('downloadModal.chooseQuality')}
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
                      <Text style={{ color: selectedQuality === 'sd' ? 'white' : 'black' }}>{t('downloadModal.sd')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={storagePlanId === 1 && storagePlanPrice === '0.00' || storagePlanExpired}
                      onPress={() => setSelectedQuality('hd')}
                      style={{
                        backgroundColor: selectedQuality === 'hd' ? Colors.primary : '#ddd',
                        opacity: (storagePlanId === 1 && storagePlanPrice === '0.00' || storagePlanExpired) ? 0.5 : 1,
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        borderTopRightRadius: 10,
                        borderBottomRightRadius: 10,
                        marginHorizontal: 0,
                      }}
                    >
                      <Text 
                       style={{ 
                        color: selectedQuality === 'hd' ? 'white' : 'black', 
                        opacity: (storagePlanId === 1 && storagePlanPrice === '0.00' || storagePlanExpired) ? 0.5 : 1, 
                       }}>
                          {t('downloadModal.hd')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {storagePlanPrice > '0.00' &&  storagePlanExpired &&(
                    <Text style={{ color: 'red', fontSize: 13, textAlign: 'center', marginBottom: 10, paddingHorizontal: 10 }}>
                      {t('downloadModal.hdExpired')}
                    </Text>
                  )}
                </>
              )}
            </>
          )}

          {isDownloading && showSizeInfo && (
            <Text style={[styles.delModalMessage, { color: 'gray', marginTop: 5 }]}>
              {hasLargeFiles
                ? t('downloadModal.filesLarge')
                : t('downloadModal.filesSmall')}
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
              <Text style={{ marginTop: 10, fontSize: 16, color: Colors.primary, fontFamily: "Nunito700" }}>
                {t('downloadModal.convertingVideo')}
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
              <Text style={{ marginTop: 10, fontSize: 16, color: 'green', fontFamily: "Nunito700" }}>
                {t('downloadModal.percentDownloaded', { percent: Math.round(downloadProgress * 100) })}
              </Text>
            </View>
          ) : (
            <View style={styles.delModalButtons}>
              <TouchableOpacity
                onPress={onCancel}
                style={[styles.delModalButton, { backgroundColor: 'white', borderWidth: 1, borderColor: Colors.primary, flexDirection: 'row' }]}
              >
                <Ionicons name="close-circle" size={20} color={Colors.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.delModalButtonText, { color: Colors.primary }]}>{t('downloadModal.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  selectedItems.forEach((item) => {
                    enqueueDownload(item);
                  });
                }}
              >
                <LinearGradient
                  colors={["#d63384", "#9b2c6f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.delModalButton,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="file-download"
                    size={20}
                    color="white"
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.delModalButtonText, { color: "white" }]}>
                    {t("downloadModal.download")}
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

export default DownloadItemModal;

