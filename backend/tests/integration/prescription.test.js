const request = require('supertest');
const express = require('express');
const prescriptionRoutes = require('../../routes/prescription');

// Mock prescriptionService
jest.mock('../../services/prescriptionService', () => ({
  generatePrescriptionPDF: jest.fn().mockResolvedValue('prescription-John-Doe-12345.pdf')
}));

// Mock Patient
jest.mock('../../models/Patient', () => ({
  findById: jest.fn().mockResolvedValue({ name: 'John Doe', phone: '1234567890' })
}));

// Mock whatsappService
jest.mock('../../services/whatsappService', () => ({
  sendDocumentMessage: jest.fn().mockResolvedValue(true)
}));

// Mock auth middleware
jest.mock('../../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock-doctor-id', name: 'Dr. Mock', role: 'DOCTOR', clinicId: 'mock-clinic' };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/prescriptions', prescriptionRoutes);

describe('Prescription Integration Tests', () => {
  it('should generate a PDF prescription', async () => {
    const res = await request(app)
      .post('/api/prescriptions/generate-and-send')
      .send({
        patientId: '5f8d0d55b54764421b7156d2',
        diagnosis: 'Fever',
        medicines: [{ name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: '5 days' }]
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toMatch(/prescriptions\/prescription-/);
  });
});
