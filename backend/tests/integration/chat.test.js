const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const chatRoutes = require('../../routes/chat');
const Patient = require('../../models/Patient');

const doctorClinicId = new mongoose.Types.ObjectId('5f8d0d55b54764421b7156d1');

// Mock Patient model
jest.mock('../../models/Patient', () => ({
  aggregate: jest.fn().mockResolvedValue([
    { name: 'John Doe', clinicId: '5f8d0d55b54764421b7156d1' }
  ])
}));

// Mock auth middleware to simulate a logged-in doctor
jest.mock('../../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    // Inject a fake user with a specific clinicId
    req.user = {
      _id: 'mock-doctor-id',
      role: 'DOCTOR',
      clinicId: '5f8d0d55b54764421b7156d1'
    };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);

describe('Chat Integration Tests - IDOR Protection', () => {
  it('should only query patients belonging to the doctors clinic', async () => {

    const res = await request(app).get('/api/chat/patients');

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveLength(1);
    
    // Check that the aggregate query was constructed with the doctor's clinicId
    expect(Patient.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ $match: { clinicId: '5f8d0d55b54764421b7156d1' } })
      ])
    );
  });
});

