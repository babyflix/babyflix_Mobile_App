import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Header from '../components/Header';
import Colors from '../constants/Colors';
import GlobalStyles from '../styles/GlobalStyles';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLOUD_API_URL } from '@env';
import { updateActionStatus } from '../state/slices/authSlice';
import { logError } from '../components/logError';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestMediaLibraryPermission } from '../components/requestMediaPermission';

const UPLOAD_API_URL = `${EXPO_PUBLIC_CLOUD_API_URL}/upload-files/`;
const CHUNK_SIZE = 2 * 1024 * 1024;

const imageExtensions = [
  "jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "tif", "jfif", "heic", "heif"
];
const videoExtensions = [
  "mp4", "webm", "ogg", "avi", "mov", "mkv", "flv", "wmv", "3gp"
];

const getMimeType = (uri) => {
  const ext = uri.split('.').pop().toLowerCase();
  if (imageExtensions.includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  if (videoExtensions.includes(ext)) return `video/${ext}`;
  return 'application/octet-stream';
};

const isValidMediaFile = (file) => {
  if (!file || !file.uri) return false;
  const uri = file.uri;
  const extension = uri.split('.').pop().toLowerCase();
  return imageExtensions.includes(extension) || videoExtensions.includes(extension);
};

const getHostUrl = async () => {
  if (Platform.OS === 'web') {
    return window.location.href;          
  }

  const url = await Linking.getInitialURL();
  return url || 'app://opened/normally';   
};

const UploadScreen = () => {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [previewLoad, setPreviewLoad] = useState(false);

  const user = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();  
  const insets = useSafeAreaInsets();

  const pickMedia = async () => {
    setPreviewLoad(true);
    // const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    // if (status !== 'granted') {
    //   if (!canAskAgain) {
    //     Alert.alert(
    //       'Permission Required',
    //       'Media access was denied and cannot be requested again. Please enable it manually in settings.',
    //       [
    //         { text: 'Cancel', style: 'cancel' },
    //         { text: 'Open Settings', onPress: () => Linking.openSettings() }
    //       ]
    //     );
    //   } else {
    //     Alert.alert(
    //       'Permission Required',
    //       'Please allow access to your media to select files.'
    //     );
    //   }
    //   return;
    // }

     const granted = await requestMediaLibraryPermission();
    if (!granted) {
      setPreviewLoad(false);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        //const file = result.assets[0];
        const asset = result.assets[0];
          const info = await FileSystem.getInfoAsync(asset.uri);

          const file = {
            ...asset,
            fileSize: info.size || 0,
          };


        if (!isValidMediaFile(file)) {
          Alert.alert(
            "Unsupported File Type",
            "Only image files (png, jpg, jpeg, etc.) and video files (mp4, mov, etc.) are allowed."
          );
          return;
        }
        setMedia(file);
        setVideoReady(false);
        setPreviewLoad(false);
      }
    } catch (error) {
      console.error('Picker error:', error);
      Alert.alert('Error', 'Could not select media.');
    } finally {
    setPreviewLoad(false);
  }
  };

  const chunkFile = async (fileUri) => {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    const totalChunks = Math.ceil(fileInfo.size / CHUNK_SIZE);
    const chunks = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileInfo.size);
      const base64Chunk = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
        position: start,
        length: end - start,
      });

      const chunkPath = `${FileSystem.documentDirectory}chunk_${i}.tmp`;
      await FileSystem.writeAsStringAsync(chunkPath, base64Chunk, {
        encoding: FileSystem.EncodingType.Base64,
      });

      chunks.push({ uri: chunkPath, index: i, totalChunks });
    }

    return chunks;
  };

  const handleUpload = async () => {
    if (!media) return;

    setLoading(true);
    setUploadProgress(0);

    const hostUrl = await getHostUrl();

    const details = {
      machine_id: user.role === 'user' ? user.machineId : user.machineId,
      user_id: user.role === 'user' ? user.uuid : '',
      uploaded_by: user.role === 'user' ? "By Me" : "By Clinic",
      hostUrl,
      provider: "MobileApp",
      fileDetails:media,
    };

    try {
      var chunks = await chunkFile(media.uri);

      for (const chunk of chunks) {
        const formData = new FormData();

        formData.append('files', {
          uri: chunk.uri,
          name: media.fileName || `chunk_${chunk.index}`,
          type: media.mimeType || 'application/octet-stream',
        });

        formData.append('chunkIndex', chunk.index.toString());
        formData.append('totalChunks', chunk.totalChunks.toString());
        formData.append('title', media.fileName || 'Untitled');
        formData.append('object_type', media.type || 'unknown');
        formData.append('machine_id', user.role === 'user' ? user.machineId : '');
        formData.append('user_id', user.role === 'user' ? user.uuid : '');

        const response = await axios.post(UPLOAD_API_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            accept: 'application/json',
          },
        });

        setUploadProgress(Math.round(((chunk.index + 1) / chunk.totalChunks) * 100));
        if (response.data?.message) {
          dispatch(updateActionStatus('Upload Successfull'));
        } else {
          throw new Error(`Chunk ${chunk.index + 1} upload failed`);
        }
      }
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Upload error email send:', error.message);

      await logError({
        error: error.message,
        data: chunks,
        details: details
      });

    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedia = () => {
    setMedia(null);
    setShowDeleteModal(false);
    setPreviewLoad(false);
  };


  return (
    <View style={[GlobalStyles.container,{marginBottom:65},Platform.OS === 'android' ? { paddingTop: insets.top } : null]}>
      <Header title="Upload" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={{ fontSize: 16, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' }}>
          Pick and upload image or video.
        </Text>

        <View style={styles.uploadOptions}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickMedia}>
            <Ionicons name="image" size={42} color={Colors.primary} />
            <Text style={styles.uploadButtonText}>Upload Media</Text>
          </TouchableOpacity>
        </View>

        {media ? (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Preview</Text>

            {media.type.startsWith('image') ? (
              <Image
                source={{ uri: media.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <Video
                source={{ uri: media.uri }}
                style={styles.previewImage}
                resizeMode="cover"
                shouldPlay={true}
                isLooping={false}
                useNativeControls
                onLoad={() => setVideoReady(true)}
                onError={(e) => console.log('Video error:', e)}
              />
            )}

            {/* Show loader only while video is loading */}
            {media.type.startsWith('video') && !videoReady && (
              <View style={{ marginVertical: 10, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text>Loading video preview...</Text>
              </View>
            )}

            <Text style={styles.mediaName}>{media.fileName}</Text>
            <Text style={styles.mediaSize}>{(media.fileSize / 1024).toFixed(2)} KB</Text>

            <TouchableOpacity style={styles.closeIcon} onPress={() => setShowDeleteModal(true)}>
              <Ionicons name="close-circle" size={32} color={Colors.error} />
            </TouchableOpacity>

            <TouchableOpacity
              style={GlobalStyles.button}
              onPress={handleUpload}
              disabled={loading}
            >
              <Text style={GlobalStyles.buttonText}>{loading ? 'Uploading...' : 'Upload'}</Text>
            </TouchableOpacity>
          </View>
        ) : previewLoad ? (
          <View style={{ marginVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text>Loading media preview...</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { padding: 24, borderRadius: 20 }]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="warning" size={48} color={Colors.error} />
              <Text style={[styles.modalTitle, { marginTop: 12, fontSize: 20 }]}>
                Confirm Delete
              </Text>
              <Text style={{ textAlign: 'center', marginTop: 6, color: '#666', fontSize: 15, fontFamily: 'Poppins_400Regular' }}>
                Are you sure you want to delete this media? This action cannot be undone.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: '#f0f0f0',
                    borderColor: '#ccc',
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingVertical: 10,
                    flex: 1,
                    marginRight: 10,
                  },
                ]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={{ color: '#333', fontSize: 15, fontFamily: 'Poppins_600SemiBold', }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: Colors.error,
                    borderRadius: 12,
                    paddingVertical: 10,
                    flex: 1,
                    marginLeft: 10,
                  },
                ]}
                onPress={handleDeleteMedia}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Upload Progress Modal */}
      {loading && (
        <Modal visible={loading} transparent animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text>Uploading...</Text>
              <Text>{uploadProgress}%</Text>
              <View style={{ width: '100%', height: 10, backgroundColor: '#f0f0f0', borderRadius: 5, marginTop: 10 }}>
                <View style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: '#46d157', borderRadius: 5 }} />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={() => setShowSuccessModal(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.successModalContainer}>
              <View style={styles.successHeader}>
                <MaterialIcons name="check-circle" size={40} color="#28a745" />
                <Text style={styles.successTitle}>Upload Successful</Text>
              </View>
              <Text style={styles.successMessage}>
                Please check gallery after 5 minutes.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setMedia(null)
                  setShowSuccessModal(false);
                  router.push('/gallery');
                }}
                style={[styles.modalButton, { backgroundColor: Colors.primary }]}
              >
                <Text style={{ color: Colors.white, fontFamily: 'Poppins_500Medium', }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 30,
  },
  uploadButton: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    width: '55%',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  uploadButtonText: {
    marginTop: 20,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
  preview: {
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: Colors.textPrimary,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  mediaName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    color: Colors.textPrimary,
  },
  mediaSize: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    width: '85%',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  successModalContainer: {
    backgroundColor: '#e6f9ec',
    padding: 25,
    borderRadius: 12,
    width: '85%',
    alignItems: 'center',
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 10,
    width: '100%',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#28a745',
    marginLeft: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#155724',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default UploadScreen;