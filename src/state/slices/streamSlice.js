import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  streamUrl: null,
  isStreamStarted: false,
  streamState: '',
  eventStartTime: null,
  eventEndTime: null,
  masterStreamUrl: null,
  reStart: null,
};

const streamSlice = createSlice({
  name: 'stream',
  initialState,
  reducers: {
    liveStreamUpdate: (state, action) => {
      const { streamUrl, isStreamStarted, streamState, eventStartTime, eventEndTime, masterStreamUrl, reStart } = action.payload;

      state.streamUrl = streamUrl;
      state.isStreamStarted = isStreamStarted;
      state.streamState = streamState;
      state.eventStartTime = eventStartTime;
      state.eventEndTime = eventEndTime;
      state.masterStreamUrl = masterStreamUrl;
      state.reStart = reStart;
    },
  },
});

export const { liveStreamUpdate } = streamSlice.actions;

export default streamSlice.reducer;

