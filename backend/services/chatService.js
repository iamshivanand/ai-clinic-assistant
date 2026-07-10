const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Message = require('../models/Message');
const whatsappService = require('./whatsappService');
const { getIO } = require('../utils/socket');

/**
 * Get list of patients with their last message for a specific clinic.
 * @param {string} clinicId 
 * @returns {Promise<Array>}
 */
const getPatientsWithLastMsg = async (clinicId) => {
  return await Patient.aggregate([
    { $match: { clinicId: new mongoose.Types.ObjectId(clinicId) } },
    {
      $lookup: {
        from: 'messages',
        let: { patientId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$patientId', '$$patientId'] } } },
          { $sort: { timestamp: -1 } },
          { $limit: 1 }
        ],
        as: 'lastMessageData'
      }
    },
    {
      $addFields: {
        lastMsg: { $arrayElemAt: ['$lastMessageData', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        phone: 1,
        isBotPaused: 1,
        lastMessage: { $ifNull: ['$lastMsg.content', 'No messages yet'] },
        lastMessageTime: { $ifNull: ['$lastMsg.timestamp', '$updatedAt'] },
        unread: { $literal: false }
      }
    },
    { $sort: { lastMessageTime: -1 } },
    { $limit: 20 }
  ]);
};

/**
 * Get chat history for a patient with cursor-based pagination.
 * @param {string} patientId 
 * @param {string} clinicId 
 * @param {string} [before] - Message ID to fetch messages before (cursor)
 * @param {number} [limit=30] - Number of messages to retrieve
 * @returns {Promise<Array>}
 */
const getChatHistory = async (patientId, clinicId, before = null, limit = 30) => {
  const patient = await Patient.findOne({ _id: patientId, clinicId });
  if (!patient) return null;

  const query = { patientId };
  if (before) {
    query._id = { $lt: new mongoose.Types.ObjectId(before) };
  }

  // Fetch in reverse chronological order (latest first) to retrieve the most recent window
  const messages = await Message.find(query)
    .sort({ timestamp: -1 })
    .limit(limit);

  // Return chronologically (oldest first) for UI rendering compatibility
  return messages.reverse();
};

/**
 * Send a manual doctor message.
 * @param {string} patientId 
 * @param {string} clinicId 
 * @param {string} text 
 * @returns {Promise<Object>}
 */
const sendManualMessage = async (patientId, clinicId, text) => {
  const patient = await Patient.findOne({ _id: patientId, clinicId });
  if (!patient) return null;

  await whatsappService.sendTextMessage(patient.phone, text, {
    clinicId: patient.clinicId,
    patientId: patient._id,
    sender: 'doctor'
  });

  return { success: true };
};

/**
 * Toggle chatbot paused state for a patient.
 * @param {string} patientId 
 * @param {string} clinicId 
 * @param {boolean} isPaused 
 * @returns {Promise<Object|null>}
 */
const toggleBotStatus = async (patientId, clinicId, isPaused) => {
  const patient = await Patient.findOneAndUpdate(
    { _id: patientId, clinicId },
    { isBotPaused: isPaused },
    { new: true }
  );
  if (!patient) return null;

  // Emit real-time update
  getIO().emit('bot-toggled', {
    patientId: patient._id,
    isPaused: patient.isBotPaused
  });

  return patient;
};

module.exports = {
  getPatientsWithLastMsg,
  getChatHistory,
  sendManualMessage,
  toggleBotStatus
};
