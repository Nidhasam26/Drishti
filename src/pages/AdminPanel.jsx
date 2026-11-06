import { useState } from 'react';
import { usePatients } from '../context/PatientContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAppointments } from '../context/AppointmentContext.jsx';
import PageWrapper from '../components/layout/PageWrapper.jsx';
import {
  Users, Activity, Eye, Download, CheckCircle2,
  Stethoscope, Plus, X, IndianRupee, MapPin, Building2, AlertCircle
} from 'lucide-react';
import CountUp from '../components/ui/CountUp.jsx';

const ROLE_LABELS = { patient: 'Patient', user: 'Field Screener', admin: 'Administrator', doctor: 'Doctor / Specialist' };

export default function AdminPanel() {
  const { patients, scans } = usePatients();
  const { getRegisteredUsers } = useAuth();
  const { doctors, addDoctor } = useAppointments();

  const registeredUsers = getRegisteredUsers();

  // Aggregate stats
  const totalScans = scans.length;
  const grade2Plus = scans.filter((s) => s.ai_result?.grade >= 2).length;
  const nonAdminUsers = registeredUsers.filter((u) => u.role !== 'admin');

  // Doctor Registration Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [docSuccess, setDocSuccess] = useState('');
  const [docError, setDocError] = useState('');

  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('MD, DNB (Ophthalmology)');
  const [formRole, setFormRole] = useState('Senior Retina Consultant');
  const [formSpecialty, setFormSpecialty] = useState('Diabetic Retinopathy & Retina Specialist');
  const [formHospital, setFormHospital] = useState('District Eye Care Hospital');
  const [formLocation, setFormLocation] = useState('Yavatmal, Maharashtra');
  const [formFee, setFormFee] = useState('600');
  const [formExperience, setFormExperience] = useState('8+ years');
  const [formModes, setFormModes] = useState(['in-person', 'tele-consultation']);
  const [formDays, setFormDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [formAbout, setFormAbout] = useState('');

  const resetDocForm = () => {
    setFormName('');
    setFormTitle('MD, DNB (Ophthalmology)');
    setFormRole('Senior Retina Consultant');
    setFormSpecialty('Diabetic Retinopathy & Retina Specialist');
    setFormHospital('District Eye Care Hospital');
    setFormLocation('Yavatmal, Maharashtra');
    setFormFee('600');
    setFormExperience('8+ years');
    setFormModes(['in-person', 'tele-consultation']);
    setFormDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    setFormAbout('');
    setDocError('');
    setDocSuccess('');
  };

  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    setDocError('');
    setDocSuccess('');

    if (!formName.trim()) {
      setDocError('Doctor name is required.');
      return;
    }

    try {
      setDocLoading(true);
      const cleanName = formName.trim().startsWith('Dr.') ? formName.trim() : `Dr. ${formName.trim()}`;
      await addDoctor({
        name: cleanName,
        title: formTitle.trim() || 'MD, Ophthalmology',
        role: formRole.trim() || 'Retina Specialist',
        specialty: formSpecialty.trim() || 'Diabetic Retinopathy',
        hospital: formHospital.trim() || 'District Eye Hospital',
        location: formLocation.trim() || 'Yavatmal, Maharashtra',
        fee: Number(formFee) || 500,
        experience: formExperience.trim() || '5+ years',
        modes: formModes,
        availableDays: formDays,
        about: formAbout.trim() || 'Specialist in diabetic retinopathy screening and tele-ophthalmology triage.',
      });

      setDocSuccess(`Doctor ${cleanName} registered successfully!`);
      setTimeout(() => {
        setShowDocModal(false);
        resetDocForm();
      }, 1200);
    } catch (err) {
      setDocError(err.message || 'Failed to register doctor.');
    } finally {
      setDocLoading(false);
    }
  };

  const toggleDay = (day) => {
    setFormDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleMode = (mode) => {
    setFormModes((prev) =>
      prev.includes(mode) ? (prev.length > 1 ? prev.filter((m) => m !== mode) : prev) : [...prev, mode]
    );
  };

  return (
    <PageWrapper>
      <div className="dr-admin-screen">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 28,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div className="dr-eyebrow" style={{ marginBottom: 6 }}>
              <span className="dr-live-dot" /> SYSTEM ADMINISTRATION · WORKSTATION
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#f0fdfa' }}>
              Admin Panel
            </h1>
            <p style={{ color: '#91b4af', fontSize: 14, marginTop: 4, margin: 0 }}>
              System overview, audit metrics, clinical specialist registry, and user account management
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                resetDocForm();
                setShowDocModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: 13.5,
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(6, 182, 212, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              <Plus size={16} /> Register New Doctor
            </button>

            <button
              type="button"
              className="dr-secondary-btn"
              disabled
              title="Export feature available in production"
              style={{
                background: 'rgba(11, 36, 34, 0.7)',
                color: '#91b4af',
                borderColor: 'rgba(115, 231, 214, 0.2)',
                opacity: 0.7,
                cursor: 'not-allowed',
              }}
            >
              <Download size={16} /> Export Report
            </button>
          </div>
        </div>

        {/* Aggregate KPI Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 18,
            marginBottom: 26,
          }}
        >
          <div className="dr-patient-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'rgba(34, 211, 238, 0.12)',
                border: '1px solid rgba(34, 211, 238, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22d3ee',
              }}
            >
              <Activity size={22} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#f0fdfa', fontFamily: 'var(--font-heading)' }}>
                <CountUp end={totalScans} />
              </div>
              <div className="patient-label" style={{ marginTop: 2 }}>TOTAL SCANS</div>
            </div>
          </div>

          <div className="dr-patient-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
              }}
            >
              <Eye size={22} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-heading)' }}>
                <CountUp end={grade2Plus} />
              </div>
              <div className="patient-label" style={{ marginTop: 2 }}>REFERRALS TRIGGERED</div>
            </div>
          </div>

          <div className="dr-patient-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-heading)' }}>
                <CountUp end={registeredUsers.length} />
              </div>
              <div className="patient-label" style={{ marginTop: 2 }}>REGISTERED USERS</div>
            </div>
          </div>

          <div className="dr-patient-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'rgba(14, 165, 233, 0.12)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Stethoscope size={22} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-heading)' }}>
                <CountUp end={doctors.length} />
              </div>
              <div className="patient-label" style={{ marginTop: 2 }}>ACTIVE SPECIALISTS</div>
            </div>
          </div>
        </div>

        {/* Stacked Layout: One after another */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* 1. Clinical Specialists & Doctors Registry Card */}
          <div className="dr-patient-card" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#f0fdfa' }}>
                  Doctors & Clinical Specialists Directory
                </h2>
                <span style={{ fontSize: 12, color: '#91b4af', display: 'block', marginTop: 2 }}>
                  Certified ophthalmologists and retina specialists available for patient appointments and AI referral triage
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#22d3ee',
                  background: 'rgba(34, 211, 238, 0.1)',
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: '1px solid rgba(34, 211, 238, 0.2)',
                }}>
                  {doctors.length} Specialists Available
                </span>
                <button
                  type="button"
                  onClick={() => {
                    resetDocForm();
                    setShowDocModal(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: 'rgba(34, 211, 238, 0.15)',
                    color: '#67e8f9',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} /> Add Doctor
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(115, 231, 214, 0.15)', background: 'rgba(6, 24, 23, 0.6)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#72a8a1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>DOCTOR</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#72a8a1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SPECIALTY</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#72a8a1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>HOSPITAL / LOCATION</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#72a8a1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>FEE</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#72a8a1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>MODES</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '36px 12px', color: '#91b4af', fontSize: 13, background: 'transparent' }}>
                        No doctors registered yet. Click &quot;Register New Doctor&quot; to add one.
                      </td>
                    </tr>
                  ) : (
                    doctors.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid rgba(115, 231, 214, 0.08)', background: 'transparent' }}>
                        <td style={{ padding: '14px 16px', background: 'transparent' }}>
                          <div style={{ fontWeight: 700, color: '#f0fdfa', fontSize: 14 }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: '#72a8a1', marginTop: 2 }}>{d.title || d.experience || ''}</div>
                        </td>
                        <td style={{ padding: '14px 16px', background: 'transparent' }}>
                          <div style={{ fontWeight: 600, color: '#67e8f9', fontSize: 13 }}>{d.specialty || d.role}</div>
                          <div style={{ fontSize: 11, color: '#91b4af', marginTop: 2 }}>{d.role}</div>
                        </td>
                        <td style={{ padding: '14px 16px', background: 'transparent' }}>
                          <div style={{ color: '#d1f2ec', fontSize: 13 }}>{d.hospital}</div>
                          <div style={{ fontSize: 11, color: '#72a8a1', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <MapPin size={11} /> {d.location}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#34d399', fontSize: 13.5, background: 'transparent' }}>
                          ₹{d.fee}
                        </td>
                        <td style={{ padding: '14px 16px', background: 'transparent' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {(d.modes || ['in-person']).map((m) => (
                              <span
                                key={m}
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: 12,
                                  background: m === 'tele-consultation' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                                  color: m === 'tele-consultation' ? '#c084fc' : '#38bdf8',
                                  border: m === 'tele-consultation' ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid rgba(14, 165, 233, 0.25)',
                                }}
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Registered Users Card */}
          <div className="dr-patient-card" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#f0fdfa' }}>Registered Users</h2>
                <span style={{ fontSize: 12, color: '#91b4af', display: 'block', marginTop: 2 }}>
                  Active screener and patient accounts in registry
                </span>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#22d3ee',
                background: 'rgba(34, 211, 238, 0.1)',
                padding: '4px 10px',
                borderRadius: 20,
                border: '1px solid rgba(34, 211, 238, 0.2)',
              }}>
                {nonAdminUsers.length} Accounts
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(115, 231, 214, 0.15)', background: 'rgba(6, 24, 23, 0.6)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#72a8a1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>NAME</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#72a8a1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>USERNAME</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#72a8a1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ROLE</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#72a8a1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>DISTRICT</th>
                  </tr>
                </thead>
                <tbody>
                  {nonAdminUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '36px 12px', color: '#91b4af', fontSize: 13, background: 'transparent' }}>
                        No user accounts registered yet.
                      </td>
                    </tr>
                  ) : (
                    nonAdminUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(115, 231, 214, 0.08)', background: 'transparent' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f0fdfa', fontSize: 13.5, background: 'transparent' }}>{u.name}</td>
                        <td style={{ padding: '14px 16px', background: 'transparent' }}>
                          <code style={{
                            fontSize: 12,
                            background: 'rgba(6, 24, 23, 0.8)',
                            color: '#22d3ee',
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid rgba(34, 211, 238, 0.2)',
                            fontFamily: 'monospace',
                          }}>
                            {u.username}
                          </code>
                        </td>
                        <td style={{ padding: '14px 16px', background: 'transparent' }}>
                          <span style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '4px 12px',
                            borderRadius: 20,
                            background: 'rgba(34, 211, 238, 0.12)',
                            color: '#67e8f9',
                            border: '1px solid rgba(34, 211, 238, 0.25)',
                          }}>
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13.5, color: '#d1f2ec', background: 'transparent' }}>{u.district || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. System Health Card */}
          <div className="dr-patient-card" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#f0fdfa' }}>System Health & Infrastructure</h2>
                <span style={{ fontSize: 12, color: '#91b4af', display: 'block', marginTop: 2 }}>
                  Real-time status of AI inference pipelines, doctor network, and database
                </span>
              </div>
              <div className="dr-eyebrow" style={{ color: '#34d399' }}>
                <span className="dr-live-dot" style={{ background: '#34d399' }} /> ALL SYSTEMS OPERATIONAL
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 18px',
                  background: 'rgba(6, 24, 23, 0.6)',
                  borderRadius: 14,
                  border: '1px solid rgba(115, 231, 214, 0.1)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#f0fdfa' }}>AI Model Inference Engine</div>
                  <div style={{ fontSize: 12, color: '#72a8a1', marginTop: 2 }}>drishti-v2.1-mobile · PyTorch / ONNX</div>
                </div>
                <span style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  <CheckCircle2 size={13} /> Online
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 18px',
                  background: 'rgba(6, 24, 23, 0.6)',
                  borderRadius: 14,
                  border: '1px solid rgba(115, 231, 214, 0.1)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#f0fdfa' }}>Specialist Doctor Network</div>
                  <div style={{ fontSize: 12, color: '#72a8a1', marginTop: 2 }}>Active ophthalmologists and tele-clinics</div>
                </div>
                <span style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  background: 'rgba(14, 165, 233, 0.15)',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                  color: '#38bdf8',
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  <CheckCircle2 size={13} /> {doctors.length} Active
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 18px',
                  background: 'rgba(6, 24, 23, 0.6)',
                  borderRadius: 14,
                  border: '1px solid rgba(115, 231, 214, 0.1)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#f0fdfa' }}>Database & Encrypted Storage</div>
                  <div style={{ fontSize: 12, color: '#72a8a1', marginTop: 2 }}>MySQL 8 & Local IndexedDB store</div>
                </div>
                <span style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  <CheckCircle2 size={13} /> Healthy
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Registration Modal */}
        {showDocModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(3, 10, 16, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 620,
                background: '#07181d',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                borderRadius: 20,
                padding: '28px 32px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  background: 'transparent',
                  border: 'none',
                  color: '#91b4af',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(34, 211, 238, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#22d3ee',
                  }}
                >
                  <Stethoscope size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#f0fdfa' }}>
                    Register Clinical Specialist
                  </h3>
                  <span style={{ fontSize: 12, color: '#91b4af' }}>
                    Add an ophthalmologist or retinal specialist to the referral directory
                  </span>
                </div>
              </div>

              {docError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: 12.5,
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <AlertCircle size={16} /> {docError}
                </div>
              )}

              {docSuccess && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontSize: 12.5,
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <CheckCircle2 size={16} /> {docSuccess}
                </div>
              )}

              <form onSubmit={handleRegisterDoctor} style={{ marginTop: 20 }}>
                {/* Name & Title */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#91b4af', marginBottom: 6, textTransform: 'uppercase' }}>
                      DOCTOR NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Dr. Rajesh Kulkarni"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(11, 20, 30, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#f0fdfa',
                        fontSize: 13.5,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#91b4af', marginBottom: 6, textTransform: 'uppercase' }}>
                      QUALIFICATIONS / TITLE
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="MS, DNB, FVRS"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(11, 20, 30, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#f0fdfa',
                        fontSize: 13.5,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Role & Specialty */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#91b4af', marginBottom: 6, textTransform: 'uppercase' }}>
                      CLINICAL ROLE / DESIGNATION
                    </label>
                    <input
                      type="text"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      placeholder="Senior Retina Consultant"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(11, 20, 30, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#f0fdfa',
                        fontSize: 13.5,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#91b4af', marginBottom: 6, textTransform: 'uppercase' }}>
                      SPECIALTY FOCUS
                    </label>
                    <input
                      type="text"
                      value={formSpecialty}
                      onChange={(e) => setFormSpecialty(e.target.value)}
                      placeholder="Medical & Surgical Retina"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(11, 20, 30, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#f0fdfa',
                        fontSize: 13.5,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Hospital & Location */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#91b4af', marginBottom: 6, textTransform: 'uppercase' }}>
                      HOSPITAL / CLINIC NAME
                    </label>
                    <input
                      type="text"
                      value={formHospital}
                      onChange={(e) => setFormHospital(e.target.value)}
                      placeholder="District Hospital Eye Dept"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(11, 20, 30, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#f0fdfa',
                        fontSize: 13.5,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#91b4af', marginBottom: 6, textTransform: 'uppercase' }}>
                      CITY & STATE
                    </label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="Yavatmal, Maharashtra"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(11, 20, 30, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#f0fdfa',
                        fontSize: 13.5,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Fee & Experience */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#91b4af', marginBottom: 6, textTransform: 'uppercase' }}>
                      CONSULTATION FEE (₹)
                    </label>
                    <input
                      type="number"
                      value={formFee}
                      onChange={(e) => setFormFee(e.target.value)}
                      placeholder="500"
                      min="0"
                      step="50"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(11, 20, 30, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#f0fdfa',
                        fontSize: 13.5,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#91b4af', marginBottom: 6, textTransform: 'uppercase' }}>
                      YEARS OF EXPERIENCE
                    </label>
                    <input
                      type="text"
                      value={formExperience}
                      onChange={(e) => setFormExperience(e.target.value)}
                      placeholder="10+ years"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(11, 20, 30, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#f0fdfa',
                        fontSize: 13.5,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Available Days */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#91b4af', marginBottom: 6, textTransform: 'uppercase' }}>
                    AVAILABLE DAYS
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                      const active = formDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            border: active ? '1px solid rgba(34, 211, 238, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                            background: active ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            color: active ? '#22d3ee' : '#91b4af',
                            cursor: 'pointer',
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Consultation Modes */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#91b4af', marginBottom: 6, textTransform: 'uppercase' }}>
                    CONSULTATION MODES
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { key: 'in-person', label: 'In-Person Clinic' },
                      { key: 'tele-consultation', label: 'Tele-Consultation' },
                    ].map(({ key, label }) => {
                      const active = formModes.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleMode(key)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 700,
                            border: active ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                            background: active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            color: active ? '#34d399' : '#91b4af',
                            cursor: 'pointer',
                          }}
                        >
                          {active ? '✓ ' : ''}{label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                  <button
                    type="button"
                    onClick={() => setShowDocModal(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#91b4af',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={docLoading}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #0284c7, #22d3ee)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 13.5,
                      cursor: docLoading ? 'wait' : 'pointer',
                      boxShadow: '0 4px 16px rgba(34, 211, 238, 0.35)',
                    }}
                  >
                    {docLoading ? 'Saving...' : 'Register Specialist'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
