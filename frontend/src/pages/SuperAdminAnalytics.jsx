import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { Users, MessageSquare, CreditCard, Activity, Loader2, CheckCircle, XCircle, Settings, ShieldCheck, Zap, Layers } from 'lucide-react';
import { getAnalyticsSummary, getAnalyticsCharts, getAdminClinics, updateAdminClinic } from '../services/api';

const StatCard = ({ title, value, change, icon: Icon, color }) => (
  <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <span className="text-green-500 text-sm font-bold">{change}</span>
    </div>
    <p className="text-gray-500 text-sm font-medium">{title}</p>
    <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
  </div>
);

const SuperAdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, clinics
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const [summaryRes, chartRes] = await Promise.all([
          getAnalyticsSummary(),
          getAnalyticsCharts()
        ]);
        setSummary(summaryRes.data.data);
        setChartData(chartRes.data.data);
      } else {
        const clinicsRes = await getAdminClinics();
        setClinics(clinicsRes.data.data.clinics);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClinic = async (id, data) => {
    setActionLoading(id);
    try {
      const response = await updateAdminClinic(id, data);
      const updatedClinic = response.data.data.clinic;
      setClinics(clinics.map(c => c._id === id ? updatedClinic : c));
    } catch (err) {
      console.error('Update failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleFeature = (clinic, feature) => {
    const newFeatures = { ...clinic.enabledFeatures };
    newFeatures[feature] = !newFeatures[feature];
    handleUpdateClinic(clinic._id, { enabledFeatures: newFeatures });
  };

  if (loading && !clinics.length && !summary) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Super Admin Console</h1>
          <p className="text-gray-500 mt-1">Global oversight and feature management.</p>
        </div>
        <div className="flex p-1 bg-gray-100 rounded-2xl">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('clinics')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'clinics' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Clinics
          </button>
        </div>
      </header>

      {activeTab === 'analytics' ? (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total Clinics" value={summary?.totalClinics || 0} change={summary?.clinicsChange} icon={Activity} color="bg-blue-500" />
            <StatCard title="Total Patients" value={summary?.totalPatients?.toLocaleString() || 0} change={summary?.patientsChange} icon={Users} color="bg-purple-500" />
            <StatCard title="WhatsApp Volume" value={summary?.totalMessages?.toLocaleString() || 0} change={summary?.messagesChange} icon={MessageSquare} color="bg-green-500" />
            <StatCard title="Revenue (Est)" value={`₹${summary?.totalRevenue?.toLocaleString() || 0}`} change={summary?.revenueChange} icon={CreditCard} color="bg-orange-500" />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Appointment Growth</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAppt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} hide />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="appointments" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAppt)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">WhatsApp Activity</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} hide />
                    <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="messages" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-8 py-6 font-bold">Clinic / Owner</th>
                  <th className="px-8 py-6 font-bold">Status</th>
                  <th className="px-8 py-6 font-bold">Plan</th>
                  <th className="px-8 py-6 font-bold">Features</th>
                  <th className="px-8 py-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clinics.map((clinic) => (
                  <tr key={clinic._id} className="hover:bg-white/40 transition-colors">
                    <td className="px-8 py-6">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{clinic.name}</p>
                        <p className="text-sm text-gray-500">{clinic.ownerName} • {clinic.email}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        clinic.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                        clinic.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {clinic.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <select 
                        value={clinic.subscriptionPlan}
                        onChange={(e) => handleUpdateClinic(clinic._id, { subscriptionPlan: e.target.value })}
                        className="bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                      >
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex space-x-2">
                        {['ai_chat', 'analytics', 'prescriptions'].map(feature => (
                          <button
                            key={feature}
                            onClick={() => toggleFeature(clinic, feature)}
                            title={`Toggle ${feature}`}
                            className={`p-2 rounded-xl transition-all ${
                              clinic.enabledFeatures?.[feature] 
                                ? 'bg-blue-100 text-blue-600 shadow-sm' 
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {feature === 'ai_chat' && <Zap className="h-4 w-4" />}
                            {feature === 'analytics' && <Layers className="h-4 w-4" />}
                            {feature === 'prescriptions' && <ShieldCheck className="h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {clinic.status === 'PENDING' ? (
                        <button 
                          onClick={() => handleUpdateClinic(clinic._id, { status: 'ACTIVE' })}
                          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-100 flex items-center space-x-2 ml-auto"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateClinic(clinic._id, { status: clinic.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                          className={`p-2 rounded-xl transition-all ${clinic.status === 'ACTIVE' ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        >
                          {clinic.status === 'ACTIVE' ? <XCircle className="h-6 w-6" /> : <CheckCircle className="h-6 w-6" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminAnalytics;
