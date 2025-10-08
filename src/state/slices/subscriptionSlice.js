import { createSlice } from "@reduxjs/toolkit";

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState: {
    expired: false,
    storageTab: false,
    showFlix10KAd: false,
    paymentStatusAdd: false,
    plans: [],
  },
  reducers: {
    setSubscriptionExpired: (state, action) => {
      state.expired = action.payload;
    },
    setStorageTab: (state, action) => {
      state.storageTab = action.payload;
    },
    setShowFlix10KADSlice: (state, action) => {
      state.showFlix10KAd = action.payload;
    },
     setPaymentStatusAdd: (state, action) => {
      state.showFlix10KAd = action.payload;
    },
    setPlans: (state, action) => {
      state.plans = action.payload; // 🔹 store fetched plans
    },
  },
});

export const { setSubscriptionExpired, setStorageTab, setShowFlix10KADSlice, setPaymentStatusAdd, setPlans } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
