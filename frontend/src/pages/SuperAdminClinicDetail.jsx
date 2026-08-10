import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, User, Phone, Calendar, Activity, ArrowLeft, Loader2, TrendingUp } from 'lucide-react';
import { getAdminClinicDetail, updateAdminClinic } from '../services/api';

const StatusBadge = ({ status }) => {
  const styles = {
    CONNECTED: { bg: '#dcfce7', color: '#166534', label: 'Connected' },
    PENDING: { bg: '#fef9c3', color: '#854d0e', label: 'Pending Setup' },
    DISCONNECTED: { bg: '#fee2e2', color: '#991b1b', label: 'Disconnected' },
  };
  const s = styles[status] || styles.PENDING;
  return (
    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

const SuperAdminClinicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAdminClinicDetail(id);
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load clinic', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleStatusChange = async (status) => {
    setUpdating(true);
    try {
      await updateAdminClinic(id, { onboardingStatus: status });
      setData(prev => ({ ...prev, clinic: { ...prev.clinic, onboardingStatus: status } }));
    } catch (err) {
      console.error('Failed to update', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-400">Clinic not found</div>;
  }

  const { clinic, doctor, stats, recentAppointments } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate('/super-admin/clinics')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{clinic.name}</h1>
            <StatusBadge status={clinic.onboardingStatus} />
          </div>
          <p className="text-gray-500">{clinic.ownerName}</p>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', value: stats.totalPatients, icon: User, color: 'bg-blue-500' },
          { label: 'Total Appointments', value: stats.totalAppointments, icon: Calendar, color: 'bg-purple-500' },
          { label: 'This Week', value: stats.weeklyAppointments, icon: Activity, color: 'bg-green-500' },
          { label: 'Last Week', value: stats.lastWeekAppointments, icon: TrendingUp, color: 'bg-orange-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className={`${s.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-gray-500 text-xs font-medium">{s.label}</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Clinic Details</h3>
          <div className="space-y-3">
            {[
              { label: 'Phone', value: clinic.phone || '-' },
              { label: 'WhatsApp Number', value: clinic.whatsappNumber || 'Not connected' },
              { label: 'Plan', value: clinic.subscriptionPlan || 'basic' },
              { label: 'Created', value: new Date(clinic.createdAt).toLocaleDateString() },
              { label: 'WABA ID', value: clinic.wabaId ? `${clinic.wabaId.slice(0, 10)}...` : '-' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">Update Status</label>
            <div className="flex gap-2">
              {['PENDING', 'CONNECTED', 'DISCONNECTED'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={updating || clinic.onboardingStatus === status}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    clinic.onboardingStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'CONNECTED' ? 'Connected' : status === 'PENDING' ? 'Pending' : 'Disconnected'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Doctor Account</h3>
          {doctor ? (
            <div className="space-y-3">
              {[
                { label: 'Name', value: doctor.name },
                { label: 'Email', value: doctor.email },
                { label: 'Phone', value: doctor.phone || '-' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No doctor account linked</p>
          )}
          <div className="border-t border-gray-100 pt-4">
            <button className="text-sm text-blue-600 font-semibold hover:underline">
              Login as this doctor →
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Appointments</h3>
        {recentAppointments?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="pb-3 pr-4">Patient</th>
                  <th className="pb-3 pr-4">Phone</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentAppointments.map(apt => (
                  <tr key={apt._id}>
                    <td className="py-3 pr-4 font-medium text-gray-900">{apt.patientId?.name || 'Unknown'}</td>
                    <td className="py-3 pr-4 text-gray-500">{apt.patientId?.phone || '-'}</td>
                    <td className="py-3 pr-4 text-gray-500">{new Date(apt.date).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 text-gray-500">{apt.timeSlot}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{apt.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No appointments yet</p>
        )}
      </div>
    </div>
  );
};

export default SuperAdminClinicDetail;
