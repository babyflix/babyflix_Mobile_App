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

const Tab = createMaterialTopTabNavigator();

const sortEvents = (events) => {
  const currentDate = new Date();
  const upcoming = [];
  const passed = [];

  events.forEach((event) => {
    const eventEndDate = event.eventEndDate

    const eventEndDateInMilliseconds = eventEndDate * 1000;

    const eventEndDateObj = new Date(eventEndDateInMilliseconds);

    if (eventEndDateObj > currentDate) {
      upcoming.push(event);
    } else {
      passed.push(event);
    }
  });

  return { upcoming, passed };
};

const EventsTab = ({ data, onPreview, onLoadMore, onRefresh, refreshing }) => {
  const onEndReachedCalledDuringMomentum = useRef(false);

  const renderItem = ({ item, index }) => {
    const isUpcoming = (item.isActive == true && item.isEventScheduleOnToday == true && item.isEventStarted == true);
  
    const eventDateConverted = item.eventDateConverted;
    const [month, day, year] = eventDateConverted.split("/");
    const eventDate = new Date(`${year}-${month}-${day}`);
  
    const monthName = eventDate.toLocaleString('default', { month: 'short' });
    const dayFormatted = String(eventDate.getDate()).padStart(2, '0');
    const yearFormatted = eventDate.getFullYear();
  
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
              <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>{monthName}</Text>
            </View>
            <View style={{ alignItems: 'center', marginTop: 3 }} >
              <Text style={{ fontSize: 26,fontFamily: 'Poppins_500Medium'}}>{dayFormatted}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 10,fontFamily: 'Poppins_400Regular' }}>{yearFormatted}</Text>
            </View>
          </View>
        </View>
  
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{item.eventName}</Text>
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
      ListEmptyComponent={<Text>No events available</Text>}
      onEndReachedThreshold={0.01}
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

