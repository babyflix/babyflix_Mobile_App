import { createSlice } from '@reduxjs/toolkit';

const storageUISlice = createSlice({
  name: 'storageUI',
  initialState: {
    openStorage2Directly: false,
  },
  reducers: {
    triggerOpenStorage2: (state) => {
      state.openStorage2Directly = true;
    },
    clearOpenStorage2: (state) => {
      state.openStorage2Directly = false;
    },
  },
});

export const { triggerOpenStorage2, clearOpenStorage2 } = storageUISlice.actions;
export default storageUISlice.reducer;
