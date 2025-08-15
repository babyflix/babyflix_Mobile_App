import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Button,
  AppState,
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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import { clearOpenStorage2 } from '../state/slices/storageUISlice.js';
import { useHeaderAction } from '../components/HeaderActionContext.js';
import { setPlanExpired, setRemainingDays, setUpgradeReminder } from '../state/slices/expiredPlanSlice.js';
import DeleteItemModal from '../components/modals/DeleteItemModal.js';
import DownloadItemModal from '../components/modals/DownloadItemModal.js';
import ShareItemModal from '../components/modals/ShareItemModal.js';
import FloatingDownloadBar from '../components/FloatingDownloadBar.js';
import Queue from '../components/DownloadQueue.js';

const Tab = createMaterialTopTabNavigator();

const MediaGrid = ({ data, type = 'all', onPreview, refreshing, onRefresh, selectedItems, setSelectedItems, selectionMode, setSelectionMode, activeMenuId, setActiveMenuId, showDeleteModal, setShowDeleteModal, showDownloadModal, setShowDownloadModal, showShareModal, setShowShareModal, setSelectedItem, disableMenuAndSelection }) => {
  const filteredData = type === 'all' ? data : data.filter(item => item.object_type === type);

  const formatCreatedAtToIST = (created_at) => {
    const istDate = moment.utc(created_at).tz('Asia/Kolkata');
    const date = istDate.format('DD/MM/YYYY');
    const time = istDate.format('HH:mm');
    return `${date} | ${time}`;
  };

  const toggleSelection = (item) => {
  if (disableMenuAndSelection) return;
  if (!selectionMode) {
    setSelectionMode(true);
    setSelectedItems([item]);
  } else {
    const exists = selectedItems.find(i => i.id === item.id);
    if (exists) {
      const updated = selectedItems.filter(i => i.id !== item.id);
      setSelectedItems(updated);
      if (updated.length === 0) setSelectionMode(false);
    } else {
      setSelectedItems(prev => [...prev, item]);
    }
  }
};

  const renderItem = ({ item }) => {
    const isSelected = selectedItems.some(i => i.id === item.id);
    const isMenuVisible = activeMenuId === item.id;

    //console.log("Rendering item:", item.id, "Menu visible:", isMenuVisible);

    return (
      <View style={{ position: 'relative' }}>
        <TouchableOpacity
          style={[styles.mediaItem, isSelected && styles.selectedMediaItem]}
          onLongPress={() => {
            if (!disableMenuAndSelection) toggleSelection(item);
          }}
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

        {/* 3-dot icon */}
        {!disableMenuAndSelection && (
        <TouchableOpacity
          style={styles.menuIcon}
          onPress={() => {
            setActiveMenuId(isMenuVisible ? null : item.id);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="more-horiz" size={17} color="black" />
        </TouchableOpacity>
        )}

        {isMenuVisible && (
          <>
          <TouchableWithoutFeedback onPress={() => setActiveMenuId(null)}>
            <View style={[StyleSheet.absoluteFillObject, { zIndex: 1 }]} />
          </TouchableWithoutFeedback>
          
          <View style={styles.menuPopup}>

            {/* <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              //setActiveMenuId(null);
              setSelectedItem([item]);
              setTimeout(() => {
                setShowShareModal(true); 
              }, 150);
              setActiveMenuId(null);
            }}
            >
              <MaterialIcons name="share" size={18} color="#000" style={{marginRight: 8}} />
              <Text style={styles.menuText}>Share</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setSelectedItem([item]);
                setTimeout(() => {
                  setShowDownloadModal(true); 
                }, 150);
                setActiveMenuId(null);
              }}
            >
              <MaterialIcons name="file-download" size={18} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.menuText}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setSelectedItem([item]);
                setTimeout(() => {
                  setShowDeleteModal(true); 
                }, 150);
                setActiveMenuId(null);
              }}
            >
              <MaterialIcons name="delete" size={18} color="red" style={{ marginRight: 8 }} />
              <Text style={[styles.menuText, { color: 'red' }]}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setActiveMenuId(null);
            }}
            >
              <MaterialIcons name="close" size={18} color="#000" style={{marginRight: 8}} />
              <Text style={styles.menuText}>Close</Text>
            </TouchableOpacity>
          </View>
          </>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={filteredData}
      renderItem={renderItem}
      numColumns={3}
      keyExtractor={(item) => item.id?.toString()}
      contentContainerStyle={styles.gridContainer}
      ListEmptyComponent={<Text>No media available</Text>}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

const AllTab = ({ data, onPreview, refreshing, onRefresh, selectedItems, setSelectedItems, selectionMode, setSelectionMode, activeMenuId, setActiveMenuId, showDeleteModal, setShowDeleteModal, showDownloadModal, setShowDownloadModal, showShareModal, setShowShareModal, setSelectedItem, disableMenuAndSelection }) => <MediaGrid data={data}
  type="all"
  onPreview={onPreview}
  refreshing={refreshing}
  onRefresh={onRefresh}
  selectedItems={selectedItems}
  setSelectedItems={setSelectedItems}
  selectionMode={selectionMode}
  setSelectionMode={setSelectionMode}
  setActiveMenuId={setActiveMenuId}
  activeMenuId={activeMenuId}
  setShowDeleteModal={setShowDeleteModal}
  showDeleteModal={showDeleteModal}
  setShowDownloadModal={setShowDownloadModal}
  showDownloadModal={showDownloadModal}
  setShowShareModal={setShowShareModal}
  showShareModal={showShareModal}
  setSelectedItem={setSelectedItem}
  disableMenuAndSelection={disableMenuAndSelection} />;
const ImagesTab = ({ data, onPreview, refreshing, onRefresh, selectedItems, setSelectedItems, selectionMode, setSelectionMode, activeMenuId, setActiveMenuId, showDeleteModal, setShowDeleteModal, showDownloadModal, setShowDownloadModal, showShareModal, setShowShareModal, setSelectedItem, disableMenuAndSelection }) => <MediaGrid data={data}
  type="image"
  onPreview={onPreview}
  refreshing={refreshing}
  onRefresh={onRefresh}
  selectedItems={selectedItems}
  setSelectedItems={setSelectedItems}
  selectionMode={selectionMode}
  setSelectionMode={setSelectionMode}
  setActiveMenuId={setActiveMenuId}
  activeMenuId={activeMenuId}
  setShowDeleteModal={setShowDeleteModal}
  showDeleteModal={showDeleteModal}
  setShowDownloadModal={setShowDownloadModal}
  showDownloadModal={showDownloadModal}
  setShowShareModal={setShowShareModal}
  showShareModal={showShareModal}
  setSelectedItem={setSelectedItem}
  disableMenuAndSelection={disableMenuAndSelection} />;
const VideosTab = ({ data, onPreview, refreshing, onRefresh, selectedItems, setSelectedItems, selectionMode, setSelectionMode, activeMenuId, setActiveMenuId, showDeleteModal, setShowDeleteModal, showDownloadModal, setShowDownloadModal, showShareModal, setShowShareModal, setSelectedItem, disableMenuAndSelection }) => <MediaGrid data={data}
  type="video"
  onPreview={onPreview}
  refreshing={refreshing}
  onRefresh={onRefresh}
  selectedItems={selectedItems}
  setSelectedItems={setSelectedItems}
  selectionMode={selectionMode}
  setSelectionMode={setSelectionMode}
  setActiveMenuId={setActiveMenuId}
  activeMenuId={activeMenuId}
  setShowDeleteModal={setShowDeleteModal}
  showDeleteModal={showDeleteModal}
  setShowDownloadModal={setShowDownloadModal}
  showDownloadModal={showDownloadModal}
  setShowShareModal={setShowShareModal}
  showShareModal={showShareModal}
  setSelectedItem={setSelectedItem}
  disableMenuAndSelection={disableMenuAndSelection} />;

const GalleryScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [mediaData, setMediaData] = useState({ images: [], videos: [] });
  const [previewItem, setPreviewItem] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('success');
  const [storageModelStart, setStorageModelStart] = useState(false);
  const [wasTriggered, setWasTriggered] = useState(false);
  const [storageModalKey, setStorageModalKey] = useState(false);
  const [hasHandledParam, setHasHandledParam] = useState(false);
  const [shouldShowStorageModal, setShouldShowStorageModal] = useState(false);
  const [showPlanExpiredModal, setShowPlanExpiredModal] = useState(false);
  const [expiredPlanName, setExpiredPlanName] = useState('');
  const [status, setStatus] = useState(null);
  const [status1, setStatus1] = useState(null);
  const [showUpgradeReminderModal, setShowUpgradeReminderModal] = useState(false);
  const [upgradeReminderMessage, setUpgradeReminderMessage] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [downloadVisible, setDownloadVisible] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadTitle, setDownloadTitle] = useState('');
  const [activeDownloads, setActiveDownloads] = useState(0);
  const [disableMenuAndSelection, setDisableMenuAndSelection] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  const user = useSelector(state => state.auth);
  const stream = useSelector(state => state.stream);
  const { storagePlanPayment } = useSelector(selectStoragePlan);
  const openStorage2Directly = useSelector(state => state.storageUI.openStorage2Directly);
  const forceOpenStorageModals = useSelector((state) => state.storageUI.forceOpenStorageModals);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const triggeredRef = useRef(false);
  const hasHandledPaymentStatusRef = useRef(false);
  const params = useLocalSearchParams();
  const { handleChooseClick } = useHeaderAction();
  const hasHiddenModalRef = useRef(false);
  const router = useRouter();
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMediaData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      triggeredRef.current = false;
      return () => {

      };
    }, [forceOpenStorageModals])
  );

  useFocusEffect(
  useCallback(() => {
    return () => {
      setActiveMenuId(null); // ✅ Close all open menus when leaving gallery
    };
  }, [])
);

  useEffect(() => {
    const checkSkipDate = async () => {
      try {
        const storedDateRaw = await AsyncStorage.getItem('last_skipped_plan_date');
        const storedDate = storedDateRaw?.trim();
        const today = moment();
        const storedDateMoment = moment(storedDate, 'DD-MM-YYYY', true);

        if (storagePlanPayment !== 1) {
          const isSameDay = storedDateMoment.isValid()
            ? storedDateMoment.isSame(today, 'day')
            : false;

            console.log('isSameDay',isSameDay)

          if (isSameDay) {
            setShouldShowStorageModal(false);
          } else {
            setShouldShowStorageModal(true);
          }
        } else {
          setShouldShowStorageModal(false);
        }
      } catch (error) {
        console.error('Error checking skip date:', error);
      }
    };

    checkSkipDate();
  }, [storagePlanPayment]);

  const fetchMediaData = async () => {
    setIsLoading(true);
    
        console.log('EXPO_PUBLIC_API_URL',EXPO_PUBLIC_API_URL)
    try {
      if (!user.email) return;

      const res = await axios.get(
        EXPO_PUBLIC_API_URL + `/api/patients/getPatientByEmail?email=${user.email}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.status === 200) {
        const data1 = res.data;
        const { storagePlanPrice, storagePlanDate, storagePlanName, storagePlanId } = data1;

        if (storagePlanId == null) {
          //setMediaData({ images: [], videos: [] });
          //return
          setDisableMenuAndSelection(true);
        } else {
          setDisableMenuAndSelection(false);
        }

        if (storagePlanPrice === '0.00' && storagePlanDate) {
          const planStartDate = moment(storagePlanDate, 'MM-DD-YYYY HH:mm:ss', true);
          const today = moment();
          const daysSince = today.diff(planStartDate, 'days');

          if (daysSince >= 31) {
            dispatch(setPlanExpired(true));
            setMediaData({ images: [], videos: [] });
            setShowUpgradeReminderModal(false);
            setTimeout(() => {
              setShowPlanExpiredModal(true);
            }, 200);
            setExpiredPlanName(storagePlanName);
            setIsLoading(false);
            setBannerMessage(
            `Your "${storagePlanName}" plan is expired please upgrade.`
          );
            return;
          }

         if (daysSince === 18) {
          const remainingDays = 30 - daysSince;
          dispatch(setRemainingDays(remainingDays));

          const message = `Your "${storagePlanName}" plan is expiring in ${remainingDays} day${remainingDays > 1 ? 's' : ''}.`;
          setUpgradeReminderMessage(
            `${message} After that, you won't be able to view or download media.`
          );
          setBannerMessage(message);

        } else if (daysSince >= 28 && daysSince < 30) {
          const remainingDays = 30 - daysSince;
          dispatch(setUpgradeReminder(true));
          dispatch(setRemainingDays(remainingDays));

          const message = `Your "${storagePlanName}" plan is expiring in ${remainingDays} day${remainingDays > 1 ? 's' : ''}.`;
          setUpgradeReminderMessage(
            `${message} After that, you won't be able to view or download media.`
          );
          setBannerMessage(message);
          setShowUpgradeReminderModal(true);

        } else if (daysSince === 30) {
          setBannerMessage(`Your "${storagePlanName}" plan expires today.`);
          dispatch(setRemainingDays(0)); // ✅ Plan expires today

        } else if (daysSince > 30) {
          setBannerMessage(`Your "${storagePlanName}" has already expired.`);
          dispatch(setRemainingDays(-1)); // ✅ Plan already expired
        }
        }

        try {
          console.log('innnn')
          const response = await axios.get(
            EXPO_PUBLIC_CLOUD_API_URL + `/get-images/?machine_id=${user.machineId}&user_id=${user.uuid}&email=${user.email}`,
            { headers: { 'Content-Type': 'application/json' } }
          );

          //console.log('response',response)

          if (response.status === 200) {
            const images = [], videos = [];
            response.data.forEach(item => {
              if (item.object_type === 'image') images.push(item);
              else if (item.object_type === 'video') videos.push(item);
            });
            setMediaData({ images, videos });
          }

          dispatch(setPlanExpired(false));
        } catch (error) {
          await logError({
            error,
            data: error.response,
            details: "Error in get-images API call on GalleryScreen"
          });
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      await logError({
        error,
        data: error.response,
        details: "Error in getPatientByEmail catch block"
      });
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const fetchStatusFromStorage = async () => {
      const storedStatus = await AsyncStorage.getItem('payment_status');
      const storedPaying = await AsyncStorage.getItem('paying');

      setStatus(storedStatus);
      setStatus1(storedPaying);

      if (!storedStatus && storedPaying === 'true') {
        dispatch(clearOpenStorage2());
        await AsyncStorage.setItem('storage_modal_triggered', 'false');
        setStorageModelStart(true);
        triggeredRef.current = false;

        if (isAuthenticated) {
          router.push('/gallery');
        }
      }
    };

    fetchStatusFromStorage();
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMediaData();
      dispatch(updateActionStatus(''));
      setWasTriggered(true)
    }
  }, [user, wasTriggered]);

  useEffect(() => {
    if ((status === 'done' || status1 === 'true') && !hasHiddenModalRef.current) {
      fetchMediaData();
      setShowPlanExpiredModal(false);
      setWasTriggered(false)
      hasHiddenModalRef.current = true;
    }
  }, [status, status1]);


  useFocusEffect(
    useCallback(() => {
      const checkTriggerOnce = async () => {
        const hasTriggered = await AsyncStorage.getItem('storage_modal_triggered');

        const shouldOpenFromParam = params?.showStorageModal === 'true' && !hasHandledParam;
        const shouldOpenFromRedux = openStorage2Directly && hasTriggered !== 'true' && !triggeredRef.current;

        if (shouldOpenFromParam || shouldOpenFromRedux) {
          setStorageModelStart(true);
          setStorageModalKey(true);

          if (shouldOpenFromParam) {
            setHasHandledParam(true);
          }

          if (shouldOpenFromRedux) {
            await AsyncStorage.setItem('storage_modal_triggered', 'true');
            dispatch(clearOpenStorage2());
            triggeredRef.current = true;
          }
        }
      };

      checkTriggerOnce();
    }, [params?.showStorageModal, openStorage2Directly, hasHandledParam])
  );


  useFocusEffect(
    useCallback(() => {
      const checkPaymentStatus = async () => {
        if (hasHandledPaymentStatusRef.current) return;

        const status = await AsyncStorage.getItem('payment_status');
        if (status === 'fail' || status === 'done') {
          setStorageModelStart(true);
          setStorageModalKey(true);
          hasHandledPaymentStatusRef.current = true;
          await AsyncStorage.setItem('paying', 'false');
        }
      };

      checkPaymentStatus();
    }, [])
  );

  useEffect(() => {
    const fetchUnreadChats = async () => {
      try {
        const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/chats/get-unread-chat-members`);
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
    setSelectedItem(selectedItems);
    setSelectionMode(false);
    setSelectedItems([]);
    setTimeout(() => {
      setShowDeleteModal(true); 
    }, 150);
  }
};
const handleDownloadSelected = () => {
  if (selectedItems.length > 0) {
    setSelectedItem(selectedItems);
    setSelectionMode(false);
    setSelectedItems([]);
    setTimeout(() => {
    setShowDownloadModal(true); 
  }, 150);
  }
};
const handleShareSelected = () => {
  if (selectedItems.length > 0) {
    setSelectedItem(selectedItems);
    setSelectionMode(false);
    setSelectedItems([]);
    setTimeout(() => {
      setShowShareModal(true);
    }, 150);
  }
};

  const handleProccessCompleted = () => {
    setSelectedItems([]);
    setSelectionMode(false);
    setShowDeleteModal(false);
    setShowDownloadModal(false);
    setShowShareModal(false);
  };

  return (
    <View style={[GlobalStyles.container, { marginBottom: 65 }, Platform.OS === 'android' ? { paddingTop: insets.top } : null]}>
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
            setSelectionMode={setSelectionMode}
            setActiveMenuId={setActiveMenuId}
            activeMenuId={activeMenuId}
            setShowDeleteModal={setShowDeleteModal}
            showDeleteModal={showDeleteModal}
            setShowDownloadModal={setShowDownloadModal}
            showDownloadModal={showDownloadModal}
            setShowShareModal={setShowShareModal}
            showShareModal={showShareModal}
            setSelectedItem={setSelectedItem}
            disableMenuAndSelection={disableMenuAndSelection} />} />
          <Tab.Screen name="Images" children={() => <ImagesTab data={mediaData.images} onPreview={handlePreview} refreshing={refreshing} onRefresh={onRefresh} selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}
            setActiveMenuId={setActiveMenuId}
            activeMenuId={activeMenuId}
            setShowDeleteModal={setShowDeleteModal}
            showDeleteModal={showDeleteModal}
            setShowDownloadModal={setShowDownloadModal}
            showDownloadModal={showDownloadModal}
            setShowShareModal={setShowShareModal}
            showShareModal={showShareModal}
            setSelectedItem={setSelectedItem}
            disableMenuAndSelection={disableMenuAndSelection} />} />
          <Tab.Screen name="Videos" children={() => <VideosTab data={mediaData.videos} onPreview={handlePreview} refreshing={refreshing} onRefresh={onRefresh} selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}
            setActiveMenuId={setActiveMenuId}
            activeMenuId={activeMenuId}
            setShowDeleteModal={setShowDeleteModal}
            showDeleteModal={showDeleteModal}
            setShowDownloadModal={setShowDownloadModal}
            showDownloadModal={showDownloadModal}
            setShowShareModal={setShowShareModal}
            showShareModal={showShareModal}
            setSelectedItem={setSelectedItem}
            disableMenuAndSelection={disableMenuAndSelection} />} />
        </Tab.Navigator>
      )}

     {selectionMode && (
  <View style={styles.selectionHeader}>
    <TouchableOpacity onPress={handleCancelSelection} style={styles.actionButton}>
      <Ionicons name="close" size={24} color="#000" />
    </TouchableOpacity>

    <TouchableOpacity onPress={handleDownloadSelected} style={styles.actionButton}>
      <MaterialIcons name="file-download" size={24} color="#000" />
    </TouchableOpacity>

    {/* <TouchableOpacity onPress={handleShareSelected} style={styles.actionButton}>
      <MaterialIcons name="share" size={24} color="#000" />
    </TouchableOpacity>  */}

    <TouchableOpacity onPress={handleDeleteSelected} style={styles.actionButton}>
      <MaterialIcons name="delete" size={24} color="red" />
    </TouchableOpacity>
  </View>
)}

{bannerMessage ? (
  <View
    style={{
      backgroundColor: '#f8ea9bff',
      paddingVertical: 10,
      paddingHorizontal: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <Text
      style={{
        color: '#000',
        fontWeight: 'bold',
        flex: 1,
        flexWrap: 'wrap',
        marginRight: 10,
      }}
    >
      {bannerMessage}
    </Text>

    <TouchableOpacity onPress={() => setBannerMessage('')}>
      <Ionicons name="close" size={20} color="#000" />
    </TouchableOpacity>
  </View>
) : null}

      <DeleteItemModal
        visible={showDeleteModal}
        selectedItems={selectedItem}
        onCancel={() => setShowDeleteModal(false)}
        onDeleted={handleProccessCompleted}
        fetchMediaData={fetchMediaData}
        setSnackbarVisible={setSnackbarVisible}
        setSnackbarMessage={setSnackbarMessage}
        setSnackbarType={setSnackbarType}
      />

      <DownloadItemModal
        visible={showDownloadModal}
        setVisible={setShowDownloadModal}
        onCancel={() => setShowDownloadModal(false)}
        selectedItems={selectedItem}
        onDownload={handleProccessCompleted}
        setSnackbarVisible={setSnackbarVisible}
        setSnackbarMessage={setSnackbarMessage}
        setSnackbarType={setSnackbarType}
        setDownloadingProgress={setDownloadVisible}
        setProgressValue={setDownloadProgress}
        setDownloadTitle={setDownloadTitle}
        setActiveDownloads={setActiveDownloads}
      />

      <ShareItemModal
        visible={showShareModal}
        onCancel={() => setShowShareModal(false)}
        selectedItems={selectedItem}
        onShare={handleProccessCompleted}
        setSnackbarVisible={setSnackbarVisible}
        setSnackbarMessage={setSnackbarMessage}
        setSnackbarType={setSnackbarType}
      />

      <FloatingDownloadBar
        visible={downloadVisible}
        progress={downloadProgress}
        title={downloadTitle}
        activeDownloads={activeDownloads}
      />

      <AppUpdateModal serverUrl={`${EXPO_PUBLIC_API_URL}/api/app-version`} />
      {(storageModelStart || shouldShowStorageModal) && (
        <StorageModals
          onClose={() => setStorageModelStart(false)}
          storageModalKey={storageModalKey}
          setStorageModalKey={setStorageModalKey}
        />
      )}

      {previewItem && previewItem.object_url && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isFullScreen && styles.maxRotateModelContent, isMaximized && styles.maxModalContent, Platform.OS === 'ios' ? { paddingTop: insets.top } : null]}>
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

              {previewItem.object_type === 'video' ? (
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
              ) : (
                <View style={styles.muteButton}>
                  <TouchableOpacity onPress={toggleFullScreen} style={styles.muteButton}>
                    <View style={styles.muteButtonText}>
                      <MaterialIcons
                        name={isFullScreen ? isMaximized ? "fullscreen" : "fullscreen-exit" : isMaximized ? "fullscreen-exit" : "fullscreen"}
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

      {showPlanExpiredModal && (
        <Modal transparent animationType="fade">
          <View style={styles.delModalOverlay}>
            <View style={styles.delModalContainer}>
              <TouchableOpacity
                onPress={() => setShowPlanExpiredModal(false)}
                style={styles.closeIcon}
              >
                <MaterialIcons name="close" size={24} color="black" />
              </TouchableOpacity>

              <Text style={styles.delModalTitle}>No images and videos available</Text>
              <Text style={[styles.delModalMessage]}>Your "{expiredPlanName}" plan has expired. Please upgrade to pro plan to view/download videos and images.</Text>

              <View style={styles.expModalButtons}>
                <TouchableOpacity
                  onPress={() => {
                    if (handleChooseClick) handleChooseClick();
                  }}
                  style={[styles.delModalButton, { backgroundColor: Colors.primary, flexDirection: 'row' }]}
                >
                  <MaterialIcons name="arrow-upward" size={20} color="white" style={{ marginRight: 5 }} />
                  <Text style={styles.delModalButtonText}>Upgrade Now</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>
      )}

      <Modal
        visible={showUpgradeReminderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradeReminderModal(false)}
      >
        <View style={styles.delModalOverlay}>
          <View style={styles.delModalContainer}>
            <TouchableOpacity
              onPress={() => setShowUpgradeReminderModal(false)}
              style={[styles.closeIcon]}
            >
              <MaterialIcons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Ionicons name="information-circle" size={48} color={Colors.error} />
            <Text style={styles.delModalTitle}>Upgrade Plan Reminder</Text>
            <Text style={styles.delModalMessage}>{upgradeReminderMessage}</Text>

            <View style={styles.expModalButtons}>
              <TouchableOpacity
                onPress={() => {
                  if (handleChooseClick) handleChooseClick();
                }}
                style={[styles.delModalButton, { backgroundColor: Colors.primary, flexDirection: 'row' }]}
              >
                <MaterialIcons name="arrow-upward" size={20} color="white" style={{ marginRight: 5 }} />
                <Text style={styles.delModalButtonText}>Upgrade Now</Text>
              </TouchableOpacity>
            </View>
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

const { width, height } = Dimensions.get('window');
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
    marginBottom: 0,
    borderRadius: 8,
    borderBottomRightRadius: 0,
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
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
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
    fontFamily: 'Poppins_400Regular'
  },
  tabIndicator: {
    backgroundColor: Colors.primary,
    height: 3,
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
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
  justifyContent: 'space-around',
  alignItems: 'center',
  paddingVertical: 10,
  paddingHorizontal: 20,
  backgroundColor: '#f1f1f1',
  borderBottomWidth: 1,
  borderColor: '#ddd',
  elevation: 4,
  zIndex: 10,
},

actionButton: {
  padding: 10,
  borderRadius: 50,
  backgroundColor: '#ffffff',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
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
    zIndex: 9999,
    elevation: 10,
  },

  delModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 10,
    textAlign: 'center',
    color: Colors.error
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
  expModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
  },

  delModalButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 45
  },

  delModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins_500Medium',
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    zIndex: 1,
  },
  menuIcon: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginRight: 5,
    paddingHorizontal: 5,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 6,
    zIndex: 5, 
    elevation: 5,
  },
  menuPopup: {
    position: 'absolute',
    bottom: -110,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 999,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },

  menuText: {
    fontSize: 14,
    color: '#333',
  },
});

export default GalleryScreen;

