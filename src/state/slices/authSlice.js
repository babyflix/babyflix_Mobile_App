import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  actionStatus: '',
  companyId: '',
  email: '',
  expiresIn: '',
  familyOf: '',
  familyOfMachineId: '',
  firstName: '',
  id: '',
  lastName: '',
  locationId: '',
  machineId: '',
  role: '',
  token: '',
  uuid: '',
  isAuthenticated: false,
  isLoggingOut: false,
  subscription: null,
  subscriptionAmount: '',
  subscriptionId: '',
  subscriptionIsActive: false,
  subscriptionExpired: false,
  firstTimeSubscription: false,
  showFlixAd: false,

   // 🔹 Storage Plan
  storagePlan: null,
  storagePlanId: '',
  storagePlanPrice: '',
  storagePlanName: '',
  storagePlanDescription: '',
  storagePlanPayment: 0,
  storagePlanExpired: false,
  storagePlanRemainingDays: 0,
  storagePlanWarning: false,
  storagePlanDeleted: 0,
  storagePlanAutoRenewal: 0,
};


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const {
        actionStatus,
        companyId,
        email,
        expiresIn,
        familyOf,
        familyOfMachineId,
        firstName,
        id,
        lastName,
        locationId,
        machineId,
        role,
        token,
        uuid,
        subscription,
        firstTimeSubscription,
        showFlixAd,
        storagePlan,
      } = action.payload;

      state.actionStatus = actionStatus;
      state.companyId = companyId;
      state.email = email;
      state.expiresIn = expiresIn;
      state.familyOf = familyOf;
      state.familyOfMachineId = familyOfMachineId;
      state.firstName = firstName;
      state.id = id;
      state.lastName = lastName;
      state.locationId = locationId;
      state.machineId = machineId;
      state.role = role;
      state.token = token;
      state.uuid = uuid;
      state.isAuthenticated = !!token;
      state.isLoggingOut = false;
      state.subscription = subscription || null;
      state.subscriptionAmount = subscription?.subscriptionAmount || '';
      state.subscriptionId = subscription?.subscriptionId || '';
      state.subscriptionIsActive = subscription?.subscriptionIsActive === 1;
      state.subscriptionExpired = subscription?.subscriptionExpired || '';
      state.firstTimeSubscription = firstTimeSubscription;
      state.showFlixAd = showFlixAd;
      // 🔹 Storage Plan mapping
      state.storagePlan = storagePlan || null;
      state.storagePlanId = storagePlan?.storagePlanId || '';
      state.storagePlanPrice = storagePlan?.storagePlanPrice || '';
      state.storagePlanName = storagePlan?.planName || '';
      state.storagePlanDescription = storagePlan?.storagePlanDescription || '';
      state.storagePlanPayment = storagePlan?.storagePlanPayment || 0;
      state.storagePlanExpired = storagePlan?.isPlanExpired || false;
      state.storagePlanRemainingDays = storagePlan?.planRemainingDays || 0;
      state.storagePlanWarning = storagePlan?.planShowWarning || false;
      state.storagePlanDeleted = storagePlan?.isPlanDeleted || 0;
      state.storagePlanAutoRenewal = storagePlan?.storagePlanAutoRenewal || 0;
    },
    logout: (state) => {
      state.actionStatus = '';
      state.companyId = '';
      state.email = '';
      state.expiresIn = '';
      state.familyOf = '';
      state.familyOfMachineId = '';
      state.firstName = '';
      state.id = '';
      state.lastName = '';
      state.locationId = '';
      state.machineId = '';
      state.role = '';
      state.token = '';
      state.uuid = '';
      state.isAuthenticated = false;
      state.isLoggingOut = false; 
      state.subscription= null;
      state.subscriptionAmount= '';
      state.subscriptionId= '';
      state.subscriptionIsActive= false;
      state.subscriptionExpired= false;
      state.firstTimeSubscription= false;
      state.showFlixAd= false;
       // 🔹 Reset storage plan
      state.storagePlan = null;
      state.storagePlanId = '';
      state.storagePlanPrice = '';
      state.storagePlanName = '';
      state.storagePlanDescription = '';
      state.storagePlanPayment = 0;
      state.storagePlanExpired = false;
      state.storagePlanRemainingDays = 0;
      state.storagePlanWarning = false;
      state.storagePlanDeleted = 0;
      state.storagePlanAutoRenewal = 0;
    },
    updateActionStatus: (state, action) => {
      state.actionStatus = action.payload;
    },  
     setLoggingOut: (state, action) => {
      state.isLoggingOut = action.payload;
    },  
    setSubscriptionActive: (state, action) => {
  state.subscriptionIsActive = action.payload;
},
  },
});

export const { setCredentials, logout, updateActionStatus, setLoggingOut, setSubscriptionActive  } = authSlice.actions;
export default authSlice.reducer;
