// // i18n.js
// import i18n from "i18next";
// import { initReactI18next } from "react-i18next";
// import * as Localization from "expo-localization";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// // ⛳️ Put your real key here
// const API_KEY = "YOUR_GOOGLE_API_KEY";

// // ---- Simple cache helpers (per language) ----
// const CACHE_KEYS = {
//   es: "i18n_cache_es_v1",
// };
// async function loadCache(lng) {
//   try {
//     const raw = await AsyncStorage.getItem(CACHE_KEYS[lng]);
//     return raw ? JSON.parse(raw) : {};
//   } catch { return {}; }
// }
// async function saveCache(lng, data) {
//   try { await AsyncStorage.setItem(CACHE_KEYS[lng], JSON.stringify(data || {})); }
//   catch {}
// }

// // ---- Google Translate helper ----
// async function translateText(text, target = "es") {
//   try {
//     const res = await fetch(
//       `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ q: text, target }),
//       }
//     );
//     const json = await res.json();
//     return json?.data?.translations?.[0]?.translatedText ?? text;
//   } catch {
//     return text; // fallback: original
//   }
// }

// // ---- Public setup you will call from App.js ----
// export async function setupI18n() {
//   // 1) get saved or device language
//   const savedLang = await AsyncStorage.getItem("appLang");
//   const deviceLang = Localization.locale?.toLowerCase().startsWith("es") ? "es" : "en";
//   const lng = savedLang || deviceLang;

//   // 2) load cached Spanish resources (if any)
//   const esCache = await loadCache("es");

//   // 3) init i18next
//   await i18n
//     .use(initReactI18next)
//     .init({
//       lng,
//       fallbackLng: "en",
//       // We keep resources empty for en; for es we preload cache
//       resources: {
//         en: { translation: {} },
//         es: { translation: esCache || {} },
//       },
//       keySeparator: false,         // use full English sentences as keys
//       interpolation: { escapeValue: false },
//       saveMissing: true,           // fire missingKey for unknown keys
//       react: {
//         useSuspense: false,
//         bindI18n: "languageChanged",
//         bindI18nStore: "added",    // re-render when new keys get added dynamically
//       },
//     });

//   // 4) When a key is missing, auto-translate it (for Spanish) and cache it
//   i18n.on("missingKey", async (lngs, ns, key) => {
//     // Only auto-translate when current language is Spanish
//     if (i18n.language === "es") {
//       const translated = await translateText(key, "es");
//       // add to i18n store
//       i18n.addResource("es", "translation", key, translated);
//       // persist in cache
//       const current = await loadCache("es");
//       current[key] = translated;
//       await saveCache("es", current);
//     }
//   });

//   return i18n;
// }

// export default i18n;


// import i18n from "i18next";
// import { initReactI18next } from "react-i18next";
// import * as Localization from "expo-localization";
// import en from "../../locales/en.json";
// import es from "../../locales/es.json";

// i18n
//   .use(initReactI18next)
//   .init({
//     compatibilityJSON: "v3",
//     resources: {
//       en: { translation: en },
//       es: { translation: es },
//     },
//     lng: Localization.getLocales()[0].languageCode, // default (can override later)
//     fallbackLng: "en",
//     interpolation: { escapeValue: false },
//   });

// export default i18n;


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
    // 1️⃣ Check AsyncStorage for saved language
    const storedLang = await AsyncStorage.getItem("appLanguage");

    // 2️⃣ If not found, use device language (fallback: en)
    const defaultLang = storedLang || Localization.getLocales()[0].languageCode || "en";

    // 3️⃣ Initialize i18n
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

// Call immediately so app waits for language
initI18n();

export default i18n;
