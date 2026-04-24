const pino = require('pino');

const isTestEnv = process.env.NODE_ENV === 'test';

const logger = pino(
  isTestEnv
    ? { level: 'silent' } // Disable logging completely during tests to avoid open handles
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

