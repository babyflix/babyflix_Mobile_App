import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';

const looksLikeSpanish = (text) => {
  const spanishChars = /[ñáéíóúü¡¿]/i;
  return spanishChars.test(text);
};

export const useDynamicTranslate = async (text) => {
  if (!text) return text;

  try {
    const lang = (await AsyncStorage.getItem('appLanguage')) || 'en';

    if (lang === 'en' && /^[\x00-\x7F]*$/.test(text)) {
      return text;
    }

    if (lang === 'es' && looksLikeSpanish(text)) {
      return text;
    }

    const cacheKey = `translate_${lang}_${text}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.post(`${EXPO_PUBLIC_API_URL}/api/translate`, {
        text,
        targetLang: lang,
      });

      const translatedText = response.data.translation || text;

      await AsyncStorage.setItem(cacheKey, translatedText);

      return translatedText;
    } catch (apiError) {
      console.error('Error calling translation API:', apiError);
      return text;
    }
  } catch (err) {
    return text;
  }
};
