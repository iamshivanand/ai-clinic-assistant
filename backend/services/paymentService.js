const Razorpay = require('razorpay');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder',
    });
  }

  async createPaymentLink(appointmentId, amount, customerData) {
    try {
      const { name, email, contact } = customerData;
      
      const response = await this.razorpay.paymentLink.create({
        amount: amount * 100, // Amount in paise
        currency: "INR",
        accept_partial: false,
        expire_by: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
        reference_id: appointmentId.toString(),
        description: `Consultation Fee for Appointment ${appointmentId}`,
        customer: {
          name,
          email,
          contact
        },
        notify: {
          sms: false,
          email: true
        },
        reminder_enable: true,
        notes: {
          appointmentId: appointmentId.toString()
        },
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success`,
        callback_method: "get"
      });

      logger.info(`Payment link created for appointment ${appointmentId}: ${response.short_url}`);
      return response;
    } catch (error) {
      logger.error('Failed to create Razorpay payment link:', error);
      throw error;
    }
  }

  verifyWebhookSignature(body, signature, secret) {
    return Razorpay.validateWebhookSignature(JSON.stringify(body), signature, secret);
  }
}

module.exports = new PaymentService();
