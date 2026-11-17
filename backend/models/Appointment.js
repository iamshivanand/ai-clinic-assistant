const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  familyMemberId: { type: String, default: 'M1' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  tokenNumber: { type: Number },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  appointmentType: {
    type: String,
    enum: ['IN_CLINIC', 'VIDEO_CONSULT', 'WHATSAPP_QUERY', 'FOLLOW_UP'],
    default: 'IN_CLINIC'
  },
  queueStatus: {
    type: String,
    enum: ['BOOKED', 'WAITING_OUTSIDE', 'IN_CABIN', 'COMPLETED', 'SKIPPED', 'CANCELLED'],
    default: 'BOOKED'
  },
  estimatedTurnTime: { type: Date },
  status: {
    type: String,
    enum: ['pending_payment', 'scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'pending_payment'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'captured', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: { type: String },
  paymentLink: { type: String },
  triageSummary: {
    rawVoiceUrl: { type: String },
    symptomsTranslated: { type: String },
    severityFlag: { type: String, enum: ['ROUTINE', 'URGENT_RED_FLAG'], default: 'ROUTINE' },
    aiPreReadBullets: [{ type: String }]
  },
  billingAudit: {
    feeAmount: { type: Number, default: 0 },
    paymentMode: {
      type: String,
      enum: ['WHATSAPP_UPI', 'CASH_AT_DESK', 'UNPAID', 'ONLINE'],
      default: 'UNPAID'
    },
    collectedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rxGeneratedInCabin: { type: Boolean, default: false },
    isDiscrepancyFlagged: { type: Boolean, default: false }
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Auto-assign daily token number if missing
AppointmentSchema.pre('save', async function(next) {
  if (!this.tokenNumber && this.doctorId && this.date) {
    const startOfDay = new Date(this.date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(this.date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const count = await this.constructor.countDocuments({
      clinicId: this.clinicId,
      doctorId: this.doctorId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    this.tokenNumber = count + 1;
  }
  next();
});

AppointmentSchema.index({ clinicId: 1, doctorId: 1, date: 1, status: 1, tokenNumber: 1 });
AppointmentSchema.index({ clinicId: 1, patientId: 1, createdAt: -1 });
AppointmentSchema.index({ clinicId: 1, status: 1 });
AppointmentSchema.index({
  doctorId: 1,
  date: 1,
  timeSlot: 1
}, {
  unique: true,
  partialFilterExpression: { status: 'scheduled' }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
