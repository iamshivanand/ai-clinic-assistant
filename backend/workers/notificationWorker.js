const { Worker } = require('bullmq');
const { connection } = require('../queues');
const logger = require('../utils/logger');
const whatsappService = require('../services/whatsappService');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const Prescription = require('../models/Prescription');
const hi = require('../lang/hi');
const en = require('../lang/en');

function getStrings(language) {
  return language === 'hi' ? hi : en;
}

const notificationWorker = new Worker(
  'notification-queue',
  async (job) => {
    const strings = getStrings(job.data?.language || 'en');

    // 1. Appointment Reminder
    if (job.name === 'send-reminder') {
      const { appointmentId, to, patientName, doctorName, time } = job.data;
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

    // 2. Post-Consultation Follow-up Check
    else if (job.name === 'check-appointment-completion') {
      const { appointmentId, to, patientName, doctorName } = job.data;
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

    // 3. Sentiment-Gated Google Review Booster (Upgraded 2-Hour Job)
    else if (job.name === 'send-review-request') {
      const { patientId, doctorName = 'Dr. Sharma' } = job.data;
      const patient = await Patient.findById(patientId);
      if (!patient || patient.googleReviewStatus !== 'none') {
        logger.info(`Skipping review request for patient ${patientId} (status: ${patient?.googleReviewStatus})`);
        return;
      }

      logger.info(`Sending Sentiment-Gated Google Review inquiry to ${patient.phone}`);
      patient.googleReviewStatus = 'requested';
      await patient.save();

      const ratingPrompt =
        `Hello ${patient.name}! 🙏\n\n` +
        `How was your consultation experience with ${doctorName} today? Please tap an option below:`;

      await whatsappService.sendInteractiveButtons(
        patient.phone,
        ratingPrompt,
        [
          { id: 'gmb_rating_5', title: '⭐ 5 - Excellent' },
          { id: 'gmb_rating_4', title: '⭐ 4 - Good' },
          { id: 'gmb_rating_1_3', title: '⭐ Needs Work' }
        ]
      );
    }

    // 4. Day-3 Acute Recovery Check-In
    else if (job.name === 'day-3-acute-check') {
      const { patientId, patientName, to, doctorName = 'Dr. Sharma' } = job.data;
      logger.info(`Sending Day-3 acute recovery check-in to ${to}`);

      const followUpMsg =
        `Namaste ${patientName}! It has been 3 days since your consultation with ${doctorName}. Are your symptoms improving?`;

      await whatsappService.sendInteractiveButtons(
        to,
        followUpMsg,
        [
          { id: 'recovering_well', title: '✅ Feeling Better' },
          { id: 'need_consultation', title: '🩺 Still Symptoms' }
        ]
      );
    }

    // 5. Day-25 Chronic Refill Loop
    else if (job.name === 'day-25-chronic-refill') {
      const { patientId, patientName, to, doctorName = 'Dr. Sharma' } = job.data;
      logger.info(`Sending Day-25 chronic refill reminder to ${to}`);

      const refillMsg =
        `Namaste ${patientName}! Your monthly maintenance medication prescribed by ${doctorName} is running close to the end of the course.\n\n` +
        `Would you like to schedule your routine repeat check-up?`;

      await whatsappService.sendInteractiveButtons(
        to,
        refillMsg,
        [
          { id: 'book_appointment', title: '📅 Book Check-Up' },
          { id: 'recovering_well', title: '💊 Already Refilled' }
        ]
      );
    }

    // 6. Nightly 9:30 PM Doctor CEO Briefing & Fraud Audit
    else if (job.name === 'nightly-ceo-briefing') {
      const { doctorId } = job.data;
      const doctor = await Doctor.findById(doctorId);
      if (!doctor || !doctor.phone) return;

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const appointments = await Appointment.find({
        doctorId: doctor._id,
        date: { $gte: today }
      });

      const totalCompleted = appointments.filter(a => a.status === 'completed').length;
      let upiTotal = 0;
      let cashTotal = 0;
      let fraudDiscrepancies = 0;

      appointments.forEach(a => {
        const fee = a.billingAudit?.feeAmount || doctor.consultationFee || 0;
        if (a.billingAudit?.paymentMode === 'WHATSAPP_UPI' || a.paymentStatus === 'captured') {
          upiTotal += fee;
        } else if (a.billingAudit?.paymentMode === 'CASH_AT_DESK') {
          cashTotal += fee;
        }

        // Fraud detection: Rx generated in cabin but reception marked visit UNPAID
        if (a.billingAudit?.rxGeneratedInCabin && a.billingAudit?.paymentMode === 'UNPAID') {
          fraudDiscrepancies++;
        }
      });

      const briefing =
        `🌙 *Good Evening Dr. ${doctor.name} - Nightly Clinic Briefing*\n` +
        `📅 Date: ${new Date().toLocaleDateString('en-IN')}\n\n` +
        `👥 *Total OPD Seen Today:* ${totalCompleted}\n` +
        `💳 *WhatsApp UPI Collections:* ₹${upiTotal.toLocaleString('en-IN')}\n` +
        `💵 *Front-Desk Cash Collected:* ₹${cashTotal.toLocaleString('en-IN')}\n` +
        `💰 *Gross Clinic Revenue:* ₹${(upiTotal + cashTotal).toLocaleString('en-IN')}\n\n` +
        (fraudDiscrepancies > 0
          ? `⚠️ *Audit Alert:* ${fraudDiscrepancies} consultation(s) had prescriptions written in cabin but were left UNPAID at reception. Check your dashboard.\n`
          : `✅ *Front-Desk Audit:* 100% of cabin visits reconciled with reception payments.`);

      await whatsappService.sendTextMessage(doctor.phone, briefing);
      logger.info(`Nightly CEO briefing delivered to Dr. ${doctor.name}`);
    }
  },
  { connection }
);

notificationWorker.on('failed', (job, err) => {
  logger.error(`Notification job ${job?.id} failed: ${err.message}`);
});

module.exports = notificationWorker;
