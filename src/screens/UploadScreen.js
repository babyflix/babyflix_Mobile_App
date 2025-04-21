import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Colors from '../constants/Colors';
import GlobalStyles from '../styles/GlobalStyles';
import { useDispatch } from 'react-redux';
import { showSnackbar, setLoading } from '../state/slices/uiSlice';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLOUD_API_URL } from '@env';
import { useSelector } from 'react-redux';
import { Video } from 'expo-av';
import { closeDropdown } from '../state/slices/headerSlice';
import * as FileSystem from 'expo-file-system';


const UploadScreen = () => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loading, setLoadingState] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth);

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedMedia(result.assets[0]);
      } else {
        dispatch(showSnackbar({ message: 'No media selected', type: 'info' }));
      }
    } catch (error) {
      dispatch(showSnackbar({ message: 'Failed to pick media', type: 'error' }));
    }
  };

  const handleUpload = async () => {
    if (!selectedMedia) {
      dispatch(showSnackbar({ message: 'Please select media to upload', type: 'error' }));
      return;
    }

    setLoadingState(true);
    try {
      const isImage = selectedMedia.type.startsWith('image');
      const isVideo = selectedMedia.type.startsWith('video');
      const fileUri = selectedMedia.uri;
      const totalChunks = 1;

        const formData = new FormData();

        const file = {  uri: selectedMedia.uri,
          name: selectedMedia.fileName || "upload.jpg", 
          type: selectedMedia.type || "image/jpeg", };
          
        console.log('file',file)

        formData.append('file', file);
        formData.append('chunkIndex', Number(1));
        formData.append('totalChunks', Number(totalChunks));
        formData.append('title', selectedMedia.fileName.split('.')[0]);
        formData.append('object_type', isImage ? 'image/jpeg' : isVideo ? 'video' : 'unknown');
        formData.append("machine_id", user.role === "user" ? user.machineId : machineId || '');
        formData.append("user_id", user.role === "user" ? user.uuid : '');
        formData.append("uploaded_by", user.role === "user" ? "By Me" : "By Clinic");

        //console.log('formData',formData)
        for (const pair of formData.entries()) {
          console.log(`${pair[0]}: ${JSON.stringify(pair[1])}`);
        }        
        
        console.log(`${EXPO_PUBLIC_CLOUD_API_URL}/upload-files/`)
        try {
          const response = await axios.post(`${EXPO_PUBLIC_CLOUD_API_URL}/upload-files/`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              accept: 'application/json',
            },
          });

    //       const response = await fetch(`${EXPO_PUBLIC_CLOUD_API_URL}/upload-files/`, {
    //   method: 'POST',
    //   body: formData,
    //   headers: {
    //     Accept: 'application/json',
    //   },
    // });

    // const data = await response.json();
    // console.log('Response:', data);

          if (response.data && response.data.message) {
            console.log(`Chunk ${1} uploaded successfully`);
          } else {
            throw new Error('Chunk upload failed');
          }
        } catch (error) {
          console.error(`Error uploading chunk ${1}:`, error?.message, error?.response?.data);
          dispatch(showSnackbar({ message: `Error uploading chunk ${1}`, type: 'error' }));
          setLoadingState(false);
          return;
        }
      //}

      dispatch(showSnackbar({ message: 'Upload successful', type: 'success' }));
      setSelectedMedia(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Error during upload:', error);
      dispatch(showSnackbar({ message: 'Error uploading media. Please try again.', type: 'error' }));
    } finally {
      setLoadingState(false);
    }
  };

  const handleDeleteMedia = () => {
    setSelectedMedia(null);
    setShowDeleteModal(false);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  return (
    <View style={GlobalStyles.container}>
      <Header title="Upload" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={{ fontSize: 16, fontFamily:'Poppins_600SemiBold', textAlign: 'center' }}>Pick and upload image or video .</Text>

        <View style={styles.uploadOptions}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickMedia}
          >
            <Ionicons name="image" size={42} color={Colors.primary} />
            <Text style={styles.uploadButtonText}>Upload Media</Text>
          </TouchableOpacity>
        </View>

        {selectedMedia && (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Preview</Text>
            {selectedMedia.type.startsWith('image') ? (
              <Image
                source={{ uri: selectedMedia.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <Video
                source={{ uri: selectedMedia.uri }}
                style={styles.previewImage}
                resizeMode="cover"
                shouldPlay
                isLooping
                isMuted
                useNativeControls
              />
            )}
            <Text style={styles.mediaName}>{selectedMedia.fileName}</Text>
            <Text style={styles.mediaSize}>{(selectedMedia.fileSize / 1024).toFixed(2)} KB</Text>

            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setShowDeleteModal(true)}
            >
              <Ionicons name="close-circle" size={32} color={Colors.error} />
            </TouchableOpacity>

            <TouchableOpacity
              style={GlobalStyles.button}
              onPress={handleUpload}
              disabled={loading}
            >
              <Text style={GlobalStyles.buttonText}>
                {loading ? 'Uploading...' : 'Upload'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseDeleteModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text>Are you sure you want to delete this media?</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colors.white }]}
                onPress={handleCloseDeleteModal}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colors.error }]}
                onPress={handleDeleteMedia}
              >
                <Text style={{ color: Colors.white }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <Modal
          visible={loading}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setLoadingState(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text>Uploading...</Text>
              <Text>{uploadProgress}%</Text>

              <View
                style={{
                  width: '100%',
                  height: 10,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 5,
                  marginTop: 10,
                }}
              >
                <View
                  style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: '#46d157',
                    borderRadius: 5,
                  }}
                />
              </View>
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
    //fontWeight: '500',
    fontFamily:'Poppins_600SemiBold',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
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
});

export default UploadScreen;