import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { modalStyles as styles } from '../../styles/GlobalStyles';
import * as Progress from 'react-native-progress';
import Colors from '../../constants/Colors';
import * as FileSystem from 'expo-file-system'; // <-- Add at top
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
  const [selectedQuality, setSelectedQuality] = useState('hd'); // "sd" or "hd"
  const [showConvertingMessage, setShowConvertingMessage] = useState(false);
  //const [activeDownloads, setActiveDownloads] = useState(0);

  const hasLargeFiles = selectedItems?.some(item => item?.size > 5 * 1024 * 1024); // > 5MB

  const simulateDownload = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.05;
      if (progress >= 1) {
        clearInterval(interval);
        setDownloadProgress(1);
        setTimeout(() => {
          setSnackbarMessage(`Selected ${selectedItems[0]?.title} (${selectedItems[0]?.object_type}) downloaded successfully!`);
          setSnackbarType('success');
          setSnackbarVisible(true);
          onDownload();
          onCancel();
          setIsDownloading(false);
          setDownloadProgress(0);
          setShowSizeInfo(false);
        }, 500);
      } else {
        setDownloadProgress(progress);
      }
    }, 200);
  };

  // const handleConfirmDownload = async () => {
  //   try {
  //     setIsDownloading(true);
  //     setShowSizeInfo(true); // Show download time info based on file size
  //     simulateDownload();
  //   } catch (e) {
  //     console.log(e);
  //     setSnackbarMessage(`Failed to download ${selectedItems[0]?.title} (${selectedItems[0]?.object_type}). Please try again.`);
  //     setSnackbarType('error');
  //     setSnackbarVisible(true);
  //     setIsDownloading(false);
  //     setShowSizeInfo(false);
  //   }
  // };

const handleConfirmDownload = async () => {
  setIsConverting(true);        // show spinner
  setIsDownloading(false);
  setDownloadProgress(0);
  setShowSizeInfo(false);
  setShowConvertingMessage(true);  

  setDownloadingProgress(false);   // hide floating bar (just in case)
  setProgressValue(0);
  setDownloadTitle('');
  
  setTimeout(() => {
    setIsConverting(false);          // stop showing "Converting..."
    onCancel();                      // close the modal
    setDownloadingProgress(true);    // show floating bar
  }, 3000);
  try {
    const item = selectedItems[0];
    //const endpoint = 'https://bf-d-cloud-run-ffmpeg-video-01-440716411130.us-east1.run.app/convert/hd';
    const endpoint =
    // selectedQuality === 'sd'
    //   ? 'https://bf-d-cloud-run-ffmpeg-video-01-440716411130.us-east1.run.app/convert/sd'
    //   : 'https://bf-d-cloud-run-ffmpeg-video-01-440716411130.us-east1.run.app/convert/hd';

      selectedQuality === 'sd'
      ? 'https://dev-fm-apis.babyflix.net/convert/sd'
      : 'https://dev-fm-apis.babyflix.net/convert/hd';

    // Step 1: API call to convert video
    // const response = await axios.get(endpoint, {
    //   params: {
    //     path: item.object_url,
    //     id: item.id,
    //   }
    // });

    const fullUrl = `${endpoint}?path=${encodeURIComponent(item.object_url)}&id=${item.id}`;

    const response = await axios.get(fullUrl);

    const downloadUrl = response.data?.download_url;
    if (!downloadUrl) throw new Error('Download URL missing from response');
    await saveDownloadState({
      downloadUrl,
      title: item.title,
      id: item.id,
    });


    // Step 2: Ask for permission
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission denied to access media library');
    }

    // Step 3: Start actual file download
    setIsConverting(false);      // stop showing spinner
    setIsDownloading(true); 
    setDownloadingProgress(true);     // start progress bar
    setShowSizeInfo(true);

    setDownloadTitle(item.title);      // show title
    setProgressValue(0)

    onCancel();
    const fileUri = FileSystem.documentDirectory + `${item.title || 'video'}.mp4`;

    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      fileUri,
      {},
      (progress) => {
        const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
        setDownloadProgress(percent);
        setProgressValue(percent);
      }
    );

    const downloadResult = await downloadResumable.downloadAsync();

    const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
    await MediaLibrary.createAlbumAsync('Download', asset, false);

    await clearDownloadState();
    await showCompletionNotification(item.title);

    setSnackbarMessage(`${item.title} downloaded successfully to your device.`);
    setSnackbarType('success');
    setSnackbarVisible(true);
    onDownload();
    onCancel();

    setDownloadingProgress(false);
setProgressValue(0);
setDownloadTitle('');

  } catch (error) {
    console.error('Download error:', error);
    setSnackbarMessage(`Failed to download video. Please try again.`);
    setSnackbarType('error');
    setSnackbarVisible(true);
    setDownloadingProgress(false);
setProgressValue(0);
setDownloadTitle('');
  } finally {
    setIsConverting(false);
    setIsDownloading(false);
    setShowSizeInfo(false);
    setDownloadProgress(0);
  }
};

// const downloadImage = async (imageUrl, title = 'image') => {
//   try {
//     // Ask for media library permission
//     const { status } = await MediaLibrary.requestPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission Required', 'Please allow access to save the image.');
//       return;
//     }

//     const filename = `${title || 'image'}.jpg`;
//     const fileUri = FileSystem.documentDirectory + filename;

//     // Download the image
//     const downloadedFile = await FileSystem.downloadAsync(imageUrl, fileUri);

//     // Save to gallery
//     const asset = await MediaLibrary.createAssetAsync(downloadedFile.uri);
//     await MediaLibrary.createAlbumAsync('Download', asset, false);

    
//     await showCompletionNotification(selectedItems[0].title);

