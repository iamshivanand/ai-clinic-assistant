const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['DOCTOR', 'SUPER_ADMIN', 'RECEPTIONIST', 'PHARMACIST'], 
    default: 'DOCTOR' 
  },
  clinicId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Clinic' 
    // clinicId is required for DOCTOR, RECEPTIONIST, PHARMACIST, but null for SUPER_ADMIN
  },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.index({ clinicId: 1 });

// Normalize email before saving
UserSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Method to check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
