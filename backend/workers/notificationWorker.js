const { Worker } = require('bullmq');
const { connection } = require('../queues');
const logger = require('../utils/logger');
const whatsappService = require('../services/whatsappService');
const Appointment = require('../models/Appointment');

const notificationWorker = new Worker(
  'notification-queue',
  async (job) => {
    const { appointmentId, to, patientName, doctorName, time } = job.data;
    
    if (job.name === 'send-reminder') {
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
    } 
    
    else if (job.name === 'check-appointment-completion') {
      logger.info(`Checking completion status for appointment ${appointmentId} to ${to}`);

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment || appointment.status === 'cancelled') {
        logger.info(`Appointment ${appointmentId} does not exist or was cancelled. Skipping follow-up.`);
        return;
      }

      if (appointment.status === 'completed') {
        // Send interactive check-in buttons
        await whatsappService.sendInteractiveButtons(
          to,
          `Hello ${patientName}! 👋 How are you feeling now after your consultation today?`,
          [
            { id: 'recovering_well', title: 'Recovering Well' },
            { id: 'need_consultation', title: 'Need Consultation' }
          ]
        );
        logger.info(`Interactive post-care follow-up sent for completed appointment ${appointmentId}`);
        return;
      }

      if (appointment.status === 'scheduled') {
        // Ask the patient if the appointment took place
        await whatsappService.sendInteractiveButtons(
          to,
          `Hi ${patientName}! 👋 We wanted to check if your scheduled consultation with ${doctorName} today was completed successfully?`,
          [
            { id: `confirm_completed_${appointmentId}`, title: 'Yes, it was' },
            { id: `confirm_missed_${appointmentId}`, title: 'No, I missed it' }
          ]
        );
        logger.info(`Verification buttons sent to ${to} for appointment ${appointmentId}`);
      }
    }
    
    else if (job.name === 'send-review-request') {
      const { patientId } = job.data;
      const Patient = require('../models/Patient');
      const patient = await Patient.findById(patientId);
      if (!patient || patient.googleReviewStatus !== 'none') {
        logger.info(`Skipping review request for patient ${patientId} (status: ${patient?.googleReviewStatus})`);
        return;
      }

      logger.info(`Sending Google review campaign request to ${patient.phone}`);
      
      patient.googleReviewStatus = 'requested';
      await patient.save();

      const clinicReviewLink = process.env.CLINIC_REVIEW_LINK || 'https://g.page/r/example-clinic/review';
      const messageText = `Hi ${patient.name}! 👋 We hope you are recovering well. Would you mind leaving a review for our clinic on Google? It helps others find us!\n\nReview link: ${clinicReviewLink}`;
      
      await whatsappService.sendInteractiveButtons(
        patient.phone,
        messageText,
        [
          { id: 'google_review_done', title: "I've left a review" },
          { id: 'google_review_skip', title: 'Maybe later' }
        ]
      );
    }
  },
  { connection }
);

notificationWorker.on('failed', (job, err) => {
  logger.error(`Notification job ${job.id} failed: ${err.message}`);
});

module.exports = notificationWorker;
