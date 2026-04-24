const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const webhookRoutes = require('../../routes/webhook');

// Mock queues so we don't actually process jobs
jest.mock('../../queues', () => ({
  messageQueue: {
    add: jest.fn()
  }
}));

const app = express();
// Webhook parser needs raw body for signature validation if we were doing it properly, 
// but in the app it uses express.json() and stringifies it.
app.use(express.json());
app.use('/api/webhook', webhookRoutes);

describe('Webhook Integration Tests - Signature Validation', () => {
  const secret = 'test_meta_secret';
  
  beforeAll(() => {
    process.env.META_APP_SECRET = secret;
  });

  it('should reject requests with invalid signatures', async () => {
    const payload = { object: 'whatsapp_business_account', entry: [] };
    
    const res = await request(app)
      .post('/api/webhook')
      .set('x-hub-signature-256', 'sha256=invalid_signature')
      .send(payload);

    expect(res.statusCode).toEqual(401);
    expect(res.text).toBe('Signature mismatch');
  });

  it('should accept requests with valid signatures', async () => {
    const payload = { object: 'whatsapp_business_account', entry: [] };
    
    const signatureHash = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const res = await request(app)
      .post('/api/webhook')
      .set('x-hub-signature-256', `sha256=${signatureHash}`)
      .send(payload);

    expect(res.statusCode).toEqual(200);
  });
});
