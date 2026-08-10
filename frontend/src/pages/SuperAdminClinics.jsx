import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, Clock, AlertCircle, Search, Loader2, ChevronRight } from 'lucide-react';
import { getAdminClinics } from '../services/api';

const StatusBadge = ({ status }) => {
  const styles = {
    CONNECTED: { bg: '#dcfce7', color: '#166534', icon: CheckCircle },
    PENDING: { bg: '#fef9c3', color: '#854d0e', icon: Clock },
    DISCONNECTED: { bg: '#fee2e2', color: '#991b1b', icon: AlertCircle },
  };
  const s = styles[status] || styles.PENDING;
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" 
      style={{ backgroundColor: s.bg, color: s.color }}>
      <Icon style={{ width: '12px', height: '12px' }} />
      {status === 'CONNECTED' ? 'Connected' : status === 'PENDING' ? 'Pending' : 'Disconnected'}
    </span>
  );
};

const SuperAdminClinics = () => {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAdminClinics();
        setClinics(res.data.data);
      } catch (err) {
        console.error('Failed to load clinics', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = clinics.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.ownerName?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: clinics.length,
    connected: clinics.filter(c => c.onboardingStatus === 'CONNECTED').length,
    pending: clinics.filter(c => c.onboardingStatus === 'PENDING').length,
    totalAppts: clinics.reduce((sum, c) => sum + (c.totalAppointments || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Clinics</h1>
          <p className="text-gray-500">{clinics.length} clinics on platform</p>
        </div>
        <button 
          onClick={() => navigate('/super-admin/create-clinic')}
          className="bg-blue-600 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2"
        >
          <Building2 className="h-4 w-4" />
          Add New Clinic
        </button>
      </header>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Clinics', value: stats.total, color: 'bg-blue-500' },
          { label: 'Connected', value: stats.connected, color: 'bg-green-500' },
          { label: 'Pending Setup', value: stats.pending, color: 'bg-yellow-500' },
          { label: 'Total Appointments', value: stats.totalAppts, color: 'bg-purple-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className={`${s.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <p className="text-gray-500 text-xs font-medium">{s.label}</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clinics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Clinic</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Appointments</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(clinic => (
                <tr 
                  key={clinic._id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/super-admin/clinics/${clinic._id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 w-9 h-9 rounded-xl flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="font-semibold text-gray-900">{clinic.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{clinic.ownerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{clinic.whatsappNumber || clinic.phone || '-'}</td>
                  <td className="px-6 py-4"><StatusBadge status={clinic.onboardingStatus} /></td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-700 capitalize">{clinic.subscriptionPlan}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{clinic.totalAppointments}</td>
                  <td className="px-6 py-4">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No clinics found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminClinics;
