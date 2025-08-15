import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const NotificationContext = createContext();

const NOTIFICATIONS_KEY = 'notifications';

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
  try {
    const json = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    console.log('[NotificationContext] Raw data:', json);
    const stored = json ? JSON.parse(json) : [];
    console.log('[NotificationContext] Parsed notifications:', stored);
    setNotifications(stored);
    const unread = stored.filter(n => !n.read || n.read === 'false').length;
    setUnreadCount(unread);
  } catch (e) {
    console.error('[NotificationContext] Load failed:', e);
  }
};


  const markAsRead = async (notification) => {
  const updated = notifications.map(n =>
    n.id === notification.id ? { ...n, read: true } : n
  );
  setNotifications(updated);
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  const unread = updated.filter(n => !n.read || n.read === 'false').length;
  setUnreadCount(unread);
};

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    setUnreadCount(0);
  };

 const addNotification = async (newNotification, triggerLocalPush = true) => {
  const json = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
  const prev = json ? JSON.parse(json) : [];

  const alreadyExists = prev.find(n => n.message === newNotification.message);
  if (alreadyExists) return;

  const updated = [...prev, newNotification];
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  setNotifications(updated);
  setUnreadCount(updated.filter(n => !n.read).length);

  // ✅ Schedule push notification only if not already sent
  if (triggerLocalPush) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: newNotification.title,
          body: newNotification.message,
          sound: true,
        },
        trigger: null, // Immediately
      });
    } catch (e) {
      console.warn('Failed to schedule notification:', e);
    }
  }
};


  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification, 
      reload: loadNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
