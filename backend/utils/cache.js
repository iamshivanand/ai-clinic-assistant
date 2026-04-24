const Redis = require('ioredis');
const { connection } = require('../queues');
const logger = require('./logger');

const redis = new Redis(connection);

redis.on('connect', () => {
  logger.info('Redis connected for caching');
});

redis.on('error', (err) => {
  logger.error('Redis cache error:', err);
});

module.exports = redis;
