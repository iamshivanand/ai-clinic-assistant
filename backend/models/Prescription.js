const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  familyMemberId: { type: String, default: 'M1' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  doctorVoiceNoteUrl: { type: String },
  pdfUrl: { type: String },
  patientAudioExplainerUrl: { type: String },
  diagnosis: { type: String, required: true },
  diagnosisTags: [{ type: String }],
  chiefComplaints: [{ type: String }],
  vitals: {
    bp: { type: String },
    pulse: { type: Number },
    temp: { type: Number },
    weight: { type: Number },
    spo2: { type: Number }
  },
  medicines: [
    {
      name: String,
      dosage: String,
      duration: String,
      timing: String,
      genericSalt: String
    }
  ],
  advisedProcedure: {
    name: { type: String },
    estimatedCost: { type: Number },
    dripStatus: {
      type: String,
      enum: ['NONE', 'ACTIVE_14_DAY_DRIP', 'CONVERTED', 'DECLINED'],
      default: 'NONE'
    }
  },
  labTestsAdvised: [
    {
      testName: { type: String },
      isFasting: { type: Boolean, default: false },
      sampleCollected: { type: Boolean, default: false }
    }
  ],
  nextFollowUpDate: { type: Date },
  followUpCampaignStatus: {
    day3CheckSent: { type: Boolean, default: false },
    refillReminderSent: { type: Boolean, default: false },
    followUpBooked: { type: Boolean, default: false }
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

PrescriptionSchema.index({ clinicId: 1, nextFollowUpDate: 1, 'followUpCampaignStatus.refillReminderSent': 1 });
PrescriptionSchema.index({ clinicId: 1, diagnosisTags: 1, createdAt: -1 });
PrescriptionSchema.index({ clinicId: 1 });
PrescriptionSchema.index({ patientId: 1 });

module.exports = mongoose.model('Prescription', PrescriptionSchema);
