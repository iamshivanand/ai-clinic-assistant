const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { messageQueue } = require('../queues');
const { AppError } = require('../middleware/errorHandler');

const { verifyWebhookSignature } = require('../middleware/webhookValidator');

// GET /api/webhook - Meta Verification Challenge
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      logger.info('Webhook verified successfully');
      return res.status(200).send(challenge);
    } else {
      logger.warn('Webhook verification failed: Invalid token');
      return res.sendStatus(403);
    }
  }
});

// POST /api/webhook - Handle incoming messages
router.post('/', verifyWebhookSignature, async (req, res, next) => {
  try {
    const { body } = req;
    
    // Quick validation of the payload structure
    if (!body.object || !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      // Not a message event, return 200 to acknowledge
      return res.sendStatus(200);
    }

    const message = body.entry[0].changes[0].value.messages[0];
    const eventId = message.id; // WhatsApp Message ID (wamid)
    const from = message.from;
    const messageBody = message.text?.body || '';
    const messageType = message.type;

    // Idempotency Check
    const WebhookEvent = require('../models/WebhookEvent');
    const alreadyProcessed = await WebhookEvent.findOne({ eventId });
    if (alreadyProcessed) {
      logger.info(`WhatsApp message ${eventId} already queued. Skipping.`);
      return res.sendStatus(200);
    }

    logger.info(`Received WhatsApp ${messageType} from ${from} (ID: ${eventId})`);

    // Push to Queue for async processing
    await messageQueue.add('incoming-message', {
      from,
      messageBody,
      messageType,
      metadata: body.entry[0].changes[0].value.metadata,
      raw: body
    });

    // Mark as processed (Only after successful queuing)
    await WebhookEvent.create({ eventId, provider: 'meta' });

    // Always respond 200 immediately to Meta
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
