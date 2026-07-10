require('dotenv').config();
const mongoose = require('mongoose');
const Clinic = require('../../models/Clinic');
const Doctor = require('../../models/Doctor');
const Patient = require('../../models/Patient');
const Appointment = require('../../models/Appointment');

const runStressTest = async () => {
  console.log('🔥 Running Concurrency Stress Test on Booking Pipeline...');
  
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-clinic-assistant');
    
    const clinic = await Clinic.findOne({ name: 'Test Clinic' });
    const doctor = await Doctor.findOne({ name: 'Dr. Test' });

    if (!clinic || !doctor) {
      console.error('❌ Database not seeded! Please run seed.js first.');
      process.exit(1);
    }

    // Clean previous appointments for stress tests
    await Appointment.deleteMany({ doctorId: doctor._id });
    await Appointment.syncIndexes();

    const date = new Date();
    date.setDate(date.getDate() + 1); // Tomorrow
    date.setUTCHours(0, 0, 0, 0);
    const slot = '10:00 AM';

    const patientsInfo = [
      { name: 'Patient A', phone: '1111111111' },
      { name: 'Patient B', phone: '2222222222' },
      { name: 'Patient C', phone: '3333333333' }
    ];

    console.log(`⚡ Dispatching 3 concurrent booking requests for ${doctor.name} at ${slot}...`);
    
    const results = await Promise.all(
      patientsInfo.map(async (pInfo) => {
        try {
          let patient = await Patient.findOne({ phone: pInfo.phone });
          if (!patient) {
            patient = await Patient.create({
              clinicId: clinic._id,
              name: pInfo.name,
              phone: pInfo.phone
            });
          }

          const appt = await Appointment.create({
            clinicId: clinic._id,
            patientId: patient._id,
            doctorId: doctor._id,
            date,
            timeSlot: slot,
            status: 'scheduled',
            paymentStatus: 'pending'
          });

          return { success: true, appointmentId: appt._id, patientName: pInfo.name };
        } catch (err) {
          return { success: false, error: err.message, patientName: pInfo.name };
        }
      })
    );

    console.log('\n📝 Stress Test Results:');
    results.forEach((res) => {
      if (res.success) {
        console.log(`✅ [SUCCESS] Created Appointment ${res.appointmentId} for ${res.patientName}`);
      } else {
        console.log(`❌ [FAILED] Booking failed for ${res.patientName}: ${res.error}`);
      }
    });

    const count = await Appointment.countDocuments({
      doctorId: doctor._id,
      date,
      timeSlot: slot,
      status: 'scheduled'
    });

    console.log(`\n📊 Slot Analysis:`);
    console.log(`- Doctor: ${doctor.name}`);
    console.log(`- Slot: ${slot}`);
    console.log(`- Total Scheduled Appointments: ${count}`);

    if (count > 1) {
      console.log('🚨 [VULNERABILITY DETECTED] Race Condition! Double-booking allowed.');
      console.log('   The system created multiple scheduled appointments for the exact same slot.');
    } else {
      console.log('🛡️ [SECURE] No double-booking occurred.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Stress test crashed:', err);
    process.exit(1);
  }
};

runStressTest();
