import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { modalStyles as styles } from '../../styles/GlobalStyles';
import { EXPO_PUBLIC_CLOUD_API_URL } from '@env';
import { useDynamicTranslate } from '../../constants/useDynamicTranslate';
import { useTranslation } from 'react-i18next';
import Colors from '../../constants/Colors';
import sendDeviceUserInfo, { USERACTIONS } from '../deviceInfo';

const DeleteItemModal = ({ visible, selectedItems, onCancel, onDeleted, fetchMediaData, setSnackbarVisible, setSnackbarMessage, setSnackbarType }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [mediaData, setMediaData] = useState({ convertedTitle: [], convertedType: [] });
  const { t } = useTranslation();

  const titles = useMemo(() => selectedItems?.map(item => item.title) || [], [selectedItems]);
  const types = useMemo(() => selectedItems?.map(item => item.object_type) || [], [selectedItems]);

  useEffect(() => {
    const handleSelectedItems = async () => {
      const convertedTitle = await Promise.all(
        titles.map(title => useDynamicTranslate(title))
      );
      const convertedType = await Promise.all(
        types.map(type => useDynamicTranslate(type))
      );

      setMediaData({ convertedTitle, convertedType });
    };

    if (titles.length || types.length) {
      handleSelectedItems();
    }
  }, [titles, types]);

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

        if (item.object_type === "predictiveBabyImage") {
        sendDeviceUserInfo({
          action_type: USERACTIONS.FLIX10KDELETE,
          action_description: `User deleted predictiveBabyImage is ${item}`,
        });
         console.log('Deleted item of predictiveBabyImage:', item);
      }else{
        sendDeviceUserInfo({
          action_type: USERACTIONS.DELETE,
          action_description: `User deleted image is ${item}`,
        });
         console.log('Deleted item of image:', item);
      }
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
        <View style={[styles.delModalContainer, { padding: 23 }]}>
          <Ionicons name="warning" size={48} color="#fa3f3fff" />
          <Text style={styles.delModalTitle}>{t("deleteModal.title")}</Text>
          <Text style={[styles.delModalMessage, { marginBottom: 10, }]}>
            {selectedItems.length > 1 ? (
              <>
                {t("deleteModal.singleConfirm")}{' '}
                <Text style={{ fontWeight: 'bold' }}>{selectedItems.length}</Text> {t("deleteModal.items")}
              </>
            ) : (
              <>
                {t("deleteModal.singleConfirm")}{' '}
                <Text style={{ fontWeight: 'bold' }}> {mediaData.convertedTitle.join(", ")}</Text>{' '}
                {mediaData.convertedType.join(", ")}?
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
              <TouchableOpacity onPress={onCancel} style={[styles.delModalButton, { backgroundColor: 'white', borderWidth: 1, borderColor: Colors.primary, flexDirection: 'row' }]}>
                <Ionicons name="close-circle" size={20} color={Colors.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.delModalButtonText, { color: Colors.primary }]}>{t("deleteModal.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={[styles.delModalButton, { backgroundColor: '#fa3f3fff', flexDirection: 'row' }]}>
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