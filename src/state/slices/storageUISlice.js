import { createSlice } from "@reduxjs/toolkit";

const storageUISlice = createSlice({
  name: 'storageUI',
  initialState: {
    openStorage2Directly: false,
    forceOpenStorageModals: false,
  },
  reducers: {
    triggerOpenStorage2: (state) => {
      state.openStorage2Directly = true;
    },
    clearOpenStorage2: (state) => {
      state.openStorage2Directly = false;
    },
    setForceOpenStorageModals: (state, action) => {
      state.forceOpenStorageModals = action.payload;
    },
  },
});

export const {
  triggerOpenStorage2,
  clearOpenStorage2,
  setForceOpenStorageModals,
} = storageUISlice.actions;

export default storageUISlice.reducer;
