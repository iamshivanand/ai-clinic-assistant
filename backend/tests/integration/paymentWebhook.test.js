const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const paymentWebhookRoutes = require('../../routes/paymentWebhook');
const Appointment = require('../../models/Appointment');

jest.mock('../../queues', () => ({
  notificationQueue: { add: jest.fn() }
}));

jest.mock('../../models/WebhookEvent', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue(true)
}));

const mockAppointment = {
  _id: 'mock-appointment-id',
  clinicId: { address: 'test address', googleMapsUrl: 'http://test.com', name: 'Test Clinic' },
  doctorId: { name: 'Dr. Test', notificationSettings: { reminderHoursBefore: 24 } },
  patientId: { phone: '1234567890', name: 'Test Patient' },
  date: new Date(),
  timeSlot: '10:00 AM',
  save: jest.fn()
};

jest.mock('../../models/Appointment', () => ({
  findById: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    then: function(resolve) { resolve(mockAppointment); } // To simulate await Appointment.findById().populate()
  })
}));

jest.mock('../../services/whatsappService', () => ({
  sendTextMessage: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use('/api/payment', paymentWebhookRoutes);

describe('Payment Webhook Integration Tests', () => {
  const secret = 'mock_razorpay_secret';

  beforeAll(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
  });

  it('should verify signature and process payment.captured event', async () => {
    const payload = {
      event: 'payment_link.paid',
      payload: {
        payment_link: {
          entity: {
            notes: { appointmentId: 'mock-appointment-id' },
            id: 'pay_mockid'
          }
        }
      }
    };

    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const res = await request(app)
      .post('/api/payment/razorpay')
      .set('x-razorpay-signature', signature)
      .send(payload);

    expect(res.statusCode).toEqual(200);
    expect(mockAppointment.save).toHaveBeenCalled();
    expect(mockAppointment.status).toBe('scheduled');
  });

  it('should reject invalid signature', async () => {
    const res = await request(app)
      .post('/api/payment/razorpay')
      .set('x-razorpay-signature', 'invalid_sig')
      .send({});

    expect(res.statusCode).toEqual(400);
  });
});
