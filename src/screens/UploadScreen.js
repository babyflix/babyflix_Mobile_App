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
import { useDispatch, useSelector } from 'react-redux';
import { showSnackbar } from '../state/slices/uiSlice';
import axios from 'axios';
import { EXPO_PUBLIC_CLOUD_API_URL } from '@env';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const EXPO_PUBLIC_CLOUD_API_URLS  = 'https://dev-apis.babyflix.net/upload-files/'; 
const CHUNK_SIZE = 1024 * 1024; 

const UploadScreen = () => {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.auth); 
  const pickMedia = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "We need permission to access your media.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        setMedia(result.assets[0]);
        console.log('Selected media:', result.assets[0]);
      }
    } catch (error) {
      console.error("Media picker error:", error);
      Alert.alert("Error", "Failed to pick media.");
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

  const uploadChunk = async () => {
    if (!media) {
      Alert.alert('No media selected', 'Please select a media file first.');
      return;
    }

    setLoading(true);

    try {
      const chunks = await chunkFile(media.uri);

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
        formData.append("machine_id", user.role === "user" ? user.machineId : '');
        formData.append("user_id", user.role === "user" ? user.uuid : '');

        const response = await axios.post(EXPO_PUBLIC_CLOUD_API_URLS, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            accept: 'application/json',
          },
        });

        if (response.data?.message) {
          console.log(`Chunk ${chunk.index + 1} uploaded`);
        } else {
          throw new Error(`Chunk ${chunk.index + 1} upload failed`);
        }
      }

      Alert.alert('Success', 'File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading:', error?.response?.data || error.message);
      Alert.alert('Upload Failed', 'An error occurred while uploading the file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Upload Image or Video</Text>

      {/* Button to pick media */}
      <TouchableOpacity onPress={pickMedia} style={{ backgroundColor: '#ddd', padding: 10, marginBottom: 10 }}>
        <Text>Select Image or Video</Text>
      </TouchableOpacity>

      {/* If a media is selected, show upload button */}
      {media && (
        <View>
          <Text style={{ marginBottom: 10 }}>Selected: {media.fileName}</Text>
          <TouchableOpacity onPress={uploadChunk} style={{ backgroundColor: 'green', padding: 10 }}>
            <Text style={{ color: 'white' }}>{loading ? 'Uploading...' : 'Upload File in Chunks'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default UploadScreen;