import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { Users, MessageSquare, CreditCard, Activity, Building2, Loader2 } from 'lucide-react';
import { getAdminAnalyticsSummary } from '../services/api';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
    <p className="text-gray-500 text-sm font-medium">{title}</p>
    <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
  </div>
);

const mockChartData = [
  { name: 'Mon', appointments: 4, messages: 24 },
  { name: 'Tue', appointments: 3, messages: 13 },
  { name: 'Wed', appointments: 2, messages: 98 },
  { name: 'Thu', appointments: 7, messages: 39 },
  { name: 'Fri', appointments: 8, messages: 48 },
  { name: 'Sat', appointments: 3, messages: 38 },
  { name: 'Sun', appointments: 4, messages: 43 },
];

const SuperAdminAnalytics = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAdminAnalyticsSummary();
        setSummary(res.data.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const stats = summary || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
          <p className="text-gray-500">Real-time performance across all clinics.</p>
        </div>
        <button
          onClick={() => navigate('/super-admin/clinics')}
          className="bg-blue-600 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2"
        >
          <Building2 className="h-4 w-4" />
          Manage Clinics
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Total Clinics" 
          value={stats.totalClinics || 0} 
          icon={Activity} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Connected" 
          value={stats.connectedClinics || 0} 
          icon={Building2} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Pending Setup" 
          value={stats.pendingClinics || 0} 
          icon={Users} 
          color="bg-yellow-500" 
        />
        <StatCard 
          title="Total Patients" 
          value={(stats.totalPatients || 0).toLocaleString()} 
          icon={Users} 
          color="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="WhatsApp Messages" 
          value={(stats.totalMessages || 0).toLocaleString()} 
          icon={MessageSquare} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Appointments (Total)" 
          value={(stats.totalAppointments || 0).toLocaleString()} 
          icon={Activity} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Estimated Revenue" 
          value={`₹${(stats.estimatedRevenue || 0).toLocaleString()}`} 
          icon={CreditCard} 
          color="bg-orange-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Completed vs Scheduled</h3>
          <div className="flex gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">{stats.completedAppointments || 0} Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span className="text-sm text-gray-600">{stats.scheduledAppointments || 0} Scheduled</span>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl">
            <p className="text-gray-400 text-sm">Appointment breakdown by status</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Appointment Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorAppt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="appointments" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAppt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">WhatsApp Activity</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#f9fafb'}}
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="messages" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;
