require('dotenv').config();
const mongoose = require('mongoose');
const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');
const Message = require('../models/Message');
const User = require('../models/User');

const seedE2E = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-clinic-assistant');
    console.log('Connected to MongoDB for E2E seeding...');

    // 1. Find or create Clinic
    let clinic = await Clinic.findOne({ name: 'Test Clinic' });
    if (!clinic) {
      clinic = await Clinic.create({
        name: 'Test Clinic',
        address: '123 AI Street, Tech City',
        phone: '1234567890'
      });
    }

    // Clean existing test users to prevent hash mismatch
    await User.deleteMany({ email: { $in: ['doctor@test.com', 'admin@test.com'] } });

    // Seed Doctor User
    let doctorUser = await User.create({
      name: 'Dr. Test',
      email: 'doctor@test.com',
      password: 'password123',
      role: 'DOCTOR',
      clinicId: clinic._id
    });

    // Seed Super Admin User
    let superAdminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'SUPER_ADMIN',
      clinicId: clinic._id
    });
    console.log('E2E Users seeded.');

    // Clean existing test patients/messages
    await Patient.deleteMany({ phone: '1234567890' });
    
    // 2. Create Patient
    const patient = await Patient.create({
      clinicId: clinic._id,
      name: 'Test Patient Alice',
      phone: '1234567890',
      isBotPaused: false
    });
    console.log('E2E Patient seeded.');

    // 3. Create Messages
    await Message.deleteMany({ patientId: patient._id });
    await Message.create([
      {
        clinicId: clinic._id,
        patientId: patient._id,
        sender: 'patient',
        type: 'text',
        content: 'Hello Dr. Test!',
        status: 'delivered',
        timestamp: new Date(Date.now() - 60000)
      },
      {
        clinicId: clinic._id,
        patientId: patient._id,
        sender: 'bot',
        type: 'text',
        content: 'Hi Alice! How can I help you today?',
        status: 'sent',
        timestamp: new Date()
      }
    ]);
    console.log('E2E Messages seeded.');

    console.log('E2E Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('E2E Seeding failed:', err);
    process.exit(1);
  }
};

seedE2E();
