import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import mediaReducer from './slices/mediaSlice';
import headerReducer from './slices/headerSlice';
import streamReducer from './slices/streamSlice';
import storagePlanReducer from './slices/storagePlanSlice';
import storageUIReducer from './slices/storageUISlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    mediaData: mediaReducer,
    header: headerReducer,
    stream: streamReducer,
    storagePlan: storagePlanReducer,
    storageUI: storageUIReducer,
  },
});