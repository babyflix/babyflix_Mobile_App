import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import i18n from "../constants/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

const LanguageModal = ({ visible, onClose }) => {
  const [selectedLang, setSelectedLang] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const loadLang = async () => {
      const storedLang = await AsyncStorage.getItem("appLanguage");
      if (storedLang) setSelectedLang(storedLang);
    };
    loadLang();
  }, [visible]);

  const selectLanguage = async (lang) => {
    setSelectedLang(lang);
    await AsyncStorage.setItem("appLanguage", lang);
    i18n.changeLanguage(lang);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>

          <Text style={styles.title}>{t("selectLanguage")}</Text>

          <TouchableOpacity
            style={[
              styles.optionContainer,
              selectedLang === "en" && styles.selectedOption,
            ]}
            onPress={() => selectLanguage("en")}
          >
            <Text style={styles.option}>English</Text>
            {selectedLang === "en" && (
              <Ionicons name="checkmark" size={20} color="green" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionContainer,
              selectedLang === "es" && styles.selectedOption,
            ]}
            onPress={() => selectLanguage("es")}
          >
            <Text style={styles.option}>Español</Text>
            {selectedLang === "es" && (
              <Ionicons name="checkmark" size={20} color="green" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    width: 300,
    alignItems: "center",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },
  title: { fontFamily: 'Nunito700', fontSize: 18, marginBottom: 20, fontWeight: "bold" },
  optionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    marginVertical: 5,
  },
  selectedOption: {
    backgroundColor: "#f5cbeaff",
  },
  option: { fontFamily: "Nunito700", fontSize: 16, color: "black" },
});

export default LanguageModal;
