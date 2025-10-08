// import React, { useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Animated,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// const PlanBanner = ({ message, onClose, onUpgrade, storagePlanPrice, storagePlanExpired }) => {
//   const slideAnim = useRef(new Animated.Value(-50)).current;

//   useEffect(() => {
//     if (message) {
//       Animated.spring(slideAnim, {
//         toValue: 0,
//         useNativeDriver: true,
//         tension: 100,
//         friction: 8,
//       }).start();
//     } else {
//       Animated.timing(slideAnim, {
//         toValue: -50,
//         duration: 200,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [message]);

//   if (!message) return null;

//   return (
//     <Animated.View style={[
//       styles.bannerContainer,
//       { transform: [{ translateY: slideAnim }] }
//     ]}>
//       <View style={{ flex: 1 }}>
//         <Text style={styles.bannerText}>{message}</Text>

//         {/* ✅ Show Upgrade button if price > 0.00 and expired */}
//         {storagePlanPrice > '0.00' && storagePlanExpired && (
//           <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
//             <Text style={styles.upgradeText}>Upgrade</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//         <Ionicons name="close" size={20} color="#333" />
//       </TouchableOpacity>
//     </Animated.View>
//   );
// };

// const styles = StyleSheet.create({
//   bannerContainer: {
//     backgroundColor: '#fff3cd',
//     borderLeftWidth: 4,
//     borderLeftColor: '#ffc107',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginHorizontal: 8,
//     marginVertical: 4,
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   bannerText: {
//     color: '#333',
//     fontFamily: 'Nunito700',
//     fontSize: 14,
//     flex: 1,
//     marginRight: 12,
//   },
//   closeButton: {
//     padding: 4,
//     borderRadius: 12,
//     backgroundColor: 'rgba(0,0,0,0.1)',
//   },
//    upgradeButton: {
//     marginTop: 6,
//     backgroundColor: '#007bff',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//     alignSelf: 'flex-start',
//   },
//   upgradeText: {
//     color: '#fff',
//     fontFamily: 'Nunito700',
//     fontSize: 13,
//   },
// });

// export default PlanBanner;

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useTranslation } from 'react-i18next';

const PlanBanner = ({ message, onClose, storagePlanPrice, storagePlanExpired, onUpgrade }) => {
  const slideAnim = useRef(new Animated.Value(-50)).current;

  const { t } = useTranslation();

  useEffect(() => {
    if (message) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerText}>{message}</Text>

        {/* ✅ Show Upgrade button if price > 0.00 and expired */}
        {parseFloat(storagePlanPrice) > 0.0 && storagePlanExpired && (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeText}>{t("flix10k.upgrade")}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={20} color="#333" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bannerText: {
    color: '#333',
    fontFamily: 'Nunito700',
    fontSize: 14,
    marginBottom: 2,
  },
  upgradeButton: {
    //marginTop: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 6,
    alignSelf: 'center',
  },
  upgradeText: {
    color: '#fff',
    fontFamily: 'Nunito700',
    fontSize: 13,
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});

export default PlanBanner;
