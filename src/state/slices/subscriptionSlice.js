import { createSlice } from "@reduxjs/toolkit";

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState: {
    expired: false,
    showFlix10KAd: false,
  },
  reducers: {
    setSubscriptionExpired: (state, action) => {
      state.expired = action.payload;
    },
    setShowFlix10KADSlice: (state, action) => {
      state.showFlix10KAd = action.payload;
    },
  },
});

export const { setSubscriptionExpired, setShowFlix10KADSlice } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
