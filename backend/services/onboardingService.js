const axios = require('axios');
const logger = require('../utils/logger');
const Clinic = require('../models/Clinic');
const { AppError } = require('../middleware/errorHandler');

class OnboardingService {
  constructor() {
    this.appId = process.env.FB_APP_ID;
    this.appSecret = process.env.FB_APP_SECRET;
  }

  async exchangeCodeForToken(code, clinicId) {
    try {
      // 1. Exchange code for user access token
      const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          code: code
        }
      });

      const accessToken = tokenResponse.data.access_token;
      logger.info(`Successfully exchanged code for access token for clinic: ${clinicId}`);

      // 2. Use token to get WABA and Phone Number ID
      // This is a simplified version; in a real flow, you'd iterate through 
      // the debug_token or shared_wabas edges to find the right assets.
      const debugResponse = await axios.get('https://graph.facebook.com/debug_token', {
        params: {
          input_token: accessToken,
          access_token: `${this.appId}|${this.appSecret}`
        }
      });

      const wabaId = debugResponse.data.data.granular_scopes?.find(s => s.scope === 'whatsapp_business_management')?.target_ids?.[0];

      // 3. Update Clinic in DB
      const updatedClinic = await Clinic.findByIdAndUpdate(clinicId, {
        metaAccessToken: accessToken,
        wabaId: wabaId,
        onboardingStatus: 'CONNECTED'
      }, { new: true });

      return updatedClinic;
    } catch (error) {
      logger.error({ message: 'WhatsApp Onboarding Error', error: error.response?.data || error.message });
      throw new AppError('Failed to complete WhatsApp onboarding', 500, 'ONBOARDING_ERROR');
    }
  }
}

module.exports = new OnboardingService();
