const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const logger = require('../utils/logger');
const Appointment = require('../models/Appointment');
const Clinic = require('../models/Clinic');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const whatsappService = require('../services/whatsappService');
const { notificationQueue } = require('../queues');

router.post('/razorpay', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex');
  const signature = req.headers['x-razorpay-signature'];

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    logger.warn('Invalid Razorpay webhook signature');
    return res.status(400).send('Invalid signature');
  }

  const event = req.body.event;
  const eventId = req.body.id; // Razorpay event ID

  // Idempotency Check
  const WebhookEvent = require('../models/WebhookEvent');
  const alreadyProcessed = await WebhookEvent.findOne({ eventId });
  if (alreadyProcessed) {
    logger.info(`Webhook event ${eventId} already processed. Skipping.`);
    return res.status(200).json({ status: 'ok', duplicated: true });
  }

  // Mark as processed
  await WebhookEvent.create({ eventId, provider: 'razorpay' });

  const payload = req.body.payload.payment_link.entity;

  logger.info(`Received Razorpay event: ${event} for payment link ${payload.id}`);

  if (event === 'payment_link.paid') {
    try {
      const appointmentId = payload.notes.appointmentId;
      const appointment = await Appointment.findById(appointmentId)
        .populate('clinicId')
        .populate('doctorId')
        .populate('patientId');

      if (!appointment) {
        logger.error(`Appointment ${appointmentId} not found for payment ${payload.id}`);
        return res.status(200).send('Appointment not found');
      }

      // Update Appointment
      appointment.status = 'scheduled';
      appointment.paymentStatus = 'captured';
      appointment.paymentId = payload.payment_id;
      await appointment.save();

      // Send Confirmation via WhatsApp
      const clinic = appointment.clinicId;
      const doctor = appointment.doctorId;
      const patient = appointment.patientId;

      let confirmationMsg = `✅ Payment Successful! Your appointment with ${doctor.name} is now confirmed for ${appointment.date.toLocaleDateString()} at ${appointment.timeSlot}.`;
      
      if (clinic.address) {
        confirmationMsg += `\n\n📍 Location: ${clinic.address}`;
      }
      if (clinic.googleMapsUrl) {
        confirmationMsg += `\n🔗 Directions: ${clinic.googleMapsUrl}`;
      }

      confirmationMsg += `\n\nWe look forward to seeing you at ${clinic.name}!`;

      await whatsappService.sendTextMessage(patient.phone, confirmationMsg);

      // Schedule Reminder
      const reminderHours = doctor.notificationSettings?.reminderHoursBefore || 24;
      const now = new Date();
      const delay = (appointment.date.getTime() - now.getTime()) - (reminderHours * 60 * 60 * 1000);

      if (delay > 0) {
        await notificationQueue.add('send-reminder', {
          appointmentId: appointment._id,
          to: patient.phone,
          patientName: patient.name,
          doctorName: doctor.name,
          time: appointment.timeSlot
        }, { delay });
      }

      logger.info(`Appointment ${appointment._id} activated after successful payment.`);
    } catch (error) {
      logger.error('Error processing payment success webhook:', error);
    }
  }

  res.status(200).json({ status: 'ok' });
});

module.exports = router;
