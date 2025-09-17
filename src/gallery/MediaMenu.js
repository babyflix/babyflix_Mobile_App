import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const MediaMenu = ({
  item,
  onClose,
  setSelectedItem,
  setShowDeleteModal,
  setShowDownloadModal,
  setShowShareModal,
}) => {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleMenuAction = (action) => {
    setSelectedItem([item]);
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      setTimeout(() => {
        switch (action) {
          case 'delete':
            setShowDeleteModal(true);
            break;
          case 'download':
            setShowDownloadModal(true);
            break;
          case 'share':
            setShowShareModal(true);
            break;
        }
      }, 100);
    });
  };

  return (
    <Animated.View style={[styles.menuPopup, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => handleMenuAction('download')}
      >
        <MaterialIcons name="file-download" size={20} color="#333" style={styles.menuIcon} />
        <Text style={styles.menuText}>{t('gallery.menu.download')}</Text>
      </TouchableOpacity>

      <View style={styles.menuDivider} />

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => handleMenuAction('delete')}
      >
        <MaterialIcons name="delete" size={20} color="#e74c3c" style={styles.menuIcon} />
        <Text style={[styles.menuText, { color: '#e74c3c' }]}>
          {t('gallery.menu.delete')}
        </Text>
      </TouchableOpacity>

      <View style={styles.menuDivider} />

      <TouchableOpacity
        style={styles.menuItem}
        onPress={onClose}
      >
        <MaterialIcons name="close" size={20} color="#666" style={styles.menuIcon} />
        <Text style={[styles.menuText, { color: '#666' }]}>
          {t('gallery.menu.close')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  menuPopup: {
    position: 'absolute',
    top: 35,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
    minWidth: 140,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuText: {
    fontSize: 14,
    fontFamily: 'Nunito400',
    color: '#333',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 8,
  },
});

export default MediaMenu;