import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  skippedPlanCount: null,
  storagePlanId: null,
  storagePlanPayment: null,
};

const storagePlanSlice = createSlice({
  name: 'storagePlan',
  initialState,
  reducers: {
    setStoragePlanDetails: (state, action) => {
      const {
        skippedPlanCount,
        storagePlanId,
        storagePlanPayment,
      } = action.payload;

      state.skippedPlanCount = skippedPlanCount;
      state.storagePlanId = storagePlanId;
      state.storagePlanPayment = storagePlanPayment;
    },
    clearStoragePlanDetails: (state) => {
      state.skippedPlanCount = null;
      state.storagePlanId = null;
      state.storagePlanPayment = null;
    },
  },
});

export const { setStoragePlanDetails, clearStoragePlanDetails } = storagePlanSlice.actions;
export const selectStoragePlan = (state) => state.storagePlan;
export default storagePlanSlice.reducer;

