const crypto = require('crypto');
const logger = require('../utils/logger');

const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const appSecret = process.env.META_APP_SECRET;

  if (!signature) {
    logger.warn('Webhook signature missing');
    return res.status(401).send('Signature missing');
  }

  if (!appSecret) {
    logger.error('META_APP_SECRET not configured');
    return next(); // Skip validation if not configured (development)
  }

  const elements = signature.split('=');
  const signatureHash = elements[1];
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(req.rawBody)
    .digest('hex');

  if (signatureHash !== expectedHash) {
    logger.warn('Webhook signature mismatch');
    return res.status(401).send('Signature mismatch');
  }

  next();
};

module.exports = { verifyWebhookSignature };
