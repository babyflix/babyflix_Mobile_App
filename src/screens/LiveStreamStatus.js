import React, { useState, useEffect } from 'react';
import moment from 'moment';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { liveStreamUpdate } from '../state/slices/streamSlice';
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLOUD_API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
     //console.log('data',data);
    if (data && data.length > 0 && resp.data["activeEventCount"] > 0) {
      const firstEvent = data[0];

      if (firstEvent.isEventScheduleOnToday) {
        if (firstEvent.startTime && firstEvent.endTime) {
          const eventStartMoment = moment(firstEvent.startTime, 'HH:mm:ss');
          const eventEndMoment = moment(firstEvent.endTime, 'HH:mm:ss');
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
        }
      }
    }
  } catch (error) {
    console.error('Error fetching events:', error);
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
      console.log('response.ok 2',response.ok)
      dispatch(liveStreamUpdate({ streamUrl: url, isStreamStarted: true, streamState: 'live' }));
      clearInterval(intervalId);
    }
  } catch (error) {
     console.log('error')
  }
};

const LiveStreamStatus = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth);
  const stream = useSelector(state => state.stream);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    console.log('useEffect 1')
    if (user && user.role === 'user' && user.machineId) {
      const fetchData = async () => {
        getEventsData(user, dispatch, stream, intervalId, stream.eventEndTime);
      };
      fetchData();
    }
  }, [user, stream.reStart]);

  useEffect(() => {
    console.log('useEffect 2')
    if (stream.eventStartTime && stream.eventEndTime && stream.streamUrl) {
      const newIntervalId = setInterval(() => {
        const currentTime = moment();
        if (currentTime.isSameOrAfter(stream.eventStartTime) && currentTime.isBefore(stream.eventEndTime)) {
          //console.log('checkUrlStatus 1',stream.isStreamStarted,stream.streamState)
          checkUrlStatus(stream.streamUrl, dispatch, newIntervalId,);
        }
      }, 2000);
      setIntervalId(newIntervalId);
    }
  }, [stream]);
  return (
    <></>
  );
};

export default LiveStreamStatus;
