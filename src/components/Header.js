import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image, Modal, ActivityIndicator, FlatList, ScrollView } from 'react-native';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Colors from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useRouter } from 'expo-router';
import { logout, setLoggingOut } from '../state/slices/authSlice';
import babyflixLogo from '../../assets/BBF_logo.jpg';
import { toggleDropdown, closeDropdown } from '../state/slices/headerSlice';
import { EXPO_PUBLIC_API_URL } from '@env';
import { clearOpenStorage2, setForceOpenStorageModals, triggerOpenStorage2 } from '../state/slices/storageUISlice';
import StorageModals from './StorageModals';
import { useHeaderAction } from './HeaderActionContext';
import Snackbar from './Snackbar';
import { getStoragePlanDetails } from './getStoragePlanDetails';
import moment from 'moment';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '../constants/NotificationContext';
import i18n from '../constants/i18n';
import LanguageModal from '../constants/LanguageModal';
import { useTranslation } from 'react-i18next';
import { useDynamicTranslate } from '../constants/useDynamicTranslate';
import 'moment/locale/es';
import { setSubscriptionExpired } from '../state/slices/subscriptionSlice';

const NOTIFICATIONS_KEY = 'APP_NOTIFICATIONS';

export const loadNotificationsFromStorage = async () => {
  const json = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
  return json ? JSON.parse(json) : [];
};

