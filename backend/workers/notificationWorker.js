const { Worker } = require('bullmq');
const { connection } = require('../queues');
const logger = require('../utils/logger');
const whatsappService = require('../services/whatsappService');
const Appointment = require('../models/Appointment');

const notificationWorker = new Worker(
  'notification-queue',
  async (job) => {
    const { appointmentId, to, patientName, doctorName, time } = job.data;
    logger.info(`Sending reminder for appointment ${appointmentId} to ${to}`);

    // Check if appointment is still scheduled (not cancelled)
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.status !== 'scheduled') {
      logger.info(`Appointment ${appointmentId} is no longer active. Skipping reminder.`);
      return;
    }

    const message = `Hello ${patientName}! 👋\n\nThis is a friendly reminder for your appointment with ${doctorName} at ${time}.\n\nWe look forward to seeing you!`;
    
    await whatsappService.sendTextMessage(to, message);
    logger.info(`Reminder sent to ${to} for appointment ${appointmentId}`);
  },
  { connection }
);

notificationWorker.on('failed', (job, err) => {
  logger.error(`Notification job ${job.id} failed: ${err.message}`);
});

module.exports = notificationWorker;
