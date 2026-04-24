const express = require('express');
const router = express.Router();
const onboardingService = require('../services/onboardingService');
const { protect } = require('../middleware/authMiddleware');

router.post('/exchange-code', protect, async (req, res, next) => {
  try {
    const { code } = req.body;
    const clinicId = req.user.clinicId;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const updatedClinic = await onboardingService.exchangeCodeForToken(code, clinicId);

    res.status(200).json({
      success: true,
      data: updatedClinic,
      message: 'WhatsApp Business Account connected successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
