const { Worker } = require('bullmq');
const { connection } = require('../queues');
const logger = require('../utils/logger');
const whatsappService = require('../services/whatsappService');
const sessionManager = require('../utils/sessionManager');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Clinic = require('../models/Clinic');
const Message = require('../models/Message');
const { getOrCreateDefaultClinic } = require('../utils/clinicHelper');
const redis = require('../utils/redis');
const Doctor = require('../models/Doctor');
const { detectLanguage, isHindiGreeting, isHindiBooking } = require('../lang/detect');
const hi = require('../lang/hi');
const en = require('../lang/en');

function t(patient, key, ...args) {
  const lang = patient?.language || 'en';
  const strings = lang === 'hi' ? hi : en;
  const val = strings[key];
  return typeof val === 'function' ? val(...args) : val;
}

async function getCachedDoctors(clinicId) {
  const cacheKey = `clinic:${clinicId}:doctors`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const doctors = await Doctor.find({ clinicId, isActive: true });
  await redis.setex(cacheKey, 3600, JSON.stringify(doctors));
  return doctors;
}

const botWorker = new Worker(
  'message-queue',
  async (job) => {
    const { from, messageBody, messageType, raw } = job.data;
    logger.info(`Processing ${messageType} from ${from}`);

    let session = await sessionManager.getSession(from);
    if (!session) {
      session = { step: 'IDLE', data: {} };
    }

    const clinic = await getOrCreateDefaultClinic();
    let patient = await Patient.findOne({ phone: from });

    if (!patient) {
      const detectedLang = detectLanguage(messageBody);
      patient = await Patient.create({
        clinicId: clinic._id,
        phone: from,
        name: 'New Patient',
        language: detectedLang,
      });
    }

    await Message.create({
      clinicId: clinic._id,
      patientId: patient._id,
      sender: 'patient',
      type: messageType === 'interactive' ? 'interactive' : 'text',
      content: messageBody || (messageType === 'interactive' ? 'User clicked a button' : 'Media/Other'),
      status: 'delivered'
    });

    if (patient.isBotPaused) {
      logger.info(`Bot is paused for ${from}. Ignoring message for human takeover.`);
      return;
    }

    if (messageType === 'interactive') {
      const interactive = raw.entry[0].changes[0].value.messages[0].interactive;
      const buttonId = interactive.button_reply?.id;
      const listId = interactive.list_reply?.id;
      const choiceId = buttonId || listId;

      if (choiceId && (choiceId.startsWith('confirm_completed_') || choiceId.startsWith('confirm_missed_'))) {
        await handleAppointmentCompletionConfirmation(from, choiceId, session, patient);
        return;
      }

      if (choiceId === 'google_review_done') {
        patient.googleReviewStatus = 'completed';
        await patient.save();
        const msg = patient.language === 'hi' ? hi.reviewDoneResponse : en.reviewDoneResponse;
        await whatsappService.sendTextMessage(from, msg);
        return;
      }

      if (choiceId === 'google_review_skip') {
        const msg = patient.language === 'hi' ? hi.reviewSkipResponse : en.reviewSkipResponse;
        await whatsappService.sendTextMessage(from, msg);
        return;
      }

      if (choiceId === 'recovering_well') {
        const msg = patient.language === 'hi' ? hi.recoveringWellResponse : en.recoveringWellResponse;
        await whatsappService.sendTextMessage(from, msg);
        return;
      }

      if (choiceId === 'need_consultation') {
        const msg = patient.language === 'hi' ? hi.needConsultationResponse : en.needConsultationResponse;
        await whatsappService.sendTextMessage(from, msg);
        await handleBookAppointment(from, session, patient);
        return;
      }

      if (choiceId === 'book_appointment') {
        await handleBookAppointment(from, session, patient);
        return;
      }

      if (session.step === 'SELECTING_DOCTOR' && choiceId) {
        await handleDoctorSelection(from, choiceId, session, patient);
        return;
      }

      if (session.step === 'SELECTING_DATE' && choiceId) {
        await handleDateSelection(from, choiceId, session, patient);
        return;
      }

      if (session.step === 'SELECTING_TIME' && choiceId) {
        await handleTimeSelection(from, choiceId, session, patient);
        return;
      }
    }

    const lang = patient.language || 'en';
    const strings = lang === 'hi' ? require('../lang/hi') : require('../lang/en');

    switch (session.step) {
      case 'IDLE': {
        const { isHindiGreeting, isHindiBooking } = require('../lang/detect');
        if (isHindiGreeting(messageBody) || messageBody.toLowerCase().includes('hi') || messageBody.toLowerCase().includes('hello')) {
          await sendWelcomeMessage(from, patient);
        } else if (isHindiBooking(messageBody) || messageBody.toLowerCase().includes('book')) {
          await handleBookAppointment(from, session, patient);
        } else {
          await whatsappService.sendTextMessage(from, strings.fallback);
        }
        break;
      }

      case 'AWAITING_NAME':
        await handleNameInput(from, messageBody, session, patient);
        break;

      case 'SELECTING_DOCTOR':
        await handleDoctorSelection(from, messageBody, session, patient);
        break;

      case 'SELECTING_DATE':
        await handleDateSelection(from, messageBody, session, patient);
        break;

      case 'SELECTING_TIME':
        await handleTimeSelection(from, messageBody, session, patient);
        break;

      default:
        logger.warn(`Unhandled state ${session.step} for ${from}`);
    }
  },
  { connection }
);

