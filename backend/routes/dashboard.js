const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

// GET /api/dashboard/stats
router.get('/stats', protect, async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId;
    if (!clinicId) {
      return res.status(400).json({ success: false, message: 'User does not belong to a clinic' });
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const todaysBookings = await Appointment.countDocuments({
      clinicId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['scheduled', 'completed'] }
    });

    const totalPatients = await Patient.countDocuments({ clinicId });

    // Calculate conversion rate: paid/scheduled vs total attempts
    const totalAttempts = await Appointment.countDocuments({ clinicId });
    const paidAppointments = await Appointment.countDocuments({
      clinicId,
      status: { $in: ['scheduled', 'completed'] }
    });
    const conversionRate = totalAttempts > 0 
      ? Math.round((paidAppointments / totalAttempts) * 100) 
      : 100;

    res.status(200).json({
      success: true,
      data: {
        todaysBookings,
        totalPatients,
        conversionRate: `${conversionRate}%`
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/appointments - Today's appointments list
router.get('/appointments', protect, async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId;
    if (!clinicId) {
      return res.status(400).json({ success: false, message: 'User does not belong to a clinic' });
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      clinicId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['scheduled', 'completed'] }
    })
    .populate('patientId')
    .sort({ timeSlot: 1 });

    res.status(200).json({
      success: true,
      data: appointments.map(apt => ({
        id: apt._id,
        patientName: apt.patientId?.name || 'Unknown Patient',
        time: apt.timeSlot,
        status: apt.status === 'completed' ? 'Completed' : 'Confirmed',
        type: 'Consultation' // Static fallback
      }))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