export const saveNotificationsToStorage = async (notifications) => {
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

const Header = ({ title, showMenu = true, showProfile = true }) => {
  const [isPlanModalVisible, setPlanModalVisible] = useState(false);
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('');
  const [showDeletePlanModal, setShowDeletePlanModal] = useState(false);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [translatedUserName, setTranslatedUserName] = useState('');
  const [translatedCurrentPlan, setTranslatedCurrentPlan] = useState('');
  const [translatedDescription, setTranslatedDescription] = useState('');

  const navigation = useNavigation();
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state) => state.auth);
  const showDropdown = useSelector((state) => state.header.showDropdown);
  const unreadMessagesCount = useSelector((state) => state.header.unreadMessagesCount);
  const storagePlan = useSelector(state => state.storagePlan)
  const isPlanExpired = useSelector((state) => state.expiredPlan.isPlanExpired);
  const showUpgradeReminder = useSelector((state) => state.expiredPlan.showUpgradeReminder);
  const remainingDays = useSelector((state) => state.expiredPlan.remainingDays);
  const openStorage2Directly = useSelector(state => state.storageUI.openStorage2Directly);
  const { setHandleChooseClick } = useHeaderAction();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const { t } = useTranslation();
  const { subscriptionAmount, subscriptionId, subscriptionIsActive, subscriptionExpired } = useSelector(
    (state) => state.auth
  );
  const subscriptionActive = subscriptionIsActive

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
  } = useNotifications();

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/getAllPlans`);
      const json = await response.json();
      if (json.actionStatus === 'success') {
        setPlans(json.data);
      } else {
        console.warn('Failed to fetch plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  //const remainingDay = 3;

  useEffect(() => {
    if (
      remainingDays != null &&
      remainingDays !== '' &&
      (remainingDays <= 3 || remainingDays === 12)
    ) {
      const date = new Date().toLocaleString();
      let message = '';
      if (remainingDays > 1) {
        message = t('header.planExpiresDays', { count: remainingDays });
      } else if (remainingDays === 1) {
        message = t('header.planExpiresTomorrow');
      } else if (remainingDays === 0) {
        message = t('header.planExpiresToday');
      } else if (remainingDays < 0) {
        message = t('header.planExpired');
      }

      const newNotification = {
        id: Date.now().toString(),
        title: t('header.planExpiringSoon'),
        message,
        type: 'plan',
        date,
        read: false,
      };

      addNotification(newNotification);

    }
  }, [remainingDays]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(async () => {
        const visited = await AsyncStorage.getItem('visited_after_redirect_notification');
        const flixVisited = await AsyncStorage.getItem('flix10k_visited_after_redirect');

        if (visited === 'true' || flixVisited === 'true') {
          // 🚫 block auto modal after redirect
          await AsyncStorage.multiRemove(['visited_after_redirect', 'flix10k_visited_after_redirect']);
          return;
        }
      setShowModal(true);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (plans.length > 0) {
      const planToShow = plans.find(
        (plan) => plan.id === storagePlan.storagePlanId
      );
      setCurrentPlan(planToShow);
    }
  }, [plans, storagePlan.storagePlanId]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.setItem('logoutInProgress', 'true');

      dispatch(setLoggingOut(true));

      await AsyncStorage.multiRemove([
        'token',
        'userData',
        'tokenExpiry',
        'storage_modal_triggered',
        'payment_status',
        'payment_status 1',
        'paying',
        'last_skipped_plan_date',
        'notifications'
      ]);

      dispatch(clearOpenStorage2());
      dispatch(setForceOpenStorageModals(false));
      dispatch(closeDropdown());
      dispatch(logout());

      setTimeout(() => {
        router.replace('/login');
      }, 100);

    } catch (error) {
      dispatch(setLoggingOut(false));
    }
  };

  const toggleDropdownHandler = () => {
    dispatch(toggleDropdown());
  };

  const closeDropdownHandler = () => {
    dispatch(closeDropdown());
  };

  useEffect(() => {
    const fetchStatusFromStorage = async () => {
      const storedStatus = await AsyncStorage.getItem('payment_status');
      const storedPaying = await AsyncStorage.getItem('paying');
      dispatch(clearOpenStorage2());
      if (!storedStatus && storedPaying === 'true') {
        dispatch(clearOpenStorage2());
        await AsyncStorage.setItem('storage_modal_triggered', 'false');

        if (isAuthenticated) {
          //router.replace('/gallery');
        }
      }
    };

    fetchStatusFromStorage();
  }, [user]);


  const handleChangeClick = async () => {
    if (Platform.OS === 'ios') {
      setPlanModalVisible(false)
    }
    setTimeout(() => {
      router.replace('/gallery');
    }, 200);
    setTimeout(() => {
      dispatch(triggerOpenStorage2());
    }, 100);
    await AsyncStorage.setItem('storage_modal_triggered', 'false');
    router.push('/gallery?showStorageModal=true');
  };

  const handleChooseClick = async () => {
    await AsyncStorage.setItem('storage_modal_triggered', 'false');
    if (Platform.OS === 'ios') {
      setPlanModalVisible(false)
    }
    setTimeout(() => {
      router.replace('/gallery');
    }, 200);
    setTimeout(() => {
      dispatch(triggerOpenStorage2());
    }, 100);
  };

  useEffect(() => {
    setHandleChooseClick(() => handleChooseClick);

    return () => setHandleChooseClick(null);
  }, []);

  const confirmPlanDelete = async () => {
    setIsDeletingPlan(true);
    await handleDeletePlan();
    setIsDeletingPlan(false);
    setShowDeletePlanModal(false);
  };


  const handleDeletePlan = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/patients/updatePlan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uuid,
          storagePlanId: null,
          storagePlanPayment: null,
          storagePlanDeleteDate: moment().format('DD-MM-YYYY hh:mm'),
          isPlanDeleted: 1,
        }),
      });


      const data = await response.json();

      if (response.ok && data.actionStatus === 'success') {

        setSnackbarMessage(`${translatedCurrentPlan} t('header.deletedSuccessfully')`);
        setSnackbarType('success');
        setSnackbarVisible(true);

        await getStoragePlanDetails(user.email, dispatch);
        setPlanModalVisible(false)
      } else {
        console.error('❌ Failed to delete plan:', data.message);

        setSnackbarMessage(t('header.failedToDeletePlan'));
        setSnackbarType('error');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('❌ Error deleting plan:', error);

      setSnackbarMessage(t('header.somethingWentWrong'));
      setSnackbarType('error');
      setSnackbarVisible(true);
    }
  };

  const formatNotificationDate = async (dateString) => {
    const lang = (await AsyncStorage.getItem('appLanguage')) || 'en';
    moment.locale(lang);
    const date = moment(dateString, 'D/M/YYYY, h:mm:ss a');

    if (moment().isSame(date, 'day')) {
      return t('header.today');
    } else if (moment().subtract(1, 'day').isSame(date, 'day')) {
      return t('header.yesterday');
    } else {
      return date.format('DD MMM YYYY');
    }
  };

  const handleNotificationPress = async (clickedItem) => {
    markAsRead(clickedItem);
    setShowModal(false);

    setTimeout(() => {
      if (clickedItem.type === 'plan') handleChooseClick();
      if (clickedItem.type === 'event') router.push('/event');
    }, 1000);
  };

  const closeModalAndMarkAllRead = async () => {
    markAllAsRead();
    setShowModal(false);
  };

  useEffect(() => {
    const translateDynamicTexts = async () => {
      if (user?.firstName && user?.lastName) {
        const fullName = `${user.firstName} ${user.lastName}`;
        const translated = await useDynamicTranslate(fullName);
        setTranslatedUserName(translated);
      }

      if (currentPlan?.name) {
        const translatedPlan = await useDynamicTranslate(currentPlan.name);
        setTranslatedCurrentPlan(translatedPlan);
      }

      if (currentPlan?.description) {
        const translatedDescription = await useDynamicTranslate(currentPlan.description);
        setTranslatedDescription(translatedDescription);
      }
    };

    translateDynamicTexts();
  }, [user, currentPlan, snackbarMessage]);

  return (
    <View style={styles.header}>
      <View style={{ justifyContent: 'flex-start'}}>
        <Image source={babyflixLogo} style={{ width: 36, height: 35, margintop: 50 }} />
      </View>

      <View style={{ flex: 1, justifyContent: 'flex-start', }}>
      <Text style={styles.title}>{title}</Text>
      </View>

      {showProfile && (
        <View style={styles.profileContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center',justifyContent:'flex-end' }}>
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.notificationButton}>
              <FontAwesome5 name="bell" size={25} color={Colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.messageButton} onPress={() => router.push('/messages')}>
              <FontAwesome5 name="comment-dots" size={25} color={Colors.textPrimary} />
              <View style={styles.messageBadge}>
                <Text style={styles.badgeText}>{unreadMessagesCount}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleDropdownHandler} style={styles.profileButton}>
              <Ionicons name="person-circle" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {showDropdown && (
            <View style={styles.dropdown}>
              <Text style={styles.dropdownItemFirst}>
                👋 {t('header.hello')} {translatedUserName}
              </Text>

              {/* {(subscriptionActive && subscriptionId) && (
                <View style={styles.subscriptionStatus}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={17}
                    color="green"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.subscriptionText}>{t("flix10k.subscribed")}</Text>
                </View>
              )} */}

              {(subscriptionActive && subscriptionId) && (
                <View
                  style={[
                    styles.subscriptionStatus,
                    subscriptionExpired ? styles.expiredStatus : styles.activeStatus,
                  ]}
                >
                  <Ionicons
                    name={subscriptionExpired ? "close-circle-outline" : "checkmark-circle-outline"}
                    size={17}
                    color={subscriptionExpired ? "red" : "green"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.subscriptionText,
                      subscriptionExpired && styles.expiredText,
                    ]}
                  >
                    {subscriptionExpired
                      ? t("flix10k.subscribedExpired")
                      : t("flix10k.subscribed")}
                  </Text>
                </View>
              )}


              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  closeDropdownHandler();
                  navigation.navigate('profile', { screen: 'ProfileSettings' });
                }}
              >
                <Ionicons name="settings-outline" size={20} color={Colors.textPrimary} style={styles.icon} />
                <Text style={{ fontFamily: 'Nunito400', marginTop: 4 }}>{t('header.profileSettings')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  closeDropdownHandler();
                  dispatch(clearOpenStorage2());
                  dispatch(setForceOpenStorageModals(true));
                  setPlanModalVisible(true);
                }}
              >
                <Ionicons name="cloud-outline" size={20} color={Colors.textPrimary} style={styles.icon} />
                {storagePlan?.storagePlanId === 1 || storagePlan?.storagePlanId === 2 ? (
                  <Text style={{ fontFamily: 'Nunito400', marginTop: 4 }}>
                    {t('header.storagePlan')}
                  </Text>
                ) : (
                  <Text style={{ fontFamily: 'Nunito400', marginTop: 4 }}>
                    {t('header.noPlanSelected')}
                  </Text>
                )}

              </TouchableOpacity>

              {(subscriptionActive && subscriptionId) && (
                <TouchableOpacity
                  style={[styles.dropdownItem]}
                  onPress={() => {
                    closeDropdownHandler();
                    dispatch(setSubscriptionExpired(true));
                    navigation.navigate('profile', {
                      screen: 'ProfileSettings',
                      params: { initialTab: 'subscriptions' },
                    });
                  }}
                >
                  <Ionicons name="card-outline" size={20} style={styles.icon} />
                  <Text style={{ fontFamily: 'Nunito400', marginTop: 4 }}>{t('profileSettings.subscriptionsTab')}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  closeDropdownHandler();
                  setShowLanguageModal(true);
                }}
              >
                <Ionicons name="language-outline" size={20} color={Colors.textPrimary} style={styles.icon} />
                <Text style={{ fontFamily: 'Nunito400', marginTop: 4 }}>
                  {t('header.language')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dropdownItem, styles.dropdownItemLast]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color={Colors.error} style={styles.icon} />
                <Text style={styles.logoutText}>{t('header.logout')}</Text>
              </TouchableOpacity>
              {showLanguageDropdown && (
                <View style={styles.subDropdown}>
                  <TouchableOpacity
                    style={styles.subDropdownItem}
                    onPress={() => {
                      setShowLanguageDropdown(false);
                      i18n.changeLanguage("en");
                    }}
                  >
                    <Text style={styles.subDropdownText}>English</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.subDropdownItem}
                    onPress={() => {
                      setShowLanguageDropdown(false);
                      i18n.changeLanguage("es");
                    }}
                  >
                    <Text style={styles.subDropdownText}>Español</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      <Modal
        visible={isPlanModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPlanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.planCard}>
            <TouchableOpacity onPress={() => setPlanModalVisible(false)} style={styles.closeIcon}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            {currentPlan ? (
              <>
                <Text style={styles.planTitle}>{translatedCurrentPlan}</Text>
                <Text style={styles.planSubtitle}>
                  ${currentPlan.price_per_month} / {t('header.year')} • {currentPlan.storage_limit_gb} {t('header.gb')}
                </Text>
                {isPlanExpired && <Text style={[styles.expiryTitle]}>{t('header.expired')}</Text>}
                {showUpgradeReminder && <Text style={[styles.expiryTitle]}>{t('header.expiringIn')} {remainingDays} {t('header.days')}</Text>}
                {storagePlan.storagePlanPrice == "0.00" && !isPlanExpired && !showUpgradeReminder && (
                  <Text style={[styles.expiryTitle, { color: "#e96b04", fontSize: 14 }]}>
                    {t('header.expiringIn')} {remainingDays} {t('header.days')}
                  </Text>
                )}

                <View style={styles.separator} />

                <Text style={styles.featureTitle}>{t('header.features')}</Text>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color="green" />
                  <Text style={styles.featureText}>{translatedDescription}</Text>
                </View>

                <View style={styles.actionRow}>
                  {remainingDays >= 0 && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleChangeClick}>
                      <Ionicons name="pencil" size={16} color="blue" />
                      <Text style={[styles.actionText, { color: 'blue' }]}>{t('header.change')}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => setShowDeletePlanModal(true)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash" size={16} color="red" />
                    <Text style={[styles.actionText, { color: 'red' }]}>{t('header.delete')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.planTitle}>{t('header.noPlanSelected')}</Text>
                <Text style={styles.planSubtitle}>{t('header.noPlanChosen')}</Text>

                <View style={styles.separator} />

                <Text style={styles.featureText}>{t('header.choosePlanPrompt')}</Text>

                <View style={[styles.actionRow, { justifyContent: 'center' }]}>
                  <TouchableOpacity style={styles.chooseButton} onPress={handleChooseClick}>
                    <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.chooseButtonText}>{t('header.choosePlan')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
          <Snackbar
            visible={snackbarVisible}
            message={snackbarMessage}
            type={snackbarType}
            onDismiss={() => setSnackbarVisible(false)}
          />
        </View>
      </Modal>

      <Modal
        visible={showDeletePlanModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeletePlanModal(false)}
      >
        <View style={styles.delModalOverlay}>
          <View style={styles.delModalContainer}>
            <Ionicons name="warning" size={48} color={Colors.error} />
            <Text style={styles.delModalTitle}>{t('header.deletePlanTitle')}</Text>
            <Text style={styles.delModalMessage}>
              {t('header.deletePlanMessage')}
            </Text>

            {isDeletingPlan ? (
              <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <ActivityIndicator size="large" color="red" />
                <Text style={{ marginTop: 10, fontFamily: "Nunito700", fontSize: 16, color: 'red' }}>
                  {t('header.deletingPlan')}
                </Text>
              </View>
            ) : (
              <View style={styles.delModalButtons}>
                <TouchableOpacity
                  onPress={() => setShowDeletePlanModal(false)}
                  style={[styles.delModalButton, { backgroundColor: '#ccc', flexDirection: 'row' }]}
                >
                  <Ionicons name="close-circle" size={20} color="white" style={{ marginRight: 5 }} />
                  <Text style={styles.delModalButtonText}>{t('eventsScreen.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmPlanDelete}
                  style={[styles.delModalButton, { backgroundColor: 'red', flexDirection: 'row' }]}
                >
                  <MaterialIcons name="delete" size={20} color="white" style={{ marginRight: 5 }} />
                  <Text style={styles.delModalButtonText}>{t('header.delete')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('header.notifications')}</Text>
              <TouchableOpacity onPress={closeModalAndMarkAllRead}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.notificationList}>
              {notifications.length > 0 ? (
                [...notifications]
                  .sort((a, b) => moment(b.date, 'D/M/YYYY, h:mm:ss a') - moment(a.date, 'D/M/YYYY, h:mm:ss a'))
                  .map((item, index) => {
                    const isRead = item.read === true;

                    return (
                      <TouchableOpacity
                        key={item.id || index}
                        style={[
                          styles.notificationItem,
                          isRead ? styles.readItem : styles.unreadItem,
                        ]}
                        onPress={() => handleNotificationPress(item)}
                      >
                        <View style={styles.notificationContent}>
                          <Text style={styles.notificationMessage}>{item.title}</Text>
                          <Text style={styles.notificationTitle}>{item.message}</Text>
                          <Text style={styles.notificationDate}>
                            {formatNotificationDate(item.date)}
                          </Text>
                          {!isRead && <View style={styles.redDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
              ) : (
                <Text style={styles.noNotifications}>{t('header.noNotifications')}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: Platform.OS === 'ios' ? 88 : 56,
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    backgroundColor: Colors.white,
   flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 999,
  },
  title: {
    fontSize: 25,
    fontFamily: 'Nunito700',
    color: Colors.textPrimary,
    //fontWeight: '600',
    paddingLeft: 15,
    //alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profileContainer: {
    //position: 'relative',
    overflow: 'visible',
    //alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  profileButton: {
    padding: 0,
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    width: 230,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  dropdownItem: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'Nunito400',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },

  dropdownItemFirst: {
    fontFamily: 'Nunito700',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
    borderBottomWidth: 0,
  },

  dropdownItemLast: {
    borderBottomWidth: 0,
  },

  icon: {
    marginRight: 10,
  },

  logoutText: {
    color: Colors.error,
    fontFamily: 'Nunito400',
  },

  messageButton: {
    marginRight: 8,
    //marginLeft: 5,
    padding: 5,
    position: 'relative',
  },
  messageBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontFamily: "Nunito400",
    fontSize: 10,
    //fontWeight: 'bold',
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito700',
    marginBottom: 10,
    color: Colors.textPrimary,
  },
  modalText: {
    fontSize: 14,
    fontFamily: 'Nunito400',
    marginBottom: 6,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontFamily: 'Nunito700',
  },
  planCard: {
    width: 330,
    backgroundColor: '#fdf2f8',
    borderRadius: 10,
    padding: 25,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  planTitle: {
    fontSize: 18,
    fontFamily: 'Nunito700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  expiryTitle: {
    fontSize: 15,
    fontFamily: 'Nunito700',
    color: 'red',
    marginTop: 4,
  },
  planSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito400',
    color: Colors.gray,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGray,
    width: '100%',
    marginVertical: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: 'Nunito700',
    marginBottom: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 5
  },
  featureText: {
    marginLeft: 8,
    marginRight: 8,
    fontFamily: 'Nunito400',
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontFamily: 'Nunito400',
    fontSize: 14,
  },
  closeModalButton: {
    alignSelf: 'center',
    marginTop: 15,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeModalText: {
    color: '#fff',
    fontFamily: 'Nunito700',
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
    zIndex: 10,
  },
  chooseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chooseButtonText: {
    color: '#fff',
    //fontWeight: '600',
    fontFamily: 'Nunito700',
    fontSize: 14,
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
    //fontWeight: 'bold',
    fontFamily: 'Nunito700',
    marginBottom: 10,
    textAlign: 'center'
  },

  delModalMessage: {
    fontSize: 14,
    fontFamily: 'Nunito400',
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
    justifyContent: 'center',
    height: 45
  },

  delModalButtonText: {
    color: 'white',
    fontSize: 16,
    //fontWeight: 'bold',
    fontFamily: 'Nunito700',
  },
  notificationButton: {
    marginHorizontal: 12,
    marginTop: 2
  },
  notificationBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationModalBox: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 10,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationHeaderText: {
    fontSize: 20,
    fontFamily: 'Nunito700',
    //fontWeight: '600',
    color: '#333',
  },
  notificationScrollArea: {
    paddingBottom: 16,
  },
  notificationCard: {
    backgroundColor: '#f1f1f1',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  notificationCardUnread: {
    backgroundColor: '#dbeafe',
  },
  notificationTimestamp: {
    fontFamily: 'Nunito400',
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  noNotificationBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  noNotificationText: {
    fontFamily: 'Nunito400',
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -4,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: 'Nunito700',
    fontSize: 20,
    //fontWeight: 'bold',
    color: '#333',
  },
  notificationList: {
    paddingBottom: 20,
  },
  notificationItem: {
    padding: 10,
    marginVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  unreadItem: {
    backgroundColor: '#f7d9efff',
    borderLeftWidth: 4,
    borderLeftColor: '#a23586'
  },
  readItem: {
    backgroundColor: '#E0E0E0',
    borderLeftWidth: 4,
    borderLeftColor: '#9E9E9E'
  },
  notificationMessage: {
    fontFamily: 'Nunito400',
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  notificationTitle: {
    fontFamily: 'Nunito400',
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  notificationDate: {
    fontFamily: 'Nunito400',
    fontSize: 11,
    color: '#888',
    textAlign: 'right',
  },
  noNotifications: {
    textAlign: 'center',
    color: '#888',
    fontFamily: 'Nunito700',
    fontSize: 14,
    marginTop: 20,
  },
  notificationContent: {
    position: 'relative',
    paddingRight: 20,
  },

  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    position: 'absolute',
    top: 0,
    right: 0
  },
  subDropdown: {
    marginLeft: 40,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 4,
    marginTop: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subDropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  subDropdownText: {
    fontFamily: 'Nunito400',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  subscriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 8,
    marginBottom: 5,
    backgroundColor: '#e6f9ec',
    borderRadius: 12,
  },

  activeStatus: {
    backgroundColor: "#e6f9ec",
  },

  expiredStatus: {
    backgroundColor: "#fdeaea",
  },

  subscriptionText: {
    fontFamily: "Nunito700",
    fontSize: 13,
    color: 'green',
  },

  expiredText: {
    color: "red",
    fontSize: 10.5,
  },

});

export default Header;
