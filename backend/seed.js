require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Clinic = require('./models/Clinic');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const MedicalRecord = require('./models/MedicalRecord');
const Prescription = require('./models/Prescription');

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-clinic-assistant';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for seeding...');

    // Clean previous test data
    await User.deleteMany({ email: { $in: ['doctor@test.com', 'receptionist@test.com', 'pharmacist@test.com', 'admin@test.com'] } });
    await Clinic.deleteMany({ name: 'Apollo Care Polyclinic' });

    // 1. Create Polyclinic Tenant
    const clinic = await Clinic.create({
      name: 'Apollo Care Polyclinic',
      ownerName: 'Dr. Sandeep Sharma',
      email: 'contact@apollocare.internal',
      phone: '919876543210',
      whatsappNumber: '919876543210',
      address: '42 Health Boulevard, Bandra West, Mumbai',
      subscriptionPlan: 'PRO_3499',
      messageWalletBalance: 3000,
      freeFollowUpDays: 5,
      postVisitQueryFee: 200,
      googleReviewLink: 'https://g.page/r/apollo-care-demo/review',
      letterheadConfig: {
        headerHtml: 'Apollo Care Polyclinic • Centre for Advanced Internal Medicine',
        footerText: 'This prescription is digitally verified. Valid for 5 days. Not valid for medico-legal cases.'
      },
      availableSlots: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '04:00 PM']
    });
    console.log('✅ Clinic provisioned:', clinic.name);

    // 2. Create Role-Based Users
    const doctorUser = await User.create({
      name: 'Dr. Sandeep Sharma',
      email: 'doctor@test.com',
      password: 'password123',
      role: 'DOCTOR',
      clinicId: clinic._id
    });

    const receptionistUser = await User.create({
      name: 'Pooja Verma (Reception)',
      email: 'receptionist@test.com',
      password: 'password123',
      role: 'RECEPTIONIST',
      clinicId: clinic._id
    });

    const pharmacistUser = await User.create({
      name: 'Amit Kumar (Pharmacy)',
      email: 'pharmacist@test.com',
      password: 'password123',
      role: 'PHARMACIST',
      clinicId: clinic._id
    });

    const superAdminUser = await User.create({
      name: 'Super Administrator',
      email: 'admin@test.com',
      password: 'password123',
      role: 'SUPER_ADMIN'
    });
    console.log('✅ Users provisioned: Doctor, Receptionist, Pharmacist, Super Admin');

    // 3. Create Doctor Profile
    const doctorProfile = await Doctor.create({
      clinicId: clinic._id,
      name: 'Dr. Sandeep Sharma',
      phone: '919876543210',
      regNo: 'MCI-2014-88492',
      specialty: 'Internal Medicine & Diabetology',
      experience: '14 Years',
      consultationFee: 500,
      availableSlots: clinic.availableSlots,
      isActive: true
    });
    console.log('✅ Doctor Profile created:', doctorProfile.name);

    // 4. Create Patients with Family Multi-Profiles
    const patient1 = await Patient.create({
      clinicId: clinic._id,
      name: 'Rajesh Sharma',
      phone: '919123456789',
      age: 44,
      gender: 'Male',
      medicalHistory: 'Type 2 Diabetes (Diagnosed 2021)',
      familyMembers: [
        { memberId: 'M1', name: 'Rajesh Sharma', age: 44, gender: 'M', relation: 'SELF', bloodGroup: 'B+', chronicConditions: ['DIABETES_T2'] },
        { memberId: 'M2', name: 'Aarav Sharma', age: 8, gender: 'M', relation: 'CHILD', bloodGroup: 'B+' },
        { memberId: 'M3', name: 'Suman Sharma', age: 70, gender: 'F', relation: 'PARENT', bloodGroup: 'O+', chronicConditions: ['HYPERTENSION'] }
      ]
    });

    const patient2 = await Patient.create({
      clinicId: clinic._id,
      name: 'Vikram Malhotra',
      phone: '919876003344',
      age: 52,
      gender: 'Male',
      medicalHistory: 'Mild Hypertension'
    });

    const patient3 = await Patient.create({
      clinicId: clinic._id,
      name: 'Sunita Verma',
      phone: '919876001122',
      age: 38,
      gender: 'Female',
      medicalHistory: 'Recurrent URTI / Sinusitis'
    });

    const patient4 = await Patient.create({
      clinicId: clinic._id,
      name: 'Priya Patel',
      phone: '919876005566',
      age: 29,
      gender: 'Female'
    });

    const patient5 = await Patient.create({
      clinicId: clinic._id,
      name: 'Anil Gupta',
      phone: '919876007788',
      age: 63,
      gender: 'Male'
    });
    console.log('✅ Patients with multi-member family profiles created');

    // 5. Create Vision Lab Record for Rajesh Sharma (Token 3)
    await MedicalRecord.create({
      clinicId: clinic._id,
      patientId: patient1._id,
      familyMemberId: 'M1',
      recordType: 'LAB_REPORT',
      mediaUrl: 'https://storage.clinic.internal/lab_reports/rajesh_sharma_blood.pdf',
      extractedBiomarkers: [
        { name: 'HbA1c (Glycated Hb)', value: 8.4, unit: '%', referenceRange: '< 5.7%', isAbnormal: true },
        { name: 'Fasting Blood Sugar', value: 168, unit: 'mg/dL', referenceRange: '70-100', isAbnormal: true },
        { name: 'Serum Creatinine', value: 0.9, unit: 'mg/dL', referenceRange: '0.6-1.2', isAbnormal: false }
      ],
      aiSummaryBullets: [
        'Elevated HbA1c (8.4%) indicating uncontrolled Type 2 Diabetes',
        'Fasting blood glucose elevated at 168 mg/dL',
        'Renal function (Serum Creatinine 0.9 mg/dL) normal'
      ]
    });

    // 6. Create Today's OPD Appointments with Tokens 1 to 5
    const today = new Date();

    // Token #1: Finished & Paid WhatsApp UPI
    await Appointment.create({
      clinicId: clinic._id,
      patientId: patient3._id,
      doctorId: doctorProfile._id,
      tokenNumber: 1,
      date: today,
      timeSlot: '10:00 AM',
      appointmentType: 'IN_CLINIC',
      queueStatus: 'COMPLETED',
      status: 'completed',
      paymentStatus: 'captured',
      billingAudit: {
        feeAmount: 500,
        paymentMode: 'WHATSAPP_UPI',
        rxGeneratedInCabin: true,
        isDiscrepancyFlagged: false
      },
      triageSummary: {
        symptomsTranslated: 'High fever, throat pain',
        severityFlag: 'ROUTINE',
        aiPreReadBullets: ['Fever for 3 days', 'No breathing difficulty']
      }
    });

    // Token #2: Finished & Rx Written, but UNPAID at reception (Fraud Audit Test Case!)
    await Appointment.create({
      clinicId: clinic._id,
      patientId: patient2._id,
      doctorId: doctorProfile._id,
      tokenNumber: 2,
      date: today,
      timeSlot: '10:30 AM',
      appointmentType: 'IN_CLINIC',
      queueStatus: 'COMPLETED',
      status: 'completed',
      paymentStatus: 'pending',
      billingAudit: {
        feeAmount: 500,
        paymentMode: 'UNPAID',
        rxGeneratedInCabin: true,
        isDiscrepancyFlagged: true
      },
      triageSummary: {
        symptomsTranslated: 'Routine blood pressure review',
        severityFlag: 'ROUTINE',
        aiPreReadBullets: ['Hypertension checkup', 'Requires refill review']
      }
    });

    // Token #3: Currently IN CABIN with Dr. Sharma (Active Cockpit Test Case!)
    await Appointment.create({
      clinicId: clinic._id,
      patientId: patient1._id,
      familyMemberId: 'M1',
      doctorId: doctorProfile._id,
      tokenNumber: 3,
      date: today,
      timeSlot: '11:00 AM',
      appointmentType: 'IN_CLINIC',
      queueStatus: 'IN_CABIN',
      status: 'scheduled',
      paymentStatus: 'captured',
      billingAudit: {
        feeAmount: 500,
        paymentMode: 'CASH_AT_DESK',
        rxGeneratedInCabin: false,
        isDiscrepancyFlagged: false
      },
      triageSummary: {
        symptomsTranslated: 'Follow-up for elevated blood sugar and fatigue',
        severityFlag: 'ROUTINE',
        aiPreReadBullets: [
          'Type 2 Diabetes follow-up',
          'HbA1c test completed yesterday (8.4%)',
          'Reports morning dizziness'
        ]
      }
    });

    // Token #4: Waiting in lounge
    await Appointment.create({
      clinicId: clinic._id,
      patientId: patient4._id,
      doctorId: doctorProfile._id,
      tokenNumber: 4,
      date: today,
      timeSlot: '11:30 AM',
      appointmentType: 'IN_CLINIC',
      queueStatus: 'WAITING_OUTSIDE',
      status: 'scheduled',
      billingAudit: {
        feeAmount: 500,
        paymentMode: 'UNPAID',
        rxGeneratedInCabin: false,
        isDiscrepancyFlagged: false
      },
      triageSummary: {
        symptomsTranslated: 'Skin allergy and rash on hands',
        severityFlag: 'ROUTINE',
        aiPreReadBullets: ['Dermatological inquiry', 'Started 4 days ago']
      }
    });

    // Token #5: Booked for afternoon
    await Appointment.create({
      clinicId: clinic._id,
      patientId: patient5._id,
      doctorId: doctorProfile._id,
      tokenNumber: 5,
      date: today,
      timeSlot: '02:00 PM',
      appointmentType: 'IN_CLINIC',
      queueStatus: 'BOOKED',
      status: 'scheduled',
      billingAudit: {
        feeAmount: 500,
        paymentMode: 'UNPAID',
        rxGeneratedInCabin: false,
        isDiscrepancyFlagged: false
      },
      triageSummary: {
        symptomsTranslated: 'Knee joint pain after morning walks',
        severityFlag: 'ROUTINE',
        aiPreReadBullets: ['Orthopedic consultation', 'Chronic osteoarthritis']
      }
    });

    console.log('✅ 5 OPD Tokens for Today created (including In-Cabin and Fraud Audit test cases)');
    console.log('\n🎉 SEEDING COMPLETE! Test Credentials:');
    console.log('   Doctor:       doctor@test.com       / password123');
    console.log('   Receptionist: receptionist@test.com / password123');
    console.log('   Pharmacist:   pharmacist@test.com   / password123');
    console.log('   Super Admin:  admin@test.com        / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
