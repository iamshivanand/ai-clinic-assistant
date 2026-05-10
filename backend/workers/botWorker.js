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
const { parseTemplate } = require('../utils/templateParser');
const { t } = require('../utils/i18nHelper');

async function getCachedDoctors(clinicId) {
  const cacheKey = `clinic:${clinicId}:doctors`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const doctors = await Doctor.find({ clinicId, isActive: true });
  await redis.setex(cacheKey, 3600, JSON.stringify(doctors)); // 1 hour cache
  return doctors;
}

const botWorker = new Worker(
  'message-queue',
  async (job) => {
    const { from, messageBody, messageType, raw } = job.data;
    logger.info(`Processing ${messageType} from ${from}`);

    // 1. Get or Create Session
    let session = await sessionManager.getSession(from);
    if (!session) {
      session = { step: 'IDLE', data: {} };
    }

    // 1.5 Sync Patient & Save Message
    const clinic = await getOrCreateDefaultClinic();
    let patient = await Patient.findOne({ phone: from });
    
    // If patient doesn't exist yet, we'll create a placeholder record
    if (!patient) {
      patient = await Patient.create({
        clinicId: clinic._id,
        phone: from,
        name: 'New Patient' // Temporary name
      });
    }

    // Save incoming message to DB
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

    // 2. Handle Interactive Messages (Buttons/Lists)
    if (messageType === 'interactive') {
      const interactive = raw.entry[0].changes[0].value.messages[0].interactive;
      const buttonId = interactive.button_reply?.id;
      const listId = interactive.list_reply?.id;
      const choiceId = buttonId || listId;

      if (choiceId === 'book_appointment') {
        await handleBookAppointment(from, session);
        return;
      }

      if (session.step === 'SELECTING_DOCTOR' && choiceId) {
        await handleDoctorSelection(from, choiceId, session);
        return;
      }

      if (session.step === 'SELECTING_DATE' && choiceId) {
        await handleDateSelection(from, choiceId, session);
        return;
      }

      if (session.step === 'SELECTING_TIME' && choiceId) {
        await handleTimeSelection(from, choiceId, session);
        return;
      }
    }

    // 3. Handle Text Messages & State Transitions
    switch (session.step) {
      case 'IDLE':
        if (messageBody.toLowerCase().includes('hi') || messageBody.toLowerCase().includes('hello')) {
          await sendWelcomeMessage(from);
        } else if (messageBody.toLowerCase().includes('book')) {
          await handleBookAppointment(from, session);
        } else {
          await whatsappService.sendTextMessage(from, "I'm sorry, I didn't quite get that. Reply with 'Hi' to start.");
        }
        break;

      case 'AWAITING_NAME':
        await handleNameInput(from, messageBody, session);
        break;

      case 'SELECTING_DOCTOR':
        await handleDoctorSelection(from, messageBody, session);
        break;

      case 'SELECTING_DATE':
        await handleDateSelection(from, messageBody, session);
        break;

      case 'SELECTING_TIME':
        await handleTimeSelection(from, messageBody, session);
        break;

      default:
        logger.warn(`Unhandled state ${session.step} for ${from}`);
    }
  },
  { connection }
);

async function sendWelcomeMessage(to) {
  const clinic = await getOrCreateDefaultClinic();
  const lang = clinic.preferredLanguage || 'en';
  const message = clinic.portfolio?.chatSettings?.welcomeMessage || t(lang, 'welcome');
  
  await whatsappService.sendInteractiveButtons(
    to, 
    message,
    [{ id: 'book_appointment', title: '📅 Book Appointment' }]
  );
  await sessionManager.setSession(to, { step: 'IDLE' });
}

async function handleBookAppointment(to, session) {
  const patient = await Patient.findOne({ phone: to });
  const clinic = await getOrCreateDefaultClinic();
  const lang = clinic.preferredLanguage || 'en';
  const doctors = await getCachedDoctors(clinic._id);

  if (!patient) {
    const message = clinic.portfolio?.chatSettings?.askNameMessage || t(lang, 'ask_name');
    await whatsappService.sendTextMessage(to, message);
    await sessionManager.setSession(to, { step: 'AWAITING_NAME' });
    return;
  }

  if (doctors.length === 0) {
    await whatsappService.sendTextMessage(to, t(lang, 'not_available'));
    return;
  }

  const rows = doctors.map(doc => ({
    id: doc._id.toString(),
    title: doc.name,
    description: doc.specialty
  }));

  const message = clinic.portfolio?.chatSettings?.selectDoctorMessage || t(lang, 'select_doctor');

  await whatsappService.sendInteractiveList(
    to,
    message,
    "Select Doctor",
    [{ title: "Available Specialists", rows }]
  );

  await sessionManager.setSession(to, { 
    step: 'SELECTING_DOCTOR', 
    data: { patientId: patient._id, doctors: doctors.map(d => ({ id: d._id, name: d.name })) } 
  });
}

async function handleNameInput(to, name, session) {
  const clinic = await getOrCreateDefaultClinic();
  const doctors = await getCachedDoctors(clinic._id);

  const rows = doctors.map(doc => ({
    id: doc._id.toString(),
    title: doc.name,
    description: doc.specialty
  }));

  await whatsappService.sendInteractiveList(
    to,
    `Thanks, ${name}! Please select a specialist:`,
    "Select Doctor",
    [{ title: "Available Specialists", rows }]
  );

  await sessionManager.updateSession(to, { 
    step: 'SELECTING_DOCTOR', 
    data: { tempName: name, doctors: doctors.map(d => ({ id: d._id, name: d.name })) } 
  });
}

