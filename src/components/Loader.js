import React from 'react';
import { ActivityIndicator, StyleSheet, View, Platform } from 'react-native';
import Colors from '../constants/Colors';

const Loader = ({ loading }) => {
  if (!loading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  loader: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});

export default Loader;

