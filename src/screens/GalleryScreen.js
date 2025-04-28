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
import { useDispatch, useSelector } from 'react-redux';
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
import moment from 'moment-timezone';
import * as ScreenOrientation from 'expo-screen-orientation';
import { setUnreadMessagesData, setUnreadMessagesCount } from '../state/slices/headerSlice';
import { connectSocket, getSocket } from '../services/socket';


const Tab = createMaterialTopTabNavigator();

const MediaGrid = ({ data, type = 'all', onPreview, refreshing, onRefresh }) => {
  const filteredData = type === 'all' ? data : data.filter(item => item.object_type === type);

  const formatCreatedAtToIST = (created_at) => {
    const istDate = moment.utc(created_at).tz('Asia/Kolkata');
    const date = istDate.format('DD/MM/YYYY');  
    const time = istDate.format('HH:mm');
    return `${date} | ${time}`;
  };

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
          <Text style={styles.videoDuration}>{formatCreatedAtToIST(item.created_at)}</Text>
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
      refreshing={refreshing} 
      onRefresh={onRefresh}
    />
  );
};

const AllTab = ({ data, onPreview, refreshing, onRefresh }) => <MediaGrid data={data} type="all" onPreview={onPreview} refreshing={refreshing} onRefresh={onRefresh}/>;
const ImagesTab = ({ data, onPreview, refreshing, onRefresh }) => <MediaGrid data={data} type="image" onPreview={onPreview} refreshing={refreshing} onRefresh={onRefresh}/>;
const VideosTab = ({ data, onPreview,refreshing, onRefresh }) => <MediaGrid data={data} type="video" onPreview={onPreview} refreshing={refreshing} onRefresh={onRefresh}/>;

const GalleryScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [mediaData, setMediaData] = useState({ images: [], videos: [] });
  const [previewItem, setPreviewItem] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMaximized, setIsMaximized]= useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const user = useSelector(state => state.auth);
  const stream = useSelector(state => state.stream);
  const dispatch = useDispatch();

