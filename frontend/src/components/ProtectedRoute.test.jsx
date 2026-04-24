import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to login when no user is in localStorage', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <div>Admin Content</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when user is in localStorage', () => {
    localStorage.setItem('user', JSON.stringify({ name: 'Dr. Test', role: 'DOCTOR' }));

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ProtectedRoute>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects to unauthorized when role is not allowed', () => {
    localStorage.setItem('user', JSON.stringify({ name: 'Dr. Test', role: 'DOCTOR' }));

    render(
      <MemoryRouter initialEntries={['/super-admin']}>
        <Routes>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          <Route 
            path="/super-admin" 
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <div>Super Admin Content</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });
});
