import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import Colors from '../../src/constants/Colors';
import { TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';

export default function AppLayout() {
  const { isStreamStarted,streamState } = useSelector((state) => state.stream);

    const [blinkColor, setBlinkColor] = useState("red");
    const [isBlinking, setIsBlinking] = useState(false); 
  
    useEffect(() => {
      let intervalId;
  
      if (isStreamStarted && streamState == 'live') {
        setIsBlinking(true);
        intervalId = setInterval(() => {
          setBlinkColor((prevColor) => (prevColor === "lightgreen" ? "white" : "lightgreen"));
        }, 500); 
      } else {
        setIsBlinking(false);
        setBlinkColor("white");
      }
      return () => clearInterval(intervalId);
    }, [isStreamStarted, streamState]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          borderTopColor: Colors.border,
          paddingTop: 5,
          paddingBottom: 5,
          height: 65,
          backgroundColor: 'white'
        },
      }}
    >
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cloud-upload-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="videocam-outline"
              size={size}
              color={isStreamStarted ? color : Colors.textSecondary}
            />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              disabled={!isStreamStarted && streamState != 'live'} 
              style={[
                props.style,
                {
                  opacity: isStreamStarted ? 1 : 0.3,
                  backgroundColor: blinkColor, 
                  
                },
              ]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
