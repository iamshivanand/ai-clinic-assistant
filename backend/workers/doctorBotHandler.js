const logger = require('../utils/logger');
const whatsappService = require('../services/whatsappService');
const prescriptionService = require('../services/prescriptionService');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const Message = require('../models/Message');
const Clinic = require('../models/Clinic');
const { getIO } = require('../utils/socket');
const { aiMediaQueue } = require('../queues');

/**
 * Handles incoming WhatsApp messages from a registered Clinic Doctor.
 */
async function handleDoctorBotMessage({ clinicId, doctor, fromPhone, messageType, messageBody, raw }) {
  logger.info(`DoctorBot handling message from Dr. ${doctor.name} (${fromPhone}) - Type: ${messageType}`);

  // Handle interactive approvals (e.g. [✅ Approve & Send Rx])
  if (messageType === 'interactive') {
    const interactive = raw?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.interactive;
    const buttonId = interactive?.button_reply?.id || interactive?.list_reply?.id;

    if (buttonId && buttonId.startsWith('APPROVE_RX_')) {
      const rxId = buttonId.replace('APPROVE_RX_', '');
      return await handleApprovePrescription(doctor, fromPhone, rxId);
    }

    if (buttonId && buttonId.startsWith('EDIT_RX_')) {
      await whatsappService.sendTextMessage(
        fromPhone,
        `Dr. ${doctor.name}, please send a voice note or text with the additions/corrections for this prescription.`
      );
      return;
    }
  }

  // Handle Audio / Voice Dictation for Prescription
  if (messageType === 'audio') {
    const audioPayload = raw?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.audio;
    logger.info(`Doctor voice note received. Enqueuing DOCTOR_VOICE_TO_RX job.`);

    // Reply immediately on WhatsApp to acknowledge receipt
    await whatsappService.sendTextMessage(
      fromPhone,
      `🎙️ Audio received! Processing clinical dictation and preparing prescription draft...`
    );

    await aiMediaQueue.add('DOCTOR_VOICE_TO_RX', {
      clinicId,
      doctorId: doctor._id,
      doctorPhone: fromPhone,
      doctorName: doctor.name,
      audioId: audioPayload?.id,
      mimeType: audioPayload?.mime_type || 'audio/ogg'
    });
    return;
  }

  // Handle text commands
  const text = (messageBody || '').trim();
  const lowerText = text.toLowerCase();

  // 1. "Delay X" command (e.g. "Delay 30" or "Delay 45 mins")
  if (lowerText.startsWith('delay')) {
    const match = lowerText.match(/delay\s+(\d+)/);
    const minutes = match ? parseInt(match[1], 10) : 30;
    return await handleQueueDelay(doctor, fromPhone, minutes);
  }

  // 2. "Status" or "Queue" command
  if (lowerText === 'status' || lowerText === 'queue') {
    return await handleQueueStatus(doctor, fromPhone);
  }

  // 3. "Next" command (Advance queue to next patient)
  if (lowerText === 'next') {
    return await handleCallNextPatient(doctor, fromPhone);
  }

  // 4. Manual text Rx (e.g. "Rx Token 5: Paracetamol 650mg 1-0-1 3 days, Cetirizine 10mg 0-0-1 5 days")
  if (lowerText.startsWith('rx')) {
    return await handleTextPrescription(doctor, fromPhone, text);
  }

  // Default Doctor Menu Response
  const helpText = 
    `👨‍⚕️ *Dr. ${doctor.name} - Assistant Console*\n\n` +
    `• *Send Voice Note*: Dictate symptoms & medicines to generate instant Rx\n` +
    `• *Delay [mins]*: e.g. "Delay 30" to notify waiting patients\n` +
    `• *Status*: View today's OPD, waiting queue, & collection totals\n` +
    `• *Next*: Call next patient in queue\n` +
    `• *Rx [Token] [Medicines]*: Quick text prescription`;

  await whatsappService.sendTextMessage(fromPhone, helpText);
}

/**
 * Doctor approves generated prescription
 */
