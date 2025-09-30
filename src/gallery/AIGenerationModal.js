// import React, { useEffect, useRef } from "react";
// import {
//   Modal,
//   View,
//   Text,
//   StyleSheet,
//   Animated,
// } from "react-native";
// import { MaterialCommunityIcons } from "@expo/vector-icons";
// import { useTranslation } from "react-i18next";
// import { useSharedValue } from "react-native-reanimated";

// const particleColors = [
//   "#ff4081",
//   "#f50057",
//   "#ff80ab",
//   "#7c4dff",
//   "#ff4081",
//   "#00bcd4",
// ];

// const AIGenerationModal = ({ visible }) => {
//   const pulseAnim = useRef(new Animated.Value(1)).current;

//   const { t } = useTranslation();

//   const orbitAnims = useRef(
//     Array.from({ length: particleColors.length }, () => new Animated.Value(0))
//   ).current;

//   const progressAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulseAnim, {
//           toValue: 1.3,
//           duration: 800,
//           useNativeDriver: true,
//         }),
//         Animated.timing(pulseAnim, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();

//     orbitAnims.forEach((anim, i) => {
//       Animated.loop(
//         Animated.timing(anim, {
//           toValue: 1,
//           duration: 3000 + i * 500,
//           useNativeDriver: true,
//         })
//       ).start();
//     });

//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(progressAnim, {
//           toValue: 1,
//           duration: 2000,
//           useNativeDriver: false,
//         }),
//         Animated.timing(progressAnim, {
//           toValue: 0,
//           duration: 2000,
//           useNativeDriver: false,
//         }),
//       ])
//     ).start();
//   }, []);

//   const progressWidth = progressAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["0%", "100%"],
//   });

// //   const progressColor = progressAnim.interpolate({
// //   inputRange: [0, 0.5, 1],
// //   outputRange: ["#667eea", "#764ba2", "#ff4081"], 
// // });
// const progress = useSharedValue(0);

// const progressColor =
//   progress >= 0.5 ? "#667eea" : "#ff4081"; // simple switch


//   return (
//     <Modal visible={visible} transparent animationType="fade" presentationStyle="overFullScreen">
//       <View style={styles.modalBackground}>
//         <View style={styles.modalContainer}>
//           {/* 🔹 Robot + Particles inside same container */}
//           <View style={styles.centerWrapper}>
//             {/* Robot */}
//             <Animated.View style={{ transform: [{ scale: pulseAnim }], 
//               shadowColor: "#667eea",
//               shadowOpacity: 0.5,
//               shadowRadius: 10,
//               shadowOffset: { width: 0, height: 0 }, }}
//             >
//               <MaterialCommunityIcons
//                 name="robot-happy"
//                 size={50}
//                 color="#ff4081"
//                 // style={{
//                 //   textShadowColor: "#667eea",
//                 //   textShadowRadius: 10,
//                 // }}
//               />
//             </Animated.View>

//             {orbitAnims.map((anim, i) => {
//               const rotate = anim.interpolate({
//                 inputRange: [0, 1],
//                 outputRange:
//                   i % 2 === 0 ? ["0deg", "360deg"] : ["360deg", "0deg"],
//               });

//               return (
//                 <Animated.View
//                   key={i}
//                   style={[
//                     styles.orbit,
//                     {
//                       transform: [
//                         { rotate },
//                         { translateX: Animated.add(new Animated.Value(30 + i*6), new Animated.Value(0)) },
//                       ],
//                     },
//                   ]}
//                 >
//                   <View
//                     style={[
//                       styles.particle,
//                       { backgroundColor: particleColors[i] },
//                     ]}
//                   />
//                 </Animated.View>
//               );
//             })}
//           </View>

//           <Text style={styles.title}>{t("flix10k.imageGenerationProgress")}</Text>
//           <Text style={styles.subtitle}>
//             {t("flix10k.imageEnhancing")}
//           </Text>

//           <View style={styles.progressBackground}>
//             <Animated.View
//             style={[
//                 styles.progressFill,
//                 { width: progressWidth, backgroundColor: progressColor },
//             ]}
//             />
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// export default AIGenerationModal;

