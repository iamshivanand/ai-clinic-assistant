const { MongoMemoryServer } = require('mongodb-memory-server');
const RedisMock = require('ioredis-mock');
const mock = require('mock-require');

async function startDemo() {
  console.log('🚀 Starting System in DEMO MODE...');

  // 1. Mock Redis
  mock('ioredis', RedisMock);
  console.log('✅ Redis mocked in-memory.');

  // 2. Start Mongo Memory Server
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  console.log(`✅ MongoDB started in-memory: ${uri}`);

  // 3. Seed the Database
  const mongoose = require('mongoose');
  const User = require('./models/User');
  const Clinic = require('./models/Clinic');
  const Doctor = require('./models/Doctor');

  await mongoose.connect(uri);
  
  const clinic = await Clinic.create({
    name: 'AI Test Clinic',
    address: '123 Cloud Lane',
    phone: '9999999999',
    ownerName: 'Dr. Test Admin'
  });

  await User.create({
    name: 'Dr. Test Admin',
    email: 'doctor@test.com',
    password: 'password123', // Model usually hashes this on save
    role: 'DOCTOR',
    clinicId: clinic._id
  });

  await Doctor.create({
    clinicId: clinic._id,
    name: 'Dr. Test Admin',
    specialty: 'AI Specialist'
  });

  console.log('✅ Demo data seeded: doctor@test.com / password123');
  await mongoose.disconnect();

  // 4. Start the actual server
  require('./server.js');
}

startDemo().catch(err => {
  console.error('❌ Failed to start demo:', err);
  process.exit(1);
});
