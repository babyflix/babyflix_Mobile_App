import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Progress from 'react-native-progress';
import Colors from '../constants/Colors';
import { useTranslation } from 'react-i18next';

const FloatingDownloadBar = ({ visible, progress, title, activeDownloads }) => {
  const { t } = useTranslation();
  if (!visible) return null;
  if (activeDownloads == 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.downloadingText}>
          {activeDownloads} {activeDownloads <= 1 ? t('floatingDownloadBar.item') : t('floatingDownloadBar.items')} {t('floatingDownloadBar.downloading')}
        </Text>

        <Progress.Bar
          progress={progress}
          width={120}
          height={8}
          color={Colors.primary}
          unfilledColor="#ccc"
          borderWidth={0}
          borderRadius={4}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  inner: {
    alignItems: 'center',
  },
  downloadingText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 5,
    color: Colors.primary,
  },
  label: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default FloatingDownloadBar;
