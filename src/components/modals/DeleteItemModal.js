import React, { useState } from 'react';
import { Modal, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { modalStyles as styles } from '../../styles/GlobalStyles';
import { EXPO_PUBLIC_CLOUD_API_URL } from '@env';
import { useDynamicTranslate } from '../../constants/useDynamicTranslate';
import { useTranslation } from 'react-i18next';

const DeleteItemModal = ({ visible, selectedItems, onCancel, onDeleted, fetchMediaData,setSnackbarVisible,setSnackbarMessage,setSnackbarType }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useTranslation();

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

      setSnackbarMessage(t("deleteModal.success", { count: selectedItems.length }));
      setSnackbarType('success');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Delete error:', error);

      setSnackbarMessage(t("deleteModal.error", { count: selectedItems.length }));
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
          <Text style={styles.delModalTitle}>{t("deleteModal.title")}</Text>
          <Text style={[styles.delModalMessage,{marginBottom: 10,}]}>
            {selectedItems.length > 1 ? (
              <>
              {t("deleteModal.singleConfirm")}{' '}
                <Text style={{ fontWeight: 'bold' }}>{selectedItems.length}</Text> {t("deleteModal.items")}
              </>
            ) : (
              <>
                {t("deleteModal.singleConfirm")}{' '}
                <Text style={{ fontWeight: 'bold' }}> {useDynamicTranslate(`${selectedItems[0]?.title || ''}`)}</Text>{' '}
                ({useDynamicTranslate(`${selectedItems[0]?.object_type}`)})?
              </>
            )}
          </Text>
           <Text style={styles.delModalMessage}>
            {t("deleteModal.warning")}    
          </Text>

          {isDeleting ? (
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <ActivityIndicator size="large" color="red" />
              <Text style={{ marginTop: 10, fontSize: 16, color: 'red', fontWeight: '600' }}>{t("deleteModal.deleting")}</Text>
            </View>
          ) : (
            <View style={styles.delModalButtons}>
              <TouchableOpacity onPress={onCancel} style={[styles.delModalButton, { backgroundColor: '#ccc', flexDirection: 'row' }]}>
                <Ionicons name="close-circle" size={20} color="white" style={{ marginRight: 5 }} />
                <Text style={styles.delModalButtonText}>{t("deleteModal.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={[styles.delModalButton, { backgroundColor: 'red', flexDirection: 'row' }]}>
                <MaterialIcons name="delete" size={20} color="white" style={{ marginRight: 5 }} />
                <Text style={styles.delModalButtonText}>{t("deleteModal.delete")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default DeleteItemModal;