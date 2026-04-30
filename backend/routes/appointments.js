const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointment');

// GET /api/appointments - Get all appointments for the clinic
router.get('/', protect, async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId;
    
    if (!clinicId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const appointments = await Appointment.find({ clinicId })
      .sort('-date')
      .limit(50);

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
