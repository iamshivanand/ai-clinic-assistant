const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const chatRoutes = require('../../routes/chat');
const Patient = require('../../models/Patient');
const { getMockPatient } = require('../factories/dataFactory');

const doctorClinicId = '5f8d0d55b54764421b7156d1';

// Mock Patient model
jest.mock('../../models/Patient', () => ({
  aggregate: jest.fn()
}));

// Mock auth middleware to simulate a logged-in doctor
jest.mock('../../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = {
      _id: 'mock-doctor-id',
      role: 'DOCTOR',
      clinicId: doctorClinicId
    };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);

describe('Chat Integration Tests - IDOR Protection', () => {
  it('should only query patients belonging to the doctors clinic', async () => {
    // Generate mock patient with the specific clinic ID using the factory
    const mockPatient = getMockPatient({ 
      name: 'John Doe', 
      clinicId: new mongoose.Types.ObjectId(doctorClinicId) 
    });
    Patient.aggregate.mockResolvedValue([mockPatient]);

    const res = await request(app).get('/api/chat/patients');

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toEqual('John Doe');
    
    // Check that the aggregate query was constructed with the doctor's clinicId as ObjectId
    expect(Patient.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ $match: { clinicId: new mongoose.Types.ObjectId(doctorClinicId) } })
      ])
    );
  });
});
