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
const whatsappService = require('../../services/whatsappService');
const Appointment = require('../../models/Appointment');

jest.mock('../../services/whatsappService');
jest.mock('../../models/Appointment');
jest.mock('../../queues', () => ({
  connection: {}
}));

// Load the worker to trigger constructor and capture handler
require('../../workers/notificationWorker');

describe('Notification Worker - Scheduled Jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send reminder if appointment is still scheduled', async () => {
    Appointment.findById.mockResolvedValue({
      _id: 'appt-123',
      status: 'scheduled'
    });

    const job = {
      name: 'send-reminder',
      data: {
        appointmentId: 'appt-123',
        to: '1234567890',
        patientName: 'Bob',
        doctorName: 'Dr. Test',
        time: '10:00 AM'
      }
    };

    await workerHandler(job);

    expect(whatsappService.sendTextMessage).toHaveBeenCalledWith(
      '1234567890',
      expect.stringContaining('friendly reminder')
    );
  });

  it('should skip reminder if appointment is cancelled', async () => {
    Appointment.findById.mockResolvedValue({
      _id: 'appt-123',
      status: 'cancelled'
    });

    const job = {
      name: 'send-reminder',
      data: {
        appointmentId: 'appt-123',
        to: '1234567890',
        patientName: 'Bob',
        doctorName: 'Dr. Test',
        time: '10:00 AM'
      }
    };

    await workerHandler(job);

    expect(whatsappService.sendTextMessage).not.toHaveBeenCalled();
  });

  it('should send interactive confirmation buttons for completion check', async () => {
    Appointment.findById.mockResolvedValue({
      _id: 'appt-123',
      status: 'scheduled'
    });

    const job = {
      name: 'check-appointment-completion',
      data: {
        appointmentId: 'appt-123',
        to: '1234567890',
        patientName: 'Bob',
        doctorName: 'Dr. Test',
        time: '10:00 AM'
      }
    };

    await workerHandler(job);

    expect(whatsappService.sendInteractiveButtons).toHaveBeenCalledWith(
      '1234567890',
      expect.stringContaining('consultation with Dr. Test today was completed'),
      expect.arrayContaining([
        expect.objectContaining({ id: 'confirm_completed_appt-123' }),
        expect.objectContaining({ id: 'confirm_missed_appt-123' })
      ])
    );
  });
});
