import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Header from '../components/Header';
import Colors from '../constants/Colors';
import GlobalStyles from '../styles/GlobalStyles';
import { useSelector } from 'react-redux';
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLOUD_API_URL } from '@env';
import axios from 'axios';
import { Video } from 'expo-av';
import { MaterialIcons } from 'react-native-vector-icons';

import { img } from '../../assets/images/Pause_video.js';
import { defaultThumbnail } from '../../assets/images/Pause_video.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from '../components/Loader';
import LiveStreamStatus from './LiveStreamStatus.js';
import { useRouter } from 'expo-router';

const Tab = createMaterialTopTabNavigator();

const MediaGrid = ({ data, type = 'all', onPreview }) => {
  const filteredData = type === 'all'
    ? data
    : data.filter(item => item.object_type === type);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.mediaItem}
      onPress={() => onPreview(item)}
    >
      {item.object_type === 'video' ? (
        <Image
          source={{ uri: item.thumbnail_url || defaultThumbnail }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      ) : (
        <Image
          source={{ uri: item.object_url }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      )}

      {item.object_type === 'video' && (
        <View style={styles.videoBadge}>
          <Text style={styles.videoDuration}>{item.created_at}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={filteredData}
      renderItem={renderItem}
      numColumns={3}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.gridContainer}
      ListEmptyComponent={<Text>No media available</Text>}
    />
  );
};

const AllTab = ({ data, onPreview }) => <MediaGrid data={data} type="all" onPreview={onPreview} />;
const ImagesTab = ({ data, onPreview }) => <MediaGrid data={data} type="image" onPreview={onPreview} />;
const VideosTab = ({ data, onPreview }) => <MediaGrid data={data} type="video" onPreview={onPreview} />;

const GalleryScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [mediaData, setMediaData] = useState({ images: [], videos: [] });
  const [previewItem, setPreviewItem] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const user = useSelector(state => state.auth);

  const fetchMediaData = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const timezone = await AsyncStorage.getItem('timezone');

      const res = await axios.get(
        EXPO_PUBLIC_API_URL + `/api/patients/getPatientByEmail?email=${user.email}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `Timezone=${timezone || 'UTC'}; Token=${token || ''}`,
          }
        }
      );

      if (res.status === 200) {
        const data1 = res.data;
        try {
          const response = await axios.get(
            EXPO_PUBLIC_CLOUD_API_URL + `/get-images/?machine_id=${user.machineId}&user_id=${user.uuid}&mobile=${data1.phone}&email=${user.email}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'Cookie': `Timezone=${timezone || 'UTC'}; Token=${token || ''}`,
              }
            }
          );

          if (response.status === 200) {
            const images = [];
            const videos = [];

            response.data.forEach(item => {
              if (item.object_type === 'image') {
                images.push(item);
              } else if (item.object_type === 'video') {
                videos.push(item);
              }
            });

            setMediaData({ images, videos });
            setIsLoading(false);
          } else {
            setIsLoading(false);
          }
        } catch (error) {
          setIsLoading(false);
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMediaData();
    }
  }, [user]);

  useEffect(() => {

  }, []);

  const handlePreview = (item) => {
    if (!item.object_url) {
      item.object_url = img;
    }
    setPreviewItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setPreviewItem(null);
  };

  const togglePlayPause = () => {
    setIsPaused(!isPaused);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <View style={GlobalStyles.container}>
      <LiveStreamStatus />
      <Header title="Gallery" />
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.white} />
      ) : (
        <Tab.Navigator
          screenOptions={{
            tabBarLabelStyle: styles.tabLabel,
            tabBarStyle: styles.tabBar,
            tabBarIndicatorStyle: styles.tabIndicator,
          }}
        >
          <Tab.Screen name="All" children={() => <AllTab data={mediaData.images.concat(mediaData.videos)} onPreview={handlePreview} />} />
          <Tab.Screen name="Images" children={() => <ImagesTab data={mediaData.images} onPreview={handlePreview} />} />
          <Tab.Screen name="Videos" children={() => <VideosTab data={mediaData.videos} onPreview={handlePreview} />} />
        </Tab.Navigator>
      )}

      {previewItem && previewItem.object_url && (
        <Modal transparent={true} visible={modalVisible} onRequestClose={closeModal}>
          <TouchableWithoutFeedback >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, isFullScreen && { width: '100%', height: '100%', margin: 0 }]}>
                {previewItem.object_type === 'video' ? (
                  <Video
                    source={{ uri: previewItem.object_url }}
                    style={[styles.modalVideo, isFullScreen && { width: '100%', height: '100%' }]}
                    useNativeControls
                    shouldPlay={true}
                    isLooping={true}
                    isMuted={isMuted}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={{ uri: previewItem.object_url }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                )}

                {previewItem.object_type === 'video' && (
                  <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                    <View style={styles.muteButtonText}>
                      <MaterialIcons
                        name={isMuted ? "volume-off" : "volume-up"}
                        size={30}
                        color="white"
                      />
                    </View>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <MaterialIcons name="close" size={30} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {isLoading && <Loader loading={true} />}
    </View>
  );
};

const { width } = Dimensions.get('window');
const itemSize = (width - 45) / 3;

const styles = StyleSheet.create({
  gridContainer: {
    padding: 15,
    justifyContent: 'left',
    alignItems: 'left',
  },
  mediaItem: {
    width: itemSize,
    height: itemSize,
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDuration: {
    color: Colors.white,
    fontSize: 7,
  },
  tabBar: {
    backgroundColor: Colors.white,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabLabel: {
    textTransform: 'none',
    fontWeight: '600',
  },
  tabIndicator: {
    backgroundColor: Colors.primary,
    height: 3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 600,
    maxHeight: 400,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalVideo: {
    width: '100%',
    height: 300,
  },
  controls: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
  },
  closeButton: {
    position: 'absolute',
    top: -37,
    right: 0,
    backgroundColor: 'rgba(248, 245, 245, 0.7)',
    padding: 5,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'red',
    fontSize: 14,
  },
  muteButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 5,
  },
  muteButtonText: {
    color: 'white',
    fontSize: 14,
  },
});

export default GalleryScreen;

