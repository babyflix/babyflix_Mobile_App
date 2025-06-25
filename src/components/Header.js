import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Colors from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { logout } from '../state/slices/authSlice';
import babyflixLogo from '../../assets/BBF_logo.jpg';
import { toggleDropdown, closeDropdown } from '../state/slices/headerSlice';
import { EXPO_PUBLIC_API_URL } from '@env';
import { clearOpenStorage2, setForceOpenStorageModals, triggerOpenStorage2 } from '../state/slices/storageUISlice';
import StorageModals from './StorageModals';

const Header = ({ title, showMenu = true, showProfile = true }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPlanModalVisible, setPlanModalVisible] = useState(false);
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState([]);
  const [showModal, setShowModal] = useState(false); 

  const navigation = useNavigation();
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state) => state.auth);
  const showDropdown = useSelector((state) => state.header.showDropdown);
  const unreadMessagesCount = useSelector((state) => state.header.unreadMessagesCount);
  const storagePlan = useSelector(state => state.storagePlan)

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

    useEffect(() => {
      if (plans.length > 0) {
        const planToShow = plans.find(
          (plan) => plan.id ===  storagePlan.storagePlanId
        );
        setCurrentPlan(planToShow);
      }
    }, [plans, storagePlan.storagePlanId]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
  
      await AsyncStorage.multiRemove(['storage_modal_triggered', 'payment_status', 'payment_status 1']);

      dispatch(clearOpenStorage2());
      dispatch(setForceOpenStorageModals(false));
      dispatch(closeDropdown());
      dispatch(logout());

      setTimeout(() => {
        router.replace('login');
      }, 100);

    } catch (error) {
    }
  };

  const toggleDropdownHandler = () => {
    dispatch(toggleDropdown());
  };

  const closeDropdownHandler = () => {
    dispatch(closeDropdown());
  };

  const handleChangeClick = async () => {
    dispatch(triggerOpenStorage2());
    await AsyncStorage.setItem('storage_modal_triggered', 'false');
    router.push('/gallery?showStorageModal=true');
  };

  const handleChooseClick = async () => {
    dispatch(triggerOpenStorage2()); 
    await AsyncStorage.setItem('storage_modal_triggered', 'false');
  };

  return (
    <View style={styles.header}>
      <View style={{ alignItems: 'center' }}>
        <Image source={babyflixLogo} style={{ width: 36, height: 35, margintop: 50 }} />
      </View>

      <Text style={styles.title}>{title}</Text>

      {showProfile && (
        <View style={styles.profileContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.messageButton} onPress={() => router.push('/messages')}>
              <Ionicons name="chatbubble-ellipses-outline" size={28} color={Colors.textPrimary} />
              <View style={styles.messageBadge}>
                <Text style={styles.badgeText}>{unreadMessagesCount}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleDropdownHandler} style={styles.profileButton}>
              <Ionicons name="person-circle" size={30} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {showDropdown && (
            <View style={styles.dropdown}>
            <Text style={styles.dropdownItemFirst}>
              👋 Hello! {user.firstName + ' ' + user.lastName}
            </Text>
          
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                closeDropdownHandler();
                navigation.navigate('profile', { screen: 'ProfileSettings' });
              }}
            >
              <Ionicons name="settings-outline" size={20} color={Colors.textPrimary} style={styles.icon} />
              <Text style={{ fontFamily: 'Poppins_400Regular', marginTop: 4 }}>Profile Settings</Text>
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
                <Text style={{ fontFamily: 'Poppins_400Regular', marginTop: 4 }}>
                  Storage Plan
                </Text>
              ) : (
                <Text style={{ fontFamily: 'Poppins_400Regular', marginTop: 4 }}>
                  No plan selected
                </Text>
              )}

            </TouchableOpacity>
          
            <TouchableOpacity
              style={[styles.dropdownItem, styles.dropdownItemLast]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.error} style={styles.icon} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>          
          )}
        </View>
      )}
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
          <Text style={styles.planTitle}>{currentPlan.name}</Text>
          <Text style={styles.planSubtitle}>
            ₹{currentPlan.price_per_month} / Year • {currentPlan.storage_limit_gb} GB
          </Text>

          <View style={styles.separator} />

          <Text style={styles.featureTitle}>Features</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={18} color="green" />
            <Text style={styles.featureText}>{currentPlan.description}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleChangeClick}>
              <Ionicons name="pencil" size={16} color="blue" />
              <Text style={[styles.actionText, { color: 'blue' }]}>Change</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="trash" size={16} color="red" />
              <Text style={[styles.actionText, { color: 'red' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.planTitle}>No Plan Selected</Text>
          <Text style={styles.planSubtitle}>You haven't chosen any storage plan yet.</Text>

          <View style={styles.separator} />

          <Text style={styles.featureText}>To store files and media, please choose a plan.</Text>

          <View style={[styles.actionRow, { justifyContent: 'center' }]}>
            <TouchableOpacity style={styles.chooseButton} onPress={handleChooseClick}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.chooseButtonText}>Choose Plan</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
          </View>
        </View>
      </Modal>
      {/* {showModal && <StorageModals />} */}

{/* <View style={styles.planCard}>
  <TouchableOpacity onPress={() => setPlanModalVisible(false)} style={styles.closeIcon}>
    <Ionicons name="close" size={24} color="#333" />
  </TouchableOpacity>

  {currentPlan ? (
    <>
      <Text style={styles.planTitle}>{currentPlan.name}</Text>
      <Text style={styles.planSubtitle}>
        ₹{currentPlan.price_per_month} / Year • {currentPlan.storage_limit_gb} GB
      </Text>

      <View style={styles.separator} />

      <Text style={styles.featureTitle}>Features</Text>
      <View style={styles.featureItem}>
        <Ionicons name="checkmark-circle" size={18} color="green" />
        <Text style={styles.featureText}>{currentPlan.description}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="pencil" size={16} color="blue" />
          <Text style={[styles.actionText, { color: 'blue' }]}>Change</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="trash" size={16} color="red" />
          <Text style={[styles.actionText, { color: 'red' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </>
  ) : (
    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14 }}>
      No plan details found.
    </Text>
  )}
</View> */}


    </View>
    
  );
};

