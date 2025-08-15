import axios from 'axios';
import { setStoragePlanDetails } from '../state/slices/storagePlanSlice'; 

export const getStoragePlanDetails = async (email, dispatch) => {
  try {
    const res = await axios.get(
      `${process.env.EXPO_PUBLIC_API_URL}/api/patients/getPatientByEmail?email=${email}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (res.status === 200) {
      const data = res.data;

      console.log('data',data)

      dispatch(setStoragePlanDetails({
        skippedPlanCount: data.skippedPlanCount,
        storagePlanId: data.storagePlanId,
        storagePlanPayment: data.storagePlanPayment,
        isPlanDeleted: data.isPlanDeleted,
        storagePlanPrice: data.storagePlanPrice,
      }));
    }
  } catch (error) {
    console.error('Error fetching storage plan details:', error);
  }
};
