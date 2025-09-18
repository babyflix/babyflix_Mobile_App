import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

const particleColors = [
  "#ff4081",
  "#f50057",
  "#ff80ab",
  "#7c4dff",
  "#ff4081",
  "#00bcd4",
];

const AIGenerationModal = ({ visible }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { t } = useTranslation();

  const orbitAnims = useRef(
    Array.from({ length: particleColors.length }, () => new Animated.Value(0))
  ).current;

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    orbitAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + i * 500,
          useNativeDriver: true,
        })
      ).start();
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const progressColor = progressAnim.interpolate({
  inputRange: [0, 0.5, 1],
  outputRange: ["#667eea", "#764ba2", "#ff4081"], 
});


  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {/* 🔹 Robot + Particles inside same container */}
          <View style={styles.centerWrapper}>
            {/* Robot */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <MaterialCommunityIcons
                name="robot-happy"
                size={50}
                color="#ff4081"
                style={{
                  textShadowColor: "#667eea",
                  textShadowRadius: 10,
                }}
              />
            </Animated.View>

            {orbitAnims.map((anim, i) => {
              const rotate = anim.interpolate({
                inputRange: [0, 1],
                outputRange:
                  i % 2 === 0 ? ["0deg", "360deg"] : ["360deg", "0deg"],
              });

              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.orbit,
                    {
                      transform: [
                        { rotate },
                        { translateX: 30 + i * 6 },
                      ],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.particle,
                      { backgroundColor: particleColors[i] },
                    ]}
                  />
                </Animated.View>
              );
            })}
          </View>

          <Text style={styles.title}>{t("flix10k.imageGenerationProgress")}</Text>
          <Text style={styles.subtitle}>
            {t("flix10k.imageEnhancing")}
          </Text>

          <View style={styles.progressBackground}>
            <Animated.View
            style={[
                styles.progressFill,
                { width: progressWidth, backgroundColor: progressColor },
            ]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AIGenerationModal;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: 320,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 8,
    overflow: "visible",
  },
  centerWrapper: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 20,
  },
  orbit: {
    position: "absolute",
    top: "50%",
    left: "45%",
  },
  particle: {
    width: 8,
    height: 8,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  title: {
    fontSize: 18,
    fontFamily: "Nunito700",
    color: "#667eea",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Nunito400",
    color: "#444",
    marginTop: 6,
    textAlign: "center",
  },
  progressBackground: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e0e0e0",
    marginTop: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#667eea",
    borderRadius: 3,
  },
});
