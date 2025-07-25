import React, { useState } from 'react';
import { Modal, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { modalStyles as styles } from '../../styles/GlobalStyles';
import { EXPO_PUBLIC_CLOUD_API_URL } from '@env';

const DeleteItemModal = ({ visible, selectedItems, onCancel, onDeleted, fetchMediaData,setSnackbarVisible,setSnackbarMessage,setSnackbarType }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);

      const allMedia = [...selectedItems];

      for (const item of allMedia) {
        const payload = {
          id: item.id,
          object_type: item.object_type,
          object_url: item.object_url,
          user_id: item.user_id,
        };

        await axios.delete(`${EXPO_PUBLIC_CLOUD_API_URL}/delete-contents/`, {
          data: payload,
        });
      }

      onDeleted(); 
      fetchMediaData();

      setSnackbarMessage(`Selected ${selectedItems.length} media deleted successfully!`);
      setSnackbarType('success');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Delete error:', error);

      setSnackbarMessage(`Failed to delete ${selectedItems.length} media. Please try again.`);
      setSnackbarType('error');
      setSnackbarVisible(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.delModalOverlay}>
        <View style={[styles.delModalContainer,{padding: 23}]}>
          <Ionicons name="warning" size={48} color="red" />
          <Text style={styles.delModalTitle}>Delete Selected Media</Text>
          <Text style={[styles.delModalMessage,{marginBottom: 10,}]}>
            {selectedItems.length > 1 ? (
              <>
                Are you sure you want to delete{' '}
                <Text style={{ fontWeight: 'bold' }}>{selectedItems.length}</Text> items?
              </>
            ) : (
              <>
                Are you sure you want to delete{' '}
                <Text style={{ fontWeight: 'bold' }}>{selectedItems[0]?.title}</Text>{' '}
                ({selectedItems[0]?.object_type})?
              </>
            )}
          </Text>
           <Text style={styles.delModalMessage}>
            The deleted item cannot be recovered in the future, it is permanently deleted.    
          </Text>

          {isDeleting ? (
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <ActivityIndicator size="large" color="red" />
              <Text style={{ marginTop: 10, fontSize: 16, color: 'red', fontWeight: '600' }}>Deleting...</Text>
            </View>
          ) : (
            <View style={styles.delModalButtons}>
              <TouchableOpacity onPress={onCancel} style={[styles.delModalButton, { backgroundColor: '#ccc', flexDirection: 'row' }]}>
                <Ionicons name="close-circle" size={20} color="white" style={{ marginRight: 5 }} />
                <Text style={styles.delModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={[styles.delModalButton, { backgroundColor: 'red', flexDirection: 'row' }]}>
                <MaterialIcons name="delete" size={20} color="white" style={{ marginRight: 5 }} />
                <Text style={styles.delModalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default DeleteItemModal;
