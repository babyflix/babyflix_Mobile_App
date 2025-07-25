import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isPlanExpired: false,
  showUpgradeReminder: false,
  remainingDays: null, // ✅ NEW
};

const expiredPlanSlice = createSlice({
  name: 'expiredPlan',
  initialState,
  reducers: {
    setPlanExpired: (state, action) => {
      state.isPlanExpired = action.payload;
    },
    setUpgradeReminder: (state, action) => {
      state.showUpgradeReminder = action.payload;
    },
    setRemainingDays: (state, action) => {
      state.remainingDays = action.payload;
    },
  },
});

export const { setPlanExpired, setUpgradeReminder, setRemainingDays } = expiredPlanSlice.actions;
export default expiredPlanSlice.reducer;
