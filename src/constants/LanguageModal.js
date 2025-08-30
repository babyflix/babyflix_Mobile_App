// // LanguageModal.js
// import React from "react";
// import { Modal, View, Text, TouchableOpacity } from "react-native";
// import i18n from "./i18n";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useTranslation } from "react-i18next";

// export default function LanguageModal({ visible, onClose }) {
//   const { t } = useTranslation();

//   const setLang = async (lang) => {
//     await AsyncStorage.setItem("appLang", lang);
//     await i18n.changeLanguage(lang);
//     onClose?.();
//   };

//   return (
//     <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
//       <View style={{
//         flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
//         justifyContent: "center", alignItems: "center"
//       }}>
//         <View style={{
//           width: "85%", backgroundColor: "white", borderRadius: 16, padding: 20
//         }}>
//           <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
//             {t("Select Language")}
//           </Text>

//           <TouchableOpacity
//             onPress={() => setLang("en")}
//             style={{ padding: 14, backgroundColor: "#f2f2f2", borderRadius: 10, marginBottom: 10 }}
//           >
//             <Text style={{ fontSize: 16 }}>English</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={() => setLang("es")}
//             style={{ padding: 14, backgroundColor: "#f2f2f2", borderRadius: 10 }}
//           >
//             <Text style={{ fontSize: 16 }}>Español</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={onClose}
//             style={{ padding: 14, alignSelf: "flex-end" }}
//           >
//             <Text style={{ fontSize: 16 }}>{t("Close")}</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// }


// import React, { useEffect, useState } from "react";
// import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import i18n from "../constants/i18n";

// const LanguageModal = () => {
//   const [visible, setVisible] = useState(false);

//   useEffect(() => {
//     const checkLanguage = async () => {
//       const lang = await AsyncStorage.getItem("appLanguage");
//       if (!lang) {
//         setVisible(true); // show modal if no language selected
//       } else {
//         i18n.changeLanguage(lang);
//       }
//     };
//     checkLanguage();
//   }, []);

//   const selectLanguage = async (lang) => {
//     await AsyncStorage.setItem("appLanguage", lang);
//     i18n.changeLanguage(lang);
//     setVisible(false); // close modal
//   };

//   return (
//     <Modal transparent={true} visible={visible} animationType="slide">
//       <View style={styles.overlay}>
//         <View style={styles.modal}>
//           <Text style={styles.title}>Select Your Language</Text>
//           <TouchableOpacity onPress={() => selectLanguage("en")}>
//             <Text style={styles.option}>English</Text>
//           </TouchableOpacity>
//           <TouchableOpacity onPress={() => selectLanguage("es")}>
//             <Text style={styles.option}>Español</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0,0,0,0.5)",
//   },
//   modal: {
//     backgroundColor: "white",
//     padding: 20,
//     borderRadius: 15,
//     width: 300,
//     alignItems: "center",
//   },
//   title: { fontSize: 18, marginBottom: 15, fontWeight: "bold" },
//   option: { fontSize: 16, marginVertical: 10, color: "blue" },
// });

// export default LanguageModal;


import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import i18n from "../constants/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons"; // for close & checkmark icons
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
    onClose(); // close modal after selection
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>

          <Text style={styles.title}>{t("selectLanguage")}</Text>

          {/* English Option */}
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

          {/* Spanish Option */}
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
  title: { fontSize: 18, marginBottom: 20, fontWeight: "bold" },
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
  option: { fontSize: 16, color: "black" },
});

export default LanguageModal;
