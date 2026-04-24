const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const Message = require('../models/Message');

// GET /api/chat/patients - Get list of patients with their last message
router.get('/patients', protect, async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId;

    const patientsWithLastMsg = await Patient.aggregate([
      { $match: { clinicId: clinicId } },
      {
        $lookup: {
          from: 'messages',
          let: { patientId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$patientId', '$$patientId'] } } },
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ],
          as: 'lastMessageData'
        }
      },
      {
        $addFields: {
          lastMsg: { $arrayElemAt: ['$lastMessageData', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          phone: 1,
          isBotPaused: 1,
          lastMessage: { $ifNull: ['$lastMsg.content', 'No messages yet'] },
          lastMessageTime: { $ifNull: ['$lastMsg.timestamp', '$updatedAt'] },
          unread: { $literal: false } // Placeholder
        }
      },
      { $sort: { lastMessageTime: -1 } },
      { $limit: 20 }
    ]);

    res.status(200).json({ success: true, data: patientsWithLastMsg });
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/messages/:patientId - Get chat history for a patient
router.get('/messages/:patientId', protect, async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.patientId, clinicId: req.user.clinicId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const messages = await Message.find({ patientId: req.params.patientId })
      .sort({ timestamp: 1 })
      .limit(50);
    
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
});

// POST /api/chat/send - Send a manual message
router.post('/send', protect, async (req, res, next) => {
  try {
    const { patientId, text } = req.body;
    
    const patient = await Patient.findOne({ _id: patientId, clinicId: req.user.clinicId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    // Send via WhatsApp and log it as 'doctor' sender
    await whatsappService.sendTextMessage(patient.phone, text, {
      clinicId: patient.clinicId,
      patientId: patient._id,
      sender: 'doctor'
    });

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/chat/toggle-bot - Pause/Resume bot for patient
router.patch('/toggle-bot', protect, async (req, res, next) => {
  try {
    const { patientId, isPaused } = req.body;
    
    const patient = await Patient.findOneAndUpdate(
      { _id: patientId, clinicId: req.user.clinicId },
      { isBotPaused: isPaused },
      { new: true }
    );
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    // Emit real-time update
    const { getIO } = require('../utils/socket');
    getIO().emit('bot-toggled', {
      patientId: patient._id,
      isPaused: patient.isBotPaused
    });

    res.status(200).json({ 
      success: true, 
      message: `Bot ${isPaused ? 'paused' : 'resumed'} for patient`,
      data: patient
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
