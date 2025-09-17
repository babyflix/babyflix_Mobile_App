import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "../../locales/en.json";
import es from "../../locales/es.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
};

const initI18n = async () => {
  try {
    const storedLang = await AsyncStorage.getItem("appLanguage");

    const defaultLang = storedLang || Localization.getLocales()[0].languageCode || "en";

    await i18n.use(initReactI18next).init({
      compatibilityJSON: "v3",
      resources,
      lng: defaultLang,
      fallbackLng: "en",
      interpolation: { escapeValue: false },
    });
  } catch (e) {
    console.error("Error initializing i18n:", e);
  }
};

initI18n();

export default i18n;
