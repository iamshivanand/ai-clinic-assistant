import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, MapPin, CheckCircle, TrendingUp, Printer, Star, Activity, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { getDashboardStats, getDashboardAppointments } from '../services/api';
import api from '../services/api';

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [statsData, setStatsData] = useState({ todaysBookings: 0, totalPatients: 0, conversionRate: '0%' });
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, apptsRes] = await Promise.all([
        getDashboardStats(),
        getDashboardAppointments()
      ]);
      setStatsData(statsRes.data.data);
      setAppointments(apptsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePrintBlankRx = async (apt) => {
    setPrintingId(apt.id);
    try {
      const res = await api.post('/prescription/generate-and-send', {
        patientId: apt.patientId,
        isBlank: true
      });
      if (res.data.url) {
        window.open(res.data.url, '_blank');
      }
      // Refresh to update status if it changed
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to generate printable template:', err);
      alert('Error generating printable template. Please try again.');
    } finally {
      setPrintingId(null);
    }
  };

  const handleCompleteAppointment = async (aptId) => {
    // Just a quick manual complete if they want to update status without printing
    try {
      // In a real flow, generating a prescription completes it. We can complete it programmatically too
      alert('Use "Print Blank Rx" to complete consultation and trigger reviews!');
    } catch (err) {
      console.error(err);
    }
  };

  const stats = [
    { label: "Today's Bookings", value: statsData.todaysBookings, icon: Calendar, color: 'text-indigo-600', iconColor: '#6366f1', type: 'indigo' },
    { label: 'Total Patients', value: statsData.totalPatients, icon: Users, color: 'text-pink-600', iconColor: '#db2777', type: 'pink' },
    { label: 'Booking Conversion', value: statsData.conversionRate, icon: TrendingUp, color: 'text-emerald-600', iconColor: '#059669', type: 'emerald' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: '80vh' }}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-semibold text-slate-400">Loading clinic workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <header className="dashboard-header">
        <div className="header-bg-glow"></div>
        <div className="relative flex justify-between items-center w-full" style={{ zIndex: 1 }}>
          <div>
            <span className="header-badge">Live Workspace</span>
            <h1 className="header-title">Dr. Admin Dashboard</h1>
            <p className="header-desc">Automated WhatsApp booking reception active. Monitoring queue flow.</p>
          </div>
          <div className="gateway-status">
            <span className="pulse-indicator"></span>
            <span>WhatsApp Connected</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className={`stat-icon-wrapper ${stat.type}`}>
              <stat.icon style={{ width: '24px', height: '24px', color: stat.iconColor }} />
            </div>
            <div>
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Queue Grid (Full Width) */}
      <div className="queue-card">
        <div className="queue-header">
          <div>
            <h2 className="queue-title">
              <Activity style={{ width: '20px', height: '20px', color: '#6366f1' }} />
              Today's Queue Timeline
            </h2>
            <p className="queue-subtitle">Live progression of patients checked in today</p>
          </div>
          <span className="queue-count">{appointments.length} Total</span>
        </div>

        {appointments.length === 0 ? (
          <div style={{ padding: '3rem 0', textAlign: 'center' }}>
            <Calendar style={{ width: '48px', height: '48px', color: '#cbd5e1', marginBottom: '1rem' }} />
            <p className="text-sm font-semibold text-slate-400">No scheduled appointments for today</p>
            <p className="text-xs text-slate-400" style={{ marginTop: '0.25rem' }}>Bookings via WhatsApp will appear here in real time.</p>
          </div>
        ) : (
          <div className="patient-grid">
            {appointments.map((apt) => {
              const isCompleted = apt.status === 'Completed';
              const isMissed = apt.status === 'Missed';
              const isConfirmed = apt.status === 'Confirmed';
              
              return (
                <div key={apt.id} className="patient-card-compact">
                  <div className="patient-card-header">
                    <h3 className="patient-card-name truncate">{apt.patientName}</h3>
                    <span className="patient-card-time">
                      <Clock style={{ width: '12px', height: '12px', color: '#6366f1' }} />
                      {apt.time}
                    </span>
                  </div>

                  <div className="patient-card-meta">
                    <span className="patient-card-type">{apt.type}</span>
                    <span className={`badge-status ${isCompleted ? 'completed' : isMissed ? 'missed' : 'confirmed'}`}>
                      {apt.status}
                    </span>
                  </div>

                  <div className="patient-card-action">
                    {!isCompleted && !isMissed && (
                      <button
                        onClick={() => handlePrintBlankRx(apt)}
                        disabled={printingId === apt.id}
                        className="btn-primary"
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                      >
                        <Printer style={{ width: '12px', height: '12px' }} />
                        {printingId === apt.id ? 'Generating...' : 'Print Blank Rx'}
                      </button>
                    )}
                    {isCompleted && (
                      <div className="badge-status completed" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.5rem' }}>
                        <CheckCircle style={{ width: '12px', height: '12px' }} />
                        Rx Handout Generated
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Widgets Grid (Side-by-Side) */}
      <div className="grid gap-6 md:grid-cols-2" style={{ marginTop: '2rem' }}>
        {/* Google Reviews Booster Widget */}
        <div className="widget-box">
          <h3 className="widget-title">
            <Star style={{ width: '20px', height: '20px', color: '#f59e0b', fill: '#f59e0b' }} />
            GMB Review Booster
          </h3>
          <p className="widget-subtitle">Review conversion statistics via automated WhatsApp requests.</p>
          
          {/* SVG Visual Dashboard Chart */}
          <div className="circular-progress-box">
            <div className="circle-percentage">
              <svg className="absolute" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle cx="56" cy="56" r="48" stroke="#f59e0b" strokeWidth="8" fill="transparent" strokeDasharray="301" strokeDashoffset="90" />
              </svg>
              <div className="circle-label-box">
                <p className="circle-value">70%</p>
                <p className="circle-text">Conversion</p>
              </div>
            </div>
          </div>

          <div className="widget-stats-list">
            <div className="widget-stats-row">
              <span style={{ color: 'var(--slate-400)' }}>Total Reminders Sent</span>
              <span className="font-bold text-slate-800">14</span>
            </div>
            <div className="widget-stats-row">
              <span style={{ color: 'var(--slate-400)' }}>Positive Reviews Left</span>
              <span className="font-bold" style={{ color: 'var(--amber-600)' }}>10</span>
            </div>
            <div className="widget-stats-row">
              <span style={{ color: 'var(--slate-400)' }}>Conversion Rate</span>
              <span className="font-bold text-slate-800">70%</span>
            </div>
          </div>
          
          <div className="widget-tip-banner" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <Sparkles style={{ width: '16px', height: '16px', color: 'var(--amber-500)', fill: 'var(--amber-500)', marginTop: '2px', flexShrink: 0 }} />
            <span>
              <strong>Auto-Campaign Active</strong>: WhatsApp review link request is queued 2h after the Prescription template is generated.
            </span>
          </div>
        </div>

        {/* Clinic Details */}
        <div className="widget-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 className="widget-title" style={{ marginBottom: '1.25rem' }}>Clinic Setup</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-sm">
                <MapPin style={{ width: '20px', height: '20px', color: '#6366f1', marginTop: '2px' }} />
                <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>123 AI Street, Tech City</span>
              </div>
              <div className="flex items-start space-x-3 text-sm">
                <Clock style={{ width: '20px', height: '20px', color: '#6366f1', marginTop: '2px' }} />
                <div>
                  <p style={{ color: 'var(--slate-700)', fontWeight: 700 }}>Doctor Availability</p>
                  <p style={{ color: 'var(--slate-400)', fontSize: '0.75rem', marginTop: '0.25rem' }}>10:00 AM, 11:00 AM, 02:00 PM, 04:00 PM</p>
                </div>
              </div>
            </div>
          </div>
          <button className="btn-secondary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.6rem', fontSize: '0.75rem', borderRadius: '0.75rem' }}>
            Modify Workspace Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
