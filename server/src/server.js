import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocketIO } from './sockets/socketHandler.js';
import { seedDatabase } from './utils/seed.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Seed database with initial demo data if empty
    await seedDatabase();

    // 3. Create HTTP Server
    const server = http.createServer(app);

    // 4. Initialize Socket.io with robust CORS
    const io = new Server(server, {
      cors: {
        origin: [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          CLIENT_URL,
        ].filter(Boolean),
        methods: ['GET', 'POST', 'PATCH'],
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 15000,
    });

    initSocketIO(io);

    // 5. Start listening
    server.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Health Check:  http://localhost:${PORT}/health`);
      console.log(`📦 REST APIs:     http://localhost:${PORT}/api/v1/orders`);
      console.log(`⚡ JSON-RPC 2.0:  http://localhost:${PORT}/rpc`);
      console.log(`🔔 SSE Stream:    http://localhost:${PORT}/events`);
      console.log(`🔌 Socket.io:     ws://localhost:${PORT}`);
      console.log('====================================================');
    });

    // Graceful shutdown handling
    const gracefulShutdown = () => {
      console.log('Received kill signal, shutting down gracefully...');
      server.close(() => {
        console.log('Closed remaining HTTP connections');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
