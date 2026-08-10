const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Clinic = require('../models/Clinic');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Message = require('../models/Message');
const bcrypt = require('bcryptjs');
const redis = require('../utils/cache');
const { z } = require('zod');
const { validate } = require('../middleware/validate');

const createClinicSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Clinic name is required'),
    ownerName: z.string().min(1, 'Owner name is required'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    doctorName: z.string().optional(),
    doctorEmail: z.string().email('Valid doctor email required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

function getLastWeekRange() {
  const now = new Date();
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  end.setDate(end.getDate() - end.getDay());
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return { start, end };
}

router.use(protect, restrictTo('SUPER_ADMIN'));

router.get('/clinics', async (req, res, next) => {
  try {
    const clinics = await Clinic.find().sort({ createdAt: -1 }).lean();

    const clinicIds = clinics.map(c => c._id);
    const clinicCounts = await Appointment.aggregate([
      { $match: { clinicId: { $in: clinicIds } } },
      { $group: { _id: '$clinicId', total: { $sum: 1 } } }
    ]);
    const countMap = {};
    clinicCounts.forEach(c => { countMap[c._id.toString()] = c.total; });

    const clinicsWithStats = clinics.map(c => ({
      _id: c._id,
      name: c.name,
      ownerName: c.ownerName,
      phone: c.phone,
      whatsappNumber: c.whatsappNumber,
      onboardingStatus: c.onboardingStatus || 'PENDING',
      subscriptionPlan: c.subscriptionPlan || 'basic',
      totalAppointments: countMap[c._id.toString()] || 0,
      createdAt: c.createdAt,
    }));

    res.json({ success: true, data: clinicsWithStats });
  } catch (error) {
    next(error);
  }
});

router.get('/clinics/:id', async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.params.id).lean();
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'Clinic not found' });
    }

    const totalPatients = await Patient.countDocuments({ clinicId: clinic._id });
    const totalAppointments = await Appointment.countDocuments({ clinicId: clinic._id });
    const recentAppointments = await Appointment.find({ clinicId: clinic._id })
      .sort({ createdAt: -1 }).limit(10).populate('patientId', 'name phone').lean();

    const thisWeek = getWeekRange();
    const lastWeek = getLastWeekRange();
    const weeklyAppointments = await Appointment.countDocuments({
      clinicId: clinic._id,
      createdAt: { $gte: thisWeek.start, $lt: thisWeek.end }
    });
    const lastWeekAppointments = await Appointment.countDocuments({
      clinicId: clinic._id,
      createdAt: { $gte: lastWeek.start, $lt: lastWeek.end }
    });

    const doctor = await User.findOne({ clinicId: clinic._id, role: 'DOCTOR' }).select('name email phone').lean();

    res.json({
      success: true,
      data: {
        clinic,
        doctor,
        stats: { totalPatients, totalAppointments, weeklyAppointments, lastWeekAppointments },
        recentAppointments,
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/clinics', validate(createClinicSchema), async (req, res, next) => {
  try {
    const { name, ownerName, email, phone, doctorName, doctorEmail, password } = req.body;

    const existingUser = await User.findOne({ email: doctorEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const clinic = await Clinic.create({
      name,
      ownerName,
      email: email || doctorEmail,
      phone,
      onboardingStatus: 'PENDING',
    });

    const doctor = await User.create({
      name: doctorName || ownerName,
      email: doctorEmail,
      password,
      role: 'DOCTOR',
      clinicId: clinic._id,
    });

    res.status(201).json({
      success: true,
      data: { clinic, doctor: { _id: doctor._id, name: doctor.name, email: doctor.email } },
      message: 'Clinic and doctor account created successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/clinics/:id', async (req, res, next) => {
  try {
    const allowedFields = ['name', 'ownerName', 'subscriptionPlan', 'onboardingStatus', 'whatsappNumber'];
    const updates = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const clinic = await Clinic.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'Clinic not found' });
    }

    res.json({ success: true, data: clinic, message: 'Clinic updated' });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics/summary', async (req, res, next) => {
  try {
    const cached = await redis.get('admin:analytics:summary');
    if (cached) return res.json({ success: true, data: JSON.parse(cached) });

    const totalClinics = await Clinic.countDocuments();
    const totalPatients = await Patient.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const connectedClinics = await Clinic.countDocuments({ onboardingStatus: 'CONNECTED' });
    const pendingClinics = await Clinic.countDocuments({ onboardingStatus: 'PENDING' });
    const completedAppts = await Appointment.countDocuments({ status: 'completed' });
    const scheduledAppts = await Appointment.countDocuments({ status: 'scheduled' });

    const data = {
      totalClinics,
      connectedClinics,
      pendingClinics,
      totalPatients,
      totalMessages,
      totalAppointments,
      completedAppointments: completedAppts,
      scheduledAppointments: scheduledAppts,
      estimatedRevenue: completedAppts * 500,
    };

    await redis.setex('admin:analytics:summary', 300, JSON.stringify(data));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
