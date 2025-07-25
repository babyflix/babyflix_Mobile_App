import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  streamUrl: null,
  isStreamStarted: false,
  streamState: '',
  eventStartTime: null,
  eventEndTime: null,
  masterStreamUrl: null,
  reStart: null,
  eventActualEndTime: null,
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
    setEventActualEndTime: (state, action) => {
      state.eventActualEndTime = action.payload;
    },
  },
});

export const { liveStreamUpdate, setEventActualEndTime } = streamSlice.actions;

export default streamSlice.reducer;
