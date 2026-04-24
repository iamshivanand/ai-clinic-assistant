const mongoose = require('mongoose');

const ClinicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  oauthProvider: { type: String },
  oauthId: { type: String },
  phone: { type: String },
  whatsappNumber: { type: String },
  address: { type: String },
  googleMapsUrl: { type: String },
  availableSlots: { type: [String], default: ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'] },
  subscriptionPlan: {
    type: String,
    enum: ['basic', 'pro'],
    default: 'basic'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Clinic', ClinicSchema);
