const express = require('express');
const router = express.Router();
const prescriptionService = require('../services/prescriptionService');
const whatsappService = require('../services/whatsappService');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const { notificationQueue } = require('../queues');

router.post('/generate-and-send', protect, async (req, res, next) => {
  try {
    const { patientId, diagnosis, medicines, isBlank } = req.body;
    
    const patient = await Patient.findOne({ _id: patientId, clinicId: req.user.clinicId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const fileName = await prescriptionService.generatePrescriptionPDF({
      doctorName: req.user.name,
      patientName: patient.name,
      diagnosis,
      medicines,
      clinicName: 'AI Clinic', // Should fetch from DB
      clinicAddress: '123 Health St', // Should fetch from DB
      isBlank: !!isBlank
    });

    const pdfUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/prescriptions/${fileName}`;

    // Send via WhatsApp as a document
    await whatsappService.sendDocumentMessage(patient.phone, pdfUrl, isBlank ? 'Prescription_Template.pdf' : 'Prescription.pdf');

    // Update appointment status to completed
    const Appointment = require('../models/Appointment');
    const appointment = await Appointment.findOne({
      patientId,
      status: 'scheduled'
    }).sort({ date: 1 }); // Oldest scheduled appointment

    if (appointment) {
      appointment.status = 'completed';
      await appointment.save();
      logger.info(`Appointment ${appointment._id} marked as completed via prescription generation.`);
    }

    // Schedule Google Review campaign check if status is 'none'
    if (patient.googleReviewStatus === 'none') {
      const delayMs = process.env.NODE_ENV === 'production' ? 2 * 60 * 60 * 1000 : 10 * 1000; // 2h in prod, 10s in dev
      await notificationQueue.add(
        'send-review-request',
        { patientId: patient._id, clinicId: req.user.clinicId },
        { delay: delayMs }
      );
      logger.info(`Scheduled Google Review request for patient ${patient._id} in ${delayMs / 1000} seconds.`);
    }

    res.status(200).json({ 
      success: true, 
      message: isBlank ? 'Printable template generated and sent' : 'Prescription generated and sent via WhatsApp',
      url: pdfUrl 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
