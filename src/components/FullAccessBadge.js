import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Colors from '../constants/Colors';

const FullAccessBadge = ({ hasFullAccess, onPressUnlock }) => {
  const { t } = useTranslation();

  if (hasFullAccess) {
    return (
      <View style={[styles.badge, styles.badgeGranted]}>
        <MaterialIcons name="verified" size={20} color={Colors.success} />
        <Text style={styles.badgeText}>
          {t(
            'oneTimePayment.fullAccessBadge',
            'Full Access — all BabyFlix premium services unlocked'
          )}
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity style={[styles.badge, styles.badgePending]} onPress={onPressUnlock}>
      <MaterialIcons name="lock-open" size={20} color={Colors.primary} />
      <Text style={[styles.badgeText, { color: Colors.primary }]}>
        {t('oneTimePayment.unlockPrompt', 'Complete your one-time payment to unlock full access')}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
  },
  badgeGranted: {
    backgroundColor: '#E8F5E9',
  },
  badgePending: {
    backgroundColor: '#F5E9F2',
  },
  badgeText: {
    fontSize: 13,
    fontFamily: 'Nunito700',
    color: Colors.success,
    marginLeft: 10,
    flex: 1,
  },
});

export default FullAccessBadge;
