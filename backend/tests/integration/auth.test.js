const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const User = require('../../models/User');

// Mock the User model
jest.mock('../../models/User', () => ({
  create: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
  findOne: jest.fn()
}));

// Mock the signToken function implicitly or just let it run
process.env.JWT_SECRET = 'test_secret';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Integration Tests', () => {
  it('should prevent mass assignment of SUPER_ADMIN role', async () => {
    
    // We expect the controller to call User.create with role: 'DOCTOR'
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker',
        email: 'hacker@test.com',
        password: 'password123',
        role: 'SUPER_ADMIN' // Trying to hack the role
      });

    expect(res.statusCode).toEqual(201);
    
    // Verify that the User.create method was called with DOCTOR instead of SUPER_ADMIN
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      role: 'DOCTOR',
      email: 'hacker@test.com'
    }));
  });
});

