import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, Clock, MapPin, CheckCircle, TrendingUp, Bot, ArrowUpRight, Loader2 } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { getAppointments, getClinicAnalytics } from '../services/api';
import useAuthStore from '../store/useAuthStore';

const Dashboard = () => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [statsData, setStatsData] = useState({
    botInteractions: 0,
    conversionRate: 100
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptsRes, statsRes] = await Promise.all([
          getAppointments(),
          getClinicAnalytics()
        ]);
        setAppointments(apptsRes.data.data);
        setStatsData(statsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: t('dashboard.total_appointments'), value: appointments.length.toString(), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: t('dashboard.bot_interactions'), value: statsData.botInteractions.toString(), icon: Bot, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: t('dashboard.conversion_rate'), value: `${statsData.conversionRate}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('dashboard.welcome_msg', { name: user?.name })}
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-bold border border-green-100 shadow-sm">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>{t('dashboard.bot_live')}</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-md border border-gray-100 flex items-center space-x-5 hover:shadow-lg transition-all duration-300">
            <div className={`${stat.bg} p-4 rounded-2xl`}>
              <stat.icon className={`h-7 w-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-extrabold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-extrabold text-gray-900">Appointment Trends</h2>
            <div className="bg-gray-50 px-4 py-2 rounded-xl text-sm font-bold text-gray-500">Last 7 Days</div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Mon', appointments: 0 },
                { name: 'Tue', appointments: 0 },
                { name: 'Wed', appointments: 0 },
                { name: 'Thu', appointments: 0 },
                { name: 'Fri', appointments: 0 },
                { name: 'Sat', appointments: appointments.length },
              ]}>
                <defs>
                  <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                <Area type="monotone" dataKey="appointments" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorAppts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions / Bot Info */}
        <div className="space-y-6">
          <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 tracking-tight">Auto-Pilot</h2>
              <p className="text-blue-100 text-sm mb-8 leading-relaxed font-medium">The AI is currently handling all patient inquiries via strict templates.</p>
              <button className="bg-white text-blue-600 py-3 px-6 rounded-2xl font-bold transition-all flex items-center space-x-2 shadow-lg hover:bg-gray-100">
                <span>Configure Bot</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
            <Bot className="absolute -bottom-6 -right-6 h-40 w-40 text-white/10 group-hover:rotate-12 transition-transform duration-500" />
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-md border border-gray-100">
            <h2 className="text-lg font-extrabold text-gray-900 mb-6">Clinic Info</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-bold text-gray-500">Status</span>
                </div>
                <span className="text-sm font-extrabold text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-bold text-gray-500">Tier</span>
                </div>
                <span className="text-sm font-extrabold text-gray-900 uppercase">{user?.clinic?.subscriptionPlan || 'Basic'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Queue */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-gray-900">Recent Appointments</h2>
          <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest">Live Feed</span>
        </div>
        <div className="overflow-x-auto">
          {appointments.length === 0 ? (
            <div className="p-20 text-center text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold">No appointments found yet.</p>
              <p className="text-sm">New bookings will appear here automatically.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-8 py-6 font-bold">Patient</th>
                  <th className="px-8 py-6 font-bold">Date / Time</th>
                  <th className="px-8 py-6 font-bold">Status</th>
                  <th className="px-8 py-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 flex items-center justify-center font-bold text-blue-600 text-lg">
                          {apt.patientName?.[0] || 'P'}
                        </div>
                        <span className="font-extrabold text-gray-900 text-lg">{apt.patientName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-gray-900 font-bold">{new Date(apt.date).toLocaleDateString()}</div>
                      <div className="text-gray-400 text-sm font-medium">{apt.time}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold ${
                        apt.status === 'scheduled' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {apt.status === 'scheduled' && <CheckCircle className="h-3 w-3 mr-2" />}
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="bg-gray-50 p-3 rounded-2xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <ArrowUpRight className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
