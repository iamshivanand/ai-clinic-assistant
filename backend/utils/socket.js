const { Server } = require('socket.io');
const logger = require('./logger');

const { createAdapter } = require('@socket.io/redis-adapter');

let io;

const init = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  // Enable Redis adapter in production for multi-instance scaling
  if (process.env.NODE_ENV === 'production' || process.env.USE_REDIS_SOCKETS === 'true') {
    try {
      const Redis = require('ioredis');
      const pubClient = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
      });
      const subClient = pubClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.io Redis adapter initialized successfully');
    } catch (err) {
      logger.error('Failed to initialize Socket.io Redis adapter:', err);
    }
  }

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    
    socket.on('join', (room) => {
      socket.join(room);
      logger.info(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { init, getIO };
