// import { createSlice } from '@reduxjs/toolkit';

// const initialState = {
//   showDropdown: false,
// };

// const headerSlice = createSlice({
//   name: 'ui',
//   initialState,
//   reducers: {
//     toggleDropdown: (state) => {
//       state.showDropdown = !state.showDropdown;
//     },
//     closeDropdown: (state) => {
//       state.showDropdown = false;
//     },
//     openDropdown: (state) => {
//       state.showDropdown = true;
//     },
//   },
// });

// export const { toggleDropdown, closeDropdown, openDropdown } = headerSlice.actions;
// export default headerSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  showDropdown: false,
  unreadMessagesCount: 0,
  unreadMessages: [],
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
    setUnreadMessagesCount: (state, action) => {
      state.unreadMessagesCount = action.payload;
    },
    setUnreadMessagesData: (state, action) => {
      state.unreadMessagesCount = action.payload.total_unread_count;
      state.unreadMessages = action.payload.unread_messages;
    },
  },
});

export const {
  toggleDropdown,
  closeDropdown,
  openDropdown,
  setUnreadMessagesCount,
  setUnreadMessagesData,
} = headerSlice.actions;

export default headerSlice.reducer;
