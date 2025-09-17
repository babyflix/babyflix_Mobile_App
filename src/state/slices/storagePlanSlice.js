import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  skippedPlanCount: null,
  storagePlanId: null,
  storagePlanPayment: null,
  storagePlanPrice: null,
  isPlanDeleted: false,
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
        storagePlanPrice,
        isPlanDeleted = false,
      } = action.payload;

      state.skippedPlanCount = skippedPlanCount;
      state.storagePlanId = storagePlanId;
      state.storagePlanPayment = storagePlanPayment;
      state.storagePlanPrice = storagePlanPrice; 
      state.isPlanDeleted = isPlanDeleted;
    },
    clearStoragePlanDetails: (state) => {
      state.skippedPlanCount = null;
      state.storagePlanId = null;
      state.storagePlanPayment = null;
      state.storagePlanPrice = null;
      state.isPlanDeleted = false; 
    },
    setIsPlanDeleted: (state, action) => {
      state.isPlanDeleted = action.payload;
    },
  },
});

export const {
  setStoragePlanDetails,
  clearStoragePlanDetails,
  setIsPlanDeleted, 
} = storagePlanSlice.actions;

export const selectStoragePlan = (state) => state.storagePlan;

export default storagePlanSlice.reducer;
