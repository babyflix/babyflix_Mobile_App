import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  images: [],
  videos: [],
};

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    setMediaData: (state, action) => {
      const { data } = action.payload;
      state.images = data.filter(item => item.type === 'image');
      state.videos = data.filter(item => item.type === 'video');
    },
  },
});

export const { setMediaData } = mediaSlice.actions;

export default mediaSlice.reducer;