async function handleApprovePrescription(doctor, doctorPhone, rxId) {
  const rx = await Prescription.findById(rxId).populate('patientId');
  if (!rx) {
    await whatsappService.sendTextMessage(doctorPhone, 'Prescription not found or already processed.');
    return;
  }

  const patient = rx.patientId;
  const clinic = await Clinic.findById(doctor.clinicId);

  // Mark appointment completed
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const appointment = await Appointment.findOne({
    clinicId: doctor.clinicId,
    patientId: patient._id,
    doctorId: doctor._id,
    date: { $gte: today }
  }).sort({ createdAt: -1 });

  if (appointment) {
    appointment.status = 'completed';
    appointment.queueStatus = 'COMPLETED';
    appointment.billingAudit.rxGeneratedInCabin = true;
    await appointment.save();
  }

  // Send prescription document to patient WhatsApp
  const pdfUrl = rx.pdfUrl || `${process.env.BASE_URL || 'http://localhost:5000'}/prescriptions/${rx.fileName || 'prescription.pdf'}`;
  await whatsappService.sendDocumentMessage(
    patient.phone,
    pdfUrl,
    `Prescription_${patient.name.replace(/\s+/g, '_')}.pdf`
  );

  // Send patient friendly WhatsApp greeting with follow-up instructions
  await whatsappService.sendTextMessage(
    patient.phone,
    `Hello ${patient.name}, Dr. ${doctor.name} has shared your official prescription. Please find the PDF attached above. Wishing you a speedy recovery!`
  );

  // Notify Doctor of success
  await whatsappService.sendTextMessage(
    doctorPhone,
    `✅ Prescription for ${patient.name} approved & dispatched to patient's WhatsApp.`
  );

  // Emit real-time events for Doctor Dashboard & Pharmacy
  try {
    const io = getIO();
    io.emit('queue:updated', { clinicId: doctor.clinicId });
    io.emit('pharmacy:new_rx', {
      clinicId: doctor.clinicId,
      patientName: patient.name,
      patientPhone: patient.phone,
      medicines: rx.medicines,
      rxUrl: pdfUrl,
      timestamp: new Date()
    });
  } catch (e) {
    // Socket emit is optional in background jobs
  }

  // Advance queue & notify upcoming patients
  await advanceQueueAndNotify(doctor);
}

/**
 * Handle "Delay X" command
 */
