import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  TrendingUp, 
  Printer, 
  Star, 
  Activity, 
  Sparkles,
  AlertTriangle,
  UserPlus,
  DoorOpen,
  DollarSign,
  FileText,
  HeartPulse,
  Phone,
  ShieldAlert
} from 'lucide-react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';
import { 
  getDashboardStats, 
  getDashboardAppointments, 
  getInCabinPatient,
  createWalkInPatient,
  callTokenIntoCabin,
  markTokenPayment
} from '../services/api';
import api from '../services/api';

const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');

const Dashboard = () => {
  const { user } = useAuthStore();
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const isDoctor = user?.role === 'DOCTOR' || user?.role === 'SUPER_ADMIN';

  const [appointments, setAppointments] = useState([]);
  const [statsData, setStatsData] = useState({
    todaysBookings: 0,
    totalPatients: 0,
    waitingCount: 0,
    inCabinCount: 0,
    completedCount: 0,
    conversionRate: '0%',
    totalCollected: 0,
    upiCollected: 0,
    cashCollected: 0,
    fraudAuditCount: 0,
    fraudDiscrepancies: []
  });
  const [inCabinPatient, setInCabinPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Walk-in modal state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    feeAmount: 500,
    symptoms: ''
  });
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, apptsRes, inCabinRes] = await Promise.all([
        getDashboardStats(),
        getDashboardAppointments(),
        getInCabinPatient()
      ]);
      setStatsData(statsRes.data.data);
      setAppointments(apptsRes.data.data);
      setInCabinPatient(inCabinRes.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Real-time synchronization
    socket.on('queue:updated', () => {
      fetchDashboardData();
    });

    return () => {
      socket.off('queue:updated');
    };
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
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to generate printable template:', err);
      alert('Error generating printable template. Please try again.');
    } finally {
      setPrintingId(null);
    }
  };

  const handleCallIntoCabin = async (aptId) => {
    setActionLoadingId(aptId);
    try {
      await callTokenIntoCabin(aptId);
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to call patient:', err);
      alert('Failed to call patient into cabin.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkPayment = async (aptId, mode = 'CASH_AT_DESK') => {
    setActionLoadingId(aptId);
    try {
      await markTokenPayment(aptId, mode);
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to record payment:', err);
      alert('Failed to record payment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!walkInForm.name || !walkInForm.phone) {
      alert('Please fill patient name and phone number');
      return;
    }
    setSubmittingWalkIn(true);
    try {
      await createWalkInPatient(walkInForm);
      setShowWalkInModal(false);
      setWalkInForm({ name: '', phone: '', age: '', gender: 'Male', feeAmount: 500, symptoms: '' });
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to create walk-in token:', err);
      alert(err.response?.data?.message || 'Error generating walk-in token');
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: '80vh' }}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-semibold text-slate-400">Loading clinic operating system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" style={{ paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <header className="dashboard-header">
        <div className="header-bg-glow"></div>
        <div className="relative flex justify-between items-center w-full" style={{ zIndex: 1 }}>
          <div>
            <span className="header-badge">
              {isReceptionist ? 'Reception Desk' : 'Doctor Cabin Cockpit'}
            </span>
            <h1 className="header-title">
              {isReceptionist ? 'Live OPD Token & Queue Manager' : `Dr. ${user?.name || 'Doctor'} Workspace`}
            </h1>
            <p className="header-desc">
              {isReceptionist 
                ? 'Manage front-desk walk-ins, cash collections, and token progression in real time.'
                : 'In-cabin clinical dashboard with patient AI pre-reads, abnormal biomarkers, and zero-typing voice Rx.'
              }
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {isReceptionist && (
              <button 
                onClick={() => setShowWalkInModal(true)}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '0.75rem' }}
              >
                <UserPlus style={{ width: '16px', height: '16px' }} />
                <span>+ Walk-In Token</span>
              </button>
            )}
            <div className="gateway-status">
              <span className="pulse-indicator"></span>
              <span>WhatsApp Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Front-Desk Fraud Auditor Alert Banner (Only for Doctor / Admin) */}
      {isDoctor && statsData.fraudAuditCount > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1px solid #fca5a5',
          borderRadius: '1rem',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
        }}>
          <ShieldAlert style={{ width: '28px', height: '28px', color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#991b1b', margin: 0 }}>
              ⚠️ Front-Desk Audit Alert: {statsData.fraudAuditCount} Consultation(s) Left Unpaid
            </h3>
            <p style={{ fontSize: '13px', color: '#b91c1c', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
              Prescriptions were generated inside the cabin, but the reception desk has not marked payment collected.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {statsData.fraudDiscrepancies.map((d, i) => (
                <span 
                  key={i}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#fff',
                    color: '#991b1b',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    border: '1px solid #f87171'
                  }}
                >
                  Token #{d.tokenNumber}: {d.patientName} (₹{d.feeAmount})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper indigo">
            <Calendar style={{ width: '24px', height: '24px', color: '#6366f1' }} />
          </div>
          <div>
            <p className="stat-label">Today's OPD Count</p>
            <p className="stat-value">{statsData.todaysBookings}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper pink">
            <Clock style={{ width: '24px', height: '24px', color: '#db2777' }} />
          </div>
          <div>
            <p className="stat-label">Waiting in Lounge</p>
            <p className="stat-value">{statsData.waitingCount}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper emerald">
            <CheckCircle style={{ width: '24px', height: '24px', color: '#059669' }} />
          </div>
          <div>
            <p className="stat-label">Completed Visits</p>
            <p className="stat-value">{statsData.completedCount}</p>
          </div>
        </div>

        {/* Financial KPI (Doctor / Admin only) */}
        {isDoctor && (
          <div className="stat-card">
            <div className="stat-icon-wrapper emerald">
              <DollarSign style={{ width: '24px', height: '24px', color: '#059669' }} />
            </div>
            <div>
              <p className="stat-label">Today's Revenue</p>
              <p className="stat-value">₹{(statsData.totalCollected || 0).toLocaleString('en-IN')}</p>
              <p style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '2px' }}>
                UPI: ₹{(statsData.upiCollected || 0).toLocaleString('en-IN')} | Cash: ₹{(statsData.cashCollected || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* DOCTOR VIEW: Active Patient In Cabin Cockpit */}
      {isDoctor && (
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
          borderRadius: '1.25rem',
          padding: '1.75rem',
          color: '#fff',
          boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                padding: '0.5rem',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HeartPulse style={{ width: '24px', height: '24px', color: '#93c5fd' }} />
              </div>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bfdbfe', fontWeight: 700 }}>
                  Active Consultation Cockpit
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                  {inCabinPatient ? `Token #${inCabinPatient.tokenNumber}: ${inCabinPatient.patientName}` : 'Cabin Currently Empty'}
                </h2>
              </div>
            </div>

            {inCabinPatient && (
              <span style={{
                backgroundColor: '#22c55e',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }}></span>
                In Cabin Now
              </span>
            )}
          </div>

          {inCabinPatient ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
              {/* Demographics & Chief Complaints */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '0.85rem', padding: '1rem' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#93c5fd', marginBottom: '0.5rem' }}>PATIENT PROFILE</p>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>{inCabinPatient.patientName} ({inCabinPatient.patientAge || 'Adult'} Yrs / {inCabinPatient.patientGender || 'Patient'})</p>
                <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '0.25rem' }}>
                  <Phone style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
                  {inCabinPatient.patientPhone}
                </p>
                <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                  <p style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 600 }}>TRIAGE PRE-READ</p>
                  <p style={{ fontSize: '13px', marginTop: '0.25rem', color: '#f8fafc' }}>
                    {inCabinPatient.triageSummary?.symptomsTranslated || 'Routine in-person consultation'}
                  </p>
                </div>
              </div>

              {/* Abnormal Biomarkers */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '0.85rem', padding: '1rem' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#93c5fd', marginBottom: '0.5rem' }}>VISION LAB BIOMARKERS</p>
                {inCabinPatient.biomarkers?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {inCabinPatient.biomarkers.map((b, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#cbd5e1' }}>{b.name}:</span>
                        <span style={{
                          fontWeight: 700,
                          color: b.isAbnormal ? '#f87171' : '#4ade80',
                          backgroundColor: b.isAbnormal ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px'
                        }}>
                          {b.value} {b.unit} {b.isAbnormal && '⚠️'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#cbd5e1' }}>No prior lab reports uploaded on WhatsApp.</p>
                )}
              </div>

              {/* Actions */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '0.85rem', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#93c5fd', marginBottom: '0.5rem' }}>ONE-CLICK PRESCRIPTION</p>
                  <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    Print an instant physical template or approve the WhatsApp voice dictation to complete this visit.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => handlePrintBlankRx({ id: inCabinPatient.appointmentId, patientId: inCabinPatient.patientId })}
                    disabled={printingId === inCabinPatient.appointmentId}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      backgroundColor: '#fff',
                      color: '#1e3a8a',
                      fontWeight: 700,
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Printer style={{ width: '14px', height: '14px' }} />
                    {printingId === inCabinPatient.appointmentId ? 'Generating...' : 'Print Blank Rx'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: '#bfdbfe', margin: '0.5rem 0 0 0' }}>
              The cabin is open. Call the next patient from the Live Token Queue below when ready.
            </p>
          )}
        </div>
      )}

      {/* Live OPD Token Queue Manager Table */}
      <div className="queue-card">
        <div className="queue-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="queue-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity style={{ width: '20px', height: '20px', color: '#6366f1' }} />
              Live OPD Token Queue
            </h2>
            <p className="queue-subtitle">
              Real-time patient progression from WhatsApp booking / walk-in arrival to cabin consultation
            </p>
          </div>
          <span className="queue-count">{appointments.length} Patients Today</span>
        </div>

        {appointments.length === 0 ? (
          <div style={{ padding: '3rem 0', textAlign: 'center' }}>
            <Calendar style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 1rem auto' }} />
            <p className="text-sm font-semibold text-slate-400">No appointments registered yet today</p>
            <p className="text-xs text-slate-400" style={{ marginTop: '0.25rem' }}>
              Patients booking via WhatsApp or walk-in arrivals will appear here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Token</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Patient & Phone</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Queue Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Payment Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => {
                  const isCompleted = apt.queueStatus === 'COMPLETED' || apt.status === 'Completed';
                  const isInCabin = apt.queueStatus === 'IN_CABIN';
                  const isWaiting = apt.queueStatus === 'WAITING_OUTSIDE' || apt.queueStatus === 'BOOKED';
                  const isPaid = apt.paymentMode === 'CASH_AT_DESK' || apt.paymentMode === 'WHATSAPP_UPI' || apt.paymentStatus === 'captured';

                  return (
                    <tr 
                      key={apt.id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isInCabin ? '#eff6ff' : (apt.isDiscrepancyFlagged ? '#fff1f2' : 'transparent'),
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {/* Token # */}
                      <td style={{ padding: '1rem', fontWeight: 800, fontSize: '15px', color: isInCabin ? '#1e40af' : '#334155' }}>
                        #{apt.tokenNumber || '-'}
                      </td>

                      {/* Patient info */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{apt.patientName}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {apt.patientAge ? `${apt.patientAge} Yrs / ` : ''}{apt.patientGender || ''} {apt.patientPhone && `• ${apt.patientPhone}`}
                        </div>
                      </td>

                      {/* Queue Status Badge */}
                      <td style={{ padding: '1rem' }}>
                        {isInCabin && (
                          <span style={{ backgroundColor: '#2563eb', color: '#fff', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '11px', fontWeight: 700 }}>
                            🚪 In Cabin
                          </span>
                        )}
                        {isWaiting && (
                          <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '11px', fontWeight: 700 }}>
                            ⏳ Waiting Lounge
                          </span>
                        )}
                        {isCompleted && (
                          <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '11px', fontWeight: 700 }}>
                            ✓ Finished
                          </span>
                        )}
                      </td>

                      {/* Payment Status Badge */}
                      <td style={{ padding: '1rem' }}>
                        {isPaid ? (
                          <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '12px' }}>
                            ✓ {apt.paymentMode === 'CASH_AT_DESK' ? 'Cash at Desk' : 'WhatsApp UPI'} (₹{apt.feeAmount})
                          </span>
                        ) : (
                          <span style={{
                            color: apt.isDiscrepancyFlagged ? '#dc2626' : '#d97706',
                            fontWeight: 700,
                            fontSize: '11px',
                            backgroundColor: apt.isDiscrepancyFlagged ? '#fee2e2' : '#fef3c7',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px'
                          }}>
                            {apt.isDiscrepancyFlagged ? '⚠️ UNPAID (Rx Written)' : 'Pending Desk Payment'}
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* Call into Cabin */}
                          {isWaiting && (
                            <button
                              onClick={() => handleCallIntoCabin(apt.id)}
                              disabled={actionLoadingId === apt.id}
                              style={{
                                padding: '0.4rem 0.75rem',
                                fontSize: '11px',
                                fontWeight: 600,
                                borderRadius: '0.5rem',
                                backgroundColor: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <DoorOpen style={{ width: '12px', height: '12px' }} />
                              Call In
                            </button>
                          )}

                          {/* Collect Cash */}
                          {!isPaid && (
                            <button
                              onClick={() => handleMarkPayment(apt.id, 'CASH_AT_DESK')}
                              disabled={actionLoadingId === apt.id}
                              style={{
                                padding: '0.4rem 0.75rem',
                                fontSize: '11px',
                                fontWeight: 600,
                                borderRadius: '0.5rem',
                                backgroundColor: '#10b981',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <DollarSign style={{ width: '12px', height: '12px' }} />
                              Cash Paid
                            </button>
                          )}

                          {/* Print Blank Rx */}
                          <button
                            onClick={() => handlePrintBlankRx(apt)}
                            disabled={printingId === apt.id}
                            style={{
                              padding: '0.4rem 0.75rem',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '0.5rem',
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <Printer style={{ width: '12px', height: '12px' }} />
                            {printingId === apt.id ? 'Printing...' : 'Print Rx'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Walk-In Patient Registration Modal */}
      {showWalkInModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '1rem',
            padding: '1.75rem',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
              Assign Walk-In Token
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '1.25rem' }}>
              Creates an instant OPD token in today's queue and sends WhatsApp confirmation.
            </p>

            <form onSubmit={handleWalkInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Patient Full Name *
                </label>
                <input 
                  type="text" 
                  value={walkInForm.name} 
                  onChange={(e) => setWalkInForm({ ...walkInForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Phone Number (WhatsApp) *
                  </label>
                  <input 
                    type="tel" 
                    value={walkInForm.phone} 
                    onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })}
                    placeholder="919876543210"
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Age (Years)
                  </label>
                  <input 
                    type="number" 
                    value={walkInForm.age} 
                    onChange={(e) => setWalkInForm({ ...walkInForm, age: e.target.value })}
                    placeholder="e.g. 42"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Gender
                  </label>
                  <select
                    value={walkInForm.gender}
                    onChange={(e) => setWalkInForm({ ...walkInForm, gender: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    OPD Consultation Fee (₹)
                  </label>
                  <input 
                    type="number" 
                    value={walkInForm.feeAmount} 
                    onChange={(e) => setWalkInForm({ ...walkInForm, feeAmount: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Symptoms / Chief Complaints
                </label>
                <input 
                  type="text" 
                  value={walkInForm.symptoms} 
                  onChange={(e) => setWalkInForm({ ...walkInForm, symptoms: e.target.value })}
                  placeholder="e.g. Fever, dry cough for 2 days"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWalkIn}
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem' }}
                >
                  {submittingWalkIn ? 'Assigning...' : 'Assign Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
