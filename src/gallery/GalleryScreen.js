import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  AppState,
  BackHandler,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  useFonts,
  ShadowsIntoLight_400Regular,
} from '@expo-google-fonts/shadows-into-light';
import * as SplashScreen from 'expo-splash-screen';

import Header from '../components/Header';
import Colors from '../constants/Colors';
import GlobalStyles from '../styles/GlobalStyles';
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLOUD_API_URL } from '@env';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from '../components/Loader';
import LiveStreamStatus from '../screens/LiveStreamStatus.js';
import moment from 'moment-timezone';
import { setUnreadMessagesData, setUnreadMessagesCount } from '../state/slices/headerSlice';
import { updateActionStatus } from '../state/slices/authSlice.js';
import { logError } from '../components/logError.js';
import AppUpdateModal from '../components/AppUpdateModal';
import StorageModals from '../components/StorageModals.js';
import { selectStoragePlan } from '../state/slices/storagePlanSlice.js';
import Snackbar from '../components/Snackbar.js';
import { clearOpenStorage2 } from '../state/slices/storageUISlice.js';
import { useHeaderAction } from '../components/HeaderActionContext.js';
import { setPlanExpired, setRemainingDays, setUpgradeReminder } from '../state/slices/expiredPlanSlice.js';
import DeleteItemModal from '../components/modals/DeleteItemModal.js';
import DownloadItemModal from '../components/modals/DownloadItemModal.js';
import ShareItemModal from '../components/modals/ShareItemModal.js';
import FloatingDownloadBar from '../components/FloatingDownloadBar.js';
import i18n from '../constants/i18n.js';
import LanguageModal from '../constants/LanguageModal.js';
import { useDynamicTranslate } from '../constants/useDynamicTranslate.js';

import MediaTabs from './MediaTabs';
import MediaPreviewModal from './MediaPreviewModal';
import SelectionBar from './SelectionBar';
import PlanBanner from './PlanBanner';
import UpgradeReminderModal from './UpgradeReminderModal.js';
import PlanExpiredModal from './PlanExpiredModal.js';
import Flix10kBanner from './Flix10kBanner.js';
import RateUsModal, { checkAndShowRateModal } from '../components/RateAppModal.js';
import PhoneNumberModal from '../constants/PhoneNumberModal.js';
import {
  initAppleIAP,
  setupApplePurchaseListener,
} from '../constants/AppleIAPHandler.js';
import { restoreIOSStoragePurchase } from '../constants/iosRestoreStorageIAP';
import { restoreIOSFlix10KPurchase } from '../constants/AppleIAPFlix10KRestore';
import { getFlix10KPlanApi } from '../components/getFlix10KPlanApi.js';
import { getStoragePlanDetails } from '../components/getStoragePlanDetails.js';

SplashScreen.preventAutoHideAsync();
let upgradeModalShown = false;
let expiredModalShown = false;

