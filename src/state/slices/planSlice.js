import { createSlice } from "@reduxjs/toolkit";

const planSlice = createSlice({
  name: "plan",
  initialState: {
    planData: null,
    loading: false,
    error: null,
    fetched: false, // 🔑 prevents multiple API calls
  },
  reducers: {
    getPlanStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getPlanSuccess: (state, action) => {
      state.loading = false;
      state.planData = action.payload;
      state.fetched = true;
    },
    getPlanError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  getPlanStart,
  getPlanSuccess,
  getPlanError,
} = planSlice.actions;

export default planSlice.reducer;
