import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, Platform } from 'react-native';
import Colors from '../constants/Colors';

const Snackbar = ({ visible, message, type = 'success', onDismiss }) => {
  const translateY = new Animated.Value(100);

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(translateY, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] },
        type === 'error' ? styles.errorContainer : styles.successContainer,
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.select({ ios: 40, android: 40 }),
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  successContainer: {
    backgroundColor: Colors.success,
  },
  errorContainer: {
    backgroundColor: Colors.error,
  },
  message: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Snackbar;