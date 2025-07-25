import React, { useState } from 'react';
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


  const handleShareViaSMS = () => {
    setIsLoading(true);
    setTimeout(() => {
      setSnackbarMessage(`Shared successfully via SMS`);
      setSnackbarType('success');
      setSnackbarVisible(true);
      onShare();
      setIsLoading(false);
      setMobileModalVisible(false);
      onCancel();
    }, 2000);
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

    </>
  );
};

export default ShareItemModal;
