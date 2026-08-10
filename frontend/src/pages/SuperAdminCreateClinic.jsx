import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Phone, Lock, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { createAdminClinic } from '../services/api';

const SuperAdminCreateClinic = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    doctorName: '',
    doctorEmail: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await createAdminClinic(form);
      setSuccess(res.data.data);
      setTimeout(() => navigate('/super-admin/clinics'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create clinic');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-6 animate-in fade-in">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Clinic Created!</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-left space-y-2 shadow-sm">
          <p className="text-sm text-gray-500">Clinic: <span className="font-semibold text-gray-900">{success.clinic.name}</span></p>
          <p className="text-sm text-gray-500">Doctor: <span className="font-semibold text-gray-900">{success.doctor.name}</span></p>
          <p className="text-sm text-gray-500">Email: <span className="font-semibold text-gray-900">{success.doctor.email}</span></p>
          <p className="text-sm text-gray-500">Password: <span className="font-mono text-gray-900">{form.password}</span></p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4 text-sm text-yellow-800">
            Share these credentials with the doctor. They can login and set up WhatsApp.
          </div>
        </div>
        <p className="text-sm text-gray-400">Redirecting to clinic list...</p>
      </div>
    );
  }

  const inputClass = "w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate('/super-admin/clinics')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Clinic</h1>
          <p className="text-gray-500">Create a clinic and doctor account in one step</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            Clinic Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Clinic Name *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input className={inputClass} placeholder="e.g. Sharma Clinic" value={form.name} onChange={update('name')} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Owner Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input className={inputClass} placeholder="Full name" value={form.ownerName} onChange={update('ownerName')} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" className={inputClass} placeholder="clinic@email.com" value={form.email} onChange={update('email')} />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input className={inputClass} placeholder="+91 9876543210" value={form.phone} onChange={update('phone')} />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            Doctor Account
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Doctor Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input className={inputClass} placeholder="Dr. Name" value={form.doctorName} onChange={update('doctorName')} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Doctor Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" className={inputClass} placeholder="doctor@email.com" value={form.doctorEmail} onChange={update('doctorEmail')} required />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" className={inputClass} placeholder="Set a password for the doctor" value={form.password} onChange={update('password')} required />
              </div>
              <p className="text-xs text-gray-400 mt-1">Share this password securely with the doctor</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Creating...' : 'Create Clinic & Doctor Account'}
        </button>
      </form>
    </div>
  );
};

export default SuperAdminCreateClinic;
