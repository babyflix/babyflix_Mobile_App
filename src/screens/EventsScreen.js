import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from 'react-native-vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import Header from '../components/Header';
import Colors from '../constants/Colors';
import GlobalStyles from '../styles/GlobalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_API_URL } from '@env';
import axios from 'axios';
import Loader from '../components/Loader';
import Snackbar from '../components/Snackbar';
import * as Animatable from 'react-native-animatable';
import { logError } from '../components/logError';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDynamicTranslate } from '../constants/useDynamicTranslate';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import sendDeviceUserInfo, { USERACTIONS } from '../components/deviceInfo';

const Tab = createMaterialTopTabNavigator();

const sortEvents = (events) => {
  const currentDate = new Date();
  const upcoming = [];
  const passed = [];

  events.forEach((event) => {
    if (event.isActive == true) {
      upcoming.push(event);
    } else {
      passed.push(event);
    }
  });

  return { upcoming, passed };
};

const EventsTab = ({ data, onPreview, onLoadMore, onRefresh, refreshing }) => {
  const onEndReachedCalledDuringMomentum = useRef(false);
  const { t } = useTranslation();

  const renderItem = ({ item, index }) => {
    const isUpcoming = (item.isActive == true);
    const eventDateConverted = item.eventDateConverted;
    const [month, day, year] = eventDateConverted.split("/").map(Number);
    const eventDate = new Date(Date.UTC(year, month - 1, day));

    const monthName = eventDate.toLocaleString('en-US', {
      month: 'short',
      timeZone: 'UTC'
    });
    const dayFormatted = day
    const yearFormatted = year

    //console.log('eventName:', item.translatedMonth, item.translatedName);

    return (
      <Animatable.View
        animation="fadeInUp"
        duration={500}
        delay={index * 100}
        style={styles.eventCard}
      >
        <View
          style={[
            styles.eventImageContainer,
            { backgroundColor: isUpcoming ? 'lightgreen' : 'lightgray' }
          ]}
        >
          <View style={styles.eventDateText}>
            <View style={{ backgroundColor: 'white', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10 }}>
              <Text style={{ fontFamily: 'Nunito700' }}>{item.translatedMonth}</Text>
            </View>
            <View style={{ alignItems: 'center', marginTop: 3 }} >
              <Text style={{ fontSize: 26, fontFamily: 'Nunito400', }}>{dayFormatted}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontFamily: 'Nunito400', }}>{yearFormatted}</Text>
            </View>
          </View>
        </View>

        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{item.translatedName}</Text>
          <View style={styles.eventDetail}>
            <Icon name="access-time" size={20} color={Colors.textSecondary} />
            <Text style={styles.eventDetailText}>{item.eventTime}</Text>
          </View>
          <View style={styles.iconContainer}>
            <View style={styles.iconWithCount}>
              <Icon name="email" size={20} color={Colors.textSecondary} />
              <Text style={styles.countText}>{item.emailInvites?.length || 0}</Text>
            </View>

            <View style={styles.iconWithCount}>
              <Icon name="phone-iphone" size={20} color={Colors.textSecondary} />
              <Text style={styles.countText}>{item.mobileInvites?.length || 0}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.shareButton, isUpcoming ? {} : styles.disabledShareButton]}
          onPress={() => isUpcoming && onPreview(item)}
          disabled={!isUpcoming}
        >
          <Icon name="share" size={20} color="#fff" />
        </TouchableOpacity>
      </Animatable.View>
    );
  };


  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.gridContainer}
      ListEmptyComponent={<Text>{t('eventsScreen.noEvents')}</Text>}
      onEndReachedThreshold={0.5}
      initialNumToRender={10}
      onEndReached={() => {
        if (!onEndReachedCalledDuringMomentum.current && onLoadMore && data.length >= 10) {
          onLoadMore();
          onEndReachedCalledDuringMomentum.current = true;
        }
      }}
      onMomentumScrollBegin={() => {
        onEndReachedCalledDuringMomentum.current = false;
      }}
      keyboardShouldPersistTaps="handled"
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