async function sendWelcomeMessage(to, patient) {
  const strings = patient.language === 'hi' ? require('../lang/hi') : require('../lang/en');
  await whatsappService.sendInteractiveButtons(
    to,
    strings.welcome,
    strings.welcomeButtons
  );
  await sessionManager.setSession(to, { step: 'IDLE' });
}

async function handleBookAppointment(to, session, patient) {
  const strings = patient.language === 'hi' ? require('../lang/hi') : require('../lang/en');
  const clinic = await getOrCreateDefaultClinic();
  const doctors = await getCachedDoctors(clinic._id);

  if (!patient || patient.name === 'New Patient') {
    await whatsappService.sendTextMessage(to, strings.askName);
    await sessionManager.setSession(to, { step: 'AWAITING_NAME', data: { patientId: patient?._id } });
    return;
  }

  if (doctors.length === 0) {
    await whatsappService.sendTextMessage(to, strings.noDoctors);
    return;
  }

  const rows = doctors.map(doc => ({
    id: doc._id.toString(),
    title: doc.name,
    description: doc.specialty
  }));

  await whatsappService.sendInteractiveList(
    to,
    strings.selectDoctor,
    strings.selectDoctorButton,
    [{ title: strings.availableSpecialists, rows }]
  );

  await sessionManager.setSession(to, {
    step: 'SELECTING_DOCTOR',
    data: { patientId: patient._id, doctors: doctors.map(d => ({ id: d._id, name: d.name })) }
  });
}

async function handleNameInput(to, name, session, patient) {
  const strings = patient.language === 'hi' ? require('../lang/hi') : require('../lang/en');
  const clinic = await getOrCreateDefaultClinic();
  const doctors = await getCachedDoctors(clinic._id);

  const rows = doctors.map(doc => ({
    id: doc._id.toString(),
    title: doc.name,
    description: doc.specialty
  }));

  await whatsappService.sendInteractiveList(
    to,
    strings.thanksName(name),
    strings.selectDoctorButton,
    [{ title: strings.availableSpecialists, rows }]
  );

  await sessionManager.updateSession(to, {
    step: 'SELECTING_DOCTOR',
    data: {
      patientId: session.data?.patientId,
      tempName: name,
      doctors: doctors.map(d => ({ id: d._id, name: d.name }))
    }
  });
}

