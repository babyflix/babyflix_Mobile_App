import { createSlice } from "@reduxjs/toolkit";

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState: {
    expired: false,
  },
  reducers: {
    setSubscriptionExpired: (state, action) => {
      state.expired = action.payload;
    },
  },
});

export const { setSubscriptionExpired } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
