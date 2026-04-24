const express = require('express');
const router = express.Router();
const prescriptionService = require('../services/prescriptionService');
const whatsappService = require('../services/whatsappService');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

router.post('/generate-and-send', protect, async (req, res, next) => {
  try {
    const { patientId, diagnosis, medicines } = req.body;
    
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const fileName = await prescriptionService.generatePrescriptionPDF({
      doctorName: req.user.name,
      patientName: patient.name,
      diagnosis,
      medicines,
      clinicName: 'AI Clinic', // Should fetch from DB
      clinicAddress: '123 Health St' // Should fetch from DB
    });

    // In a real app, you'd upload this to S3 and get a public URL.
    // For now, we'll assume a public static path.
    const pdfUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/prescriptions/${fileName}`;

    // Send via WhatsApp as a document
    await whatsappService.sendDocumentMessage(patient.phone, pdfUrl, 'Prescription.pdf');

    res.status(200).json({ 
      success: true, 
      message: 'Prescription generated and sent via WhatsApp',
      url: pdfUrl 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
