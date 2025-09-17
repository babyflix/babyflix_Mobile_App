import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const SelectionBar = ({
  visible,
  onCancel,
  onDownload,
  onShare,
  onDelete,
  flix10kSelectionMode,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!flix10kSelectionMode && visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible,flix10kSelectionMode]);

  if (!visible) return null;
  if (flix10kSelectionMode) return null; 

  return (
    <Animated.View style={[
      styles.selectionHeader,
      { transform: [{ translateY: slideAnim }] }
    ]}>
      <TouchableOpacity onPress={onCancel} style={styles.actionButton}>
        <Ionicons name="close" size={24} color="#333" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onDownload} style={styles.actionButton}>
        <MaterialIcons name="file-download" size={24} color="#333" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
        <MaterialIcons name="delete" size={24} color="#e74c3c" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SelectionBar;