const GalleryScreen = () => {
  const [fontsLoaded, fontError] = useFonts({
    'ShadowsIntoLight': ShadowsIntoLight_400Regular,
  });

  const MODALS = {
  LANGUAGE: 'LANGUAGE',
  APP_UPDATE: 'APP_UPDATE',
  PHONE: 'PHONE',
  AD: 'AD',
  PLAN_EXPIRED: 'PLAN_EXPIRED',
  UPGRADE: 'UPGRADE',
  RATE: 'RATE',
  STORAGE: 'STORAGE',
};

  const [isLoading, setIsLoading] = useState(true);
  const [mediaData, setMediaData] = useState({ images: [], videos: [], babyProfile: [], predictiveBabyImages: [] });
  const [previewItem, setPreviewItem] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
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
  const [tL, setT] = useState(null);
  //const [showLangModal, setShowLangModal] = useState(false);
  const [flix10kSelectionMode, setFlix10kSelectionMode] = useState(false);
  const [selectedItemsForAi, setSelectedItemsForAi] = useState([]);
  const [flix10kGenerating, setFlix10kGenerating] = useState(false);
  const [flix10kResults, setFlix10kResults] = useState([]);
  const [flix10kAiImages, setFlix10kAiImages] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [flix10KAD, setFlix10KAD] = useState(false);
  const [showAfterAdd, setShowafterAdd] = useState(false);
  //const [showRateModal, setShowRateModal] = useState(false);
  //const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [refreshData, setRefreshData] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [modalChecks, setModalChecks] = useState({
    language: null,
    appUpdate: null,
    phone: null,
    ad: null,
    plan: null,
    rate: null,
    storage: null,
  });
  const [storageFlowActive, setStorageFlowActive] = useState(true);
  const [modalLock, setModalLock] = useState(true);

  const user = useSelector(state => state.auth);
  const stream = useSelector(state => state.stream);
  const { storagePlanPayment } = useSelector(selectStoragePlan);
  const openStorage2Directly = useSelector(state => state.storageUI.openStorage2Directly);
  const forceOpenStorageModals = useSelector((state) => state.storageUI.forceOpenStorageModals);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
   const showFlix10KAd = useSelector((state) => state.subscription.showFlix10KAd);
   const paymentStatusAdd = useSelector((state) => state.subscription.paymentStatusAdd);

  const storagePlanPrice = useSelector((state) => state.auth.storagePlanPrice);
  const storagePlanDate = useSelector((state) => state.auth.storagePlan?.planDate);
  const storagePlanName = useSelector((state) => state.auth.storagePlanName);
  const storagePlanId = useSelector((state) => state.auth.storagePlanId);
  const storagePlanExpired = useSelector((state) => state.auth.storagePlanExpired);
  const storagePlanRemainingDays = useSelector((state) => state.auth.storagePlanRemainingDays);

  console.log("storagePlanPrice, storagePlanDate, storagePlanName, storagePlanId, storagePlanExpired, storagePlanRemainingDays",{storagePlanPrice, storagePlanDate, storagePlanName, storagePlanId, storagePlanExpired, storagePlanRemainingDays})

  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const triggeredRef = useRef(false);
  const hasHandledPaymentStatusRef = useRef(false);
  const params = useLocalSearchParams();
  const { handleChooseClick } = useHeaderAction();
  const hasHiddenModalRef = useRef(false);
  const router = useRouter();
  const { t } = useTranslation();
  const upgradeShownRef = useRef(false);
  const expiredShownRef = useRef(false);
  const hasAutoRestoredRef = useRef(false);

  useEffect(() => {
    setModalLock(true);
  }, []);

  useEffect(() => {
  if (Platform.OS !== 'ios') return;

  const timer = setTimeout(async () => {
    try {
      await initAppleIAP();
      setupApplePurchaseListener({
        onSuccess: handleSuccess,
        onFailure: handleFailure,
      });
    } catch (e) {
      console.log('IAP init error', e);
    }
  }, 800); // delay is IMPORTANT

  return () => {
    clearTimeout(timer);
  };
}, []);

useEffect(() => {
  if (Platform.OS !== 'ios') return;
  if (!user?.uuid || !user?.email) return;
  if (hasAutoRestoredRef.current) return;

  hasAutoRestoredRef.current = true;

  let cancelled = false;

  const autoRestore = async () => {
    try {
      // ⏳ Allow app + StoreKit to fully stabilize
      await new Promise(res => setTimeout(res, 1500));
      if (cancelled) return;

      console.log('Silent auto-restore on app open');

      await restoreIOSStoragePurchase({
        userId: user.uuid,
        userEmail: user.email,
        dispatch,
        getStoragePlanDetails,
        silent: true, // 🔑 REQUIRED
      });

      await restoreIOSFlix10KPurchase({
        userId: user.uuid,
        userEmail: user.email,
        dispatch,
        getFlix10KPlanApi,
        silent: true, // 🔑 REQUIRED
      });
    } catch (e) {
      console.log('Auto restore failed safely:', e);
    }
  };

  autoRestore();

  return () => {
    cancelled = true;
  };
}, [user?.uuid, user?.email]);


  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

   useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const status = await AsyncStorage.getItem("flix10kPaymentForAdd");
         if (status === null) {
        setShowafterAdd(true);
        }else{
          setShowafterAdd(false);
        }
      } catch (err) {
        console.error("Error reading AsyncStorage flix10kPaymentForAdd:", err);
      }
    };
    fetchPaymentStatus();
  }, []);


   useEffect(() => {
    if (showFlix10KAd) {
      setFlix10KAD(false);
      //setStorageFlowActive(true);
    }else{
      setFlix10KAD(true);
    }
  
  }, [showFlix10KAd, paymentStatusAdd]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
    setT(t);
  }, []);

