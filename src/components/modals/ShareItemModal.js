import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { modalStyles as styles } from '../../styles/GlobalStyles';
import Colors from '../../constants/Colors';
import GlobalStyles from '../../styles/GlobalStyles';
import Loader from '../../components/Loader';
import { Video } from 'expo-av';
import { Dimensions } from 'react-native';
import * as Contacts from 'expo-contacts';
//import * as Permissions from 'expo-permissions';
import { EXPO_PUBLIC_API_URL } from '@env';
import axios from 'axios';
const screenWidth = Dimensions.get('window').width;

const ShareItemModal = ({
  visible,
  selectedItems,
  onCancel,
  onShare,
  setSnackbarVisible,
  setSnackbarMessage,
  setSnackbarType,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [mobileModalVisible, setMobileModalVisible] = useState(false);
  const [mobileNumbers, setMobileNumbers] = useState([{ countryCode: '', mobileNumber: '' }]);
  const [mobileErrors, setMobileErrors] = useState('');
  const [showPhoneInfo, setShowPhoneInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [add, setAdd] = useState(false)
  const [contactList, setContactList] = useState([]);
  const [contactPickerVisible, setContactPickerVisible] = useState(false);
  const [selectedContactIndex, setSelectedContactIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [isContactLoading, setIsContactLoading] = useState(false);

useEffect(() => {
  if (searchQuery.trim() === '') {
    setFilteredContacts(contactList);
  } else {
    const lowerQuery = searchQuery.toLowerCase();

    const filtered = contactList
      .filter(contact =>
        contact.name?.toLowerCase().includes(lowerQuery) ||
        contact.phoneNumbers?.some(num => num.number?.replace(/\D/g, '').includes(searchQuery))
      )
      .sort((a, b) => {
        const aName = a.name?.toLowerCase() || '';
        const bName = b.name?.toLowerCase() || '';

        const aStartsWith = aName.startsWith(lowerQuery) ? 0 : 1;
        const bStartsWith = bName.startsWith(lowerQuery) ? 0 : 1;

        if (aStartsWith !== bStartsWith) {
          return aStartsWith - bStartsWith;
        }

        // Optional: fallback sort alphabetically
        return aName.localeCompare(bName);
      });

    setFilteredContacts(filtered);
  }
}, [searchQuery, contactList]);

  const handleConfirmShare = async () => {
    onCancel();
    setMobileModalVisible(true);
  };

  const handleAddMobileRow = () => {
    const hasEmpty = mobileNumbers.some(item => !item.countryCode.trim() || !item.mobileNumber.trim());
    if (hasEmpty) {
      setMobileErrors("Please fill all existing fields before adding a new one.");
      return;
    }
    setAdd(true);

    const seen = new Set();
    for (const item of mobileNumbers) {
      const key = `${item.countryCode}-${item.mobileNumber}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
    }

    setMobileErrors('');
    setMobileNumbers([...mobileNumbers, { countryCode: '', mobileNumber: '' }]);
  };


  const handleRemoveMobileRow = (index) => {
    setAdd(false)
    const updated = [...mobileNumbers];
    updated.splice(index, 1);
    setMobileNumbers(updated);
  };

  const handleUpdateMobileNumber = (index, field, value) => {
    const updated = [...mobileNumbers];
    updated[index][field] = value;
    setMobileNumbers(updated);

    const currentMobile = updated[index].mobileNumber;

    const isDuplicate = updated.some((item, i) => {
      return i !== index &&
        item.mobileNumber &&
        item.mobileNumber === currentMobile;
    });

    if (isDuplicate) {
      setMobileErrors('This mobile number already exists.');
    } else {
      setMobileErrors('');
    }
  };


  const handleShareViaSMS = async () => {
  try {
    setIsLoading(true);

    const invitePayload = {
      inviteType: "mobile",
      data: mobileNumbers.map(item => ({
        countryCode: item.countryCode.replace("+", "").trim(),
        mobileNumber: item.mobileNumber.trim(),
      })),
      message: ``,
      isMediaShare: true,
      mediaItem: selectedItems[0],
    };

    console.log('invitePayload',invitePayload)

    const { status, data } = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/gallery/sendSms`,
      invitePayload
    );

    console.log('SMS response:', data);

    setSnackbarMessage(data?.message || "SMS sent successfully");
    setSnackbarType(status === 200 ? "success" : "error");
    setSnackbarVisible(true);

    setMobileModalVisible(false);
    onShare(); // callback after success
  } catch (error) {
    console.error("Error sending SMS:", error);
    setSnackbarMessage(
      error.response?.data?.message || "Failed to send SMS"
    );
    setSnackbarType("error");
    setSnackbarVisible(true);
  } finally {
    setIsLoading(false);
  }
};

//   const handlePickContact = async (index) => {
//   const { status } = await Contacts.requestPermissionsAsync();
//   if (status === 'granted') {
//     const { data } = await Contacts.getContactsAsync({
//       fields: [Contacts.Fields.PhoneNumbers],
//     });

//     if (data.length > 0) {
//       // Optional: Open a modal/list to let the user choose a contact.
//       const contact = data.find(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0);

//       if (contact) {
//         const number = contact.phoneNumbers[0].number.replace(/\s|-/g, ''); // clean format
//         const updated = [...mobileNumbers];
//         updated[index].mobileNumber = number;
//         setMobileNumbers(updated);
//       } else {
//         setSnackbarMessage('No valid phone number found in contact');
//         setSnackbarType('error');
//         setSnackbarVisible(true);
//       }
//     }
//   } else {
//     setSnackbarMessage('Permission to access contacts was denied');
//     setSnackbarType('error');
//     setSnackbarVisible(true);
//   }
// };

// const handlePickContact = async (index) => {
//   const { status } = await Contacts.requestPermissionsAsync();
//   if (status === 'granted') {
//     const { data } = await Contacts.getContactsAsync({
//       fields: [Contacts.Fields.PhoneNumbers],
//     });

//     const contactsWithPhones = data.filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0);
    
//     setContactList(contactsWithPhones);
//     setSelectedContactIndex(index);
//     setContactPickerVisible(true);
//   } else {
//     setSnackbarMessage('Permission to access contacts was denied');
//     setSnackbarType('error');
//     setSnackbarVisible(true);
//   }
// };

const handlePickContact = async (index) => {
  setIsContactLoading(true);
  setSelectedContactIndex(index);
  setContactPickerVisible(true); // Show modal immediately

  const { status } = await Contacts.requestPermissionsAsync();
  if (status === 'granted') {
    // Optional: Show a loading indicator inside modal here

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    const contactsWithPhones = data.filter(
      contact => contact.phoneNumbers && contact.phoneNumbers.length > 0
    );

    setContactList(contactsWithPhones);
  } else {
    setSnackbarMessage('Permission to access contacts was denied');
    setSnackbarType('error');
    setSnackbarVisible(true);
    setContactPickerVisible(false); // Hide modal if permission denied
  }
   setIsContactLoading(false);
};

  return (
    <>
      {/* <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <View style={styles.delModalOverlay}>
          <View style={styles.delModalContainer}>
            <MaterialIcons name="share" size={48} color={Colors.primary} />
            <Text style={styles.delModalTitle}>Share Selected Media</Text>
            {selectedItems.length === 1 ? (
              <Text style={styles.delModalMessage}>
                Are you sure you want to share{' '}
                <Text style={{ fontWeight: 'bold' }}>{selectedItems[0]?.title}</Text>{' '}
                ({selectedItems[0]?.object_type})?
              </Text>
            ) : (
              <Text style={styles.delModalMessage}>
                Are you sure you want to share{' '}
                <Text style={{ fontWeight: 'bold' }}>{selectedItems.length}</Text> selected items?
              </Text>
            )}

            {isSharing ? (
              <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <ActivityIndicator size="large" color="blue" />
                <Text style={{ marginTop: 10, fontSize: 16, color: 'blue', fontWeight: '600' }}>Sharing...</Text>
              </View>
            ) : (
              <View style={styles.delModalButtons}>
                <TouchableOpacity onPress={onCancel} style={[styles.delModalButton, { backgroundColor: '#ccc', flexDirection: 'row' }]}>
                  <Ionicons name="close-circle" size={20} color="white" style={{ marginRight: 5 }} />
                  <Text style={styles.delModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmShare} style={[styles.delModalButton, { backgroundColor: Colors.primary, flexDirection: 'row' }]}>
                  <MaterialIcons name="share" size={20} color="white" style={{ marginRight: 5 }} />
                  <Text style={styles.delModalButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal> */}

  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
  <View style={styles.delModalOverlay}>
    <View style={styles.delModalContainer}>
      <MaterialIcons name="share" size={48} color={Colors.primary} />
      <Text style={styles.delModalTitle}>Share Selected Media</Text>

      {selectedItems.length === 1 ? (
        <>
          <Text style={styles.delModalMessage}>
            Are you sure you want to share{' '}
            <Text style={{ fontWeight: 'bold' }}>{selectedItems[0]?.title}</Text>{' '}
            ({selectedItems[0]?.object_type})?
          </Text>

          {/* ✅ Preview Section */}
          <View style={{ marginVertical: 10 }}>
            <Text style={[styles.modalTitle, { fontSize: 18, marginBottom: 10, textAlign:'center' }]}>Preview</Text>
            <View
              style={styles.preview}
            >
              {selectedItems[0]?.object_type === 'video' ? (
                <Video
                  source={{ uri: selectedItems[0]?.object_url }}
                  rate={1.0}
                  volume={1.0}
                  isMuted={false}
                  //resizeMode="cover"
                  resizeMode="contain"
                  shouldPlay={true}
                  isLooping={false}
                  useNativeControls
                  style={styles.previewImages}
                />
              ) : (
                <Image
                  source={{ uri: selectedItems[0]?.object_url }}
                  style={styles.previewImages}
                  //resizeMode="cover"
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.delModalMessage}>
          Are you sure you want to share{' '}
          <Text style={{ fontWeight: 'bold' }}>{selectedItems.length}</Text> selected items?
        </Text>
      )}

      {isSharing ? (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <ActivityIndicator size="large" color="blue" />
          <Text style={{ marginTop: 10, fontSize: 16, color: 'blue', fontWeight: '600' }}>
            Sharing...
          </Text>
        </View>
      ) : (
        <View style={styles.delModalButtons}>
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.delModalButton, { backgroundColor: '#ccc', flexDirection: 'row' }]}
          >
            <Ionicons name="close-circle" size={20} color="white" style={{ marginRight: 5 }} />
            <Text style={styles.delModalButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirmShare}
            style={[styles.delModalButton, { backgroundColor: Colors.primary, flexDirection: 'row' }]}
          >
            <MaterialIcons name="share" size={20} color="white" style={{ marginRight: 5 }} />
            <Text style={styles.delModalButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  </View>
</Modal>

      {mobileModalVisible && (
        <Modal transparent={true} visible={mobileModalVisible} onRequestClose={() => setMobileModalVisible(false)}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Share Media Via SMS</Text>

                <View style={styles.messageBox}>
                  <Text>Media titled "{selectedItems[0]?.title}" will be shared via SMS.</Text>
                </View>

                <Text style={styles.listTitle}>Enter Mobile Number</Text>
                <ScrollView>
                  {mobileNumbers.map((item, index) => (
                    <View key={index} style={styles.mobileInputRow}>
                      <TextInput
                        style={styles.countryCodeInput}
                        placeholder="+1"
                        value={item.countryCode}
                        onChangeText={(text) => handleUpdateMobileNumber(index, "countryCode", text)}
                        keyboardType="phone-pad"
                        maxLength={4}
                      />
                      <View style={{ flex: 1 }}>
                        <Ionicons name="call" size={20} color={Colors.gray} style={{ position: 'absolute', left: '6%', top: '50%', transform: [{ translateY: -10 }] }} />
                        <TextInput
                          style={styles.mobileInput}
                          placeholder="Mobile Number"
                          value={item.mobileNumber}
                          onChangeText={(text) => handleUpdateMobileNumber(index, "mobileNumber", text)}
                          keyboardType="phone-pad"
                          maxLength={10}
                          onFocus={() => setShowPhoneInfo(true)}
                        />
                         <TouchableOpacity onPress={() => handlePickContact(index)} style={{ position: 'absolute',  right: add ? '6%' : '18%', top: '50%', transform: [{ translateY: -10 }] }}>
                         <MaterialIcons name="contact-page" size={24} color={Colors.gray} />
                        </TouchableOpacity>
                      </View>
                      {mobileNumbers.length > 1 && (
                        <TouchableOpacity onPress={() => handleRemoveMobileRow(index)}>
                          <Ionicons name="remove-circle-outline" size={24} color="red" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  {mobileErrors && <Text style={styles.errorText}>{mobileErrors}</Text>}
                  {showPhoneInfo && (
                    <View style={{ backgroundColor: 'lightyellow', padding: 8, borderRadius: 5, marginTop: 5 }}>
                      <Text style={{ fontSize: 12, color: 'black' }}>
                        This number will only be used to send the media invite via SMS.
                      </Text>
                    </View>
                  )}
                </ScrollView>

                <TouchableOpacity style={styles.addMoreButton} onPress={handleAddMobileRow}>
                  <Ionicons name="add-circle" size={24} color={Colors.primary} />
                  <Text style={styles.addMoreText}>Add More</Text>
                </TouchableOpacity>

                <View style={[GlobalStyles.row, { marginVertical: 15 }]}>
                  <TouchableOpacity style={[GlobalStyles.resetButton, GlobalStyles.allMarginRight]} onPress={() => setMobileModalVisible(false)}>
                    <Ionicons name="refresh" size={20} color={Colors.black} style={{ marginRight: 5 }} />
                    <Text style={[GlobalStyles.buttonText, { color: Colors.black }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[GlobalStyles.registerButton, GlobalStyles.allMarginLeft]} onPress={handleShareViaSMS}>
                    <Ionicons name="send-outline" size={20} color={Colors.white} style={{ marginRight: 5 }} />
                    <Text style={GlobalStyles.buttonText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>

          {isLoading && <Loader loading={true} />}
          {/* <Snackbar
            visible={snackbarVisible}
            message={snackbarMessage}
            type={snackbarType}
            onDismiss={() => setSnackbarVisible(false)}
          /> */}
        </Modal>
      )}

      {/* {contactPickerVisible && (
  <Modal visible={contactPickerVisible} transparent animationType="slide">
    <TouchableWithoutFeedback onPress={() => setContactPickerVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: '60%' }]}>
          <Text style={styles.modalTitle}>Select a Contact</Text>
          <ScrollView>
            {contactList.map((contact, i) => (
              <TouchableOpacity
                key={i}
                style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' }}
                // onPress={() => {
                //   const selectedNumber = contact.phoneNumbers[0]?.number?.replace(/[\s\-\(\)]+/g, '');
                //   const updated = [...mobileNumbers];
                //   updated[selectedContactIndex].mobileNumber = selectedNumber;
                //   setMobileNumbers(updated);
                //   setContactPickerVisible(false);
                // }}
                onPress={() => {
                const rawNumber = contact.phoneNumbers[0]?.number?.replace(/[\s\-\(\)]+/g, '').trim();

                let countryCode = '';
                let mobileNumber = '';

                if (rawNumber) {
                  const digitsOnly = rawNumber.replace(/\D/g, ''); // remove all non-digits
                  const totalLength = digitsOnly.length;

                  if (totalLength > 10) {
                    mobileNumber = digitsOnly.slice(-10);                      // Last 10 digits
                    countryCode = digitsOnly.slice(0, totalLength - 10);       // All before that — digits only
                  } else {
                    mobileNumber = digitsOnly;
                  }
                }

                const updated = [...mobileNumbers];
                updated[selectedContactIndex] = {
                  countryCode,    // will be like '91', '1', '44' — without +
                  mobileNumber,   // clean 10-digit number
                };
                setMobileNumbers(updated);
                setContactPickerVisible(false);
              }}
              >
                <Text style={{ fontWeight: 'bold' }}>{contact.name}</Text>
                <Text style={{ color: 'gray' }}>{contact.phoneNumbers[0]?.number}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
)} */}

{contactPickerVisible && (
  <Modal visible={contactPickerVisible} transparent animationType="slide">
    <TouchableWithoutFeedback onPress={() => setContactPickerVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: '70%', backgroundColor: 'white', borderRadius: 12, padding: 16 }]}>
          <Text style={styles.modalTitle}>Select a Contact</Text>

          {/* Search Bar */}
          <TextInput
            placeholder="Search by name or number"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderColor: '#ccc',
              borderWidth: 1,
              borderRadius: 8,
              marginBottom: 10,
              fontSize: 16,
            }}
          />
          
          {isContactLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#000" />
              <Text>Loading contacts...</Text>
            </View>
          ) : (
          <ScrollView>
            {filteredContacts.map((contact, i) => (
              <TouchableOpacity
                key={i}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  borderBottomWidth: 1,
                  borderColor: '#eee',
                }}
                onPress={() => {
                  const rawNumber = contact.phoneNumbers[0]?.number?.replace(/[\s\-\(\)]+/g, '').trim();
                  let countryCode = '';
                  let mobileNumber = '';

                  if (rawNumber) {
                    const digitsOnly = rawNumber.replace(/\D/g, '');
                    const totalLength = digitsOnly.length;

                    if (totalLength > 10) {
                      mobileNumber = digitsOnly.slice(-10);
                      countryCode = digitsOnly.slice(0, totalLength - 10);
                    } else {
                      mobileNumber = digitsOnly;
                    }
                  }

                  const updated = [...mobileNumbers];
                  updated[selectedContactIndex] = {
                    countryCode,
                    mobileNumber,
                  };
                  setMobileNumbers(updated);
                  setContactPickerVisible(false);
                }}
              >
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{contact.name}</Text>
                <Text style={{ color: '#666', fontSize: 14 }}>{contact.phoneNumbers[0]?.number}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
)}

    </>
  );
};

export default ShareItemModal;
