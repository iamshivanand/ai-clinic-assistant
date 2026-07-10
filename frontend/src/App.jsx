import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';

// Components and Layouts
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

// Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SuperAdminAnalytics = lazy(() => import('./pages/SuperAdminAnalytics'));
const Chat = lazy(() => import('./pages/Chat'));
const WhatsAppSetup = lazy(() => import('./pages/WhatsAppSetup'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

import api from './services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, data: { user } } = res.data;
      login(user, token);
      if (user.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  const autofill = (role) => {
    if (role === 'DOCTOR') {
      setEmail('doctor@test.com');
      setPassword('password123');
    } else {
      setEmail('admin@test.com');
      setPassword('password123');
    }
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">AI Clinic Portal</h2>
          <p className="login-subtitle">Sign in to your clinic admin workspace</p>
        </div>
        
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@clinic.com"
                className="input-premium"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem' }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-premium"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: '1.25rem', marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: 'var(--slate-400)', marginBottom: '0.75rem' }}>Quick Autofill (Demo / Tests)</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => autofill('DOCTOR')}
              className="btn-secondary"
              style={{ flex: 1, padding: '0.5rem', fontSize: '11px', borderRadius: '0.5rem' }}
            >
              Prefill Doctor
            </button>
            <button
              onClick={() => autofill('SUPER_ADMIN')}
              className="btn-secondary"
              style={{ flex: 1, padding: '0.5rem', fontSize: '11px', borderRadius: '0.5rem' }}
            >
              Prefill Super Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/welcome" element={<LandingPage />} />
          
          {/* Protected Doctor Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'SUPER_ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<Chat />} />
            <Route path="settings" element={<div>Clinic Settings</div>} />
            <Route path="bot-settings" element={<WhatsAppSetup />} />
          </Route>

          {/* Protected Super Admin Routes */}
          <Route 
            path="/super-admin" 
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SuperAdminAnalytics />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
