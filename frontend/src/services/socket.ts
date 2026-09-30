import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = getAuthToken();
    socket = io(window.location.origin, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