const AllTab = ({ data, onPreview, onLoadMore, onRefresh, refreshing }) => <EventsTab data={data} onPreview={onPreview} onLoadMore={onLoadMore} onRefresh={onRefresh} refreshing={refreshing} />;
const UpcomingTab = ({ data, onPreview, onLoadMore, onRefresh, refreshing }) => <EventsTab data={data} onPreview={onPreview} onLoadMore={onLoadMore} onRefresh={onRefresh} refreshing={refreshing} />;
const PassedTab = ({ data, onPreview, onLoadMore, onRefresh, refreshing }) => <EventsTab data={data} onPreview={onPreview} onLoadMore={onLoadMore} onRefresh={onRefresh} refreshing={refreshing} />;

const EventsScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [eventsData, setEventsData] = useState();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [passedEvents, setPassedEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState();
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [mobileModalVisible, setMobileModalVisible] = useState(false);
  const [events, setEvents] = useState([]);
  const [email, setEmail] = useState('');
  const [mobileNumbers, setMobileNumbers] = useState([{ countryCode: "", mobileNumber: "" }]);
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [inviteType, setInviteType] = useState("");
  const [existingEmails, setExistingEmails] = useState([]);
  const [existingMobileNumbers, setExistingMobileNumbers] = useState([])
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('success');
  const [emailError, setEmailError] = useState('');
  const [mobileErrors, setMobileErrors] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPhoneInfo, setShowPhoneInfo] = useState(false);
  const [translatedPreviewUserName, setTranslatedPreviewUserName] = useState('');

  const user = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  useEffect(() => {
    if (previewItem?.userName) {
      (async () => {
        const translated = await useDynamicTranslate(previewItem.userName);
        setTranslatedPreviewUserName(translated || previewItem.userName);
      })();
    }
  }, [previewItem]);

  const fetchData = async (page = 0, isLoadMore = false) => {
    setIsLoading(true);
    const timezone = await AsyncStorage.getItem('timezone');

    try {
      const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/events/getAllEvents`, {
        params: {
          pageSize: 10,
          pageIndex: page,
          sortBy: 'id',
          sortOrder: 'desc',
          userId: user.id,
          isApp: 'native',
          timezone,
        },
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const newEvent = response.data.data;
      const newEvents = await Promise.all(
        newEvent.map(async (item) => {
          const [month, day, year] = item.eventDateConverted.split("/").map(Number);
          const eventDate = new Date(Date.UTC(year, month - 1, day));
          const monthName = eventDate.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });

          return {
            ...item,
            translatedMonth: await useDynamicTranslate(monthName),
            translatedName: await useDynamicTranslate(item.eventName),
          };
        })
      );
      const allEvents = isLoadMore ? [...events, ...newEvents] : newEvents;

      setEvents(allEvents);
      const { upcoming, passed } = sortEvents(allEvents);
      setUpcomingEvents(upcoming);
      setPassedEvents(passed);
      setHasMoreData(newEvents.length >= 10);
      setPageIndex(page);
    } catch (error) {
      console.error(error);
      const errorData = JSON.stringify(error?.response || error || 'Unknown Error');

      await logError({
        error: error,
        data: errorData,
        details: "Error in getAllEvents API call on EventScreen"
      });

    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData(0);
    setIsRefreshing(false);
  };

  const loadMoreData = () => {
    if (hasMoreData && !isLoading) {
      fetchData(pageIndex + 1, true);
    }
  };

  const handleShareViaEmail = async ({ previewItem, inviteType, invitedEmails, mobileNumbers }) => {
    try {

      //console.log('previewItem, inviteType, invitedEmails, mobileNumbers', previewItem, inviteType, invitedEmails, mobileNumbers)

      if (!previewItem) {
        return;
      }
      if (inviteType === "email" && invitedEmails.length === 0) {
        setEmailError(t("eventsScreen.enterEmailError"))
        return;
      }
      if (inviteType === "mobile" && mobileNumbers.filter(item => item.mobileNumber && item.mobileNumber.trim() !== "").length === 0) {
        setMobileErrors(t("eventsScreen.enterMobile"))
        return;
      }
      if (!inviteType) {
        return;
      }

      let Data = inviteType === "email" ? invitedEmails : mobileNumbers;
      const normalizePhoneNumber = (num) => num.replace(/[^0-9]/g, '');
      let updatedEmails = [...new Set([...existingEmails, ...(previewItem.emailInvites || [])])];

      let normalizedExistingMobileNumbers = existingMobileNumbers.map(normalizePhoneNumber);
      let normalizedPreviewMobileInvites = (previewItem.mobileInvites || []).map(normalizePhoneNumber);

      let updatedMobileNumbers = [
        ...new Set([...normalizedExistingMobileNumbers, ...normalizedPreviewMobileInvites])
      ];

      const requestBody = {
        inviteType: inviteType || "email",
        data: Data.length > 0 ? Data : null,
        eventDetails: previewItem || {},
        exsitingEmails: updatedEmails.length > 0 ? updatedEmails : [],
        exsistingMobileNumbers: updatedMobileNumbers.length > 0 ? updatedMobileNumbers : [],
        message: `${previewItem?.userName}'s ultrasound is scheduled on ${previewItem?.eventDateConverted}, ${previewItem?.eventTime}. Log in to the Babyflix app to enjoy live streaming.`,
      };

      const response = await axios.post(`${EXPO_PUBLIC_API_URL}/api/events/sendInvite`, requestBody);

      setMobileModalVisible(false);
      setEmailModalVisible(false);

      if (inviteType === 'email' && response.data) {
        setExistingEmails(updatedEmails);
        setSnackbarMessage(t('eventsScreen.snackbar.shareEmailSuccess'));
        setSnackbarType('success');
        setSnackbarVisible(true);
        onRefresh();

        sendDeviceUserInfo({
          action_type: USERACTIONS.SHARE,
          action_description: `User Shared event via email`,
        });
      } else {
        setExistingMobileNumbers(updatedMobileNumbers);
        setSnackbarMessage(t('eventsScreen.snackbar.shareMobileSuccess'));
        setSnackbarType('success');
        setSnackbarVisible(true);
        onRefresh();

        sendDeviceUserInfo({
          action_type: USERACTIONS.SHARE,
          action_description: `User Shared event via SMS`,
        });
      }
    } catch (error) {
      await logError({
        error: error,
        data: error.response,
        details: "Error in sendInvite API call on EventScreen"
      });
    }
  };

  const handlePreview = (item) => {
    setPreviewItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setPreviewItem(null);
  };

  const handleAddMobileRow = () => {
    const last = mobileNumbers[mobileNumbers.length - 1];
    if (!last.countryCode || !last.mobileNumber) {
      setMobileErrors(t('eventsScreen.snackbar.completeRow'));
      return;
    }

    setMobileNumbers([...mobileNumbers, { countryCode: "", mobileNumber: "" }]);
    setInviteType("mobile");
  };

  const handleRemoveMobileRow = (index) => {
    setMobileNumbers(mobileNumbers.filter((_, i) => i !== index));
  };

  const handleUpdateMobileNumber = (index, field, value) => {
    const updatedNumbers = [...mobileNumbers];
    updatedNumbers[index] = { ...updatedNumbers[index], [field]: value };
    setMobileNumbers(updatedNumbers);
    setInviteType("mobile");

    const numberToCheck = updatedNumbers[index].mobileNumber.trim();
    const duplicates = updatedNumbers.filter((item, i) => i !== index && item.mobileNumber === numberToCheck);

    const updatedErrors = [...mobileErrors];
    if (duplicates.length > 0 && field === "mobileNumber") {
      updatedErrors[index] = (t('eventsScreen.snackbar.duplicateMobile'));
    } else {
      updatedErrors[index] = "";
    }
    setMobileErrors(updatedErrors);
  };

  const openMobileModal = () => {
    if (previewItem && previewItem.mobileInvites?.length > 0) {
      const parsedMobiles = previewItem.mobileInvites.map((item) => {
        const [countryCode, mobileNumber] = item.split("-");
        return {
          countryCode: countryCode || "",
          mobileNumber: mobileNumber || "",
        };
      });

      setMobileNumbers(parsedMobiles);
      setMobileErrors(parsedMobiles.map(() => ""));
    } else {
      setMobileNumbers([{ countryCode: "", mobileNumber: "" }]);
      setMobileErrors([""]);
    }

    setModalVisible(false);
    setMobileModalVisible(true);
    setInviteType("mobile");
  };

  return (
    <View style={[GlobalStyles.container, Platform.OS === 'android' ? { paddingTop: insets.top } : null]}>
      <Header title={t('eventsScreen.title')} />

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.white} />
      ) : (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarLabelStyle: styles.tabLabel,
            tabBarStyle: styles.tabBar,
            tabBarIndicatorStyle: {
              backgroundColor: route.name === t('eventsScreen.upcomingTab') ? 'green' : route.name === t('eventsScreen.passedTab') ? 'red' : Colors.primary,
              height: 3,
            },
            tabBarActiveTintColor: route.name === t('eventsScreen.upcomingTab') ? 'green' : route.name === t('eventsScreen.passedTab') ? 'red' : Colors.primary,
            tabBarInactiveTintColor: Colors.textSecondary,
          })}
        >
          <Tab.Screen
            name={t('eventsScreen.allTab')}
            options={{
              tabBarLabel: ({ color }) => (
                <View style={styles.tabItem}>
                  <Ionicons name="albums-outline" size={20} color={color} />
                  <View style={styles.tabRow}>
                    <Text style={[styles.tabLabel, { color }]}>{t('eventsScreen.allTab')}</Text>
                    {[...upcomingEvents, ...passedEvents].length > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {[...upcomingEvents, ...passedEvents].length}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ),
            }}
            children={() => (
              <AllTab
                data={[...upcomingEvents, ...passedEvents]}
                onPreview={handlePreview}
                onLoadMore={loadMoreData}
                onRefresh={onRefresh}
                refreshing={isRefreshing}
              />
            )}
          />

          <Tab.Screen
            name={t('eventsScreen.upcomingTab')}
            options={{
              tabBarLabel: ({ color }) => (
                <View style={styles.tabItem}>
                  <Ionicons name="calendar-outline" size={20} color={color} />
                  <View style={styles.tabRow}>
                    <Text style={[styles.tabLabel, { color }]}>{t('eventsScreen.upcomingTab')}</Text>
                    {upcomingEvents.length > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{upcomingEvents.length}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ),
            }}
            children={() => (
              <UpcomingTab
                data={upcomingEvents}
                onPreview={handlePreview}
                onLoadMore={loadMoreData}
                onRefresh={onRefresh}
                refreshing={isRefreshing}
              />
            )}
          />

          <Tab.Screen
            name={t('eventsScreen.passedTab')}
            options={{
              tabBarLabel: ({ color }) => (
                <View style={styles.tabItem}>
                  <MaterialCommunityIcons name="calendar-remove-outline" size={20} color={color} />
                  <View style={styles.tabRow}>
                    <Text style={[styles.tabLabel, { color }]}>{t('eventsScreen.passedTab')}</Text>
                    {passedEvents.length > 0 && (
                      <View style={[styles.badge, { backgroundColor: 'lightgray' }]}>
                        <Text style={styles.badgeText}>{passedEvents.length}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ),
            }}
            children={() => (
              <PassedTab
                data={passedEvents}
                onPreview={handlePreview}
                onLoadMore={loadMoreData}
                onRefresh={onRefresh}
                refreshing={isRefreshing}
              />
            )}
          />
        </Tab.Navigator>
      )}

      {previewItem && (
        <Modal transparent={true} visible={modalVisible} onRequestClose={closeModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle]}>{t('eventsScreen.shareEvent')}</Text>
              <Text style={styles.modalTitle}>{useDynamicTranslate(previewItem.eventName)}</Text>
              <View style={{ marginLeft: 10 }}>
                <Text>{previewItem.eventDateConverted}</Text>
                <Text>{previewItem.eventTime}</Text>
              </View>

              <TouchableOpacity activeOpacity={0.8} onPress={openMobileModal} style={{ marginBottom: -20 }}>
                <LinearGradient
                  colors={["#d63384", "#9b2c6f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[GlobalStyles.button, styles.moduleButton, { justifyContent: "center" }]}
                >
                  <Ionicons name="phone-portrait-outline" size={22} color="#fff" />
                  <Text style={[GlobalStyles.buttonText, styles.modalButtonText, { marginLeft: 6 }]}>
                    {t("eventsScreen.shareViaMobile")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setModalVisible(false);
                  setEmailModalVisible(true);
                  setInvitedEmails(previewItem.emailInvites || []);
                  setInviteType("email");
                }}
              >
                <LinearGradient
                  colors={["#d63384", "#9b2c6f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[GlobalStyles.button, styles.moduleButton, { justifyContent: "center" }]}
                >
                  <Ionicons name="mail-outline" size={24} color="#fff" />
                  <Text style={[GlobalStyles.buttonText, styles.modalButtonText, { marginLeft: 6 }]}>
                    {t("eventsScreen.shareViaEmail")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={[GlobalStyles.button, styles.moduleButton, { marginTop: 0, backgroundColor: Colors.white }]} onPress={closeModal}>

                <Ionicons name="close-circle-outline" size={24} color={Colors.black} />
                <Text style={[GlobalStyles.buttonText, styles.modalButtonText, { color: Colors.black }]}>{t('eventsScreen.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {emailModalVisible && (
        <Modal transparent={true} visible={emailModalVisible} onRequestClose={() => setEmailModalVisible(false)}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t('eventsScreen.shareEventViaEmail')}</Text>

                <View style={styles.messageBox}>
                  <Text style={{ fontFamily: 'Nunito400' }}>{
                    t('eventsScreen.ultrasoundMessage', {
                      userName: translatedPreviewUserName || previewItem.userName,
                      eventDate: previewItem.eventDateConverted,
                      eventTime: previewItem.eventTime
                    })}
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={24} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('eventsScreen.enterEmail')}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setEmailError('');
                    }}
                  />
                  <TouchableOpacity onPress={() => {
                    if (email) {
                      const trimmedEmail = email.trim().toLowerCase();
                      const alreadyInvited = invitedEmails.includes(trimmedEmail);
                      setEmail('');
                      setInviteType("email");

                      if (alreadyInvited) {
                        setEmailError(t('eventsScreen.snackbar.emailAlreadyInvited'));
                      } else {
                        setInvitedEmails([...invitedEmails, email])
                        setEmail('');
                        setInviteType("email");
                        setEmailError('');
                      }
                    }
                  }}>
                    <Ionicons name="add-circle" size={28} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}

                <Text style={styles.shareCount}>{t('eventsScreen.totalShares')}: {invitedEmails.length}</Text>

                <Text style={styles.listTitle}>{t('eventsScreen.invitedForThisEvent')}</Text>
                <ScrollView contentContainerStyle={styles.invitedList}>
                  {invitedEmails.map((email, index) => (
                    <View key={index} style={styles.invitedEmailContainer}>
                      <Text style={styles.invitedEmail}>{email}</Text>
                      <TouchableOpacity onPress={() => {
                        setInvitedEmails(invitedEmails.filter((_, i) => i !== index));
                      }}>
                        <Ionicons name="close-circle" size={22} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                <View style={[GlobalStyles.row, { marginVertical: 15 }]}>

                  <TouchableOpacity
                    style={[GlobalStyles.resetButton, GlobalStyles.allMarginRight]}
                    onPress={() => setEmailModalVisible(false)}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={Colors.primary} style={{ marginRight: 5 }} />
                    <Text style={[GlobalStyles.buttonText, { color: Colors.primary }]}>
                      {t("eventsScreen.cancel")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{ flex: 1 }}
                    onPress={() => {
                      if (previewItem) {
                        handleShareViaEmail({
                          previewItem: previewItem,
                          inviteType: inviteType,
                          invitedEmails: invitedEmails,
                          mobileNumbers: mobileNumbers,
                        });
                        // setTimeout(() => {
                        //   setEmailModalVisible(false);
                        // }, 2000);
                      } else {
                        console.error("Error: No event selected for sharing.");
                      }
                    }}
                  >
                    <LinearGradient
                      colors={["#d63384", "#9b2c6f"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[GlobalStyles.registerButton, GlobalStyles.allMarginLeft, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
                    >
                      <Ionicons name="send-outline" size={20} color="#fff" style={{ marginRight: 5 }} />
                      <Text style={[GlobalStyles.buttonText, { color: "#fff" }]}>
                        {t("eventsScreen.send")}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
          {isLoading && <Loader loading={true} />}
        </Modal>
      )}

      {mobileModalVisible && (
        <Modal transparent={true} visible={mobileModalVisible} onRequestClose={() => setMobileModalVisible(false)}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t('eventsScreen.shareEvebtViaMobile')}</Text>

                <View style={styles.messageBox}>
                  <Text style={{ fontFamily: 'Nunito400' }}>{t('eventsScreen.ultrasoundMessage', {
                    userName: translatedPreviewUserName || previewItem.userName,
                    eventDate: previewItem.eventDateConverted,
                    eventTime: previewItem.eventTime
                  })}
                  </Text>
                </View>

                <Text style={styles.listTitle}>{t('eventsScreen.enterMobileNumber')}</Text>
                <ScrollView >
                  {mobileNumbers.map((item, index) => (
                    <View key={index} style={styles.mobileInputRow}>
                      <TextInput
                        style={styles.countryCodeInput}
                        placeholder="1"
                        value={item.countryCode}
                        onChangeText={(text) => {
                          handleUpdateMobileNumber(index, "countryCode", text);
                          setMobileErrors('');
                        }}
                        keyboardType="phone-pad"
                        maxLength={4}
                      />

                      <View style={{ flex: 1 }}>
                        <Ionicons
                          name="call"
                          size={20}
                          color={Colors.gray}
                          style={{
                            position: 'absolute',
                            left: '6%',
                            top: '50%',
                            transform: [{ translateY: -10 }],
                          }}
                        />
                        <TextInput
                          style={styles.mobileInput}
                          placeholder={t('eventsScreen.enterMobileNumber')}
                          value={item.mobileNumber}
                          onChangeText={(text) => {
                            handleUpdateMobileNumber(index, "mobileNumber", text);
                            setMobileErrors('');
                          }}
                          keyboardType="phone-pad"
                          maxLength={10}
                          onFocus={() => setShowPhoneInfo(true)}
                        />
                      </View>

                      {mobileNumbers.length > 1 && (
                        <TouchableOpacity onPress={() => handleRemoveMobileRow(index)}>
                          <Ionicons name="remove-circle-outline" size={24} color="red" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  {mobileErrors ? (
                    <Text style={styles.errorText}>{mobileErrors}</Text>
                  ) : null}
                  {showPhoneInfo && (
                    <View style={{
                      backgroundColor: 'lightyellow',
                      padding: 8,
                      borderRadius: 5,
                      marginTop: 5,
                    }}>
                      <Text style={{ fontFamily: 'Nunito400', fontSize: 12, color: 'black' }}>
                        {t('eventsScreen.phoneInfo')}
                      </Text>
                    </View>
                  )}
                </ScrollView>


                <TouchableOpacity style={styles.addMoreButton} onPress={handleAddMobileRow}>
                  <Ionicons name="add-circle" size={24} color={Colors.primary} />
                  <Text style={styles.addMoreText}>{t('eventsScreen.addMore')}</Text>
                </TouchableOpacity>

                <View style={[GlobalStyles.row, { marginVertical: 15 }]}>
                  <TouchableOpacity
                    style={[GlobalStyles.resetButton, GlobalStyles.allMarginRight]}
                    onPress={() => setMobileModalVisible(false)}
                  >
                    <Ionicons name="refresh" size={20} color={Colors.black} style={{ marginRight: 5 }} />
                    <Text style={[GlobalStyles.buttonText, { color: Colors.black }]}>{t('eventsScreen.cancel')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{ flex: 1 }}
                    onPress={() => {
                      if (previewItem) {
                        handleShareViaEmail({
                          previewItem: previewItem,
                          inviteType: inviteType,
                          invitedEmails: invitedEmails,
                          mobileNumbers: mobileNumbers,
                        });

                        //setMobileModalVisible(false);
                      } else {
                        console.error("Error: No event selected for sharing.");
                      }
                    }}
                  >
                    <LinearGradient
                      colors={["#d63384", "#9b2c6f"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[GlobalStyles.registerButton, GlobalStyles.allMarginLeft, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
                    >
                      <Ionicons name="send-outline" size={20} color={Colors.white} style={{ marginRight: 5 }} />
                      <Text style={GlobalStyles.buttonText}>{t('eventsScreen.send')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
          {isLoading && <Loader loading={true} />}
        </Modal>
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

const styles = StyleSheet.create({
  gridContainer: {
    padding: 15,
    paddingBottom: 65,
  },
  eventCard: {
    backgroundColor: Colors.white,
    padding: 10,
    marginBottom: 10,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  eventContent: {
    flex: 1,
    marginBottom: 0,
    marginLeft: 5,
  },

  eventTitle: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Nunito700',
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  eventDetailText: {
    fontSize: 14,
    marginLeft: 6,
    marginTop: 3,
    color: '#555',
    fontFamily: 'Nunito400',
  },
  shareButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: Colors.messagePrimary,
    borderRadius: 30,
    padding: 16,
    elevation: 6,
    zIndex: 10,
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fdf2f8',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  modalTitle: {
    fontFamily: 'Nunito700',
    fontSize: 20,
    //fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 10,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    borderRadius: 5,
  },
  modalButtonText: {
    color: Colors.white,
    fontFamily: 'Nunito700',
    fontSize: 16,
    paddingLeft: 7,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  closeButton: {
    backgroundColor: 'gray',
    padding: 10,
    marginBottom: 10,
    marginTop: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  closeButtonText: {
    color: Colors.white,
    fontFamily: 'Nunito700',
    fontSize: 16,
    paddingLeft: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  messageBox: {
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  shareCount: {
    fontFamily: 'Nunito700',
    fontSize: 15,
    //fontWeight: 'bold',
    marginTop: 10,
    marginLeft: 2,
  },
  listTitle: {
    fontFamily: 'Nunito700',
    fontSize: 16,
    //fontWeight: 'bold',
    marginTop: 10,
    marginLeft: 5
  },
  invitedEmail: {
    fontFamily: 'Nunito400',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Nunito400',
    padding: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 50,
  },
  invitedList: {
    marginVertical: 10,
  },
  invitedEmailContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.messageGray,
    padding: 7,
    borderRadius: 8,
    marginVertical: 5,
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  mobileInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  countryCodeInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    padding: 8,
    marginHorizontal: 5,
    textAlign: "center",
    borderRadius: 8,
    fontFamily: 'Nunito400',
  },
  mobileInput: {
    height: 50,
    width: 185,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    padding: 8,
    paddingLeft: 37,
    borderRadius: 8,
    marginRight: 5,
    fontFamily: 'Nunito400',
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  addMoreText: {
    marginLeft: 5,
    color: Colors.primary,
    fontFamily: 'Nunito400',
    fontSize: 16,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  disabledShareButton: {
    opacity: 0.5,
  },
  moduleButton: {
    backgroundColor: Colors.primary,
    marginVertical: 15,
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 50,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20
  },

  iconWithCount: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  countText: {
    marginLeft: 5,
    marginTop: 3,
    fontSize: 13,
    fontFamily: 'Nunito400',
    color: Colors.black,
  },
  eventImageContainer: {
    width: '20%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: 5,
    marginRight: 10,
    borderRadius: 10,
  },
  eventDateText: {
    textAlign: 'center',
    color: 'white',
  },
  errorText: {
    color: Colors.error,
    fontFamily: 'Nunito400',
    fontSize: 12,
    marginLeft: 5,
    marginTop: 5,
  },
  tabBar: {
    backgroundColor: Colors.white,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tabLabel: {
    fontFamily: 'Nunito400',
    fontSize: 12,
    marginRight: 4,
  },
  badge: {
    backgroundColor: '#e9b7dcff',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default EventsScreen;
