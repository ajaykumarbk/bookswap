import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';

import { initDatabase } from './database/db';
import { seedDatabase } from './database/seed';
import { setupWebsocket } from './websocket/socketHandler';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import bookRoutes from './routes/bookRoutes';
import swapRoutes from './routes/swapRoutes';
import chatRoutes from './routes/chatRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import reviewRoutes from './routes/reviewRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'BookSwap Backend Service', timestamp: new Date().toISOString() });
});

// WebSockets
setupWebsocket(io);

// Boot sequence
const PORT = process.env.PORT || 5000;

async function startServer() {
  initDatabase();
  await seedDatabase();

  server.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` 📚 BookSwap Backend Server is running on port ${PORT}`);
    console.log(` 🌐 REST API: http://localhost:${PORT}/api`);
    console.log(` ⚡ WebSockets: ws://localhost:${PORT}`);
    console.log(`=================================================`);
  });
}

startServer();
