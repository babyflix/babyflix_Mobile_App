import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  snackbar: {
    visible: false,
    message: '',
    type: 'success',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    showSnackbar: (state, action) => {
      state.snackbar = {
        visible: true,
        message: action.payload.message,
        type: action.payload.type || 'success',
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.visible = false;
    },
  },
});

export const { setLoading, showSnackbar, hideSnackbar } = uiSlice.actions;
export default uiSlice.reducer;