async function handleDoctorSelection(to, choiceId, session) {
  const doctor = session.data.doctors.find(d => d.id === choiceId);

  if (!doctor) {
    await whatsappService.sendTextMessage(to, "Please select a doctor from the list provided.");
    return;
  }

  const clinic = await getOrCreateDefaultClinic();
  const lang = clinic.preferredLanguage || 'en';
  const template = clinic.portfolio?.chatSettings?.selectDateMessage || t(lang, 'select_date');
  const message = parseTemplate(template, { doctorName: doctor.name });

  await whatsappService.sendInteractiveButtons(
    to,
    message,
    [
      { id: 'date_tomorrow', title: 'Tomorrow' },
      { id: 'date_day_after', title: 'Day after tomorrow' }
    ]
  );

  await sessionManager.updateSession(to, { 
    step: 'SELECTING_DATE', 
    data: { ...session.data, chosenDoctorId: doctor.id, chosenDoctorName: doctor.name } 
  });
}

async function handleDateSelection(to, choiceId, session) {
  let dateLabel = '';
  let dateObj = new Date();

  if (choiceId === 'date_tomorrow') {
    dateLabel = 'Tomorrow';
    dateObj.setDate(dateObj.getDate() + 1);
  } else if (choiceId === 'date_day_after') {
    dateLabel = 'Day after tomorrow';
    dateObj.setDate(dateObj.getDate() + 2);
  } else {
    const clinic = await getOrCreateDefaultClinic();
    const lang = clinic.preferredLanguage || 'en';
    await whatsappService.sendTextMessage(to, t(lang, 'invalid_selection'));
    return;
  }

  const Doctor = require('../models/Doctor');
  const doctor = await Doctor.findById(session.data.chosenDoctorId);
  
  const slots = doctor?.availableSlots || ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];
  
  const rows = slots.map((slot, index) => ({
    id: `slot_${index}`,
    title: slot
  }));

  const clinic = await getOrCreateDefaultClinic();
  const lang = clinic.preferredLanguage || 'en';
  const template = clinic.portfolio?.chatSettings?.selectTimeMessage || t(lang, 'select_time');
  const message = parseTemplate(template, { doctorName: session.data.chosenDoctorName, date: dateLabel });

  await whatsappService.sendInteractiveList(
    to,
    message,
    "Select Time Slot",
    [{ title: "Available Slots", rows }]
  );

  await sessionManager.updateSession(to, { 
    step: 'SELECTING_TIME', 
    data: { ...session.data, chosenDate: dateObj.toISOString(), dateLabel, slots } 
  });
}

async function handleTimeSelection(to, choiceId, session) {
  const clinic = await getOrCreateDefaultClinic();
  const doctor = await Doctor.findById(session.data.chosenDoctorId);
  
  const slots = session.data.slots || ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];
  const choiceIndex = parseInt(choiceId.replace('slot_', ''));
  const timeLabel = slots[choiceIndex];

  if (!timeLabel) {
    await whatsappService.sendTextMessage(to, "Please select a time slot from the list provided.");
    return;
  }

  try {
    let patientId = session.data.patientId;

    // 1. Create Patient if new
    if (!patientId) {
      const newPatient = await Patient.create({
        clinicId: clinic._id,
        name: session.data.tempName,
        phone: to
      });
      patientId = newPatient._id;
    }

    // 2. Create Appointment (Status is pending_payment by default)
    const appointment = await Appointment.create({
      clinicId: clinic._id,
      patientId: patientId,
      doctorId: session.data.chosenDoctorId,
      date: new Date(session.data.chosenDate),
      timeSlot: timeLabel,
    });

    // 2.5 Generate Payment Link
    const paymentService = require('../services/paymentService');
    const paymentLinkResponse = await paymentService.createPaymentLink(
      appointment._id, 
      doctor.consultationFee || 500,
      {
        name: session.data.tempName || 'Patient',
        email: `${to}@ai-clinic.com`, // Fallback email
        contact: to
      }
    );

    // Save payment link details
    appointment.paymentId = paymentLinkResponse.id;
    appointment.paymentLink = paymentLinkResponse.short_url;
    await appointment.save();

    // 3. Send Payment Request
    const lang = clinic.preferredLanguage || 'en';
    const template = clinic.portfolio?.chatSettings?.paymentRequestMessage || t(lang, 'payment_request');
    const paymentMsg = parseTemplate(template, {
      doctorName: session.data.chosenDoctorName,
      date: session.data.dateLabel,
      time: timeLabel,
      fee: doctor.consultationFee || 500,
      paymentLink: paymentLinkResponse.short_url
    });

    await whatsappService.sendTextMessage(to, paymentMsg);
    
    // 4. Clear Session
    await sessionManager.deleteSession(to);
    logger.info(`Payment link sent to ${to} for appointment ${appointment._id}`);
  } catch (error) {
    logger.error('Failed to finalize booking or create payment link:', error);
    await whatsappService.sendTextMessage(to, "I'm sorry, I encountered an error while processing your payment link. Please try again later.");
  }
}

botWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

botWorker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed with error: ${err.message}`);
});

module.exports = botWorker;
