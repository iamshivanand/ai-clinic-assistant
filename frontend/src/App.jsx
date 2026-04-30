import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';

// Components and Layouts
const AdminLayout = lazy(() => import('./components/AdminLayout'));
import ProtectedRoute from './components/ProtectedRoute';

// Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SuperAdminAnalytics = lazy(() => import('./pages/SuperAdminAnalytics'));
const WhatsAppSetup = lazy(() => import('./pages/WhatsAppSetup'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const PendingApproval = lazy(() => import('./pages/PendingApproval'));
const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center p-10 bg-white rounded-3xl shadow-xl">
      <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-500 mb-6">You don't have permission to access this page.</p>
      <button onClick={() => window.location.href = '/login'} className="text-blue-600 font-bold hover:underline">Return to Login</button>
    </div>
  </div>
);

const LoadingFallback = () => null;

function App() {
  const { user } = useAuthStore();
  const isPending = user?.role === 'DOCTOR' && user?.clinic?.status === 'PENDING';

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected Doctor Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'SUPER_ADMIN']}>
                {isPending ? <PendingApproval /> : <AdminLayout />}
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
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
