const sessionManager = require('../../utils/sessionManager');
const redis = require('../../utils/redis');

jest.mock('../../utils/redis', () => {
  const store = {};
  return {
    get: jest.fn(async (key) => store[key] || null),
    set: jest.fn(async (key, value, mode, expiry) => {
      store[key] = value;
      return 'OK';
    }),
    del: jest.fn(async (key) => {
      delete store[key];
      return 1;
    })
  };
});

describe('Session Manager - Redis Session Storage', () => {
  const phone = '1234567890';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when no session exists', async () => {
    const session = await sessionManager.getSession(phone);
    expect(session).toBeNull();
    expect(redis.get).toHaveBeenCalledWith(`session:${phone}`);
  });

  it('should set and retrieve a session correctly', async () => {
    const data = { step: 'SELECTING_DOCTOR', data: { chosenDoctorId: 'doc-123' } };
    await sessionManager.setSession(phone, data);

    expect(redis.set).toHaveBeenCalledWith(`session:${phone}`, JSON.stringify(data), 'EX', 3600);

    const retrieved = await sessionManager.getSession(phone);
    expect(retrieved).toEqual(data);
  });

  it('should delete a session correctly', async () => {
    const data = { step: 'IDLE' };
    await sessionManager.setSession(phone, data);
    await sessionManager.deleteSession(phone);

    expect(redis.del).toHaveBeenCalledWith(`session:${phone}`);
    const retrieved = await sessionManager.getSession(phone);
    expect(retrieved).toBeNull();
  });

  it('should update a session incrementally', async () => {
    const initial = { step: 'IDLE', data: { name: 'Alice' } };
    await sessionManager.setSession(phone, initial);

    await sessionManager.updateSession(phone, { step: 'AWAITING_NAME', data: { name: 'Alice', phone } });

    const updated = await sessionManager.getSession(phone);
    expect(updated).toEqual({
      step: 'AWAITING_NAME',
      data: { name: 'Alice', phone }
    });
  });
});
