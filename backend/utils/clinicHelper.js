const Clinic = require('../models/Clinic');
const logger = require('./logger');

const getOrCreateDefaultClinic = async () => {
  try {
    let clinic = await Clinic.findOne({ name: 'Default AI Clinic' });
    if (!clinic) {
      clinic = await Clinic.create({
        name: 'Default AI Clinic',
        ownerName: 'Dr. Admin',
        phone: '1234567890',
        whatsappNumber: '1234567890',
        address: '123 Health St, Wellness City'
      });
      logger.info('Created default clinic for development');
    }
    return clinic;
  } catch (error) {
    logger.error('Error getting/creating default clinic:', error);
    return null;
  }
};

module.exports = { getOrCreateDefaultClinic };
