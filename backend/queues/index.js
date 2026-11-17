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

// Dedicated queue for Whisper STT, Gemini Vision OCR, TTS generation, and PDFKit rendering
const aiMediaQueue = new Queue('ai-media-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});

logger.info('Queues initialized successfully (including ai-media-queue)');

module.exports = {
  messageQueue,
  notificationQueue,
  aiMediaQueue,
  connection,
};
