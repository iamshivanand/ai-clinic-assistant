const request = require('supertest');
const express = require('express');
const onboardingRoutes = require('../../routes/onboarding');

// Mock onboardingService
jest.mock('../../services/onboardingService', () => ({
  exchangeCodeForToken: jest.fn().mockResolvedValue('mock-system-user-token'),
  subscribeAppToWhatsApp: jest.fn().mockResolvedValue(true)
}));

// Mock Clinic model
jest.mock('../../models/Clinic', () => ({
  findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: 'mock-clinic', wabaId: 'mock-waba', phoneNumberId: 'mock-phone' })
}));

// Mock auth middleware
jest.mock('../../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock-doctor', clinicId: 'mock-clinic' };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/onboarding', onboardingRoutes);

describe('Onboarding Integration Tests', () => {
  it('should process Meta embedded signup callback successfully', async () => {
    const res = await request(app)
      .post('/api/onboarding/exchange-code')
      .send({
        code: 'mock-auth-code',
        wabaId: 'mock-waba',
        phoneNumberId: 'mock-phone'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('WhatsApp Business Account connected successfully');
  });
});
