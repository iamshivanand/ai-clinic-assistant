const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, errorCode = 'INTERNAL_ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.errorCode = err.errorCode || 'INTERNAL_ERROR';

  logger.error({
    message: err.message,
    stack: err.stack,
    errorCode: err.errorCode,
    path: req.path,
    method: req.method,
  });

  res.status(err.statusCode).json({
    success: false,
    error: {
      code: err.errorCode,
      message: err.isOperational ? err.message : 'Something went wrong',
      details: err.details || [],
    },
  });
};

module.exports = { AppError, errorHandler };
