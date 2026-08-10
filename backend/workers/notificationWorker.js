const { Worker } = require('bullmq');
const { connection } = require('../queues');
const logger = require('../utils/logger');
const whatsappService = require('../services/whatsappService');
const Appointment = require('../models/Appointment');
const hi = require('../lang/hi');
const en = require('../lang/en');

function getStrings(language) {
  return language === 'hi' ? hi : en;
}

const notificationWorker = new Worker(
  'notification-queue',
  async (job) => {
    const { appointmentId, to, patientName, doctorName, time, language } = job.data;
    const strings = getStrings(language || 'en');

    if (job.name === 'send-reminder') {
      logger.info(`Sending reminder for appointment ${appointmentId} to ${to}`);

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment || appointment.status !== 'scheduled') {
        logger.info(`Appointment ${appointmentId} is no longer active. Skipping reminder.`);
        return;
      }

      const message = strings.reminder(patientName, doctorName, time);

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
        await whatsappService.sendInteractiveButtons(
          to,
          strings.postCare(patientName),
          [
            { id: 'recovering_well', title: strings.recoveringWell },
            { id: 'need_consultation', title: strings.needConsultation }
          ]
        );
        logger.info(`Interactive post-care follow-up sent for completed appointment ${appointmentId}`);
        return;
      }

      if (appointment.status === 'scheduled') {
        await whatsappService.sendInteractiveButtons(
          to,
          strings.completionCheck(patientName, doctorName),
          [
            { id: `confirm_completed_${appointmentId}`, title: strings.completed },
            { id: `confirm_missed_${appointmentId}`, title: strings.missed }
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

      const strings = (patient.language || 'en') === 'hi' ? hi : require('../lang/en');
      const clinicReviewLink = process.env.CLINIC_REVIEW_LINK || 'https://g.page/r/example-clinic/review';
      const messageText = `${strings.reviewRequest(patient.name)}\n\nReview link: ${clinicReviewLink}`;

      await whatsappService.sendInteractiveButtons(
        patient.phone,
        messageText,
        [
          { id: 'google_review_done', title: strings.reviewDone },
          { id: 'google_review_skip', title: strings.reviewSkip }
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
