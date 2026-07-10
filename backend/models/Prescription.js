const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  diagnosis: { type: String, required: true },
  medicines: [
    {
      name: String,
      dosage: String,
      duration: String
    }
  ],
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

PrescriptionSchema.index({ clinicId: 1 });
PrescriptionSchema.index({ patientId: 1 });

module.exports = mongoose.model('Prescription', PrescriptionSchema);
