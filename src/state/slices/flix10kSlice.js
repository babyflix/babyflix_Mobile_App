import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedItems: [],
  flix10kSelectionMode: false,
};

const flix10kSlice = createSlice({
  name: 'flix10k',
  initialState,
  reducers: {
    enableSelectionMode: (state, action) => {
      state.flix10kSelectionMode = action.payload;
      if (!action.payload) state.selectedItems = [];
    },

    toggleItemSelection: (state, action) => {
      const item = action.payload;
      const exists = state.selectedItems.find(i => i.id === item.id);
      if (exists) {
        state.selectedItems = state.selectedItems.filter(i => i.id !== item.id);
      } else {
        state.selectedItems.push(item);
      }
      state.flix10kSelectionMode = state.selectedItems.length > 0;
    },

    clearSelection: (state) => {
      state.selectedItems = [];
      state.flix10kSelectionMode = false;
    },

    setSelectedItems: (state, action) => {
      state.selectedItems = action.payload;
      state.flix10kSelectionMode = action.payload.length > 0;
    },
  },
});

export const { enableSelectionMode, toggleItemSelection, clearSelection, setSelectedItems } = flix10kSlice.actions;
export default flix10kSlice.reducer;
