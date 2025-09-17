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
      state.subscription= null,
      state.subscriptionAmount= '',
      state.subscriptionId= '',
      state.subscriptionIsActive= false
      state.subscriptionExpired= false
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
