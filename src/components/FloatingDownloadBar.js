// // components/FloatingDownloadBar.js
// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import * as Progress from 'react-native-progress';
// import Colors from '../constants/Colors';

// const FloatingDownloadBar = ({ progress, visible }) => {
//   if (!visible) return null;

//   return (
//     <View style={styles.container}>
//       <Progress.Bar
//         progress={progress}
//         width={150}
//         height={8}
//         color={Colors.primary}
//         unfilledColor="#ccc"
//         borderWidth={0}
//         borderRadius={4}
//       />
//       <Text style={styles.label}>{Math.round(progress * 100)}%</Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: 'absolute',
//     bottom: 15,
//     left: 15,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#ffffffee',
//     borderRadius: 8,
//     padding: 8,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//   },
//   label: {
//     marginLeft: 8,
//     fontSize: 14,
//     fontWeight: '500',
//   },
// });

// export default FloatingDownloadBar;


// components/FloatingDownloadBar.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Progress from 'react-native-progress';
import Colors from '../constants/Colors';

const FloatingDownloadBar = ({ visible, progress, title , activeDownloads}) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.downloadingText}>
          {activeDownloads} {activeDownloads <= 1 ? 'item' : 'items'} Downloading...
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
        {/* <Text style={styles.label}>
          {Math.round(progress * 100)}% Downloaded
        </Text> */}
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
