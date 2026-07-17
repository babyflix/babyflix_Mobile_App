import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';
import { setPaymentDetails } from '../state/slices/authSlice';

export const getPatientPaymentDetails = async (email, dispatch) => {
  try {
    const res = await axios.get(
      `${EXPO_PUBLIC_API_URL}/api/patients/getPatientByEmail?email=${email}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (res.status === 200) {
      const data = res.data;

      dispatch(setPaymentDetails({
        requiresPay: data.requiresPay,
        fullAccessUnlocked: data.fullAccessUnlocked,
        payAmount: data.payAmount,
        payBaseAmount: data.payBaseAmount,
        payDiscountAmount: data.payDiscountAmount,
        payModalContent: data.payModalContent,
      }));
    }
  } catch (error) {
    console.error('Error fetching patient payment details:', error);
  }
};
