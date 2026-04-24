const mongoose = require('mongoose');

const WebhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  provider: { type: String, enum: ['meta', 'razorpay'], required: true },
  processedAt: { type: Date, default: Date.now, expires: '7d' } // Auto-delete after 7 days
});

module.exports = mongoose.model('WebhookEvent', WebhookEventSchema);
