const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  clinicId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Clinic', 
    required: true 
  },
  name: { type: String, required: true },
  phone: { type: String },
  regNo: { type: String },
  specialty: { type: String, required: true },
  experience: { type: String },
  bio: { type: String },
  photo: { type: String },
  availableSlots: { 
    type: [String], 
    default: ['10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'] 
  },
  consultationFee: { type: Number, default: 500 },
  notificationSettings: {
    reminderHoursBefore: { type: Number, default: 24 },
    sendFollowup: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

DoctorSchema.index({ clinicId: 1 });
DoctorSchema.index({ clinicId: 1, phone: 1 });

module.exports = mongoose.model('Doctor', DoctorSchema);
