const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  familyMemberId: { type: String, default: 'M1', required: true },
  recordType: {
    type: String,
    enum: [
      'LAB_REPORT',
      'OLD_HANDWRITTEN_RX',
      'MEDICINE_STRIP_CHECK',
      'HOME_VITALS_LCD',
      'MEAL_PLATE_PHOTO',
      'PROGRESS_PHOTO'
    ],
    required: true
  },
  mediaUrl: { type: String, required: true },
  extractedBiomarkers: [
    {
      name: { type: String }, // e.g. 'HbA1c', 'Creatinine'
      value: { type: Number },
      unit: { type: String },
      referenceRange: { type: String },
      isAbnormal: { type: Boolean, default: false }
    }
  ],
  aiSummaryBullets: [{ type: String }],
  safetyVerificationResult: {
    isMatchWithActiveRx: { type: Boolean },
    discrepancyWarning: { type: String }
  }
}, { timestamps: true });

medicalRecordSchema.index({ clinicId: 1, patientId: 1, familyMemberId: 1, createdAt: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);

