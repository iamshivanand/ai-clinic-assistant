const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const MedicalRecord = require('../models/MedicalRecord');
const whatsappService = require('../services/whatsappService');
const { getIO } = require('../utils/socket');
const logger = require('../utils/logger');

// GET /api/dashboard/stats - Role-aware OPD & financial statistics
router.get('/stats', protect, async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId;
    if (!clinicId && req.user.role !== 'SUPER_ADMIN') {
      return res.status(400).json({ success: false, message: 'User does not belong to a clinic' });
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const query = { date: { $gte: todayStart, $lte: todayEnd } };
    if (clinicId) query.clinicId = clinicId;

    const todayAppointments = await Appointment.find(query).populate('patientId');
    const totalPatients = clinicId ? await Patient.countDocuments({ clinicId }) : 0;

    const todaysBookings = todayAppointments.length;
    const waitingCount = todayAppointments.filter(a => a.queueStatus === 'WAITING_OUTSIDE' || a.queueStatus === 'BOOKED').length;
    const inCabinCount = todayAppointments.filter(a => a.queueStatus === 'IN_CABIN').length;
    const completedCount = todayAppointments.filter(a => a.status === 'completed' || a.queueStatus === 'COMPLETED').length;

    // Financial calculations (Only for DOCTOR and SUPER_ADMIN)
    const isDoctorOrAdmin = req.user.role === 'DOCTOR' || req.user.role === 'SUPER_ADMIN';

    let upiCollected = 0;
    let cashCollected = 0;
    let fraudDiscrepancies = [];

    todayAppointments.forEach(apt => {
      const fee = apt.billingAudit?.feeAmount || 500;
      if (apt.billingAudit?.paymentMode === 'WHATSAPP_UPI' || apt.paymentStatus === 'captured') {
        upiCollected += fee;
      } else if (apt.billingAudit?.paymentMode === 'CASH_AT_DESK') {
        cashCollected += fee;
      }

      // Fraud detection check: Rx was written in cabin, but visit is marked UNPAID at reception
      if (apt.billingAudit?.rxGeneratedInCabin && (apt.billingAudit?.paymentMode === 'UNPAID' || !apt.billingAudit?.paymentMode)) {
        fraudDiscrepancies.push({
          appointmentId: apt._id,
          tokenNumber: apt.tokenNumber,
          patientName: apt.patientId?.name || 'Patient',
          feeAmount: fee
        });
      }
    });

    const responseData = {
      todaysBookings,
      totalPatients,
      waitingCount,
      inCabinCount,
      completedCount,
      conversionRate: todaysBookings > 0 ? `${Math.round((completedCount / todaysBookings) * 100)}%` : '100%'
    };

    if (isDoctorOrAdmin) {
      responseData.upiCollected = upiCollected;
      responseData.cashCollected = cashCollected;
      responseData.totalCollected = upiCollected + cashCollected;
      responseData.fraudAuditCount = fraudDiscrepancies.length;
      responseData.fraudDiscrepancies = fraudDiscrepancies;
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/appointments - Live OPD token queue
router.get('/appointments', protect, async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId;
    if (!clinicId && req.user.role !== 'SUPER_ADMIN') {
      return res.status(400).json({ success: false, message: 'User does not belong to a clinic' });
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const query = { date: { $gte: todayStart, $lte: todayEnd } };
    if (clinicId) query.clinicId = clinicId;

    const appointments = await Appointment.find(query)
      .populate('patientId')
      .populate('doctorId')
      .sort({ tokenNumber: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: appointments.map(apt => ({
        id: apt._id,
        patientId: apt.patientId?._id,
        tokenNumber: apt.tokenNumber || 1,
        patientName: apt.patientId?.name || 'Walk-in Patient',
        patientPhone: apt.patientId?.phone || '',
        patientAge: apt.patientId?.age,
        patientGender: apt.patientId?.gender,
        familyRelation: apt.patientId?.familyMembers?.find(m => m.memberId === apt.familyMemberId)?.relation || 'SELF',
        doctorName: apt.doctorId?.name || 'Dr. Sharma',
        time: apt.timeSlot,
        status: apt.status === 'completed' ? 'Completed' : 'Confirmed',
        queueStatus: apt.queueStatus || (apt.status === 'completed' ? 'COMPLETED' : 'WAITING_OUTSIDE'),
        paymentStatus: apt.paymentStatus,
        paymentMode: apt.billingAudit?.paymentMode || 'UNPAID',
        feeAmount: apt.billingAudit?.feeAmount || 500,
        rxGeneratedInCabin: apt.billingAudit?.rxGeneratedInCabin || false,
        isDiscrepancyFlagged: apt.billingAudit?.isDiscrepancyFlagged || (apt.billingAudit?.rxGeneratedInCabin && apt.billingAudit?.paymentMode === 'UNPAID'),
        triageSummary: apt.triageSummary
      }))
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/in-cabin - Active patient in cabin cockpit data
router.get('/in-cabin', protect, async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId;
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const activeApt = await Appointment.findOne({
      clinicId,
      date: { $gte: todayStart },
      queueStatus: 'IN_CABIN'
    })
      .populate('patientId')
      .populate('doctorId');

    if (!activeApt) {
      return res.status(200).json({ success: true, data: null });
    }

    // Retrieve recent medical record / biomarkers for this patient
    const medicalRecord = await MedicalRecord.findOne({
      patientId: activeApt.patientId?._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        appointmentId: activeApt._id,
        tokenNumber: activeApt.tokenNumber,
        patientId: activeApt.patientId?._id,
        patientName: activeApt.patientId?.name,
        patientPhone: activeApt.patientId?.phone,
        patientAge: activeApt.patientId?.age,
        patientGender: activeApt.patientId?.gender,
        doctorName: activeApt.doctorId?.name,
        triageSummary: activeApt.triageSummary || {
          aiPreReadBullets: [
            'Follow-up visit for ongoing symptoms',
            'No urgent contraindications flagged'
          ],
          severityFlag: 'ROUTINE'
        },
        biomarkers: medicalRecord?.extractedBiomarkers || [],
        aiSummaryBullets: medicalRecord?.aiSummaryBullets || []
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/dashboard/walk-in - Front desk receptionist adds a walk-in patient token
router.post('/walk-in', protect, async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId;
    const { name, phone, age, gender, doctorId, feeAmount = 500, symptoms } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Patient name and phone are required' });
    }

    // 1. Resolve or create patient
    let patient = await Patient.findOne({ clinicId, phone });
    if (!patient) {
      patient = await Patient.create({
        clinicId,
        name,
        phone,
        age: age ? parseInt(age, 10) : undefined,
        gender
      });
    }

    // 2. Resolve Doctor
    let doctor = doctorId ? await Doctor.findById(doctorId) : await Doctor.findOne({ clinicId, isActive: true });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'No active doctor found for this clinic' });
    }

    // 3. Compute next token number
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const tokenCount = await Appointment.countDocuments({
      clinicId,
      doctorId: doctor._id,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    const tokenNumber = tokenCount + 1;

    const appointment = await Appointment.create({
      clinicId,
      patientId: patient._id,
      doctorId: doctor._id,
      tokenNumber,
      date: new Date(),
      timeSlot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      appointmentType: 'IN_CLINIC',
      queueStatus: 'WAITING_OUTSIDE',
      status: 'scheduled',
      billingAudit: {
        feeAmount: parseFloat(feeAmount),
        paymentMode: 'UNPAID',
        collectedByUserId: req.user._id,
        rxGeneratedInCabin: false,
        isDiscrepancyFlagged: false
      },
      triageSummary: {
        symptomsTranslated: symptoms || 'Walk-in consultation',
        severityFlag: 'ROUTINE',
        aiPreReadBullets: [symptoms ? `Chief complaint: ${symptoms}` : 'Walk-in arrival']
      }
    });

    // Send WhatsApp token confirmation to walk-in patient
    try {
      await whatsappService.sendTextMessage(
        phone,
        `🎟️ *Welcome to the Clinic!*\n\n` +
        `Your walk-in OPD appointment has been registered.\n` +
        `• *Token Number:* #${tokenNumber}\n` +
        `• *Doctor:* Dr. ${doctor.name}\n` +
        `• *Status:* Waiting in lounge\n\n` +
        `We will notify you on WhatsApp the moment Dr. ${doctor.name} is ready for you.`
      );
    } catch (msgErr) {
      logger.warn('Failed to dispatch walk-in WhatsApp token confirmation:', msgErr.message);
    }

    // Emit real-time queue update
    try {
      getIO().emit('queue:updated', { clinicId, tokenNumber });
    } catch (e) {}

    res.status(201).json({
      success: true,
      data: appointment,
      message: `Token #${tokenNumber} assigned successfully`
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/dashboard/token/:id/call - Call token into doctor's cabin
router.patch('/token/:id/call', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id).populate('patientId').populate('doctorId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Update status
    appointment.queueStatus = 'IN_CABIN';
    await appointment.save();

    // Alert patient on WhatsApp
    if (appointment.patientId?.phone) {
      try {
        await whatsappService.sendTextMessage(
          appointment.patientId.phone,
          `🔔 *Token #${appointment.tokenNumber}*: Dr. ${appointment.doctorId?.name || 'Sharma'} is ready for you now. Please enter the consultation cabin.`
        );
      } catch (err) {}
    }

    // Emit socket event
    try {
      getIO().emit('queue:updated', { clinicId: req.user.clinicId, inCabinToken: appointment.tokenNumber });
    } catch (e) {}

    res.status(200).json({
      success: true,
      data: appointment,
      message: `Token #${appointment.tokenNumber} called into cabin`
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/dashboard/token/:id/pay - Mark payment collected at reception desk
router.patch('/token/:id/pay', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentMode = 'CASH_AT_DESK' } = req.body;

    const appointment = await Appointment.findById(id).populate('patientId');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (!appointment.billingAudit) {
      appointment.billingAudit = { feeAmount: 500 };
    }

    appointment.billingAudit.paymentMode = paymentMode;
    appointment.billingAudit.collectedByUserId = req.user._id;
    appointment.billingAudit.isDiscrepancyFlagged = false;
    appointment.paymentStatus = 'captured';
    await appointment.save();

    try {
      getIO().emit('queue:updated', { clinicId: req.user.clinicId });
    } catch (e) {}

    res.status(200).json({
      success: true,
      data: appointment,
      message: `Payment of ₹${appointment.billingAudit.feeAmount} recorded (${paymentMode})`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
