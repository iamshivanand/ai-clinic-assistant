const { Queue } = require('bullmq');
const logger = require('../utils/logger');

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
};

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

const messageQueue = new Queue('message-queue', { connection, defaultJobOptions });
const notificationQueue = new Queue('notification-queue', { connection, defaultJobOptions });

logger.info('Queues initialized successfully');

module.exports = { messageQueue, notificationQueue, connection };
