import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';

export function setupWebsocket(io: SocketIOServer) {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    const payload = verifyToken(token as string);
    if (!payload) {
      return next(new Error('Invalid token'));
    }
    (socket as any).userId = payload.id;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`Websocket client connected: ${socket.id} (User: ${userId})`);

    // User joins their personal notification room
    socket.join(`user_${userId}`);

    // Join swap chat room
    socket.on('join_swap_room', (swapId: string) => {
      socket.join(`swap_${swapId}`);
      console.log(`User ${userId} joined room swap_${swapId}`);
    });

    // Leave swap chat room
    socket.on('leave_swap_room', (swapId: string) => {
      socket.leave(`swap_${swapId}`);
    });

    // Real-time typing indicators
    socket.on('typing_start', ({ swapId, name }: { swapId: string; name: string }) => {
      socket.to(`swap_${swapId}`).emit('user_typing', { swapId, userId, name });
    });

    socket.on('typing_stop', ({ swapId }: { swapId: string }) => {
      socket.to(`swap_${swapId}`).emit('user_stopped_typing', { swapId, userId });
    });

    socket.on('disconnect', () => {
      console.log(`Websocket client disconnected: ${socket.id}`);
    });
  });
}