const AllTab = ({ data, onPreview, onLoadMore,onRefresh, refreshing  }) => <EventsTab data={data} onPreview={onPreview} onLoadMore={onLoadMore} onRefresh={onRefresh} refreshing={refreshing}/>;
const UpcomingTab = ({ data, onPreview, onLoadMore,onRefresh, refreshing  }) => <EventsTab data={data} onPreview={onPreview} onLoadMore={onLoadMore} onRefresh={onRefresh} refreshing={refreshing}/>;
const PassedTab = ({ data, onPreview, onLoadMore,onRefresh, refreshing  }) => <EventsTab data={data} onPreview={onPreview} onLoadMore={onLoadMore} onRefresh={onRefresh} refreshing={refreshing} />;

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


  const user = useSelector((state) => state.auth);

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
  
      const newEvents = response.data.data;
      const allEvents = isLoadMore ? [...events, ...newEvents] : newEvents;
  
      setEvents(allEvents);
      const { upcoming, passed } = sortEvents(allEvents);
      setUpcomingEvents(upcoming);
      setPassedEvents(passed);
      setHasMoreData(newEvents.length >= 10);
      setPageIndex(page);
    } catch (error) {
      console.error(error.response);

      const formData = new FormData();

      const errorData = JSON.stringify(error?.response || error || 'Unknown Error');

      formData.append('error', errorData); 
      formData.append('data', errorData); 
      formData.append('details', errorData);

      const payload={
        error : errorData,
        data: errorData,
        details : errorData,
      }

      try {
        const response = await axios.post(`${EXPO_PUBLIC_API_URL}/error/triggerError`, payload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch (err) {
        console.error('Failed to send error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };  

  useEffect(() => {
    fetchData();
  }, [user.id, existingEmails, existingMobileNumbers]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData(0); // Re-fetch from the beginning
    setIsRefreshing(false);
  };  

  const loadMoreData = () => {
    if (hasMoreData && !isLoading) {
      fetchData(pageIndex + 1, true);
    }
  };  

  const handleShareViaEmail = async ({ previewItem, inviteType, invitedEmails, mobileNumbers }) => {
    try {

      if (!previewItem) {
        console.error("Error: previewItem is undefined!");
        return;
      }
      if (!inviteType) {
        console.error("Error: inviteType is undefined!");
        return;
      }
      if (inviteType === "email" && invitedEmails.length === 0) {
        console.error("Error: No emails provided!");
        return;
      }
      if (inviteType === "mobile" && mobileNumbers.length === 0) {
        console.error("Error: No mobile numbers provided!");
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

      if (inviteType === 'email' && response.data) {
        setExistingEmails(updatedEmails);
        setSnackbarMessage('Share Event Via Email successful');
        setSnackbarType('success');
        setSnackbarVisible(true);
      } else {
        setExistingMobileNumbers(updatedMobileNumbers);
        setSnackbarMessage('Share Event Via SMS successful');
        setSnackbarType('success');
        setSnackbarVisible(true);
      }
    } catch (error) {
      if (error.response) {
        console.error('Server Error:', error.response.data);
      } else {
        console.error('Request Error:', error.message);
      }
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
      setMobileErrors("complete the current row before adding new");
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
      updatedErrors[index] = "This number is already added.";
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
  };



  return (
    <View style={GlobalStyles.container}>
      <Header title="Events" />

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.white} />
      ) : (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarLabelStyle: styles.tabLabel,
            tabBarStyle: styles.tabBar,
            tabBarIndicatorStyle: {
              backgroundColor: route.name === 'Upcoming' ? 'green' : route.name === 'Passed' ? 'red' : Colors.primary,
              height: 3,
            },
            tabBarActiveTintColor: route.name === 'Upcoming' ? 'green' : route.name === 'Passed' ? 'red' : Colors.primary,
            tabBarInactiveTintColor: Colors.textSecondary,
          })}
        >
          <Tab.Screen name="All" children={() => <AllTab data={[...upcomingEvents, ...passedEvents]} onPreview={handlePreview} onLoadMore={loadMoreData} onRefresh={onRefresh} refreshing={isRefreshing} />} />
          <Tab.Screen name="Upcoming" children={() => <UpcomingTab data={upcomingEvents} onPreview={handlePreview} onLoadMore={loadMoreData} onRefresh={onRefresh} refreshing={isRefreshing}/>} />
          <Tab.Screen name="Passed" children={() => <PassedTab data={passedEvents} onPreview={handlePreview} onLoadMore={loadMoreData} onRefresh={onRefresh} refreshing={isRefreshing}/>} />
        </Tab.Navigator>
      )}

      {previewItem && (
        <Modal transparent={true} visible={modalVisible} onRequestClose={closeModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle]}>Share Event</Text>
              <Text style={styles.modalTitle}>{previewItem.eventName}</Text>
              <View style={{ marginLeft: 10 }}>
                <Text>{previewItem.eventDateConverted}</Text>
                <Text>{previewItem.eventTime}</Text>
              </View>

              <TouchableOpacity
                style={[GlobalStyles.button, styles.moduleButton, { marginTop: 10 }]}
                onPress={openMobileModal}
              >
                <Ionicons name="phone-portrait-outline" size={22} color={Colors.white} />
                <Text style={[GlobalStyles.buttonText, styles.modalButtonText]}>Share via Mobile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[GlobalStyles.button, styles.moduleButton, { marginTop: 0 }]}
                onPress={() => {
                  setModalVisible(false);
                  setEmailModalVisible(true);
                  setInvitedEmails(previewItem.emailInvites||[])
                }}
              >
                <Ionicons name="mail-outline" size={24} color={Colors.white} />
                <Text style={[GlobalStyles.buttonText, styles.modalButtonText]}>Share via Email</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[GlobalStyles.button, styles.moduleButton, { marginTop: 0, backgroundColor: Colors.white }]} onPress={closeModal}>

                <Ionicons name="close-circle-outline" size={24} color={Colors.black} />
                <Text style={[GlobalStyles.buttonText, styles.modalButtonText, { color: Colors.black }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {emailModalVisible && (
        <Modal transparent={true} visible={emailModalVisible} onRequestClose={() => setEmailModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Share Event Via Email</Text>

              <View style={styles.messageBox}>
                <Text>{previewItem.userName}'s ultrasound is scheduled on {previewItem.eventDateConverted}, {previewItem.eventTime}.
                  Log in to the Babyflix app to enjoy live streaming of the experience.</Text>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={24} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Email"
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
                      setEmailError('This email is already invited.');
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

              <Text style={styles.shareCount}>Total Shares: {invitedEmails.length}</Text>

              <Text style={styles.listTitle}>Invited for this event</Text>
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
                  <Ionicons name="close-circle-outline" size={20} color={Colors.black} style={{ marginRight: 5 }} />
                  <Text style={[GlobalStyles.buttonText, { color: Colors.black }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[GlobalStyles.registerButton, GlobalStyles.allMarginLeft]}
                  onPress={() => {
                    if (previewItem) {
                      handleShareViaEmail({
                        previewItem: previewItem,
                        inviteType: inviteType,
                        invitedEmails: invitedEmails,
                        mobileNumbers: mobileNumbers,
                      });
                      setTimeout(() => {
                        setEmailModalVisible(false);
                      }, 2000);
                    } else {
                      console.error("Error: No event selected for sharing.");
                    }
                  }}
                >
                  <Ionicons name="send-outline" size={20} color={Colors.white} style={{ marginRight: 5 }} />
                  <Text style={GlobalStyles.buttonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {mobileModalVisible && (
        <Modal transparent={true} visible={mobileModalVisible} onRequestClose={() => setMobileModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Share Event Via SMS</Text>

              <View style={styles.messageBox}>
                <Text>{previewItem.userName}'s ultrasound is scheduled on {previewItem.eventDateConverted}, {previewItem.eventTime}.
                  Log in to the Babyflix app to enjoy live streaming of the experience.</Text>
              </View>

              <Text style={styles.listTitle}>Enter Mobile Number</Text>
              <ScrollView >
                {mobileNumbers.map((item, index) => (
                  <View key={index} style={styles.mobileInputRow}>
                    <TextInput
                      style={styles.countryCodeInput}
                      placeholder="1"
                      value={item.countryCode}
                      onChangeText={(text) => handleUpdateMobileNumber(index, "countryCode", text)}
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
                        placeholder="Mobile Number"
                        value={item.mobileNumber}
                        onChangeText={(text) => handleUpdateMobileNumber(index, "mobileNumber", text)}
                        keyboardType="phone-pad"
                        maxLength={10}
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
              </ScrollView>


              <TouchableOpacity style={styles.addMoreButton} onPress={handleAddMobileRow}>
                <Ionicons name="add-circle" size={24} color={Colors.primary} />
                <Text style={styles.addMoreText}>Add More</Text>
              </TouchableOpacity>

              <View style={[GlobalStyles.row, { marginVertical: 15 }]}>
                <TouchableOpacity
                  style={[GlobalStyles.resetButton, GlobalStyles.allMarginRight]}
                  onPress={() => setMobileModalVisible(false)}
                >
                  <Ionicons name="refresh" size={20} color={Colors.black} style={{ marginRight: 5 }} />
                  <Text style={[GlobalStyles.buttonText, { color: Colors.black }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[GlobalStyles.registerButton, GlobalStyles.allMarginLeft]}
                  onPress={() => {
                    if (previewItem) {
                      handleShareViaEmail({
                        previewItem: previewItem,
                        inviteType: inviteType,
                        invitedEmails: invitedEmails,
                        mobileNumbers: mobileNumbers,
                      });

                      setMobileModalVisible(false);
                    } else {
                      console.error("Error: No event selected for sharing.");
                    }
                  }}
                >
                  <Ionicons name="send-outline" size={20} color={Colors.white} style={{ marginRight: 5 }} />
                  <Text style={GlobalStyles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {isLoading && <Loader loading={true} />}
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
    paddingBottom:65,
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
    fontFamily: 'Poppins_600SemiBold',
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
    color:'#555',
    fontFamily: 'Poppins_400Regular',
  },
  shareButton: {
    position: 'absolute',
    // bottom: 38,
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
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
    marginLeft: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginLeft: 5
  },
  invitedEmail: {
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
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  addMoreText: {
    marginLeft: 5,
    color: Colors.primary,
    fontSize: 16,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  // modalButtonText: {
  //   marginLeft: 7,
  //   color: Colors.white,
  //   fontSize: 16,
  // },
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
    marginTop:3,
    fontSize: 12,
    fontFamily:'Poppins_500Medium',
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
    fontSize: 12,
    marginLeft: 5,
    marginTop: 5,
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
});

export default EventsScreen;
