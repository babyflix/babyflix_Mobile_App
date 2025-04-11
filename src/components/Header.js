import React, { useState } from 'react';
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
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state) => state.auth);
  const showDropdown = useSelector((state) => state.header.showDropdown);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');

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
          <TouchableOpacity onPress={toggleDropdownHandler} style={styles.profileButton}>
            <Ionicons name="person-circle" size={30} color={Colors.textPrimary} />
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdown}>
              <Text style={styles.dropdownItem}>Hello! {user.firstName + ' ' + user.lastName}</Text>

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  closeDropdownHandler();
                  navigation.navigate('profile', { screen: 'ProfileSettings' });
                }}
              >
                <Ionicons name="settings-outline" size={20} color={Colors.textPrimary} style={styles.icon} />
                <Text>Profile Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownItem}
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
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  profileContainer: {
    position: 'relative',
  },
  profileButton: {
    padding: 5,
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 10,
    width: 150,
    marginTop: 5,
    zIndex: 10,
    elevation: 5,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 10,
    paddingLeft: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  logoutText: {
    color: Colors.error,
  },
});

export default Header;