async function handleDoctorSelection(to, choiceId, session, patient) {
  const strings = patient.language === 'hi' ? require('../lang/hi') : require('../lang/en');
  const doctor = session.data.doctors.find(d => d.id === choiceId);

  if (!doctor) {
    await whatsappService.sendTextMessage(to, strings.selectDoctorPrompt);
    return;
  }

  await whatsappService.sendInteractiveButtons(
    to,
    strings.doctorChosen(doctor.name),
    [
      { id: 'date_tomorrow', title: strings.tomorrow },
      { id: 'date_day_after', title: strings.dayAfter }
    ]
  );

  await sessionManager.updateSession(to, {
    step: 'SELECTING_DATE',
    data: { ...session.data, chosenDoctorId: doctor.id, chosenDoctorName: doctor.name }
  });
}

async function handleDateSelection(to, choiceId, session, patient) {
  const strings = patient.language === 'hi' ? require('../lang/hi') : require('../lang/en');
  let dateLabel = '';
  let dateObj = new Date();

  if (choiceId === 'date_tomorrow') {
    dateLabel = strings.tomorrow;
    dateObj.setDate(dateObj.getDate() + 1);
  } else if (choiceId === 'date_day_after') {
    dateLabel = strings.dayAfter;
    dateObj.setDate(dateObj.getDate() + 2);
  } else {
    await whatsappService.sendTextMessage(to, strings.selectDatePrompt);
    return;
  }

  dateObj.setUTCHours(0, 0, 0, 0);

  const Doctor = require('../models/Doctor');
  const doctor = await Doctor.findById(session.data.chosenDoctorId);

  const slots = doctor?.availableSlots || ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];

  const rows = slots.map((slot, index) => ({
    id: `slot_${index}`,
    title: slot
  }));

  await whatsappService.sendInteractiveList(
    to,
    strings.selectTime(session.data.chosenDoctorName, dateLabel),
    strings.selectTimeButton,
    [{ title: strings.availableSlots, rows }]
  );

  await sessionManager.updateSession(to, {
    step: 'SELECTING_TIME',
    data: { ...session.data, chosenDate: dateObj.toISOString(), dateLabel, slots }
  });
}

