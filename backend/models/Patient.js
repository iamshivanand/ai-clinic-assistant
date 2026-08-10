const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  age: { type: Number },
  gender: { type: String },
  medicalHistory: { type: String },
  tags: [{ type: String }],
  lastVisit: { type: Date },
  isBotPaused: { type: Boolean, default: false },
  language: { type: String, enum: ['en', 'hi'], default: 'en' },
  googleReviewStatus: {
    type: String,
    enum: ['none', 'requested', 'completed'],
    default: 'none'
  },
  createdAt: { type: Date, default: Date.now }
});

PatientSchema.index({ clinicId: 1, phone: 1 });

module.exports = mongoose.model('Patient', PatientSchema);