async function handleQueueDelay(doctor, doctorPhone, minutes) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const pendingAppointments = await Appointment.find({
    clinicId: doctor.clinicId,
    doctorId: doctor._id,
    date: { $gte: today },
    queueStatus: { $in: ['BOOKED', 'WAITING_OUTSIDE'] }
  }).populate('patientId');

  for (const apt of pendingAppointments) {
    const currentEst = apt.estimatedTurnTime ? new Date(apt.estimatedTurnTime) : new Date();
    apt.estimatedTurnTime = new Date(currentEst.getTime() + minutes * 60000);
    await apt.save();

    // Send gentle delay notification to patient
    if (apt.patientId?.phone) {
      await whatsappService.sendTextMessage(
        apt.patientId.phone,
        `⏳ Clinic Update from Dr. ${doctor.name}:\n` +
        `Due to extended patient care in earlier consultations, the queue is running approximately ${minutes} minutes behind schedule. Your adjusted estimated time is ${apt.estimatedTurnTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      );
    }
  }

  await whatsappService.sendTextMessage(
    doctorPhone,
    `⏱️ Queue adjusted. Delayed ${pendingAppointments.length} upcoming appointments by ${minutes} minutes and notified patients.`
  );
}

/**
 * Handle "Status" command
 */
async function handleQueueStatus(doctor, doctorPhone) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const appointments = await Appointment.find({
    clinicId: doctor.clinicId,
    doctorId: doctor._id,
    date: { $gte: today }
  });

  const waitingCount = appointments.filter(a => a.queueStatus === 'WAITING_OUTSIDE').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const totalCount = appointments.length;

  let totalCollected = 0;
  let upiCollected = 0;
  let cashCollected = 0;
  let unpaidCount = 0;

  appointments.forEach(a => {
    const fee = a.billingAudit?.feeAmount || doctor.consultationFee || 0;
    if (a.billingAudit?.paymentMode === 'WHATSAPP_UPI' || a.paymentStatus === 'captured') {
      upiCollected += fee;
      totalCollected += fee;
    } else if (a.billingAudit?.paymentMode === 'CASH_AT_DESK') {
      cashCollected += fee;
      totalCollected += fee;
    } else if (a.status === 'completed') {
      unpaidCount++;
    }
  });

  const statusMsg = 
    `📊 *OPD Status Report - Dr. ${doctor.name}*\n` +
    `📅 Date: ${new Date().toLocaleDateString('en-IN')}\n\n` +
    `• Total Appointments: *${totalCount}*\n` +
    `• Completed Consultations: *${completedCount}*\n` +
    `• Currently Waiting: *${waitingCount}*\n\n` +
    `💰 *Billing Summary:*\n` +
    `• Total Collected: *₹${totalCollected.toLocaleString('en-IN')}*\n` +
    `  - WhatsApp UPI: ₹${upiCollected.toLocaleString('en-IN')}\n` +
    `  - Front-Desk Cash: ₹${cashCollected.toLocaleString('en-IN')}\n` +
    (unpaidCount > 0 ? `⚠️ *Unpaid Completed Visits:* ${unpaidCount}\n` : '');

  await whatsappService.sendTextMessage(doctorPhone, statusMsg);
}

/**
 * Handle "Next" command
 */
async function handleCallNextPatient(doctor, doctorPhone) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const nextApt = await Appointment.findOne({
    clinicId: doctor.clinicId,
    doctorId: doctor._id,
    date: { $gte: today },
    queueStatus: { $in: ['BOOKED', 'WAITING_OUTSIDE'] }
  }).sort({ tokenNumber: 1 }).populate('patientId');

  if (!nextApt) {
    await whatsappService.sendTextMessage(doctorPhone, 'No pending patients remaining in today\'s queue! 🎉');
    return;
  }

  nextApt.queueStatus = 'IN_CABIN';
  await nextApt.save();

  await whatsappService.sendTextMessage(
    doctorPhone,
    `🚪 Token #${nextApt.tokenNumber}: *${nextApt.patientId?.name}* has been called into the cabin.`
  );

  if (nextApt.patientId?.phone) {
    await whatsappService.sendTextMessage(
      nextApt.patientId.phone,
      `🔔 Token #${nextApt.tokenNumber}: Dr. ${doctor.name} is ready to see you now. Please proceed into the consultation cabin.`
    );
  }

  await advanceQueueAndNotify(doctor);
}

/**
 * Handle Quick text prescription
 */
async function handleTextPrescription(doctor, doctorPhone, text) {
  // Pattern: "Rx Token 4: Paracetamol 650mg 1-0-1 3 days"
  const match = text.match(/rx\s+(?:token\s+)?(\d+)[:\s]+(.+)/i);
  if (!match) {
    await whatsappService.sendTextMessage(
      doctorPhone,
      `Format: "Rx Token [Token#]: [Medicine Name] [Dosage] [Duration]"\nExample: "Rx Token 3: Augmentin 625 1-0-1 5 days, Pantocid 40 1-0-0 5 days"`
    );
    return;
  }

  const tokenNum = parseInt(match[1], 10);
  const rawMeds = match[2];

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const apt = await Appointment.findOne({
    clinicId: doctor.clinicId,
    doctorId: doctor._id,
    date: { $gte: today },
    tokenNumber: tokenNum
  }).populate('patientId');

  if (!apt) {
    await whatsappService.sendTextMessage(doctorPhone, `Could not find appointment for Token #${tokenNum} today.`);
    return;
  }

  // Parse comma-separated medicines
  const medItems = rawMeds.split(',').map(m => {
    const parts = m.trim().split(/\s+/);
    return {
      name: parts.slice(0, -2).join(' ') || parts[0],
      dosage: parts[parts.length - 2] || '1-0-1',
      duration: parts[parts.length - 1] || '5 days',
      timing: 'After Food'
    };
  });

  const clinic = await Clinic.findById(doctor.clinicId);
  const fileName = await prescriptionService.generatePrescriptionPDF({
    doctorName: doctor.name,
    doctorRegNo: doctor.regNo || '',
    patientName: apt.patientId?.name || 'Patient',
    tokenNumber: tokenNum,
    diagnosis: 'General OPD',
    medicines: medItems,
    clinicName: clinic?.name || 'AI Clinic',
    clinicAddress: clinic?.address || 'Healthcare Boulevard'
  });

  const rx = await Prescription.create({
    clinicId: doctor.clinicId,
    patientId: apt.patientId._id,
    doctorId: doctor._id,
    diagnosis: 'General OPD',
    medicines: medItems,
    pdfUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/prescriptions/${fileName}`
  });

  // Send approval buttons to doctor
  await whatsappService.sendInteractiveButtons(
    doctorPhone,
    `📄 *Prescription Draft for Token #${tokenNum} (${apt.patientId?.name})*\n\n` +
    medItems.map(m => `• ${m.name} | ${m.dosage} | ${m.duration}`).join('\n') +
    `\n\nTap below to approve and dispatch to patient's WhatsApp:`,
    [
      { id: `APPROVE_RX_${rx._id}`, title: '✅ Approve & Send' },
      { id: `EDIT_RX_${rx._id}`, title: '🎙️ Edit' }
    ]
  );
}

/**
 * Notifies upcoming patients in the queue
 */
async function advanceQueueAndNotify(doctor) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const queue = await Appointment.find({
    clinicId: doctor.clinicId,
    doctorId: doctor._id,
    date: { $gte: today },
    queueStatus: { $in: ['BOOKED', 'WAITING_OUTSIDE'] }
  }).sort({ tokenNumber: 1 }).populate('patientId');

  // Notify the patient who is 3rd in line
  if (queue.length >= 3 && queue[2].patientId?.phone) {
    const patientAhead = queue[2];
    await whatsappService.sendTextMessage(
      patientAhead.patientId.phone,
      `📢 Queue Update: Dr. ${doctor.name} is now seeing Token #${queue[0].tokenNumber}. Your Token #${patientAhead.tokenNumber} is just 2-3 patients away. Please ensure you are at the clinic waiting area.`
    );
  }
}

module.exports = {
  handleDoctorBotMessage
};

