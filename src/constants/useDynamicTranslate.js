// import { useState, useEffect } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const GOOGLE_TRANSLATE_API_KEY = 'YOUR_API_KEY'; // Replace with your key

// // Example static translations (optional, can keep your i18next JSON)
// const staticTranslations = {}; // empty because you already use i18next

// export const useDynamicTranslate = (text, targetLang = 'es') => {
//   const [translated, setTranslated] = useState(text);

//   useEffect(() => {
//     const translate = async () => {
//       if (!text) return;

//       // 1️⃣ Check cache first
//       const cacheKey = `translate_${targetLang}_${text}`;
//       const cached = await AsyncStorage.getItem(cacheKey);
//       if (cached) {
//         setTranslated(cached);
//         return;
//       }

//       // 2️⃣ Call Google Translate API
//       try {
//         const response = await axios.post(
//           `https://translation.googleapis.com/language/translate/v2`,
//           {},
//           {
//             params: { q: text, target: targetLang, key: GOOGLE_TRANSLATE_API_KEY },
//           }
//         );

//         const translatedText = response.data.data.translations[0].translatedText || text;
//         setTranslated(translatedText);
//         await AsyncStorage.setItem(cacheKey, translatedText); // cache it
//       } catch (err) {
//         console.error('Translation error:', err);
//         setTranslated(text);
//       }
//     };

//     translate();
//   }, [text, targetLang]);

//   return translated;
// };


// import { useState, useEffect } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const GOOGLE_TRANSLATE_API_KEY = 'YOUR_API_KEY'; // Replace with your key

// export const useDynamicTranslate = (text) => {
//   const [translated, setTranslated] = useState(text);

//   useEffect(() => {
//     const translate = async () => {
//       if (!text) return;

//       try {
//         // 1️⃣ Get selected language from AsyncStorage
//         const lang = (await AsyncStorage.getItem('appLanguage')) || 'en';

//         // If language is English, just return the same text
//         if (lang === 'en') {
//           setTranslated(text);
//           return;
//         }

//         // 2️⃣ Check cache first
//         const cacheKey = `translate_${lang}_${text}`;
//         const cached = await AsyncStorage.getItem(cacheKey);
//         if (cached) {
//           setTranslated(cached);
//           return;
//         }

//         // 3️⃣ Call Google Translate API
//         const response = await axios.post(
//           `https://translation.googleapis.com/language/translate/v2`,
//           {},
//           {
//             params: { q: text, target: lang, key: GOOGLE_TRANSLATE_API_KEY },
//           }
//         );

//         const translatedText = response.data.data.translations[0].translatedText || text;
//         setTranslated(translatedText);
//         await AsyncStorage.setItem(cacheKey, translatedText); // cache it
//       } catch (err) {
//         console.error('Translation error:', err);
//         setTranslated(text);
//       }
//     };

//     translate();
//   }, [text]);

//   return translated;
// };



// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const GOOGLE_TRANSLATE_API_KEY = 'YOUR_API_KEY'; // Replace with your actual key

// // Simple helper: check if text has accented/Spanish-specific characters
// const looksLikeSpanish = (text) => {
//   const spanishChars = /[ñáéíóúü¡¿]/i;
//   return spanishChars.test(text);
// };

// export const useDynamicTranslate = async (text) => {
//   if (!text) return text;

//   try {
//     // 1️⃣ Get selected language from AsyncStorage
//     const lang = (await AsyncStorage.getItem('appLanguage')) || 'en';

    // // 2️⃣ Skip translation if target is English and text is ASCII
    // if (lang === 'en' && /^[\x00-\x7F]*$/.test(text)) {
    //   return text;
    // }

    // // 3️⃣ Skip translation if target is Spanish and text looks Spanish
    // if (lang === 'es' && looksLikeSpanish(text)) {
    //   return text;
    // }

//     // 4️⃣ Otherwise call Google Translate API
//     const res = await axios.post(
//       `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
//       {
//         q: text,
//         target: lang,
//       }
//     );

//     return res.data.data.translations[0].translatedText;
//   } catch (err) {
//     console.error('Translation error:', err.message);
//     return text; // fallback
//   }
// };





import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';

//const GOOGLE_TRANSLATE_API_KEY = ''; // Replace with your actual API key

const looksLikeSpanish = (text) => {
  const spanishChars = /[ñáéíóúü¡¿]/i;
  return spanishChars.test(text);
};

export const useDynamicTranslate = async (text) => {
  if (!text) return text;

  console.log('Translating text:', text);

  try {
    // 1️⃣ Get selected language from AsyncStorage
    const lang = (await AsyncStorage.getItem('appLanguage')) || 'en';

    // If language is English, just return the same text
    // if (lang === 'en') {
    //   return text;
    // }

    // 2️⃣ Skip translation if target is English and text is ASCII
    if (lang === 'en' && /^[\x00-\x7F]*$/.test(text)) {
      return text;
    }

    // 3️⃣ Skip translation if target is Spanish and text looks Spanish
    if (lang === 'es' && looksLikeSpanish(text)) {
      return text;
    }

    console.log('Target language:', lang);

    // 2️⃣ Check cache first
    const cacheKey = `translate_${lang}_${text}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }

    // 3️⃣ Call Google Translate API
    // const response = await axios.post(
    //   `https://translation.googleapis.com/language/translate/v2`,
    //   {},
    //   {
    //     params: { q: text, target: lang, key: GOOGLE_TRANSLATE_API_KEY },
    //   }
    // );

     try {
      const response = await axios.post(`${EXPO_PUBLIC_API_URL}/api/translate`, {
        text,
        targetLang: lang,
      });

      console.log('Translation API response:', response.data);

      const translatedText = response.data.translation || text;
      console.log('Translated text:', translatedText);

      // Save in cache
      await AsyncStorage.setItem(cacheKey, translatedText);

      return translatedText;
    } catch (apiError) {
      console.error('Error calling translation API:', apiError);
      return text; // fallback
    }
  } catch (err) {
    //console.error('Translation error:', err);
    return text; // fallback to original text
  }
};
