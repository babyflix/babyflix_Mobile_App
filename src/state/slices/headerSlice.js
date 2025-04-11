import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  showDropdown: false,
};

const headerSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDropdown: (state) => {
      state.showDropdown = !state.showDropdown;
    },
    closeDropdown: (state) => {
      state.showDropdown = false;
    },
    openDropdown: (state) => {
      state.showDropdown = true;
    },
  },
});

export const { toggleDropdown, closeDropdown, openDropdown } = headerSlice.actions;
export default headerSlice.reducer;