useEffect(() => {
  if (modalLock) return;
    const checkPhone = async () => {
      const res = await axios.get(
        EXPO_PUBLIC_API_URL + `/api/patients/getPatientByEmail?email=${user.email}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.status === 200) {
        const data = res.data;

      setPatientData(data);
      
      const stored = await AsyncStorage.getItem("phone_verified");

      const phoneMissing = !data?.phone && !stored;
      const dobMissing = !data?.dob;
      const dueMissing = !data?.dueDate;

      if (phoneMissing || dobMissing || dueMissing) {
        //setShowPhoneModal(true);
        setModalChecks(p => ({ ...p, phone: 'NEEDED' }));
      }
    }
    };
    checkPhone();
  }, [user,refreshData,modalLock]);

   useEffect(() => {
  // Show rate modal only after update modal or when user opens app multiple times
  console.log("modalLock",modalLock)
  if (modalLock) return;
  const timer = setTimeout(async () => {
    //checkAndShowRateModal(setShowRateModal);
     const shouldShow = await checkAndShowRateModal();
    if (shouldShow) {
      setModalChecks(p => ({ ...p, rate: 'NEEDED' }));
    }
  }, 100); // show after 3 seconds delay
  return () => clearTimeout(timer);
}, [modalLock]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          console.log('Back button pressed');
          return true;
        }
      );

      return () => backHandler.remove();
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMediaData();
    setRefreshing(false);
    setSelectedType(null);
  };

  useFocusEffect(
    useCallback(() => {
      triggeredRef.current = false;
      return () => { };
    }, [forceOpenStorageModals])
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        setActiveMenuId(null);
      };
    }, [])
  );

  useEffect(() => {
    if (modalLock) return;
    const checkLanguage = async () => {
      const lang = await AsyncStorage.getItem("appLanguage");
      if (!lang) {
        //setShowLangModal(true);
        setModalChecks(p => ({ ...p, language: 'NEEDED' }));
      } else {
        i18n.changeLanguage(lang);
      }
    };
    checkLanguage();
  }, [modalLock]);

  useEffect(() => {
    const checkLanguage = async () => {
      console.log('innnnnnnnnnnnnnnnnnnnnnnn')
      const result = await axios.post(`${EXPO_PUBLIC_API_URL}/api/subscription/update-flix10k-autorenewal`, {
      uuid: user.uuid,
      autoRenewal: false,
      expiryDate: "2027-03-08T11:12:41.000Z",
    });

    console.log("Auto-renewal synced with backend:", result);
    };
    checkLanguage();
  }, []);

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
            setStorageFlowActive(false);
           // setModalLock(false);
          } else {
            setShouldShowStorageModal(true);
            setStorageFlowActive(true);
            //setModalLock(true);
          }
        } else {
          setShouldShowStorageModal(false);
          setStorageFlowActive(false);
          //setModalLock(false);
        }
      } catch (error) {
        console.error('Error checking skip date:', error);
      }
    };

    checkSkipDate();
  }, [storagePlanPayment]);

  useEffect(() => {
    fetchMediaData();
  }, [flix10kSelectionMode]);

  // const fetchMediaData = async () => {
  //   setIsLoading(true);

  //   try {
  //     if (!user.email) return;

  //     const res = await axios.get(
  //       EXPO_PUBLIC_API_URL + `/api/patients/getPatientByEmail?email=${user.email}`,
  //       { headers: { 'Content-Type': 'application/json' } }
  //     );

  //     if (res.status === 200) {
  //       const data1 = res.data;
  //       const { storagePlanPrice, storagePlanDate, storagePlanName, storagePlanId } = data1;

  //       if (storagePlanId == null) {
  //         setDisableMenuAndSelection(true);
  //       } else {
  //         setDisableMenuAndSelection(false);
  //       }

  //       if (storagePlanPrice === '0.00' && storagePlanDate) {
  //         const planStartDate = moment(storagePlanDate, 'MM-DD-YYYY HH:mm:ss', true);
  //         const today = moment();
  //         const daysSince = today.diff(planStartDate, 'days');

  //         const translatedPlanName = await useDynamicTranslate(`${storagePlanName}`);

  //         if (daysSince >= 31) {
  //           const remainingDays = 30 - daysSince;
  //           dispatch(setRemainingDays(remainingDays));
  //           dispatch(setPlanExpired(true));
  //           setMediaData({ images: [], videos: [], babyProfile: [], predictiveBabyImages: [] });
  //           setShowUpgradeReminderModal(false);
  //           if(!expiredModalShown){
  //             console.log("showing model of expiry")
  //           setTimeout(() => {
  //             setShowPlanExpiredModal(true);
  //           }, 200);
  //           expiredModalShown = true;
  //         }
  //           setExpiredPlanName(translatedPlanName);
  //           setIsLoading(false);
  //           setBannerMessage(
  //             t('gallery.plan.expired', { plan: translatedPlanName })
  //           );
  //           return;
  //         }

  //         if (daysSince === 18) {
  //           const remainingDays = 30 - daysSince;
  //           dispatch(setRemainingDays(remainingDays));

  //           const message = t('gallery.plan.expiring', {
  //             plan: translatedPlanName,
  //             days: remainingDays,
  //             plural: remainingDays > 1 ? 's' : ''
  //           });
  //           setUpgradeReminderMessage(`${message} ${t('gallery.plan.afterMessage')}`);
  //           setBannerMessage(message);

  //         } else if (daysSince >= 28 && daysSince < 30) {
  //           const remainingDays = 30 - daysSince;
  //           dispatch(setUpgradeReminder(true));
  //           dispatch(setRemainingDays(remainingDays));

  //           const message = t('gallery.plan.expiring', {
  //             plan: translatedPlanName,
  //             days: remainingDays,
  //             plural: remainingDays > 1 ? 's' : ''
  //           });
  //           setUpgradeReminderMessage(`${message} ${t('gallery.plan.afterMessage')}`);
  //           setBannerMessage(message);
  //           if (!upgradeModalShown){
  //           setShowUpgradeReminderModal(true);
  //           upgradeModalShown = true;
  //           }

  //         } else if (daysSince === 30) {
  //           const remainingDays = 30 - daysSince;
  //           const message = t('gallery.plan.expiring', {
  //             plan: translatedPlanName,
  //             days: remainingDays == 0 ? 'today' : remainingDays,
  //             plural: remainingDays > 1 ? 's' : ''
  //           });
  //           setUpgradeReminderMessage(`${message} ${t('gallery.plan.afterMessage')}`);
  //           if (!upgradeModalShown){
  //           setShowUpgradeReminderModal(true);
  //           upgradeModalShown = true;
  //           }
  //           setBannerMessage(t('gallery.plan.expiresToday', { plan: translatedPlanName }));
  //           dispatch(setRemainingDays(0));

  //         } else if (daysSince > 30) {
  //           setBannerMessage(t('gallery.plan.expiredAlready', { plan: translatedPlanName }));
  //           dispatch(setRemainingDays(-1));
  //         } else {
  //           const remainingDays = 30 - daysSince;
  //           dispatch(setRemainingDays(remainingDays));
  //         }
  //       }

  //       try {
  //         const response = await axios.get(
  //           EXPO_PUBLIC_CLOUD_API_URL + `/get-images/?machine_id=${user.machineId}&user_id=${user.uuid}&email=${user.email}`,
  //           { headers: { 'Content-Type': 'application/json' } }
  //         );

  //         const galleryItems = response.data;

  //         setFlix10kAiImages((prev) => {
  //           if (!prev || prev.length === 0) {
  //             return prev;
  //           }

  //           return prev.filter((flix10kAiImages) => {
  //             if (!flix10kAiImages?.flix10kAiImages?.output_path?.gcs_url) return true;

  //             const aiFileName = flix10kAiImages.flix10kAiImages.output_path.gcs_url
  //               .split("/")
  //               .pop();

  //             const isDuplicate = galleryItems.some((galleryItem) => {
  //               if (!galleryItem?.object_url) return false;

  //               const galleryFileName = galleryItem.object_url.split("/").pop();

  //               return (
  //                 galleryItem.object_type === "predictiveBabyImage" &&
  //                 galleryFileName === aiFileName
  //               );
  //             });

  //             return !isDuplicate;
  //           });
  //         });


  //         if (response.status === 200) {
  //           const images = [], videos = [], babyProfile = [], predictiveBabyImages = [];
  //           response.data.forEach(item => {
  //             if (item.object_type === 'image') images.push(item);
  //             else if (item.object_type === 'video') videos.push(item);
  //             else if (item.object_type === 'babyProfile') babyProfile.push(item);
  //             else if (item.object_type === 'predictiveBabyImage') predictiveBabyImages.push(item);
  //           });
  //           setMediaData({ images, videos, babyProfile, predictiveBabyImages });
  //         }

  //         dispatch(setPlanExpired(false));
  //       } catch (error) {
  //         await logError({
  //           error,
  //           data: error.response,
  //           details: "Error in get-images API call on GalleryScreen"
  //         });
  //       } finally {
  //         setIsLoading(false);
  //       }
  //     }
  //   } catch (error) {
  //     await logError({
  //       error,
  //       data: error.response,
  //       details: "Error in getPatientByEmail catch block"
  //     });
  //     setIsLoading(false);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

    const fetchMediaData = async () => {
    setIsLoading(true);

    try {
      if (!user.email) return;

      // const res = await axios.get(
      //   EXPO_PUBLIC_API_URL + `/api/patients/getPatientByEmail?email=${user.email}`,
      //   { headers: { 'Content-Type': 'application/json' } }
      // );

      // if (res.status === 200) {
      //   const data1 = res.data;
      //   const { storagePlanPrice, storagePlanDate, storagePlanName, storagePlanId } = data1;

        if (storagePlanId == null) {
          setDisableMenuAndSelection(true);
        } else {
          setDisableMenuAndSelection(false);
        }

        const translatedPlanName = await useDynamicTranslate(`${storagePlanName}`);

        if (storagePlanPrice === '0.00' && storagePlanDate) {
          //const planStartDate = moment(storagePlanDate, 'MM-DD-YYYY HH:mm:ss', true);
          //const today = moment();
          //const daysSince = today.diff(planStartDate, 'days');

          console.log("storagePlanExpired",storagePlanExpired)

          if (storagePlanExpired) {
            //const remainingDays = 30 - daysSince;
            //dispatch(setRemainingDays(remainingDays));
            console.log("showing model of expiry")
            dispatch(setPlanExpired(true));
            setMediaData({ images: [], videos: [], babyProfile: [], predictiveBabyImages: [] });
            setShowUpgradeReminderModal(false);
            if(!expiredModalShown){
              console.log("showing model of expiry")
            setTimeout(() => {
              setShowPlanExpiredModal(true);
            }, 200);
            expiredModalShown = true;
          }
            setExpiredPlanName(translatedPlanName);
            setIsLoading(false);
            setBannerMessage(
              t('gallery.plan.expired', { plan: translatedPlanName })
            );
            return;
          }

          if (storagePlanRemainingDays === 12) {
            //const remainingDays = 30 - daysSince;
            //dispatch(setRemainingDays(remainingDays));

            const message = t('gallery.plan.expiring', {
              plan: translatedPlanName,
              days: storagePlanRemainingDays,
              plural: storagePlanRemainingDays > 1 ? 's' : ''
            });
            setUpgradeReminderMessage(`${message} ${t('gallery.plan.afterMessage')}`);
            setBannerMessage(message);

          } else if (storagePlanRemainingDays > 0 && storagePlanRemainingDays <= 3) {
            //const remainingDays = 30 - daysSince;
            dispatch(setUpgradeReminder(true));
            //dispatch(setRemainingDays(remainingDays));

            const message = t('gallery.plan.expiring', {
              plan: translatedPlanName,
              days: storagePlanRemainingDays,
              plural: storagePlanRemainingDays > 1 ? 's' : ''
            });
            setUpgradeReminderMessage(`${message} ${t('gallery.plan.afterMessage')}`);
            setBannerMessage(message);
            if (!upgradeModalShown){
            setShowUpgradeReminderModal(true);
            upgradeModalShown = true;
            }

          } else if (storagePlanRemainingDays === 0 && !storagePlanExpired) {
            //const remainingDays = 30 - daysSince;
            const message = t('gallery.plan.expiring', {
              plan: translatedPlanName,
              days: storagePlanRemainingDays == 0 ? 'today' : storagePlanRemainingDays,
              plural: storagePlanRemainingDays > 1 ? 's' : ''
            });
            setUpgradeReminderMessage(`${message} ${t('gallery.plan.afterMessage')}`);
            if (!upgradeModalShown){
            setShowUpgradeReminderModal(true);
            upgradeModalShown = true;
            }
            setBannerMessage(t('gallery.plan.expiresToday', { plan: translatedPlanName }));
            //dispatch(setRemainingDays(0));

          } else if (storagePlanExpired) {
            setBannerMessage(t('gallery.plan.expiredAlready', { plan: translatedPlanName }));
            //dispatch(setRemainingDays(-1));
          } 
          // else {
          //   const remainingDays = 30 - daysSince;
          //   dispatch(setRemainingDays(remainingDays));
          // }
        }

        if (storagePlanPrice > '0.00' && storagePlanExpired) {
           setBannerMessage(
              t('gallery.plan.expired', { plan: translatedPlanName })
            );
        }

        try {
          const response = await axios.get(
            EXPO_PUBLIC_CLOUD_API_URL + `/get-images/?machine_id=${user.machineId}&user_id=${user.uuid}&email=${user.email}`,
            { headers: { 'Content-Type': 'application/json' } }
          );

          const galleryItems = response.data;

          setFlix10kAiImages((prev) => {
            if (!prev || prev.length === 0) {
              return prev;
            }

            return prev.filter((flix10kAiImages) => {
              if (!flix10kAiImages?.flix10kAiImages?.output_path?.gcs_url) return true;

              const aiFileName = flix10kAiImages.flix10kAiImages.output_path.gcs_url
                .split("/")
                .pop();

              const isDuplicate = galleryItems.some((galleryItem) => {
                if (!galleryItem?.object_url) return false;

                const galleryFileName = galleryItem.object_url.split("/").pop();

                return (
                  galleryItem.object_type === "predictiveBabyImage" &&
                  galleryFileName === aiFileName
                );
              });

              return !isDuplicate;
            });
          });


          if (response.status === 200) {
            const images = [], videos = [], babyProfile = [], predictiveBabyImages = [];
            response.data.forEach(item => {
              if (item.object_type === 'image') images.push(item);
              else if (item.object_type === 'video') videos.push(item);
              else if (item.object_type === 'babyProfile') babyProfile.push(item);
              else if (item.object_type === 'predictiveBabyImage') predictiveBabyImages.push(item);
            });
            setMediaData({ images, videos, babyProfile, predictiveBabyImages });
          }

          dispatch(setPlanExpired(false));
        } catch (error) {
          // await logError({
          //   error,
          //   data: error.response,
          //   details: "Error in get-images API call on GalleryScreen"
          // });
        } finally {
          setIsLoading(false);
        }
      //}
    } catch (error) {
      // await logError({
      //   error,
      //   data: error.response,
      //   details: "Error in getPatientByEmail catch block"
      // });
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

      console.log("storedStatus, storedPaying",{storedStatus, storedPaying})
      if (!storedStatus && storedPaying === 'true') {
        dispatch(clearOpenStorage2());
        await AsyncStorage.setItem('storage_modal_triggered', 'false');
        console.log("innnnn1")
        setStorageModelStart(true);
        setStorageFlowActive(true);
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
      setWasTriggered(true);
    }
  }, [user, wasTriggered]);

  useEffect(() => {
    if ((status === 'done' || status1 === 'true') && !hasHiddenModalRef.current) {
      fetchMediaData();
      setShowPlanExpiredModal(false);
      setWasTriggered(false);
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
          console.log("innnnn2")
          setStorageModelStart(true);
          setStorageFlowActive(true);
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
      let isActive = true;

      const checkPaymentStatus = async () => {
        if (!isActive) return;

        const status = await AsyncStorage.getItem('payment_status');
        const paying = await AsyncStorage.getItem('paying');

        if ((status === 'done' || status === 'fail') && paying !== 'false') {
          if (!hasHandledPaymentStatusRef.current) { 
          console.log("innnnn3")
          setStorageModelStart(true);
          setStorageFlowActive(true);
          setStorageModalKey(true);

          hasHandledPaymentStatusRef.current = true;

          await AsyncStorage.setItem('paying', 'false');
          }
        }
      };

      checkPaymentStatus();

      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          checkPaymentStatus();
        }
      });

      return () => {
        isActive = false;
        subscription.remove();
      };
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

  useEffect(() => {
  if (modalLock) return;
  if (storageFlowActive) return;
  if (activeModal) return;

  console.log("modalChecks",modalChecks)

  if (modalChecks.language === 'NEEDED') {
    setActiveModal(MODALS.LANGUAGE);
    return;
  }

  if (modalChecks.phone === 'NEEDED') {
    setActiveModal(MODALS.PHONE);
    return;
  }

  if (modalChecks.appUpdate === 'NEEDED') {
    setActiveModal(MODALS.APP_UPDATE);
    return;
  }

  if (modalChecks.rate === 'NEEDED') {
    setActiveModal(MODALS.RATE);
    return;
  }
}, [modalChecks, activeModal, storageFlowActive, modalLock]);

  const handlePreview = (item) => {
    if (!item.object_url) {
      item.object_url = img;
    }
    setPreviewItem(item);
    setModalVisible(true);
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedItems([]);
    setFlix10kSelectionMode(false);
    setSelectedItemsForAi([]);
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

  const handleProcessCompleted = () => {
    setSelectedItems([]);
    setSelectionMode(false);
    setShowDeleteModal(false);
    setShowDownloadModal(false);
    setShowShareModal(false);
  };

  const toggleItemSelection = (id) => {
    setSelectedItemsForAi((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFlix10KPress = () => {
    setFlix10kSelectionMode(true);
    setSelectedItemsForAi([]);
  };

  return (
    <View style={[
      GlobalStyles.container,
      { marginBottom: 0 },
      Platform.OS === 'android' ? { paddingTop: insets.top } : null
    ]}>
      <LiveStreamStatus />
      <Header title={t("gallery.header")} />

      <Flix10kBanner
        mediaData={mediaData}
        setFlix10kSelectionMode={setFlix10kSelectionMode}
        selectedItemsForAi={selectedItemsForAi}
        setSelectedItemsForAi={setSelectedItemsForAi}
        handleCancelSelection={handleCancelSelection}
        toggleItemSelection={toggleItemSelection}
        setSelectedType={setSelectedType}
        selectedType={selectedType}
        flix10kGenerating={flix10kGenerating}
        setFlix10kGenerating={setFlix10kGenerating}
        flix10kResults={flix10kResults}
        setFlix10kResults={setFlix10kResults}
        flix10kAiImages={flix10kAiImages}
        setFlix10kAiImages={setFlix10kAiImages}
        setSnackbarVisible={setSnackbarVisible}
        setSnackbarMessage={setSnackbarMessage}
        setSnackbarType={setSnackbarType}
        setModalLock={setModalLock}
      />

      {isLoading ? (
        <Loader loading={true} />
      ) : (
        <MediaTabs
          mediaData={mediaData}
          onPreview={handlePreview}
          refreshing={refreshing}
          onRefresh={onRefresh}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          selectionMode={selectionMode}
          setSelectionMode={setSelectionMode}
          setActiveMenuId={setActiveMenuId}
          activeMenuId={activeMenuId}
          setShowDeleteModal={setShowDeleteModal}
          setShowDownloadModal={setShowDownloadModal}
          setShowShareModal={setShowShareModal}
          setSelectedItem={setSelectedItem}
          disableMenuAndSelection={disableMenuAndSelection}
          tL={tL}
          flix10kSelectionMode={flix10kSelectionMode}
          selectedItemsForAi={selectedItemsForAi}
          toggleItemSelection={toggleItemSelection}
          flix10kGenerating={flix10kGenerating}
          setFlix10kGenerating={setFlix10kGenerating}
          flix10kResults={flix10kResults}
          setFlix10kResults={setFlix10kResults}
          selectedType={selectedType}
          flix10kAiImages={flix10kAiImages}
          setFlix10kAiImages={setFlix10kAiImages}
          setSelectedType={setSelectedType}
        />
      )}

      <SelectionBar
        visible={selectionMode}
        onCancel={handleCancelSelection}
        onDownload={handleDownloadSelected}
        onShare={handleShareSelected}
        onDelete={handleDeleteSelected}
        flix10kSelectionMode={flix10kSelectionMode}
      />

      <PlanBanner
        message={bannerMessage}
        onClose={() => setBannerMessage('')}
        onUpgrade={handleChooseClick}
        storagePlanPrice={storagePlanPrice}
        storagePlanExpired={storagePlanExpired}
      />

      <MediaPreviewModal
        visible={modalVisible}
        item={previewItem}
        onClose={() => setModalVisible(false)}
        insets={insets}
      />

       <PhoneNumberModal
        visible={activeModal === MODALS.PHONE}
        onClose={() => {
          setModalChecks(p => ({ ...p, phone: 'DONE' }));
          setActiveModal(null);
        }}
        userEmail={user?.email}
        data={patientData}
        setRefreshData={setRefreshData}
      />

      {console.log("flix10KAD && showAfterAdd 1",{flix10KAD, showAfterAdd })}
      {/* {flix10KAD && showAfterAdd && */}
      {/* {flix10KAD && showAfterAdd && */}
      <UpgradeReminderModal
        //visible={showUpgradeReminderModal}
         visible={flix10KAD && showAfterAdd && showUpgradeReminderModal}
        message={upgradeReminderMessage}
        onClose={() => {
          setShowUpgradeReminderModal(false);
          upgradeModalShown= false;
        }}
        onUpgrade={handleChooseClick}
      />
      {/* } */}

      {console.log("flix10KAD && showAfterAdd 2",{flix10KAD, showAfterAdd, expiredModalShown })}
      {/* {flix10KAD && showAfterAdd && */}
      {/* {flix10KAD && showAfterAdd && */}
      <PlanExpiredModal
        //visible={showPlanExpiredModal}
        visible={flix10KAD && showAfterAdd && showPlanExpiredModal}
        expiredPlanName={expiredPlanName}
        onClose={() => {
          setShowPlanExpiredModal(false);
          expiredModalShown = false;
        }}
        onUpgrade={handleChooseClick}
      />
      {/* } */}

      <DeleteItemModal
        visible={showDeleteModal}
        selectedItems={selectedItem}
        onCancel={() => setShowDeleteModal(false)}
        onDeleted={handleProcessCompleted}
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
        onDownload={handleProcessCompleted}
        setSnackbarVisible={setSnackbarVisible}
        setSnackbarMessage={setSnackbarMessage}
        setSnackbarType={setSnackbarType}
        setDownloadingProgress={setDownloadVisible}
        setProgressValue={setDownloadProgress}
        setDownloadTitle={setDownloadTitle}
        setActiveDownloads={setActiveDownloads}
        storagePlanPrice={storagePlanPrice}
        storagePlanExpired={storagePlanExpired}
      />

      <ShareItemModal
        visible={showShareModal}
        onCancel={() => setShowShareModal(false)}
        selectedItems={selectedItem}
        onShare={handleProcessCompleted}
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

      <LanguageModal visible={activeModal === MODALS.LANGUAGE} 
        onClose={() => {
          setModalChecks(p => ({ ...p, language: 'DONE' }));
          setActiveModal(null);
        }}
      />

      {/* <AppUpdateModal serverUrl={`${EXPO_PUBLIC_API_URL}/api/app-version`} /> */}
      <AppUpdateModal
        serverUrl={`${EXPO_PUBLIC_API_URL}/api/app-version`}
        visible={activeModal === MODALS.APP_UPDATE}
        onUpdateRequired={() =>{
          setModalChecks(p => ({ ...p, appUpdate: 'NEEDED' }));
        }}
        onClose={() => {
          setModalChecks(p => ({ ...p, appUpdate: 'DONE' }));
          setActiveModal(null);
        }}
      />

      <RateUsModal
        visible={activeModal === MODALS.RATE}
        onClose={() => {
          setModalChecks(p => ({ ...p, rate: 'DONE' }));
          setActiveModal(null);
        }}
      />

      {console.log("flix10KAD && showAfterAdd 3",{flix10KAD, showAfterAdd })}

      {(storageModelStart || shouldShowStorageModal) && flix10KAD && showAfterAdd && (
        <StorageModals
          onClose={() => {
            setStorageModelStart(false); 
            hasHandledPaymentStatusRef.current = false;
            setStorageFlowActive(false);   // ✅ IMPORTANT
            setModalLock(false); 
            setActiveModal(null);  
          }}
          storageModalKey={storageModalKey}
          setStorageModalKey={setStorageModalKey}
        />
      )}

      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </View>
  );
};

export default GalleryScreen;