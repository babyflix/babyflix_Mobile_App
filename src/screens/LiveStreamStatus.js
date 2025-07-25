import React, { useState, useEffect } from 'react';
import moment from 'moment';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { liveStreamUpdate, setEventActualEndTime } from '../state/slices/streamSlice';
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLOUD_API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '../components/logError';

const getEventsData = async (user, dispatch, stream, intervalId, eventEndTime,) => {
  const timezone = await AsyncStorage.getItem('timezone');
  try {
    const resp = await axios.get(`${EXPO_PUBLIC_API_URL}/api/events/getAllEvents`, {
      params: {
        pageSize: 10,
        pageIndex: 0,
        sortBy: 'id',
        sortOrder: 'desc',
        userId: user.id,
        isApp: 'native',
        timezone: timezone,
      },
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    let data = resp.data.data;

    if (data && data.length > 0 && resp.data["activeEventCount"] > 0) {
      const firstEvent = data[0];

      if (firstEvent.isEventScheduleOnToday) {
        if (firstEvent.startTime && firstEvent.endTime) {
          const eventStartMoment = moment(firstEvent.startTime, 'HH:mm:ss');
          const eventEndMoment = moment(firstEvent.endTime, 'HH:mm:ss');
          dispatch(setEventActualEndTime(eventEndMoment.toISOString()));
          const response = await axios.get(
            EXPO_PUBLIC_CLOUD_API_URL +
            `/get-channel-details/?channel_name=${user.locationId}-${user.companyId}-${user.uuid}`
          );

          if (response && response.data && response.data.master_stream_url) {
            const eventData = {
              streamUrl: response.data.master_stream_url,
              isStreamStarted: false,
              streamState: 'notlive',
              eventStartTime: eventStartMoment.toISOString(),
              eventEndTime: eventEndMoment.toISOString(),
              masterStreamUrl: response.data.master_stream_url,
            };

            dispatch(liveStreamUpdate(eventData));
          }
          const currentTime = moment();
          if (eventStartMoment.isSameOrAfter(currentTime)) {
            setTimeout(() => {
              viewStream(user, dispatch, response.data.master_stream_url, intervalId, eventEndTime,);
            }, eventStartMoment.diff(currentTime));
          }
        } else {
          console.error('Missing start or end time for event:', firstEvent);
          await logError({
            error: response.data,
            data: response.data.massege,
            details: "Error in get-channel-details API call on LiveStreamStatus Missing start or end time for event"
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    await logError({
      error: error,
      data: error.response,
      details: "Error in get-channel-details API call on LiveStreamStatus"
    });
  }
};


const viewStream = async (user, dispatch, streamUrl, intervalId, eventEndTime,) => {
  try {
    if (streamUrl) {
      checkUrlStatus(streamUrl, dispatch, intervalId, eventEndTime,);
    } else {
      console.error('No stream URL found.');
    }
  } catch (error) {
    console.error('Error viewing stream:', error);
  }
};

const checkUrlStatus = async (url, dispatch, intervalId) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
    });
     
    console.log('response.ok',response.ok)

    if (response.ok) {
      dispatch(liveStreamUpdate({ streamUrl: url, isStreamStarted: true, streamState: 'live' }));
      clearInterval(intervalId);
    }
  } catch (error) {
     console.error('error')
  }
};

const LiveStreamStatus = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth);
  const stream = useSelector(state => state.stream);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    if (user && user.role === 'user' && user.machineId) {
      console.log("useEffect 1")
      const fetchData = async () => {
        getEventsData(user, dispatch, stream, intervalId, stream.eventEndTime);
      };
      fetchData();
    }
  }, [user, stream.reStart]);

  useEffect(() => {
    if (stream.eventStartTime && stream.eventEndTime && stream.streamUrl) {
      if (intervalId) clearInterval(intervalId);
      console.log("useEffect 2")
      const newIntervalId = setInterval(() => {
        const currentTime = moment();
        if (currentTime.isSameOrAfter(stream.eventStartTime) && currentTime.isBefore(stream.eventEndTime) && stream.streamState !== 'live') {
          checkUrlStatus(stream.streamUrl, dispatch, newIntervalId,);
        }
      }, 2000);
      setIntervalId(newIntervalId);
      return () => clearInterval(newIntervalId);
    }
  }, [stream]);
  return (
    <></>
  );
};

export default LiveStreamStatus;
