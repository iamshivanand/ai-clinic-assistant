const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const { protect } = require('../middleware/authMiddleware');

// GET /api/chat/patients - Get list of patients with their last message
router.get('/patients', protect, async (req, res, next) => {
  try {
    const patients = await chatService.getPatientsWithLastMsg(req.user.clinicId);
    res.status(200).json({ success: true, data: patients });
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/messages/:patientId - Get chat history for a patient (paginated)
router.get('/messages/:patientId', protect, async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { before, limit } = req.query;

    const parsedLimit = limit ? parseInt(limit, 10) : 30;

    const messages = await chatService.getChatHistory(
      patientId,
      req.user.clinicId,
      before,
      parsedLimit
    );

    if (!messages) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
});

// POST /api/chat/send - Send a manual message
router.post('/send', protect, async (req, res, next) => {
  try {
    const { patientId, text } = req.body;

    const result = await chatService.sendManualMessage(patientId, req.user.clinicId, text);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/chat/toggle-bot - Pause/Resume bot for patient
router.patch('/toggle-bot', protect, async (req, res, next) => {
  try {
    const { patientId, isPaused } = req.body;

    const patient = await chatService.toggleBotStatus(patientId, req.user.clinicId, isPaused);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

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
