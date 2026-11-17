const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  memberId: { type: String, required: true }, // e.g. 'M1', 'M2'
  name: { type: String, required: true },
  age: { type: Number },
  dob: { type: Date },
  gender: { type: String, enum: ['M', 'F', 'OTHER', 'Male', 'Female'] },
  relation: { type: String, enum: ['SELF', 'SPOUSE', 'CHILD', 'PARENT', 'OTHER'], default: 'SELF' },
  abhaId: { type: String },
  bloodGroup: { type: String },
  allergies: [{ type: String }],
  chronicConditions: [{ type: String }]
}, { _id: false });

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
  familyMembers: { type: [familyMemberSchema], default: [] },
  activeMemberId: { type: String, default: 'M1' },
  freeChatWindowExpiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Ensure a primary family member exists if familyMembers is empty
PatientSchema.pre('save', function(next) {
  if (this.familyMembers.length === 0 && this.name) {
    this.familyMembers.push({
      memberId: 'M1',
      name: this.name,
      age: this.age,
      gender: this.gender,
      relation: 'SELF'
    });
  }
  next();
});

PatientSchema.index({ clinicId: 1, phone: 1 });
PatientSchema.index({ clinicId: 1, 'familyMembers.chronicConditions': 1 });

module.exports = mongoose.model('Patient', PatientSchema);