//     setSnackbarMessage(`${filename} downloaded successfully to your device.`);
//     setSnackbarType('success');
//     setSnackbarVisible(true);
//   } catch (error) {
//     console.error('Image Download Error:', error);
//     setSnackbarMessage('Failed to download image. Please try again.');
//     setSnackbarType('error');
//     setSnackbarVisible(true);
//   }
// };

// const downloadImageHandler = async (imageUrl, title = 'image') => {
//   try {
//     // 👇 Close the modal immediately
//     onCancel();

//     // 👇 Reset and show floating progress bar
//     setProgressValue(0);
//     setDownloadTitle(title);
//     setDownloadingProgress(true);

//     // Ask for media library permission
//     const { status } = await MediaLibrary.requestPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission Required', 'Please allow access to save the image.');
//       setDownloadingProgress(false);
//       return;
//     }

//     const filename = `${title || 'image'}.jpg`;
//     const fileUri = FileSystem.documentDirectory + filename;

//     // 👇 Create download with progress tracking
//     const downloadResumable = FileSystem.createDownloadResumable(
//       imageUrl,
//       fileUri,
//       {},
//       (progress) => {
//         const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
//         setProgressValue(percent);
//       }
//     );

//     // Start download
//     const downloadedFile = await downloadResumable.downloadAsync();

//     // Save to gallery
//     const asset = await MediaLibrary.createAssetAsync(downloadedFile.uri);
//     await MediaLibrary.createAlbumAsync('Download', asset, false);

//     await showCompletionNotification(title);

//     setSnackbarMessage(`${filename} downloaded successfully to your device.`);
//     setSnackbarType('success');
//     setSnackbarVisible(true);
//   } catch (error) {
//     console.error('Image Download Error:', error);
//     setSnackbarMessage('Failed to download image. Please try again.');
//     setSnackbarType('error');
//     setSnackbarVisible(true);
//   } finally {
//     // 👇 Hide the floating progress bar after finish
//     setDownloadingProgress(false);
//     setProgressValue(0);
//     setDownloadTitle('');
//     setActiveDownloads(prev => Math.max(0, prev - 1)); // when finished
//   }
// };

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
    // 👇 Close the modal immediately (if needed)
    onCancel();

    // 👇 Reset and show floating progress bar
    setProgressValue(0);
    setDownloadTitle(title);
    setDownloadingProgress(true);

    // Ask for media library permission
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to save the image.');
      setDownloadingProgress(false);
      return;
    }

    const filename = `${title}.jpg`;
    const fileUri = FileSystem.documentDirectory + filename;

    // 👇 Create download with progress tracking
    const downloadResumable = FileSystem.createDownloadResumable(
      imageUrl,
      fileUri,
      {},
      (progress) => {
        const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
        setProgressValue(percent);
      }
    );

    // Start download
    const downloadedFile = await downloadResumable.downloadAsync();

    // Save to gallery
    const asset = await MediaLibrary.createAssetAsync(downloadedFile.uri);
    await MediaLibrary.createAlbumAsync('Download', asset, false);

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
    trigger: null, // fire immediately
  });
};

// const enqueueDownload = (item) => {
//   DownloadQueue.addToQueue(item, {
//     selectedQuality,
//     downloadHandler: downloadVideoHandler,
//     setSnackbarMessage,
//     setSnackbarType,
//     setSnackbarVisible,
//     setDownloadTitle,
//     setProgressValue,
//     setDownloadingProgress,
//     onDownload,
//   });

//   setSnackbarMessage(`"${item.title}" added to download queue.`);
//   setSnackbarType('info');
//   setSnackbarVisible(true);

//   setActiveDownloads(prev => prev + 1)

//   setIsConverting(true);        // show spinner
//   setIsDownloading(false);
//   //setDownloadProgress(0);
//   //setShowSizeInfo(false);
//   //setShowConvertingMessage(true);  
  
//   setTimeout(() => {
//     setIsConverting(false);          // stop showing "Converting..."
//     onCancel();                      // close the modal
//     //setDownloadingProgress(true);    // show floating bar
//   }, 3000);
// };

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

  // Optional converting animation (you can skip for images)
   if (!isImage) {
    setIsConverting(true);
    setIsDownloading(false);

    setTimeout(() => {
      setIsConverting(false);
      onCancel(); // close modal only for videos
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

  //setActiveDownloads(prev => prev + 1); // when download starts

  setIsConverting(true);        // show spinner
  setIsDownloading(false);
  setDownloadProgress(0);
  setShowSizeInfo(false);
  setShowConvertingMessage(true);  

  setDownloadingProgress(false);   // hide floating bar (just in case)
  setProgressValue(0);
  setDownloadTitle('');

   setTimeout(() => {
    setIsConverting(false);          // stop showing "Converting..."
    onCancel();                      // close the modal
    setDownloadingProgress(true);    // show floating bar
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

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') throw new Error('Permission denied');

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

    const result = await downloadResumable.downloadAsync();
    const asset = await MediaLibrary.createAssetAsync(result.uri);
    await MediaLibrary.createAlbumAsync('Download', asset, false);

    setSnackbarMessage(`${item.title} downloaded successfully.`);
    setSnackbarType('success');
    setSnackbarVisible(true);
    onDownload();
  } catch (err) {
    throw err;
  } finally {
    setProgressValue(0);
    setDownloadingProgress(false);
    setActiveDownloads(prev => Math.max(0, prev - 1)); // when finished
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


          {/* Show message during downloading */}
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
    {/* cancel + download buttons */}
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
    // if (item?.object_type === 'image') {
    //   downloadImage(item?.object_url, item?.title);
    // } else {
    //   enqueueDownload(item); // enqueue each video item one by one
    // }
    enqueueDownload(item);
  });
  //onCancel(); // close the modal after queueing
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
