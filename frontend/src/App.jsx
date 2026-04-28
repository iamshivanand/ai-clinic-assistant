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

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = (role) => {
    // Simulate login for development
    const user = { name: role === 'DOCTOR' ? 'Dr. Admin' : 'Super Admin', email, role };
    login(user, 'fake-jwt-token');
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

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
