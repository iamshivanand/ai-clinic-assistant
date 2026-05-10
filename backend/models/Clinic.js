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
  preferredLanguage: { type: String, default: 'en' },
  availableSlots: { type: [String], default: ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'] },
  subscriptionPlan: {
    type: String,
    enum: ['basic', 'pro', 'enterprise'],
    default: 'basic'
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED'],
    default: 'PENDING'
  },
  slug: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  portfolio: {
    templateId: { type: String, default: 'modern' },
    profileImage: { type: String },
    bio: { type: String },
    specialties: { type: [String], default: [] },
    achievements: [{
      year: String,
      title: String,
      description: String,
      image: String
    }],
    themeColor: { type: String, default: '#2563eb' },
    isPublished: { type: Boolean, default: false },
    socialLinks: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String
    },
    chatSettings: {
      welcomeMessage: { type: String, default: "Welcome to AI Clinic! 👋\n\nHow can I help you today?" },
      askNameMessage: { type: String, default: "It looks like it's your first time here! Please tell me your full name to get started." },
      selectDoctorMessage: { type: String, default: "Please select a specialist you'd like to book with:" },
      selectDateMessage: { type: String, default: "Excellent. You've chosen {{doctorName}}. Which date would you like to visit?" },
      selectTimeMessage: { type: String, default: "Great! What time works best for your appointment with {{doctorName}} on {{date}}?" },
      paymentRequestMessage: { type: String, default: "🗓️ Almost there! To confirm your appointment with {{doctorName}} on {{date}} at {{time}}, please pay the consultation fee of ₹{{fee}}.\n\n💳 Pay here: {{paymentLink}}" }
    }
  },
  enabledFeatures: {
    type: Map,
    of: Boolean,
    default: {
      'ai_chat': true,
      'appointments': true,
      'analytics': false,
      'prescriptions': false,
      'website_portfolio': false
    }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Clinic', ClinicSchema);
