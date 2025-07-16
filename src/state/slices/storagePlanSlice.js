import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  skippedPlanCount: null,
  storagePlanId: null,
  storagePlanPayment: null,
  isPlanDeleted: false, // ✅ added new field
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
        isPlanDeleted = false, // ✅ default to false if not provided
      } = action.payload;

      state.skippedPlanCount = skippedPlanCount;
      state.storagePlanId = storagePlanId;
      state.storagePlanPayment = storagePlanPayment;
      state.isPlanDeleted = isPlanDeleted;
    },
    clearStoragePlanDetails: (state) => {
      state.skippedPlanCount = null;
      state.storagePlanId = null;
      state.storagePlanPayment = null;
      state.isPlanDeleted = false; // ✅ reset to false
    },
    setIsPlanDeleted: (state, action) => {
      state.isPlanDeleted = action.payload;
    },
  },
});

export const {
  setStoragePlanDetails,
  clearStoragePlanDetails,
  setIsPlanDeleted, // ✅ export new action
} = storagePlanSlice.actions;

export const selectStoragePlan = (state) => state.storagePlan;

export default storagePlanSlice.reducer;