// const styles = StyleSheet.create({
//   modalBackground: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.3)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalContainer: {
//     width: 320,
//     padding: 20,
//     backgroundColor: "rgba(255,255,255,0.95)",
//     borderRadius: 16,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.25,
//     shadowOffset: { width: 0, height: 6 },
//     shadowRadius: 10,
//     elevation: 8,
//     overflow: "hidden",
//   },
//   centerWrapper: {
//     width: 120,
//     height: 120,
//     justifyContent: "center",
//     alignItems: "center",
//     position: "relative",
//     marginBottom: 20,
//   },
//   orbit: {
//     position: "absolute",
//     top: "50%",
//     left: "45%",
//   },
//   particle: {
//     width: 8,
//     height: 8,
//     borderRadius: 5,
//     shadowColor: "#000",
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//   },
//   title: {
//     fontSize: 18,
//     fontFamily: "Nunito700",
//     color: "#667eea",
//     textAlign: "center",
//   },
//   subtitle: {
//     fontSize: 14,
//     fontFamily: "Nunito400",
//     color: "#444",
//     marginTop: 6,
//     textAlign: "center",
//   },
//   progressBackground: {
//     width: "100%",
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: "#e0e0e0",
//     marginTop: 20,
//     overflow: "hidden",
//   },
//   progressFill: {
//     height: "100%",
//     backgroundColor: "#667eea",
//     borderRadius: 3,
//   },
// });

// AIGenerationModal_fixed.js
import React, { useEffect, useRef } from "react";
import { Modal, View, Text, StyleSheet, Animated, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

const particleColors = ["#ff4081","#f50057","#ff80ab","#7c4dff","#00bcd4"];

const AIGenerationModal = ({ visible = false }) => {
  const { t } = useTranslation();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const orbitAnims = useRef(particleColors.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let pulseLoop, orbitLoops = [], progressLoop;

    if (visible) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true })
        ])
      );
      pulseLoop.start();

      orbitLoops = orbitAnims.map((anim, i) =>
        Animated.loop(
          Animated.timing(anim, { toValue: 1, duration: 2800 + i * 300, useNativeDriver: true })
        )
      );
      orbitLoops.forEach(loop => loop.start());

      progressLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
          Animated.timing(progressAnim, { toValue: 0, duration: 1800, useNativeDriver: false })
        ])
      );
      progressLoop.start();
    }

    return () => {
      // stop loops
      try { pulseLoop && pulseLoop.stop(); } catch(e){}
      orbitLoops.forEach(l => { try { l.stop(); } catch(e){} });
      try { progressLoop && progressLoop.stop(); } catch(e){}
      // reset values to 0
      pulseAnim.setValue(1);
      progressAnim.setValue(0);
      orbitAnims.forEach(a => a.setValue(0));
    };
  }, [visible]);

  // interpolated width and color
  const progressWidth = progressAnim.interpolate({ inputRange: [0,1], outputRange: ["0%","100%"] });
  const progressColor = progressAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#ff4081", "#764ba2", "#667eea"]
  });

  // compute particle translateX radii once
  const radii = particleColors.map((_, i) => 32 + i * 8);

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={styles.centerWrapper}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              {/* place shadow in plain view for iOS */}
              <View style={styles.iconShadow}>
                <MaterialCommunityIcons name="robot-happy" size={52} color="#ff4081" />
              </View>
            </Animated.View>

            {orbitAnims.map((anim, i) => {
              const rotate = anim.interpolate({ inputRange: [0,1], outputRange: [i%2===0?"0deg":"360deg", i%2===0?"360deg":"0deg"] });
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.orbit,
                    {
                      transform: [{ rotate }, { translateX: radii[i] }],
                    },
                  ]}
                >
                  <View style={[styles.particle, { backgroundColor: particleColors[i] }]} />
                </Animated.View>
              );
            })}
          </View>

          <Text style={styles.title}>{t("flix10k.imageGenerationProgress")}</Text>
          <Text style={styles.subtitle}>{t("flix10k.imageEnhancing")}</Text>

          <View style={styles.progressBackground}>
            <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: progressColor }]} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: 320, padding: 20, backgroundColor: "rgba(255,255,255,0.98)", borderRadius: 16, alignItems: "center" },
  centerWrapper: { width: 140, height: 140, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  orbit: { position: "absolute", top: "50%", left: "50%", marginLeft: -4, marginTop: -4 },
  particle: { width: 8, height: 8, borderRadius: 4, shadowColor:"#000", shadowOpacity:0.18, shadowRadius:3, elevation:2 },
  iconShadow: { padding: 6, borderRadius: 40, shadowColor: "#667eea", shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  title: { fontSize: 18, fontFamily: "Nunito700", color: "#667eea", textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Nunito400", color: "#444", marginTop: 6, textAlign:"center" },
  progressBackground: { width: "100%", height: 6, borderRadius: 3, backgroundColor: "#e0e0e0", marginTop: 16, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 }
});

export default AIGenerationModal;