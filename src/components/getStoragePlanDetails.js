// import axios from 'axios';
// import { setStoragePlanDetails } from '../state/slices/storagePlanSlice'; 
// import { useDispatch, useSelector } from 'react-redux';

// const dispatch = useDispatch();
// const user = useSelector(state => state.auth);

// export const getStoragePlanDetails = async () => {
//   try {
//     const res = await axios.get(
//       `${process.env.EXPO_PUBLIC_API_URL}/api/patients/getPatientByEmail?email=${user.email}`,
//       {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     if (res.status === 200) {
//       const data = res.data;

//       console.log("data slice",data)
//       dispatch(setStoragePlanDetails({
//         skippedPlanCount: data.skippedPlanCount,
//         storagePlanId: data.storagePlanId,
//         storagePlanPayment: data.storagePlanPayment,
//       }));
//     }
//   } catch (error) {
//     console.error('Error fetching storage plan details:', error);
//   }
// };


// src/utils/getStoragePlanDetails.js
import axios from 'axios';
import { setStoragePlanDetails } from '../state/slices/storagePlanSlice'; // Adjust the path if needed

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

      console.log("data storage",data)

      dispatch(setStoragePlanDetails({
        skippedPlanCount: data.skippedPlanCount,
        storagePlanId: data.storagePlanId,
        storagePlanPayment: data.storagePlanPayment,
      }));
    }
  } catch (error) {
    console.error('Error fetching storage plan details:', error);
  }
};
