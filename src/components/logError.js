import axios from 'axios';
import { EXPO_PUBLIC_API_URL} from '@env';

export const logError = async ({ error, data = null, details = null }) => {
  const payload = {
    error: error?.message || 'Unknown error',
    data,
    details,
  };

  try {
    const response = await axios.post(`${EXPO_PUBLIC_API_URL}/api/error/triggerError`, payload);
  } catch (err) {
    console.error('Failed to send error log:', err);
  }
};
