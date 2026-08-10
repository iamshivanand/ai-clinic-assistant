const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');

const router = express.Router();
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    logger.error('FATAL: JWT_SECRET not set in production');
    process.exit(1);
  }
  JWT_SECRET = 'dev_secret_key_12345';
}

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '90d'
  });
};

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    clinicId: z.string().optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, clinicId } = req.body;
    
    const newUser = await User.create({
      name,
      email,
      password,
      role: 'DOCTOR', // Prevent mass assignment of SUPER_ADMIN
      clinicId
    });

    const token = signToken(newUser._id);

    res.status(201).json({
      success: true,
      token,
      data: { user: newUser }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401, 'INVALID_CREDENTIALS'));
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: { 
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId
        } 
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
