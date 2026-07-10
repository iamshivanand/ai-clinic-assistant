let workerHandler;

// Mock BullMQ to intercept the worker handler
jest.mock('bullmq', () => {
  return {
    Worker: jest.fn().mockImplementation((name, handler, opts) => {
      workerHandler = handler;
      return {
        on: jest.fn()
      };
    })
  };
});

// Mock dependencies
const sessionManager = require('../../utils/sessionManager');
const whatsappService = require('../../services/whatsappService');
const Patient = require('../../models/Patient');
const Clinic = require('../../models/Clinic');
const Message = require('../../models/Message');
const Doctor = require('../../models/Doctor');
const Appointment = require('../../models/Appointment');
const redis = require('../../utils/redis');

jest.mock('../../utils/sessionManager');
jest.mock('../../services/whatsappService');
jest.mock('../../models/Patient');
jest.mock('../../models/Clinic');
jest.mock('../../models/Message');
jest.mock('../../models/Doctor');
jest.mock('../../models/Appointment');
jest.mock('../../utils/redis');
jest.mock('../../utils/clinicHelper', () => ({
  getOrCreateDefaultClinic: jest.fn().mockResolvedValue({ _id: 'clinic-123', name: 'Test Clinic' })
}));
jest.mock('../../queues', () => ({
  connection: {},
  notificationQueue: {
    add: jest.fn().mockResolvedValue(true)
  }
}));

// Load the worker to trigger constructor and capture handler
require('../../workers/botWorker');

describe('Bot Worker - State Machine Handler', () => {
  const from = '1234567890';

  beforeEach(() => {
    jest.clearAllMocks();
    Patient.create.mockResolvedValue({ _id: 'patient-123', name: 'New Patient', phone: from });
    Message.create.mockResolvedValue({ _id: 'msg-123' });
  });

  it('should initialize welcome flow for IDLE state when receiving "Hi"', async () => {
    sessionManager.getSession.mockResolvedValue({ step: 'IDLE', data: {} });
    Patient.findOne.mockResolvedValue({ _id: 'patient-123', phone: from, name: 'Alice' });

    const job = {
      data: {
        from,
        messageBody: 'Hi',
        messageType: 'text',
        raw: {}
      }
    };

    await workerHandler(job);

    expect(whatsappService.sendInteractiveButtons).toHaveBeenCalledWith(
      from,
      expect.stringContaining('Welcome to AI Clinic!'),
      expect.any(Array)
    );
    expect(sessionManager.setSession).toHaveBeenCalledWith(from, { step: 'IDLE' });
  });

  it('should transition to AWAITING_NAME for new patient booking', async () => {
    sessionManager.getSession.mockResolvedValue({ step: 'IDLE', data: {} });
    Patient.findOne.mockResolvedValue(null); // New patient placeholder

    const job = {
      data: {
        from,
        messageBody: 'book',
        messageType: 'text',
        raw: {}
      }
    };

    await workerHandler(job);

    expect(whatsappService.sendTextMessage).toHaveBeenCalledWith(
      from,
      expect.stringContaining('Please tell me your full name')
    );
    expect(sessionManager.setSession).toHaveBeenCalledWith(from, expect.objectContaining({ step: 'AWAITING_NAME' }));
  });

  it('should process name input and list available doctors', async () => {
    sessionManager.getSession.mockResolvedValue({ step: 'AWAITING_NAME', data: {} });
    redis.get.mockResolvedValue(null);
    Doctor.find.mockResolvedValue([
      { _id: 'doc-123', name: 'Dr. John', specialty: 'Cardiology', isActive: true }
    ]);

    const job = {
      data: {
        from,
        messageBody: 'Alice Smith',
        messageType: 'text',
        raw: {}
      }
    };

    await workerHandler(job);

    expect(whatsappService.sendInteractiveList).toHaveBeenCalledWith(
      from,
      expect.stringContaining('Please select a specialist'),
      'Select Doctor',
      expect.any(Array)
    );
    expect(sessionManager.updateSession).toHaveBeenCalledWith(
      from,
      expect.objectContaining({
        step: 'SELECTING_DOCTOR',
        data: expect.objectContaining({ tempName: 'Alice Smith' })
      })
    );
  });
});
