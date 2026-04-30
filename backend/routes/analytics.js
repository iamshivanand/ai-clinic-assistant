const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');
const Message = require('../models/Message');
const Appointment = require('../models/Appointment');

const redis = require('../utils/cache');

// GET /api/analytics/summary - Super-Admin stats
router.get('/summary', protect, restrictTo('SUPER_ADMIN'), async (req, res, next) => {
  try {
    // Try to get from cache first
    const cachedData = await redis.get('analytics:summary');
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedData)
      });
    }

    const totalClinics = await Clinic.countDocuments();
    const totalPatients = await Patient.countDocuments();
    const totalMessages = await Message.countDocuments();
    
    // Calculate revenue from completed appointments
    const appointments = await Appointment.find({ status: 'scheduled' }); // Should be 'completed' but using scheduled for now
    const totalRevenue = appointments.length * 500; // Mock average fee

    const summaryData = {
      totalClinics,
      totalPatients,
      totalMessages,
      totalRevenue,
      clinicsChange: '+5%',
      patientsChange: '+12%',
      messagesChange: '+20%',
      revenueChange: '+8%'
    };

    // Store in cache for 5 minutes (300 seconds)
    await redis.setex('analytics:summary', 300, JSON.stringify(summaryData));

    res.status(200).json({
      success: true,
      data: summaryData
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/charts - Chart data
router.get('/charts', protect, restrictTo('SUPER_ADMIN'), async (req, res, next) => {
  try {
    // Mocking chart data for now as real time-series aggregation can be complex
    const chartData = [
      { name: 'Mon', appointments: 4, messages: 24 },
      { name: 'Tue', appointments: 3, messages: 13 },
      { name: 'Wed', appointments: 2, messages: 98 },
      { name: 'Thu', appointments: 7, messages: 39 },
      { name: 'Fri', appointments: 8, messages: 48 },
      { name: 'Sat', appointments: 3, messages: 38 },
      { name: 'Sun', appointments: 4, messages: 43 },
    ];

    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/clinic - Individual clinic stats
router.get('/clinic', protect, async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId;
    if (!clinicId) return res.status(400).json({ success: false, message: 'No clinic found' });

    const totalPatients = await Patient.countDocuments({ clinicId });
    const totalMessages = await Message.countDocuments({ clinicId });
    const totalAppointments = await Appointment.countDocuments({ clinicId });
    
    // Simple conversion rate calculation
    const conversionRate = totalPatients > 0 
      ? Math.round((totalAppointments / totalPatients) * 100) 
      : 100;

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        totalMessages,
        totalAppointments,
        conversionRate,
        botInteractions: totalMessages // Mocking bot interactions as message count for now
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