const styles = StyleSheet.create({
  header: {
    height: Platform.OS === 'ios' ? 88 : 56,
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 999,
  },
  title: {
    fontSize: 20,
    fontFamily:'Poppins_700Bold',
    color: Colors.textPrimary,
    paddingLeft:45
  },
  profileContainer: {
    position: 'relative',
    overflow: 'visible', 
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
    width: 220,
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
    fontFamily: 'Poppins_400Regular',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  
  dropdownItemFirst: {
    fontFamily: 'Poppins_600SemiBold',
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
    fontFamily: 'Poppins_400Regular',
  },
    
  messageButton: {
    marginRight: 10,
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
    fontSize: 10,
    fontWeight: 'bold',
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
  fontFamily: 'Poppins_700Bold',
  marginBottom: 10,
  color: Colors.textPrimary,
},
modalText: {
  fontSize: 14,
  fontFamily: 'Poppins_400Regular',
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
  fontFamily: 'Poppins_600SemiBold',
},
planCard: {
  width: 300,
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 20,
  alignItems: 'flex-start',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 10,
},
planTitle: {
  fontSize: 18,
  fontFamily: 'Poppins_700Bold',
  color: Colors.textPrimary,
  marginBottom: 4,
},
planSubtitle: {
  fontSize: 13,
  fontFamily: 'Poppins_400Regular',
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
  fontFamily: 'Poppins_600SemiBold',
  marginBottom: 6,
},
featureItem: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginBottom: 12,
},
featureText: {
  marginLeft: 8,
  marginRight: 8,
  fontFamily: 'Poppins_400Regular',
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
  fontFamily: 'Poppins_500Medium',
  fontSize: 13,
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
  fontFamily: 'Poppins_600SemiBold',
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
  fontWeight: '600',
  fontSize: 14,
},
});

export default Header;
