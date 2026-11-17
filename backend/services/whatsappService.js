const axios = require('axios');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const Message = require('../models/Message');
const Patient = require('../models/Patient');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN;
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    this.apiVersion = process.env.META_API_VERSION || 'v21.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;
  }

  async logMessage(to, data) {
    try {
      let { clinicId, patientId, sender, type, content } = data;

      // Auto-resolve patient if not provided
      if (!patientId && to) {
        const patient = await Patient.findOne({ phone: to });
        if (patient) {
          patientId = patient._id;
          clinicId = patient.clinicId;
        }
      }

      if (clinicId && patientId) {
        const newMessage = await Message.create({
          clinicId,
          patientId,
          sender: sender || 'bot',
          type: type || 'text',
          content,
          status: 'sent'
        });

        // Emit real-time update
        const { getIO } = require('../utils/socket');
        try {
          getIO().emit('new-message', {
            patientId,
            message: newMessage
          });
        } catch (err) {
          // Socket might not be initialized in all contexts (e.g. scripts)
        }
      }
    } catch (error) {
      logger.error('Failed to log outgoing message to DB:', error);
    }
  }

  async sendTemplate(to, templateName, languageCode = 'en_US', components = [], logData = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      await this.logMessage(to, {
        ...logData,
        type: 'template',
        content: `Template: ${templateName}`
      });

      logger.info({ message: 'WhatsApp template sent', to, templateName, messageId: response.data.messages[0].id });
      return response.data;
    } catch (error) {
      logger.error({ message: 'Failed to send WhatsApp template', error: error.response?.data || error.message });
      throw new AppError('Failed to send WhatsApp message', 500, 'WHATSAPP_SEND_ERROR');
    }
  }

  async sendTextMessage(to, text, logData = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      await this.logMessage(to, {
        ...logData,
        type: 'text',
        content: text
      });

      logger.info({ message: 'WhatsApp text message sent', to, messageId: response.data.messages[0].id });
      return response.data;
    } catch (error) {
      logger.error({ message: 'Failed to send WhatsApp text message', error: error.response?.data || error.message });
      throw new AppError('Failed to send WhatsApp message', 500, 'WHATSAPP_SEND_ERROR');
    }
  }

  async sendDocumentMessage(to, url, fileName, logData = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'document',
          document: {
            link: url,
            filename: fileName,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      await this.logMessage(to, {
        ...logData,
        type: 'document',
        content: `Document: ${fileName} (${url})`
      });

      logger.info({ message: 'WhatsApp document sent', to, fileName, messageId: response.data.messages[0].id });
      return response.data;
    } catch (error) {
      logger.error({ message: 'Failed to send WhatsApp document', error: error.response?.data || error.message });
      throw new AppError('Failed to send WhatsApp message', 500, 'WHATSAPP_SEND_ERROR');
    }
  }

  async sendInteractiveButtons(to, text, buttons, logData = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text },
            action: {
              buttons: buttons.map((b) => ({
                type: 'reply',
                reply: { id: b.id, title: b.title }
              }))
            }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      await this.logMessage(to, {
        ...logData,
        type: 'interactive',
        content: `Buttons: ${text}`
      });

      logger.info({ message: 'WhatsApp interactive buttons sent', to, messageId: response.data.messages[0].id });
      return response.data;
    } catch (error) {
      logger.error({ message: 'Failed to send WhatsApp interactive buttons', error: error.response?.data || error.message });
      throw new AppError('Failed to send WhatsApp message', 500, 'WHATSAPP_SEND_ERROR');
    }
  }

  async sendInteractiveList(to, text, buttonText, sections, logData = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'interactive',
          interactive: {
            type: 'list',
            body: { text },
            action: {
              button: buttonText,
              sections
            }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      await this.logMessage(to, {
        ...logData,
        type: 'interactive',
        content: `List: ${text}`
      });

      logger.info({ message: 'WhatsApp interactive list sent', to, messageId: response.data.messages[0].id });
      return response.data;
    } catch (error) {
      logger.error({ message: 'Failed to send WhatsApp interactive list', error: error.response?.data || error.message });
      throw new AppError('Failed to send WhatsApp message', 500, 'WHATSAPP_SEND_ERROR');
    }
  }

  /**
   * Send WhatsApp Flow message for single-screen booking
   */
  async sendFlowMessage(to, headerText, bodyText, flowId, flowCta = 'Book Appointment', flowPayload = {}, logData = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'interactive',
          interactive: {
            type: 'flow',
            header: { type: 'text', text: headerText },
            body: { text: bodyText },
            action: {
              name: 'flow',
              parameters: {
                flow_message_version: '3',
                flow_token: `flow_${Date.now()}`,
                flow_id: flowId,
                flow_cta: flowCta,
                flow_action: 'navigate',
                flow_action_payload: {
                  screen: 'APPOINTMENT_FORM',
                  data: flowPayload
                }
              }
            }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      await this.logMessage(to, {
        ...logData,
        type: 'interactive',
        content: `Flow: ${headerText} - ${bodyText}`
      });

      return response.data;
    } catch (error) {
      logger.error({ message: 'Failed to send WhatsApp Flow message', error: error.response?.data || error.message });
      throw new AppError('Failed to send WhatsApp Flow', 500, 'WHATSAPP_FLOW_ERROR');
    }
  }

  /**
   * Send Native WhatsApp UPI payment request
   */
  async sendNativeUpiOrder(to, referenceId, amountInRupees, description = 'Doctor Consultation Fee', logData = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'interactive',
          interactive: {
            type: 'order_details',
            header: { type: 'text', text: 'Consultation Fee Invoice' },
            body: { text: description },
            action: {
              name: 'review_and_pay',
              parameters: {
                reference_id: referenceId,
                type: 'digital-goods',
                payment_settings: [{
                  type: 'payment_gateway',
                  payment_gateway: {
                    type: 'razorpay',
                    configuration_name: 'clinic_primary'
                  }
                }],
                currency: 'INR',
                total_amount: {
                  value: amountInRupees * 100,
                  offset: 100
                },
                order: {
                  status: 'pending',
                  items: [{
                    retailer_id: `consult_${referenceId}`,
                    name: 'Doctor OPD Consultation',
                    amount: { value: amountInRupees * 100, offset: 100 },
                    quantity: 1
                  }]
                }
              }
            }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      await this.logMessage(to, {
        ...logData,
        type: 'interactive',
        content: `Native UPI Invoice: ₹${amountInRupees}`
      });

      return response.data;
    } catch (error) {
      logger.error({ message: 'Failed to send WhatsApp native UPI order', error: error.response?.data || error.message });
      throw new AppError('Failed to send WhatsApp native UPI order', 500, 'WHATSAPP_UPI_ERROR');
    }
  }
}

module.exports = new WhatsAppService();
