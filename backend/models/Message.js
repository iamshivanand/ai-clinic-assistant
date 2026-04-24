const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  sender: {
    type: String,
    enum: ['patient', 'bot', 'doctor'],
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'interactive', 'document', 'template'],
    default: 'text'
  },
  content: { type: String, required: true },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  timestamp: { type: Date, default: Date.now }
});

MessageSchema.index({ clinicId: 1, status: 1 });
MessageSchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', MessageSchema);
