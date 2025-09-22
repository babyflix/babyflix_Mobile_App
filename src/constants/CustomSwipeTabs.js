// import React, { useRef, useState } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Dimensions,
// } from "react-native";
// import Animated, {
//   useAnimatedStyle,
//   useSharedValue,
//   withTiming,
// } from "react-native-reanimated";
// import { PanGestureHandler } from "react-native-gesture-handler";
// import { Ionicons } from "@expo/vector-icons";
// import Colors from "../constants/Colors";

// const { width } = Dimensions.get("window");

// const CustomSwipeTabs = ({ tabs, initialIndex = 0 }) => {
//   const [activeTab, setActiveTab] = useState(initialIndex);
//   const translateX = useSharedValue(-width * initialIndex);

//   const onTabPress = (index) => {
//     setActiveTab(index);
//     translateX.value = withTiming(-width * index, { duration: 250 });
//   };

//   const animatedStyle = useAnimatedStyle(() => ({
//     transform: [{ translateX: translateX.value }],
//   }));

//   const onGestureEvent = (event) => {
//     const { translationX, velocityX, state } = event.nativeEvent;
//     if (Math.abs(translationX) > 50) {
//       if (translationX < 0 && activeTab < tabs.length - 1) {
//         onTabPress(activeTab + 1);
//       } else if (translationX > 0 && activeTab > 0) {
//         onTabPress(activeTab - 1);
//       }
//     }
//   };

//   return (
//     <View style={{ flex: 1 }}>
//       {/* Tabs Header */}
//       <View style={styles.tabContainer}>
//         {tabs.map((tab, index) => (
//           <TouchableOpacity
//             key={index}
//             style={[styles.tabButton, activeTab === index && styles.activeTab]}
//             onPress={() => onTabPress(index)}
//           >
//             <Ionicons
//               name={tab.icon}
//               size={20}
//               color={activeTab === index ? Colors.primary : Colors.gray}
//             />
//             <Text
//               style={[
//                 styles.tabLabel,
//                 activeTab === index && { color: Colors.primary },
//               ]}
//             >
//               {tab.label}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Tabs Content with swipe */}
//       <PanGestureHandler onGestureEvent={onGestureEvent}>
//         <Animated.View style={[styles.contentContainer, animatedStyle]}>
//           {tabs.map((tab, index) => (
//             <View key={index} style={{ width, flex: 1 }}>
//               {tab.component}
//             </View>
//           ))}
//         </Animated.View>
//       </PanGestureHandler>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   tabContainer: {
//     flexDirection: "row",
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.lightGray,
//   },
//   tabButton: {
//     flex: 1,
//     paddingVertical: 12,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   activeTab: {
//     borderBottomWidth: 3,
//     borderBottomColor: Colors.primary,
//   },
//   tabLabel: {
//     marginLeft: 6,
//     fontFamily: "Nunito700",
//     fontSize: 16,
//     color: Colors.gray,
//   },
//   contentContainer: {
//     flexDirection: "row",
//     width: width * 2, // max 2 tabs, adjust if dynamic
//     flex: 1,
//   },
// });

// export default CustomSwipeTabs;

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { useFocusEffect } from "expo-router";
import { setSubscriptionExpired } from "../state/slices/subscriptionSlice";
import { useDispatch } from "react-redux";

const { width } = Dimensions.get("window");

const CustomSwipeTabs = ({ tabs, initialIndex = 0 }) => {
  const [activeTab, setActiveTab] = useState(initialIndex);
  const translateX = useSharedValue(-width * initialIndex);
    const dispatch = useDispatch();

   useFocusEffect(
          useCallback(() => {
            return () => {
              console.log("in Focus Effect")
              dispatch(setSubscriptionExpired(false));
            }
          }, [])
        );
  
  const onTabPress = (index) => {
    setActiveTab(index);
    translateX.value = withTiming(-width * index, { duration: 250 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // ✅ Define gesture with Gesture API
  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10]) // detect horizontal swipes
    .failOffsetY([-5, 5]) // ignore vertical drags
    .onUpdate((event) => {
      translateX.value = -activeTab * width + event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 50) {
        if (event.translationX < 0 && activeTab < tabs.length - 1) {
          runOnJS(onTabPress)(activeTab + 1);
        } else if (event.translationX > 0 && activeTab > 0) {
          runOnJS(onTabPress)(activeTab - 1);
        } else {
          translateX.value = withTiming(-activeTab * width, { duration: 250 });
        }
      } else {
        translateX.value = withTiming(-activeTab * width, { duration: 250 });
      }
    });

  return (
    <View style={{ flex: 1 }}>
      {/* Tabs Header */}
      <View style={styles.tabContainer}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tabButton, activeTab === index && styles.activeTab]}
            onPress={() => onTabPress(index)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === index ? Colors.primary : Colors.gray}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === index && { color: Colors.primary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tabs Content with swipe */}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.contentContainer,
            { width: width * tabs.length },
            animatedStyle,
          ]}
        >
          {tabs.map((tab, index) => (
            <View key={index} style={{ width, flex: 1 }}>
              {tab.component}
            </View>
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
  },
  tabLabel: {
    marginLeft: 6,
    fontFamily: "Nunito700",
    fontSize: 15,
    color: Colors.gray,
  },
  contentContainer: {
    flexDirection: "row",
    flex: 1,
  },
});

export default CustomSwipeTabs;
