import { io } from 'socket.io-client';
import { EXPO_PUBLIC_API_URL } from '@env';

let socket;

export const connectSocket = (userUuid) => {
  socket = io(EXPO_PUBLIC_API_URL, {
    transports: ['websocket'],
    query: { userUuid },
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

