import axios from 'axios';
import { EXPO_PUBLIC_API_URL} from '@env';

export const logError = async ({ error, data = null, details = null }) => {
  const payload = {
    error: error?.message || 'Unknown error',
    data,
    details,
  };

  console.log('Logging error:', payload);

  try {
    const response = await axios.post(`${EXPO_PUBLIC_API_URL}/api/error/triggerError`, payload);
    console.log('Error log response:', response.data);
  } catch (err) {
    console.error('Failed to send error log:', err);
  }
};
