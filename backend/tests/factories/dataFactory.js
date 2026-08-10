const mongoose = require('mongoose');

/**
 * Generate a mock User document structure with sensible defaults.
 * @param {Object} [overrides] 
 * @returns {Object}
 */
const getMockUser = (overrides = {}) => {
  const clinicId = overrides.clinicId || new mongoose.Types.ObjectId();
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Dr. Mock',
    email: 'mock-doctor@test.com',
    password: 'password123',
    role: 'DOCTOR',
    clinicId: clinicId,
    ...overrides
  };
};

/**
 * Generate a mock Patient document structure with sensible defaults.
 * @param {Object} [overrides] 
 * @returns {Object}
 */
const getMockPatient = (overrides = {}) => {
  const clinicId = overrides.clinicId || new mongoose.Types.ObjectId();
  return {
    _id: new mongoose.Types.ObjectId(),
    clinicId: clinicId,
    name: 'Mock Patient Bob',
    phone: '9999999999',
    isBotPaused: false,
  language: 'en',
    ...overrides
  };
};

/**
 * Generate a mock Appointment document structure with sensible defaults.
 * @param {Object} [overrides] 
 * @returns {Object}
 */
const getMockAppointment = (overrides = {}) => {
  const clinicId = overrides.clinicId || new mongoose.Types.ObjectId();
  const patientId = overrides.patientId || new mongoose.Types.ObjectId();
  const doctorId = overrides.doctorId || new mongoose.Types.ObjectId();
  return {
    _id: new mongoose.Types.ObjectId(),
    clinicId: clinicId,
    patientId: patientId,
    doctorId: doctorId,
    date: new Date(),
    timeSlot: '11:00 AM',
    status: 'scheduled',
    paymentStatus: 'pending',
    ...overrides
  };
};

/**
 * Generate a mock Message document structure with sensible defaults.
 * @param {Object} [overrides] 
 * @returns {Object}
 */
const getMockMessage = (overrides = {}) => {
  const clinicId = overrides.clinicId || new mongoose.Types.ObjectId();
  const patientId = overrides.patientId || new mongoose.Types.ObjectId();
  return {
    _id: new mongoose.Types.ObjectId(),
    clinicId: clinicId,
    patientId: patientId,
    sender: 'patient',
    type: 'text',
    content: 'Mock message content',
    status: 'delivered',
    timestamp: new Date(),
    ...overrides
  };
};

module.exports = {
  getMockUser,
  getMockPatient,
  getMockAppointment,
  getMockMessage
};
