const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const analyticsRoutes = require('../../routes/analytics');

// Mock dependencies
jest.mock('../../models/Clinic', () => ({ countDocuments: jest.fn().mockResolvedValue(10) }));
jest.mock('../../models/Patient', () => ({ countDocuments: jest.fn().mockResolvedValue(100) }));
jest.mock('../../models/Message', () => ({ countDocuments: jest.fn().mockResolvedValue(1000) }));
jest.mock('../../models/Appointment', () => ({ find: jest.fn().mockResolvedValue(new Array(5)) }));
jest.mock('../../utils/cache', () => ({ get: jest.fn().mockResolvedValue(null), setex: jest.fn() }));

// Mock auth middleware
jest.mock('../../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock-admin-id', role: 'SUPER_ADMIN' };
    next();
  },
  restrictTo: (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).send('Forbidden');
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRoutes);

describe('Analytics Integration Tests', () => {
  it('should return aggregated summary for SUPER_ADMIN', async () => {
    const res = await request(app).get('/api/analytics/summary');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalClinics).toBe(10);
    expect(res.body.data.totalPatients).toBe(100);
    expect(res.body.data.totalMessages).toBe(1000);
    expect(res.body.data.totalRevenue).toBe(2500); // 5 appointments * 500
  });

  it('should return chart data', async () => {
    const res = await request(app).get('/api/analytics/charts');

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveLength(7);
    expect(res.body.data[0]).toHaveProperty('appointments');
  });
});
