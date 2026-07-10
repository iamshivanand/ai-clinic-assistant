const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const chatRoutes = require('../../routes/chat');
const prescriptionRoutes = require('../../routes/prescription');
const Patient = require('../../models/Patient');

// Mock dependencies
jest.mock('../../models/Patient');
jest.mock('../../models/Appointment');
jest.mock('../../services/whatsappService');
jest.mock('../../services/prescriptionService');

// Mock auth middleware to simulate a doctor from Clinic A
jest.mock('../../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = {
      _id: 'doctor-1',
      name: 'Dr. Clinic A',
      role: 'DOCTOR',
      clinicId: 'clinic-a-id'
    };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);
app.use('/api/prescription', prescriptionRoutes);

describe('Security and IDOR Protection Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/chat/messages/:patientId - Chat History IDOR', () => {
    it('should reject access if the patient belongs to a different clinic', async () => {
      // Mock patient lookup to return null (signifying not found within Doctor A's clinic scope)
      Patient.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/chat/messages/patient-from-clinic-b');

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Patient not found');
      
      // Ensure it queried with clinicId protection
      expect(Patient.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'patient-from-clinic-b',
          clinicId: 'clinic-a-id'
        })
      );
    });
  });

  describe('POST /api/prescription/generate-and-send - Prescription IDOR', () => {
    it('should prevent generating prescriptions for patients from another clinic', async () => {
      Patient.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/prescription/generate-and-send')
        .send({
          patientId: 'patient-from-clinic-b',
          diagnosis: 'Cold',
          medicines: []
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Patient not found');
      
      // Ensure lookup was scoped to Dr. Clinic A's clinicId
      expect(Patient.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'patient-from-clinic-b',
          clinicId: 'clinic-a-id'
        })
      );
    });
  });
});
