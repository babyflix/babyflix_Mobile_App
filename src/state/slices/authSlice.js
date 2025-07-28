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
    },
    updateActionStatus: (state, action) => {
      state.actionStatus = action.payload;
    },  
     setLoggingOut: (state, action) => {
      state.isLoggingOut = action.payload;
    },  
  },
});

export const { setCredentials, logout, updateActionStatus, setLoggingOut  } = authSlice.actions;
export default authSlice.reducer;
