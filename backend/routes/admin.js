const express = require('express');
const Clinic = require('../models/Clinic');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to protect admin routes
const protectAdmin = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in!', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key_12345');
    const user = await User.findById(decoded.id);

    if (!user || user.role !== 'SUPER_ADMIN') {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

router.use(protectAdmin);

// Get all clinics
router.get('/clinics', async (req, res, next) => {
  try {
    const clinics = await Clinic.find().sort('-createdAt');
    res.status(200).json({
      success: true,
      data: { clinics }
    });
  } catch (error) {
    next(error);
  }
});

// Update clinic (Approval, Features, Plan)
router.patch('/clinics/:id', async (req, res, next) => {
  try {
    const { status, subscriptionPlan, enabledFeatures } = req.body;
    
    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      { status, subscriptionPlan, enabledFeatures },
      { new: true, runValidators: true }
    );

    if (!clinic) {
      return next(new AppError('No clinic found with that ID', 404));
    }

    res.status(200).json({
      success: true,
      data: { clinic }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
