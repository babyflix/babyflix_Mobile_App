import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Colors from '../constants/Colors';

const PlanExpiredModal = ({
  visible,
  expiredPlanName,
  onClose,
  onUpgrade,
}) => {
  const { t } = useTranslation();

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeIcon}
          >
            <MaterialIcons name="close" size={24} color="black" />
          </TouchableOpacity>

          <MaterialIcons name="warning" size={48} color={Colors.error} style={styles.warningIcon} />

          <Text style={styles.modalTitle}>
            {t("gallery.noMediaAvailable")}
          </Text>
          <Text style={styles.modalMessage}>
            {t("gallery.planExpiredMessage", { expiredPlanName })}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'ios') {
                  onClose();
                }
               setTimeout(() => {
                if (onUpgrade) onUpgrade(); 
              }, 200);
              }}
              style={styles.upgradeButton}
            >
              <MaterialIcons name="arrow-upward" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.upgradeButtonText}>
                {t("gallery.upgradeNow")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  closeIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    zIndex: 1,
  },
  warningIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    //fontWeight: 'bold',
    fontFamily: 'Nunito700',
    marginBottom: 12,
    textAlign: 'center',
    color: Colors.error,
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Nunito700',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    color: '#555',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 150,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    //fontWeight: 'bold',
    fontFamily: 'Nunito700',
  },
});

export default PlanExpiredModal;