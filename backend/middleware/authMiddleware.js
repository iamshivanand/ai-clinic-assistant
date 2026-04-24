const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { AppError } = require('./errorHandler');
const User = require('../models/User');
const logger = require('../utils/logger');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  logger.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_12345';

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please login to get access.', 401, 'UNAUTHORIZED'));
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    // Grant access
    req.user = currentUser;
    next();
  } catch (error) {
    next(new AppError('Invalid token. Please login again.', 401, 'INVALID_TOKEN'));
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
