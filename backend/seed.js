require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Clinic = require('./models/Clinic');
const Doctor = require('./models/Doctor');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-clinic-assistant');
    console.log('Connected to MongoDB for seeding...');

    // 1. Create a Clinic
    let clinic = await Clinic.findOne({ name: 'Test Clinic' });
    if (!clinic) {
      clinic = await Clinic.create({
        name: 'Test Clinic',
        ownerName: 'Dr. Test Owner',
        address: '123 AI Street, Tech City',
        phone: '1234567890',
        status: 'ACTIVE'
      });
      console.log('Clinic created.');
    }

    // 2. Create a User (Doctor Role)
    let user = await User.findOne({ email: 'doctor@test.com' });
    if (!user) {
      user = await User.create({
        name: 'Dr. Test',
        email: 'doctor@test.com',
        password: 'password123',
        role: 'DOCTOR',
        clinicId: clinic._id
      });
      console.log('User created.');
    }

    // 2.1 Create a Super Admin
    let superAdmin = await User.findOne({ email: 'admin@test.com' });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'Super Admin',
        email: 'admin@test.com',
        password: 'adminpassword123',
        role: 'SUPER_ADMIN'
      });
      console.log('Super Admin created.');
    }

    // 3. Create a Doctor Profile
    let doctorProfile = await Doctor.findOne({ name: 'Dr. Test' });
    if (!doctorProfile) {
      doctorProfile = await Doctor.create({
        clinicId: clinic._id,
        name: 'Dr. Test',
        specialty: 'General Physician',
        consultationFee: 500,
        availableSlots: ['10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']
      });
      console.log('Doctor profile created.');
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
