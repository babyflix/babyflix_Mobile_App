import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Colors from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { logout } from '../state/slices/authSlice';
import babyflixLogo from '../../assets/BBF_logo.jpg';
import { toggleDropdown, closeDropdown } from '../state/slices/headerSlice';

const Header = ({ title, showMenu = true, showProfile = true }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state) => state.auth);
  const showDropdown = useSelector((state) => state.header.showDropdown);
  const unreadMessagesCount = useSelector((state) => state.header.unreadMessagesCount);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
  
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
});

export default Header;
