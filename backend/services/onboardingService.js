const axios = require('axios');
const logger = require('../utils/logger');
const Clinic = require('../models/Clinic');
const { AppError } = require('../middleware/errorHandler');

class OnboardingService {
  constructor() {
    this.appId = process.env.FB_APP_ID;
    this.appSecret = process.env.FB_APP_SECRET;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'ai-clinic-verify';
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

      const userAccessToken = tokenResponse.data.access_token;
      logger.info(`Successfully exchanged code for access token for clinic: ${clinicId}`);

      // 2. Get WABA ID from debug_token
      const debugResponse = await axios.get('https://graph.facebook.com/debug_token', {
        params: {
          input_token: userAccessToken,
          access_token: `${this.appId}|${this.appSecret}`
        }
      });

      const wabaId = debugResponse.data.data.granular_scopes
        ?.find(s => s.scope === 'whatsapp_business_management')
        ?.target_ids?.[0];

      if (!wabaId) {
        throw new AppError('No WhatsApp Business Account found. Please create one in Meta Business Manager.', 400, 'NO_WABA');
      }

      // 3. Get a long-lived access token (60 day validity)
      const longTokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: userAccessToken
        }
      });

      const longLivedToken = longTokenResponse.data.access_token;

      // 4. Get WABA details (including phone numbers)
      const wabaResponse = await axios.get(`https://graph.facebook.com/v18.0/${wabaId}`, {
        params: {
          fields: 'name,phone_numbers{id,display_phone_number,verified_name}',
          access_token: longLivedToken
        }
      });

      const phoneNumbers = wabaResponse.data.phone_numbers?.data || [];
      const primaryPhone = phoneNumbers[0];

      // 5. Subscribe app to WABA webhooks
      try {
        await axios.post(`https://graph.facebook.com/v18.0/${wabaId}/subscribed_apps`, {}, {
          params: {
            access_token: longLivedToken
          }
        });
        logger.info(`Subscribed app to WABA ${wabaId} webhooks`);
      } catch (webhookError) {
        logger.warn(`Webhook subscription failed (may already be subscribed): ${webhookError.response?.data || webhookError.message}`);
      }

      // 6. Register the phone number for WhatsApp Business API
      if (primaryPhone) {
        try {
          await axios.post(`https://graph.facebook.com/v18.0/${primaryPhone.id}/register`, {}, {
            params: {
              access_token: longLivedToken
            }
          });
          logger.info(`Registered phone number ${primaryPhone.id} for API use`);
        } catch (regError) {
          logger.warn(`Phone registration failed: ${regError.response?.data || regError.message}`);
        }
      }

      // 7. Update Clinic in DB
      const updatedClinic = await Clinic.findByIdAndUpdate(clinicId, {
        metaAccessToken: longLivedToken,
        wabaId: wabaId,
        phoneNumberId: primaryPhone?.id,
        whatsappNumber: primaryPhone?.display_phone_number,
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
