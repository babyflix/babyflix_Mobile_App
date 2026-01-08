import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import mediaReducer from './slices/mediaSlice';
import headerReducer from './slices/headerSlice';
import streamReducer from './slices/streamSlice';
import storagePlanReducer from './slices/storagePlanSlice';
import storageUIReducer from './slices/storageUISlice';
import expiredPlanReducer from './slices/expiredPlanSlice';
import flix10kSliceReducer from './slices/flix10kSlice';
import subscriptionReducer from "./slices/subscriptionSlice";
import planReducer from "./slices/planSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    mediaData: mediaReducer,
    header: headerReducer,
    stream: streamReducer,
    storagePlan: storagePlanReducer,
    storageUI: storageUIReducer,
    expiredPlan: expiredPlanReducer,
    flix10kSlice: flix10kSliceReducer,
    subscription: subscriptionReducer,
    plan: planReducer,
  },
});