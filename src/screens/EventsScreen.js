import React, { useState, useEffect } from 'react';
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

const EventsTab = ({ data, onPreview }) => {

  const renderItem = ({ item }) => {
    const isUpcoming = (item.isActive == true && item.isEventScheduleOnToday == true && item.isEventStarted == true);

    const eventDateConverted = item.eventDateConverted;
    const [month, day, year] = eventDateConverted.split("/");
    const eventDate = new Date(`${year}-${month}-${day}`);

    const monthName = eventDate.toLocaleString('default', { month: 'short' });
    const dayFormatted = String(eventDate.getDate()).padStart(2, '0');
    const yearFormatted = eventDate.getFullYear();

    return (
      <ScrollView contentContainerStyle={styles.eventCard}>
        <View
          style={[
            styles.eventImageContainer,
            { backgroundColor: isUpcoming ? 'lightgreen' : 'lightgray' }
          ]}
        >
          <View style={styles.eventDateText}>
            <View style={{ backgroundColor: 'white', color: "black", alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10 }}><Text style={{ fontWeight: 'bold' }}>{monthName}</Text></View>
            <View style={{ alignItems: 'center', marginTop: 3 }} ><Text style={{ fontSize: 25 }}>{dayFormatted}</Text></View>
            <View style={{ alignItems: 'center' }}><Text style={{ fontSize: 10 }}>{yearFormatted}</Text></View>
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
          <Icon name="share" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.gridContainer}
      ListEmptyComponent={<Text>No events available</Text>}
    />
  );
}

const AllTab = ({ data, onPreview }) => <EventsTab data={data} onPreview={onPreview} />;
const UpcomingTab = ({ data, onPreview }) => <EventsTab data={data} onPreview={onPreview} />;
const PassedTab = ({ data, onPreview }) => <EventsTab data={data} onPreview={onPreview} />;

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

  const user = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const timezone = await AsyncStorage.getItem('timezone');
      const token = await AsyncStorage.getItem('token');
      try {
        const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/events/getAllEvents`, {
          params: {
            pageSize: 10,
            pageIndex: 0,
            sortBy: 'id',
            sortOrder: 'desc',
            userId: user.id,
            isApp: 'native',
            timezone: timezone,
          },
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        setEvents(response.data);
        const { upcoming, passed } = sortEvents(response.data.data);
        setUpcomingEvents(upcoming);
        setPassedEvents(passed);
      } catch (error) {
        console.error(error.response);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user.id, existingEmails, existingMobileNumbers]);

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
          <Tab.Screen name="All" children={() => <AllTab data={[...upcomingEvents, ...passedEvents]} onPreview={handlePreview} />} />
          <Tab.Screen name="Upcoming" children={() => <UpcomingTab data={upcomingEvents} onPreview={handlePreview} />} />
          <Tab.Screen name="Passed" children={() => <PassedTab data={passedEvents} onPreview={handlePreview} />} />
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
                onPress={() => {
                  setModalVisible(false);
                  setMobileModalVisible(true);
                }}
              >
                <Ionicons name="share-social-outline" size={22} color={Colors.white} />
                <Text style={[GlobalStyles.buttonText, styles.modalButtonText]}>Share via Mobile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[GlobalStyles.button, styles.moduleButton, { marginTop: 0 }]}
                onPress={() => {
                  setModalVisible(false);
                  setEmailModalVisible(true);
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
                  onChangeText={setEmail}
                />
                <TouchableOpacity onPress={() => {
                  if (email) {
                    setInvitedEmails([...invitedEmails, email]);
                    setEmail('');
                    setInviteType("email");
                  }
                }}>
                  <Ionicons name="add-circle" size={28} color={Colors.primary} />
                </TouchableOpacity>
              </View>

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
              {mobileNumbers.map((item, index) => (
                <ScrollView key={index} contentContainerStyle={styles.mobileInputRow}>

                  <TextInput
                    style={styles.countryCodeInput}
                    placeholder="1"
                    value={item.countryCode}
                    onChangeText={(text) => handleUpdateMobileNumber(index, "countryCode", text)}
                    keyboardType="phone-pad"
                    maxLength={4}
                  />
                  <View>
                    <Ionicons name="call" size={20} color={Colors.gray}
                      style={{
                        position: 'absolute', left: '6%', top: '50%',
                        transform: [{ translateY: -10 }],
                      }} />
                    <TextInput
                      style={styles.mobileInput}
                      placeholder="Mobile Number"
                      value={item.number}
                      onChangeText={(text) => handleUpdateMobileNumber(index, "mobileNumber", text)}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>

                  <TouchableOpacity onPress={() => handleRemoveMobileRow(index)}>
                    <Ionicons name="remove-circle-outline" size={24} color="red" />
                  </TouchableOpacity>
                </ScrollView>
              ))}

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
                      share(),
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
  },
  eventCard: {
    backgroundColor: Colors.white,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
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
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  eventDetailText: {
    marginLeft: 5,
    color: Colors.textSecondary,
  },
  shareButton: {
    position: 'absolute',
    top: 40,
    right: 15,
    padding: 5,
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
    paddingLeft: 10,
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
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  mobileInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    marginTop: 15
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
    marginTop: 10,
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
  modalButtonText: {
    marginLeft: 10,
    color: Colors.white,
    fontSize: 16,
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
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.black,
  },
  eventImageContainer: {
    width: '20%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: 5,
    marginRight: 10,
  },
  eventDateText: {
    textAlign: 'center',
    color: 'white',
  },
});

export default EventsScreen;
