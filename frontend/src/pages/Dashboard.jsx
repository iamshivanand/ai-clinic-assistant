import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, MapPin, CheckCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const [appointments, setAppointments] = useState([
    { id: 1, patient: 'Ravi Kumar', time: '10:00 AM', status: 'Confirmed', type: 'Consultation' },
    { id: 2, patient: 'Amit Singh', time: '11:30 AM', status: 'Arrived', type: 'Follow-up' },
    { id: 3, patient: 'Priya Sharma', time: '02:00 PM', status: 'Confirmed', type: 'Consultation' },
  ]);

  const stats = [
    { label: "Today's Bookings", value: '14', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Patients', value: '128', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Conversion Rate', value: '82%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Doctor Dashboard</h1>
        <p className="text-gray-500">Welcome back, Dr. Admin. Here's what's happening today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`${stat.bg} p-3 rounded-xl`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Today's Queue</h2>
            <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{apt.patient}</td>
                    <td className="px-6 py-4 text-gray-600">{apt.time}</td>
                    <td className="px-6 py-4 text-gray-600">{apt.type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600">
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clinic Info / Availability */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Clinic Details</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-sm">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <span className="text-gray-600">123 Health St, Wellness City</span>
              </div>
              <div className="flex items-start space-x-3 text-sm">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-900 font-medium">Available Slots</p>
                  <p className="text-gray-500">10:00 AM, 11:30 AM, 02:00 PM, 04:30 PM</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 py-2 px-4 bg-gray-50 text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-100 transition-colors">
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
