const pino = require('pino');

const isTestEnv = process.env.NODE_ENV === 'test';
const isProdEnv = process.env.NODE_ENV === 'production';

const logger = pino(
  isTestEnv
    ? { level: 'silent' } // Disable logging completely during tests to avoid open handles
    : isProdEnv
      ? { level: 'info' } // Output raw structured JSON in production for fast logging & indexing
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        }
);

module.exports = logger;

