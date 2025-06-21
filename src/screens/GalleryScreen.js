import React, { useState, useEffect, useCallback } from 'react';
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
  StatusBar,
  Platform,
  Alert,
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
import { useFocusEffect, useRouter } from 'expo-router';
import moment from 'moment-timezone';
import * as ScreenOrientation from 'expo-screen-orientation';
import { setUnreadMessagesData, setUnreadMessagesCount } from '../state/slices/headerSlice';
import { connectSocket, getSocket } from '../services/socket';
import { updateActionStatus } from '../state/slices/authSlice.js';
import { logError } from '../components/logError.js';
import AppUpdateModal from '../components/AppUpdateModal';
import StorageModals from '../components/StorageModals.js'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectStoragePlan, setStoragePlanDetails } from '../state/slices/storagePlanSlice.js';
import { Ionicons } from '@expo/vector-icons';
import Snackbar from '../components/Snackbar.js';

const Tab = createMaterialTopTabNavigator();

const MediaGrid = ({ data, type = 'all', onPreview, refreshing, onRefresh, selectedItems, setSelectedItems, selectionMode, setSelectionMode }) => {
  const filteredData = type === 'all' ? data : data.filter(item => item.object_type === type);

  const formatCreatedAtToIST = (created_at) => {
    const istDate = moment.utc(created_at).tz('Asia/Kolkata');
    const date = istDate.format('DD/MM/YYYY');  
    const time = istDate.format('HH:mm');
    return `${date} | ${time}`;
  };

  // const renderItem = ({ item }) => (
  //   <TouchableOpacity
  //     style={styles.mediaItem}
  //     onPress={() => onPreview(item)}
  //   >
  //     {item.object_type === 'video' ? (
  //       <Image
  //         source={{ uri: item.thumbnail_url || defaultThumbnail }}
  //         style={styles.mediaImage}
  //         resizeMode="cover"
  //       />
  //     ) : (
  //       <Image
  //         source={{ uri: item.object_url }}
  //         style={styles.mediaImage}
  //         resizeMode="cover"
  //       />
  //     )}

  //     {item.object_type === 'video' && (
  //       <View style={styles.videoBadge}>
  //         <Text style={styles.videoDuration}>{formatCreatedAtToIST(item.created_at)}</Text>
  //       </View>
  //     )}
  //   </TouchableOpacity>
  // );

  const toggleSelection = (item) => {
  if (!selectionMode) {
    setSelectionMode(true);
    setSelectedItems([item.id]);
  } else {
    if (selectedItems.includes(item.id)) {
      setSelectedItems(prev => prev.filter(id => id !== item.id));
      if (selectedItems.length === 1) setSelectionMode(false);
    } else {
      setSelectedItems(prev => [...prev, item.id]);
    }
  }
};

const renderItem = ({ item }) => {
  const isSelected = selectedItems.includes(item.id);

  return (
    <TouchableOpacity
      style={[styles.mediaItem, isSelected && styles.selectedMediaItem]}
      onLongPress={() => toggleSelection(item)}
      onPress={() => {
        if (selectionMode) {
          toggleSelection(item);
        } else {
          onPreview(item);
        }
      }}
    >
      <Image
        source={{ uri: item.object_type === 'video' ? item.thumbnail_url || defaultThumbnail : item.object_url }}
        style={styles.mediaImage}
        resizeMode="cover"
      />
      {item.object_type === 'video' && (
        <View style={styles.videoBadge}>
          <Text style={styles.videoDuration}>{formatCreatedAtToIST(item.created_at)}</Text>
        </View>
      )}
      {isSelected && (
        <View style={styles.selectionOverlay}>
          <MaterialIcons name="check-circle" size={24} color={Colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};


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

const AllTab = ({ data, onPreview, refreshing, onRefresh, selectedItems, setSelectedItems, selectionMode, setSelectionMode}) => <MediaGrid data={data} 
  type="all" 
  onPreview={onPreview} 
  refreshing={refreshing} 
  onRefresh={onRefresh} 
  selectedItems={selectedItems}
  setSelectedItems={setSelectedItems}
  selectionMode={selectionMode}
  setSelectionMode={setSelectionMode}/>;
const ImagesTab = ({ data, onPreview, refreshing, onRefresh, selectedItems, setSelectedItems, selectionMode, setSelectionMode }) => <MediaGrid data={data} 
  type="image" 
  onPreview={onPreview} 
  refreshing={refreshing} 
  onRefresh={onRefresh} 
  selectedItems={selectedItems}
  setSelectedItems={setSelectedItems}
  selectionMode={selectionMode}
  setSelectionMode={setSelectionMode}/>;
const VideosTab = ({ data, onPreview,refreshing, onRefresh, selectedItems, setSelectedItems, selectionMode, setSelectionMode }) => <MediaGrid data={data} 
  type="video" 
  onPreview={onPreview} 
  refreshing={refreshing} 
  onRefresh={onRefresh} 
  selectedItems={selectedItems}
  setSelectedItems={setSelectedItems}
  selectionMode={selectionMode}
  setSelectionMode={setSelectionMode}/>;

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
  //const [storagePlanPayment, setStoragePlanPayment] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('success');

  const user = useSelector(state => state.auth);
  const stream = useSelector(state => state.stream);
  //const storagePlan = useSelector(state => state.storagePlan)
  const { storagePlanPayment } = useSelector(selectStoragePlan);
  console.log("storagePlanPayment",storagePlanPayment)
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

const onRefresh = async () => {
  setRefreshing(true);
  await fetchMediaData();
  setRefreshing(false);
};
  
  const fetchMediaData = async () => {
    setIsLoading(true);
    try {
      if (!user.email) {
        return;        
      }

      const res = await axios.get(
        EXPO_PUBLIC_API_URL + `/api/patients/getPatientByEmail?email=${user.email}`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      if (res.status === 200) {
        const data1 = res.data;
        // setStoragePlanPayment(data1.storagePlanPayment)
        // dispatch(setStoragePlanDetails({
        //   skippedPlanCount: data1.skippedPlanCount,
        //   storagePlanId: data1.storagePlanId,
        //   storagePlanPayment: data1.storagePlanPayment,
        // }));
        // console.log("data1",data1)
        try {
          const response = await axios.get(
            EXPO_PUBLIC_CLOUD_API_URL + `/get-images/?machine_id=${user.machineId}&user_id=${user.uuid}&email=${user.email}`,
            {
              headers: {
                'Content-Type': 'application/json',
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

          await logError({
                  error: error,
                  data: error.response,
                  details: "Error in get-images API call on GalleryScreen"
                });

          setIsLoading(false);
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      await logError({
        error: error,
        data: error.response,
        details: "Error in get-images API call catch 2 on GalleryScreen"
      });
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMediaData();
      dispatch(updateActionStatus(''));
    }
  }, [user]);


//  useFocusEffect(
//   useCallback(() => {
//     StatusBar.setHidden(true); // Ensure it’s visible
//   }, [])
// ); 

  useEffect(() => {
    const fetchUnreadChats = async () => {
      try {
        const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/chats/get-unread-chat-members`);
        console.log('response',response.data)
        dispatch(setUnreadMessagesData(response.data));
        dispatch(setUnreadMessagesCount(response.data.unread_messages?.[0]?.unread_count || 0));
      } catch (error) {
        console.error('Error fetching unread chats:', error);
      }
    };
  
    fetchUnreadChats();

    const intervalId = setInterval(fetchUnreadChats, 5000); 
  
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
    StatusBar.setHidden(false);

    setModalVisible(false);
    setPreviewItem(null);
    setIsFullScreen(false);
    setIsMaximized(false);
    //StatusBar.setHidden(false);
  };

  useEffect(() => {
    if (!modalVisible) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
    StatusBar.setHidden(modalVisible);
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
    //StatusBar.setHidden(true);
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    setIsFullScreen(true);
    <StatusBar hidden={modalVisible} />
    StatusBar.setHidden(false)
  };
  
  const exitFullScreen = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    setIsFullScreen(false);
    StatusBar.setHidden(false)
  };

  const handleCancelSelection = () => {
  setSelectionMode(false);
  setSelectedItems([]);
};

const handleDeleteSelected = () => {
  if (selectedItems.length > 0) {
    setShowDeleteModal(true);
  }
};

const confirmDelete = async () => {
  try {
    setIsDeleting(true);
    // Combine images and videos into one array
    const allMedia = [...mediaData.images, ...mediaData.videos];

    // Filter only selected items
    const selectedMediaObjects = allMedia.filter(item =>
      selectedItems.includes(item.id)
    );

    // Loop through and send delete API calls
    for (const item of selectedMediaObjects) {
      const payload = {
        id: item.id,
        object_type: item.object_type,     // "image" or "video"
        object_url: item.object_url, // make sure you're using the correct field
        user_id: item.user_id,
      };

      console.log("Calling:", `${EXPO_PUBLIC_API_URL}/delete-contents/`);
      console.log('Payload for delete:', payload);

      const res = await axios.delete(`${EXPO_PUBLIC_CLOUD_API_URL}/delete-contents/`, {
        data: payload,
      });
      console.log("Delete responce",res)
    }

    // Reset state after deletion
    setSelectedItems([]);
    setSelectionMode(false);
    fetchMediaData(); // Refresh media
    setShowDeleteModal(false);

    setSnackbarMessage(`Selected ${selectedItems.length} media deleted successfully!`);
    setSnackbarType('success');
    setSnackbarVisible(true);
  } catch (error) {
    console.error('Delete error:', error);
    setShowDeleteModal(false);

    setSnackbarMessage(`Failed to delete ${selectedItems.length} media. Please try again.`);
    setSnackbarType('error');
    setSnackbarVisible(true);
  } finally {
    setIsDeleting(false); // hide loader
  }
};


  return (
    <View style={[GlobalStyles.container,{marginBottom:65},Platform.OS === 'android' ? { paddingTop: insets.top } : null]}>
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
            new Date(b.created_at) - new Date(a.created_at))} onPreview={handlePreview} refreshing={refreshing} onRefresh={onRefresh} selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}/>} />
          <Tab.Screen name="Images" children={() => <ImagesTab data={mediaData.images} onPreview={handlePreview} refreshing={refreshing} onRefresh={onRefresh} selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}/>} />
          <Tab.Screen name="Videos" children={() => <VideosTab data={mediaData.videos} onPreview={handlePreview} refreshing={refreshing} onRefresh={onRefresh} selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}/>} />
        </Tab.Navigator>
      )}

      {selectionMode && (
        <View style={styles.selectionHeader}>
          <TouchableOpacity onPress={handleCancelSelection}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeleteSelected}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}


<AppUpdateModal serverUrl={`${EXPO_PUBLIC_API_URL}/api/app-version`} />
{storagePlanPayment !== 1 && <StorageModals />}

      {previewItem && previewItem.object_url && (
        <Modal 
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent,isFullScreen && styles.maxRotateModelContent,isMaximized && styles.maxModalContent]}>
                {previewItem.object_type === 'video' ? (
                  <Video
                    key={previewItem?.id}
                    source={{ uri: previewItem.object_url }}
                    style={[styles.modalVideo, isFullScreen && { width: '100%', height: '100%' }]}
                    useNativeControls
                    shouldPlay={modalVisible}
                    isLooping
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
        </Modal>
      )}

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.delModalOverlay}>
          <View style={styles.delModalContainer}>
            <Ionicons name="warning" size={48} color={Colors.error} />
            <Text style={styles.delModalTitle}>Delete Selected Media</Text>
            <Text style={styles.delModalMessage}>
              Are you sure you want to delete {selectedItems.length} selected item(s)?
            </Text>
            {isDeleting ? (
              <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <ActivityIndicator size="large" color="red" />
                <Text style={{ marginTop: 10, fontSize: 16, color: 'red', fontWeight: '600' }}>
                  Deleting...
                </Text>
              </View>
            ) : (
              <View style={styles.delModalButtons}>
                <TouchableOpacity
                  onPress={() => setShowDeleteModal(false)}
                  style={[styles.delModalButton, { backgroundColor: '#ccc', flexDirection: 'row' }]}
                >
                  <Ionicons name="close-circle" size={20} color="white" style={{ marginRight: 5 }} />
                  <Text style={styles.delModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmDelete}
                  style={[styles.delModalButton, { backgroundColor: 'red', flexDirection: 'row' }]}
                >
                  <MaterialIcons name="delete" size={20} color="white" style={{ marginRight: 5 }} />
                  <Text style={styles.delModalButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />


      {isLoading && <Loader loading={true} />}
    </View>
  );
};

const { width,height } = Dimensions.get('window');
const itemSize = (width - 45) / 3;

const styles = StyleSheet.create({
  gridContainer: {
    padding: 5,
    justifyContent: 'center',
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
  // modalOverlay: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   backgroundColor: 'rgba(0, 0, 0, 0.8)',
  // },

  modalOverlay: {
  position: 'absolute',  // ✅ Needed for full-screen overlay
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,           // ✅ Ensure it stays on top
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    maxWidth: Dimensions.get('window').height,
    maxHeight: Dimensions.get('window').width,
    backgroundColor: 'black',
    padding: 10,
    },

//   maxRotateModelContent: {
//   position: 'absolute',
//   top: 0,
//   left: 0,
//   right: 0,
//   bottom: 0,
//   width: Dimensions.get('window').height, // rotated
//   height: Dimensions.get('window').width, // rotated
//   backgroundColor: 'black',
//   padding: 0, // No padding in fullscreen!
//   zIndex: 9999,
// },

  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  modalVideo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
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
    top: 5,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 5,
    zIndex: 999,
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
    zIndex: 999,
  },
  rotateButton: {
    position: 'absolute',
    top: 5,
    left: 43,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 5,
    zIndex: 999,
  },
  muteButtonText: {
    color: 'white',
    fontSize: 10,
  },
  selectedMediaItem: {
  borderWidth: 2,
  borderColor: Colors.primary,
  opacity: 0.7,
},

selectionOverlay: {
  position: 'absolute',
  top: 5,
  right: 5,
  backgroundColor: 'rgba(0,0,0,0.6)',
  borderRadius: 15,
  padding: 2,
},
selectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 10,
  backgroundColor: '#f2f2f2',
  borderBottomWidth: 1,
  borderBottomColor: '#ddd',
},

cancelText: {
  fontSize: 16,
  color: 'red',
  fontWeight: '500',
},

deleteText: {
  fontSize: 16,
  color: 'black',
  fontWeight: '500',
},
delModalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},

delModalContainer: {
  backgroundColor: 'white',
  borderRadius: 14,
  padding: 20,
  width: '80%',
  alignItems: 'center',
},

delModalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  fontFamily: 'Poppins_600SemiBold',
  marginBottom: 10,
},

delModalMessage: {
  fontSize: 14,
  fontFamily: 'Poppins_400Regular',
  textAlign: 'center',
  marginBottom: 20,
},

delModalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
},

delModalButton: {
  flex: 1,
  marginHorizontal: 5,
  paddingVertical: 10,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center'
},

delModalButtonText: {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
  fontFamily:'Poppins_500Medium',
},

});

export default GalleryScreen;