const onRefresh = async () => {
  setRefreshing(true);
  await fetchMediaData();
  setRefreshing(false);
};

  
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
            //'Cookie': `Timezone=${timezone || 'UTC'}; Token=${token || ''}`,
          }
        }
      );
       if(res){
       console.log('getPatientByEmail',res.data)
       }else{
        console.log('getPatientByEmail else',res.data)
       }

      if (res.status === 200) {
        const data1 = res.data;
        try {
          const response = await axios.get(
            EXPO_PUBLIC_CLOUD_API_URL + `/get-images/?machine_id=${user.machineId}&user_id=${user.uuid}&mobile=${data1.phone}&email=${user.email}`,
            {
              headers: {
                'Content-Type': 'application/json',
              }
            }
          );

          console.log('CLOUD_API_URL get-images',response)

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
            console.log('CLOUD_API_URL get-images error',response.error)
            setIsLoading(false);
          }
        } catch (error) {
          console.log('catch CLOUD_API_URL get-images error',error)
          setIsLoading(false);
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.log('catch 2 CLOUD_API_URL get-images error',error)
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMediaData();
    }
  }, [user,stream]);

  useEffect(() => {

  }, []);  

  useEffect(() => {
    const fetchUnreadChats = async () => {
      try {
        const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/chats/get-unread-chat-members`);
  
        //console.log('get-unread-chat-members',response.data)
        dispatch(setUnreadMessagesData(response.data));
        dispatch(setUnreadMessagesCount(response.data.unread_messages?.[0]?.unread_count || 0));
      } catch (error) {
        console.error('Error fetching unread chats:', error);
      }
    };
  
    fetchUnreadChats();

    const intervalId = setInterval(fetchUnreadChats, 3000); 
  
    return () => clearInterval(intervalId);
  }, []);  

  const handlePreview = (item) => {
    if (!item.object_url) {
      item.object_url = img;
    }
    setPreviewItem(item);
    setModalVisible(true);
  };

  const closeModal = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    setModalVisible(false);
    setPreviewItem(null);
    setIsFullScreen(false);
    setIsMaximized(false);
  };

  useEffect(() => {
    if (!modalVisible) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }, [modalVisible]);
  
  const togglePlayPause = () => {
    setIsPaused(!isPaused);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullScreen = () => {
    setIsMaximized(!isMaximized);
  };

  const enterFullScreen = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    setIsFullScreen(true);
  };
  
  const exitFullScreen = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    setIsFullScreen(false);
  };

  return (
    <View style={[GlobalStyles.container,{marginBottom:65}]}>
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
          <Tab.Screen name="All" children={() => <AllTab data={[...mediaData.images, ...mediaData.videos].sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at))} onPreview={handlePreview} refreshing={refreshing} onRefresh={onRefresh}/>} />
          <Tab.Screen name="Images" children={() => <ImagesTab data={mediaData.images} onPreview={handlePreview} refreshing={refreshing} onRefresh={onRefresh}/>} />
          <Tab.Screen name="Videos" children={() => <VideosTab data={mediaData.videos} onPreview={handlePreview} refreshing={refreshing} onRefresh={onRefresh}/>} />
        </Tab.Navigator>
      )}

      {previewItem && previewItem.object_url && (
        <Modal transparent={true} visible={modalVisible} onRequestClose={closeModal}>
          <TouchableWithoutFeedback >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, isFullScreen && styles.maxRotateModelContent,isMaximized && styles.maxModalContent]}>
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
                    style={[styles.modalImage,
                      isMaximized && {
                        width: "100%",
                        height: "100%",
                      }
                    ]}
                    resizeMode="contain"
                  />
                )}

                {previewItem.object_type === 'video'? (
                  <View style={styles.muteButton}>
                  <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                    <View style={styles.muteButtonText}>
                      <MaterialIcons
                        name={isMuted ? "volume-off" : "volume-up"}
                        size={20}
                        color="white"
                      />
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={isFullScreen ? exitFullScreen : enterFullScreen} style={styles.rotateButton}>
                    <View style={styles.muteButtonText}>
                     <MaterialIcons
                        name={isFullScreen ? "stay-current-landscape" : "stay-current-portrait"}
                        size={20}
                        color="white"
                      />
                    </View>
                  </TouchableOpacity>
                  </View>
                ):(
                <View style={styles.muteButton}>
                  <TouchableOpacity onPress={toggleFullScreen} style={styles.muteButton}>
                    <View style={styles.muteButtonText}>
                      <MaterialIcons
                        name={isFullScreen?isMaximized ? "fullscreen" : "fullscreen-exit":isMaximized ? "fullscreen-exit" : "fullscreen"}
                        size={20}
                        color="white"
                      />
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={isFullScreen ? exitFullScreen : enterFullScreen} style={styles.rotateButton}>
                    <View style={styles.muteButtonText}>
                     <MaterialIcons
                        name={isFullScreen ? "stay-current-landscape" : "stay-current-portrait"}
                        size={20}
                        color="white"
                      />
                    </View>
                  </TouchableOpacity>
                  </View>)}

                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <MaterialIcons name="close" size={30} color="white" />
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

const { width,height } = Dimensions.get('window');
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
    bottom: 0,
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
    fontFamily:'Poppins_400Regular'
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
    height: '50%',
    maxWidth: Dimensions.get('window').width,
    maxHeight: Dimensions.get('window').height,
    backgroundColor: 'black',
    padding: 10,
  },
  maxModalContent: {
    width: '100%',
    height: '100%',
    maxWidth: Dimensions.get('window').width,
    maxHeight: Dimensions.get('window').height,
    backgroundColor: 'black',
    padding: 10,
  },
  maxRotateModelContent: { 
    width: '100%',
    height: '100%',
    maxWidth: Dimensions.get('window').height,
    maxHeight: Dimensions.get('window').width,
    backgroundColor: 'black',
    padding: 10,
    },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalVideo: {
    width: '100%',
    height: '100%',
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
    top: 0,
    right: 0,
    backgroundColor: 'black',
    padding: 5,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'red',
    fontSize: 14,
  },
  muteButton: {
    position: 'absolute',
    top: 5,
    left: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 5,
  },
  rotateButton: {
    position: 'absolute',
    top: 5,
    left: 43,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 5,
  },
  muteButtonText: {
    color: 'white',
    fontSize: 10,
  },
});

export default GalleryScreen;

