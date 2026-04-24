import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import SuperAdminAnalytics from './pages/SuperAdminAnalytics';
import Chat from './pages/Chat';
import WhatsAppSetup from './pages/WhatsAppSetup';
import ProtectedRoute from './components/ProtectedRoute';

const Login = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleLogin = (role) => {
    // Simulate login for development
    const user = { name: role === 'DOCTOR' ? 'Dr. Admin' : 'Super Admin', email, role };
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', 'fake-jwt-token');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">AI Clinic Portal</h2>
          <p className="mt-2 text-sm text-gray-600">Please sign in to your account</p>
        </div>
        <div className="space-y-4">
          <button 
            onClick={() => handleLogin('DOCTOR')}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Sign in as Doctor
          </button>
          <button 
            onClick={() => handleLogin('SUPER_ADMIN')}
            className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
          >
            Sign in as Super Admin
          </button>
        </div>
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <p>Manage all clinics and system performance here.</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
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
    </BrowserRouter>
  );
}

export default App;
