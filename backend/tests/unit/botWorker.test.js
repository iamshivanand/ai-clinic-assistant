let workerHandler;

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

require('../../workers/botWorker');

describe('Bot Worker - State Machine Handler', () => {
  const from = '1234567890';

  beforeEach(() => {
    jest.clearAllMocks();
    Patient.create.mockImplementation((data) => Promise.resolve({
      _id: 'patient-123',
      name: data.name || 'New Patient',
      phone: data.phone || from,
      language: data.language || 'en',
    }));
    Message.create.mockResolvedValue({ _id: 'msg-123' });
  });

  it('should initialize welcome flow for IDLE state when receiving "Hi"', async () => {
    sessionManager.getSession.mockResolvedValue({ step: 'IDLE', data: {} });
    Patient.findOne.mockResolvedValue({ _id: 'patient-123', phone: from, name: 'Alice', language: 'en' });

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
    Patient.findOne.mockResolvedValue(null);

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

  it('should respond in Hindi when patient language is set to hi', async () => {
    sessionManager.getSession.mockResolvedValue({ step: 'IDLE', data: {} });
    Patient.findOne.mockResolvedValue({ _id: 'patient-123', phone: from, name: 'Alice', language: 'hi' });

    const job = {
      data: {
        from,
        messageBody: 'नमस्ते',
        messageType: 'text',
        raw: {}
      }
    };

    await workerHandler(job);

    expect(whatsappService.sendInteractiveButtons).toHaveBeenCalledWith(
      from,
      expect.stringContaining('AI Clinic में आपका स्वागत है'),
      expect.any(Array)
    );
  });

  it('should detect Hinglish and respond in Hindi', async () => {
    sessionManager.getSession.mockResolvedValue({ step: 'IDLE', data: {} });
    Patient.findOne.mockResolvedValue({ _id: 'patient-123', phone: from, name: 'Alice', language: 'hi' });

    const job = {
      data: {
        from,
        messageBody: 'namaste',
        messageType: 'text',
        raw: {}
      }
    };

    await workerHandler(job);

    expect(whatsappService.sendInteractiveButtons).toHaveBeenCalledWith(
      from,
      expect.stringContaining('AI Clinic में आपका स्वागत है'),
      expect.any(Array)
    );
  });

  it('should handle Hindi booking request with "बुक" keyword', async () => {
    sessionManager.getSession.mockResolvedValue({ step: 'IDLE', data: {} });
    Patient.findOne.mockResolvedValue(null);

    const job = {
      data: {
        from,
        messageBody: 'बुक',
        messageType: 'text',
        raw: {}
      }
    };

    await workerHandler(job);

    expect(whatsappService.sendTextMessage).toHaveBeenCalledWith(
      from,
      expect.stringContaining('अपना पूरा नाम बताएं')
    );
    expect(sessionManager.setSession).toHaveBeenCalledWith(from, expect.objectContaining({ step: 'AWAITING_NAME' }));
  });

  it('should detect Hinglish and respond in Hindi for existing Hindi patient', async () => {
    sessionManager.getSession.mockResolvedValue({ step: 'IDLE', data: {} });
    Patient.findOne.mockResolvedValue({ _id: 'patient-123', phone: from, name: 'Alice', language: 'hi' });

    const job = {
      data: {
        from,
        messageBody: 'namaste',
        messageType: 'text',
        raw: {}
      }
    };

    await workerHandler(job);

    expect(whatsappService.sendInteractiveButtons).toHaveBeenCalledWith(
      from,
      expect.stringContaining('AI Clinic में आपका स्वागत है'),
      expect.any(Array)
    );
  });

  it('should respond in Hindi for Hindi script input', async () => {
    sessionManager.getSession.mockResolvedValue({ step: 'IDLE', data: {} });
    Patient.findOne.mockResolvedValue({ _id: 'patient-123', phone: from, name: 'Alice', language: 'hi' });

    const job = {
      data: {
        from,
        messageBody: 'नमस्ते',
        messageType: 'text',
        raw: {}
      }
    };

    await workerHandler(job);

    expect(whatsappService.sendInteractiveButtons).toHaveBeenCalledWith(
      from,
      expect.stringContaining('AI Clinic में आपका स्वागत है'),
      expect.any(Array)
    );
  });
});
