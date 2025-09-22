// import { Tabs } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { useSelector } from 'react-redux';
// import Colors from '../../src/constants/Colors';
// import { TouchableOpacity } from 'react-native';
// import { useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';

// export default function AppLayout() {
//   const { isStreamStarted,streamState } = useSelector((state) => state.stream);

//     const [blinkColor, setBlinkColor] = useState("red");
//     const [isBlinking, setIsBlinking] = useState(false); 
//     const { t } = useTranslation();
  
//     useEffect(() => {
//       let intervalId;
  
//       if (isStreamStarted && streamState == 'live') {
//         setIsBlinking(true);
//         intervalId = setInterval(() => {
//           setBlinkColor((prevColor) => (prevColor === "lightgreen" ? "white" : "lightgreen"));
//         }, 500); 
//       } else {
//         setIsBlinking(false);
//         setBlinkColor("white");
//       }
//       return () => clearInterval(intervalId);
//     }, [isStreamStarted, streamState]);

//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarHideOnKeyboard: true,
//         tabBarActiveTintColor: Colors.primary,
//         tabBarInactiveTintColor: Colors.textSecondary,
//         tabBarStyle: {
//           position: 'absolute',
//           borderTopColor: Colors.border,
//           paddingTop: 5,
//           paddingBottom: 5,
//           height: 65,
//           backgroundColor: 'white',
//           //fontfamily: "Nunito700",
//         },
//         tabBarLabelStyle: {
//           fontFamily: "Nunito700", 
//           //fontSize: 13,            
//         },
//       }}
//     >
//       <Tabs.Screen
//         name="gallery"
//         options={{
//           title: t("gallery.header"),
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="images-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="upload"
//         options={{
//           title: t("upload.header"),
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="cloud-upload-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="events"
//         options={{
//           title: t('eventsScreen.title'),
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="calendar-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="live"
//         options={{
//           title: t('liveStreaming.label'),
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons
//               name="videocam-outline"
//               size={size}
//               color={isStreamStarted ? color : Colors.textSecondary}
//             />
//           ),
//           tabBarButton: (props) => (
//             <TouchableOpacity
//               {...props}
//               disabled={!isStreamStarted && streamState != 'live'} 
//               style={[
//                 props.style,
//                 {
//                   opacity: isStreamStarted ? 1 : 0.3,
//                   backgroundColor: blinkColor, 
                  
//                 },
//               ]}
//             />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="messages"
//         options={{
//           title: t('messagesScreen.header'),
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="chatbubbles-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: t('profileSettings.label'),
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="person-circle" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }

import { Tabs } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import Colors from '../../src/constants/Colors';
import { TouchableOpacity, Animated, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function AppLayout() {
  const { isStreamStarted, streamState } = useSelector((state) => state.stream);
  const { t } = useTranslation();

  // Animated value for smooth pulsing effect on live tab
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isStreamStarted && streamState === 'live') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isStreamStarted, streamState]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          borderTopColor: Colors.border,
          paddingTop: 5,
          paddingBottom: 5,
          height: 65,
          backgroundColor: '#f9f9f9', // Light grey background
        },
        tabBarLabelStyle: {
          fontFamily: 'Nunito700',
        },
      }}
    >
      <Tabs.Screen
        name="gallery"
        options={{
          title: t('gallery.header'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="photo-library" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: t('upload.header'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="cloud-upload" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: t('eventsScreen.title'),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="calendar-alt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: t('liveStreaming.label'),
          tabBarIcon: ({ color, size }) => (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons
                name="videocam"
                size={size}
                color={isStreamStarted ? Colors.red : Colors.textSecondary}
              />
            </Animated.View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              disabled={!isStreamStarted || streamState !== 'live'}
              style={[props.style, { opacity: isStreamStarted ? 1 : 0.3 }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('messagesScreen.header'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profileSettings.label'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
