import { createSlice } from "@reduxjs/toolkit";

const storageUISlice = createSlice({
  name: 'storageUI',
  initialState: {
    openStorage2Directly: false,
    forceOpenStorageModals: false,
    deepLinkHandled: false,
    galleryRefreshKey: 0,
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
    setDeepLinkHandled: (state, action) => {
      state.deepLinkHandled = action.payload; // true or false
    },
    triggerGalleryRefresh: (state) => {
      state.galleryRefreshKey += 1; // 🔥 important (not boolean)
    },
  },
});

export const {
  triggerOpenStorage2,
  clearOpenStorage2,
  setForceOpenStorageModals,
  setDeepLinkHandled,
  triggerGalleryRefresh,
} = storageUISlice.actions;

export default storageUISlice.reducer;
