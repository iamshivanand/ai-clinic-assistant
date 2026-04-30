const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  logger.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_12345';

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '90d'
  });
};

const Clinic = require('../models/Clinic');

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, clinicName, ownerName } = req.body;
    
    // 1. Create the Clinic in PENDING state
    const newClinic = await Clinic.create({
      name: clinicName || `${name}'s Clinic`,
      ownerName: ownerName || name,
      email: email,
      status: 'PENDING'
    });

    // 2. Create the User linked to the Clinic
    const newUser = await User.create({
      name,
      email,
      password,
      role: 'DOCTOR',
      clinicId: newClinic._id
    });

    const token = signToken(newUser._id);

    res.status(201).json({
      success: true,
      token,
      data: { 
        user: newUser,
        clinic: newClinic
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400, 'BAD_REQUEST'));
    }

    const user = await User.findOne({ email }).select('+password').populate('clinicId');
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
          clinic: user.clinicId // This is now populated
        } 
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
