const mongoose = require('mongoose');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function getMasterKey() {
  const key = process.env.ENCRYPTION_MASTER_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  return Buffer.from(key.slice(0, 64), 'hex');
}

function encryptToken(text) {
  if (!text) return text;
  if (typeof text !== 'string') return text;
  // If already encrypted (format iv:authTag:encrypted), return as is
  if (text.includes(':') && text.split(':').length === 3) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptToken(encryptedPayload) {
  if (!encryptedPayload) return encryptedPayload;
  if (typeof encryptedPayload !== 'string' || !encryptedPayload.includes(':') || encryptedPayload.split(':').length !== 3) {
    return encryptedPayload; // Backward compatibility with legacy plain text
  }
  try {
    const [ivHex, authTagHex, encryptedText] = encryptedPayload.split(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, getMasterKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return encryptedPayload;
  }
}

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
    enum: ['basic', 'pro', 'STARTER_1999', 'PRO_3499', 'POLYCLINIC_7999'],
    default: 'STARTER_1999'
  },
  messageWalletBalance: { type: Number, default: 1500 },
  freeFollowUpDays: { type: Number, default: 5 },
  postVisitQueryFee: { type: Number, default: 200 },
  googleReviewLink: { type: String },
  letterheadConfig: {
    logoUrl: { type: String },
    headerHtml: { type: String },
    footerText: { type: String },
    signatureUrl: { type: String }
  },
  metaAccessToken: { type: String },
  wabaId: { type: String },
  phoneNumberId: { type: String },
  onboardingStatus: {
    type: String,
    enum: ['PENDING', 'CONNECTED', 'DISCONNECTED'],
    default: 'PENDING'
  },
  createdAt: { type: Date, default: Date.now }
});

ClinicSchema.pre('save', function(next) {
  if (this.isModified('metaAccessToken') && this.metaAccessToken) {
    this.metaAccessToken = encryptToken(this.metaAccessToken);
  }
  next();
});

ClinicSchema.methods.getDecryptedMetaToken = function() {
  return decryptToken(this.metaAccessToken);
};

ClinicSchema.statics.encryptToken = encryptToken;
ClinicSchema.statics.decryptToken = decryptToken;

module.exports = mongoose.model('Clinic', ClinicSchema);