async function handleTimeSelection(to, choiceId, session, patient) {
  const strings = patient.language === 'hi' ? require('../lang/hi') : require('../lang/en');
  const clinic = await getOrCreateDefaultClinic();
  const doctor = await Doctor.findById(session.data.chosenDoctorId);

  const slots = session.data.slots || ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];
  const choiceIndex = parseInt(choiceId.replace('slot_', ''));
  const timeLabel = slots[choiceIndex];

  if (!timeLabel) {
    await whatsappService.sendTextMessage(to, strings.selectTimePrompt);
    return;
  }

  try {
    let patientId = session.data.patientId;

    if (!patientId) {
      let patient = await Patient.findOne({ phone: to });
      if (!patient) {
        patient = await Patient.create({
          clinicId: clinic._id,
          name: session.data.tempName || 'New Patient',
          phone: to,
          language: patient.language || 'en',
        });
      } else if (session.data.tempName) {
        patient.name = session.data.tempName;
        await patient.save();
      }
      patientId = patient._id;
    } else if (session.data.tempName) {
      await Patient.findByIdAndUpdate(patientId, { name: session.data.tempName });
    }

    const existingAppt = await Appointment.findOne({
      clinicId: clinic._id,
      doctorId: session.data.chosenDoctorId,
      date: new Date(session.data.chosenDate),
      timeSlot: timeLabel,
      status: { $in: ['scheduled', 'pending_payment'] }
    });
    if (existingAppt) {
      logger.warn(`Double-booking prevented for slot ${timeLabel} on ${session.data.chosenDate}`);
      await whatsappService.sendTextMessage(to, strings.slotTaken || "I'm sorry, this time slot has just been booked by another patient. Please select a different time.");
      await sessionManager.updateSession(to, { step: 'SELECTING_TIME', data: session.data });
      return;
    }

    const appointment = await Appointment.create({
      clinicId: clinic._id,
      patientId: patientId,
      doctorId: session.data.chosenDoctorId,
      date: new Date(session.data.chosenDate),
      timeSlot: timeLabel,
      status: 'scheduled',
      paymentStatus: 'pending'
    });

    let patientName = session.data.tempName;
    if (!patientName && patientId) {
      const existingPatient = await Patient.findById(patientId);
      patientName = existingPatient?.name;
    }
    patientName = patientName || 'Patient';

    const { notificationQueue } = require('../queues');
    const now = Date.now();
    const apptTime = new Date(session.data.chosenDate).getTime();

    const reminderDelay = Math.max(apptTime - now - (24 * 60 * 60 * 1000), 10 * 1000);
    await notificationQueue.add('send-reminder', {
      appointmentId: appointment._id,
      to,
      patientName,
      doctorName: session.data.chosenDoctorName,
      time: timeLabel,
      language: patient.language,
    }, { delay: reminderDelay });

    const followUpDelay = Math.max(apptTime - now + (1 * 60 * 60 * 1000), 30 * 1000);
    await notificationQueue.add('check-appointment-completion', {
      appointmentId: appointment._id,
      to,
      patientName,
      doctorName: session.data.chosenDoctorName,
      time: timeLabel,
      language: patient.language,
    }, { delay: followUpDelay });

    const confirmMsg = strings.confirmAppointment(
      session.data.chosenDoctorName,
      session.data.dateLabel,
      timeLabel,
      clinic.name,
      clinic.address
    );

    await whatsappService.sendTextMessage(to, confirmMsg);

    await sessionManager.deleteSession(to);
    logger.info(`Appointment ${appointment._id} confirmed directly for ${to}`);
  } catch (error) {
    if (error.code === 11000) {
      logger.warn(`Duplicate key error - double booking prevented for slot ${timeLabel}`);
      await whatsappService.sendTextMessage(to, strings.slotTaken || "I'm sorry, this time slot has just been booked by another patient. Please select a different time.");
      await sessionManager.updateSession(to, { step: 'SELECTING_TIME', data: session.data });
      return;
    }
    logger.error('Failed to finalize booking:', error);
    await whatsappService.sendTextMessage(to, strings.error);
  }
}

async function handleAppointmentCompletionConfirmation(to, choiceId, session, patient) {
  const strings = patient.language === 'hi' ? require('../lang/hi') : require('../lang/en');
  const isCompleted = choiceId.startsWith('confirm_completed_');
  const appointmentId = choiceId.replace(isCompleted ? 'confirm_completed_' : 'confirm_missed_', '');

  try {
    const appointment = await Appointment.findById(appointmentId).populate('doctorId');
    if (!appointment) {
      await whatsappService.sendTextMessage(to, "Sorry, I couldn't find this appointment record.");
      return;
    }

    if (isCompleted) {
      appointment.status = 'completed';
      await appointment.save();

      await whatsappService.sendTextMessage(to, strings.completedResponse);
      logger.info(`Appointment ${appointmentId} confirmed completed by patient.`);
    } else {
      appointment.status = 'no-show';
      await appointment.save();

      await whatsappService.sendInteractiveButtons(
        to,
        strings.missedResponse,
        [{ id: 'book_appointment', title: strings.bookAppointment }]
      );

      await sessionManager.setSession(to, { step: 'IDLE' });
      logger.info(`Appointment ${appointmentId} marked as no-show by patient. Prompted to reschedule.`);
    }
  } catch (err) {
    logger.error('Error handling appointment completion confirmation:', err);
    await whatsappService.sendTextMessage(to, strings.error);
  }
}

botWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

botWorker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed with error: ${err.message}`);
});

module.exports = botWorker;
