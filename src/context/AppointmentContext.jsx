import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDB, generateClientId } from '../data/db.js';
import { DEMO_DOCTORS } from '../data/seedData.js';
import { syncEngine } from '../services/syncEngine.js';
import { useAuth } from './AuthContext.jsx';

const AppointmentContext = createContext(null);
const DOCTORS_STORAGE_KEY = 'drishti_doctors';

function getInitialDoctors() {
  try {
    const saved = localStorage.getItem(DOCTORS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const missingDemo = DEMO_DOCTORS.filter(
          (d) => !parsed.some((p) => p.id === d.id || p.name.toLowerCase() === d.name.toLowerCase())
        );
        return [...parsed, ...missingDemo];
      }
    }
  } catch {}
  return [...DEMO_DOCTORS];
}

export function AppointmentProvider({ children }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState(getInitialDoctors);
  const [loading, setLoading] = useState(true);

  /**
   * Load doctors from localStorage and sync from MySQL /api/doctors if online
   */
  const loadDoctors = useCallback(async () => {
    let current = getInitialDoctors();
    setDoctors(current);

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/doctors', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const remote = json.data || [];
          if (remote.length > 0) {
            const mergedMap = new Map();
            current.forEach((d) => mergedMap.set(d.id, d));
            remote.forEach((d) => {
              const prev = mergedMap.get(d.id) || {};
              mergedMap.set(d.id, { ...prev, ...d });
            });
            const merged = Array.from(mergedMap.values());
            setDoctors(merged);
            try {
              localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(merged));
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Backend doctors fetch unavailable; using local doctors:', err.message);
      }
    }
  }, []);

  /**
   * Register a new doctor profile
   */
  const addDoctor = useCallback(async (data) => {
    const id = data.id || generateClientId('doc');
    const newDoctor = {
      id,
      name: data.name.trim(),
      title: data.title?.trim() || 'MD, Ophthalmology',
      role: data.role?.trim() || 'Retina Specialist',
      specialty: data.specialty?.trim() || 'Diabetic Retinopathy',
      hospital: data.hospital?.trim() || 'District Eye Hospital',
      location: data.location?.trim() || 'Yavatmal, Maharashtra',
      fee: Number(data.fee) || 500,
      experience: data.experience?.trim() || '5+ years',
      rating: data.rating ? Number(data.rating) : 4.9,
      reviewsCount: data.reviewsCount || 1,
      avatarColor: data.avatarColor || '#0891b2',
      availableDays: Array.isArray(data.availableDays) && data.availableDays.length > 0
        ? data.availableDays
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      availableSlots: Array.isArray(data.availableSlots) && data.availableSlots.length > 0
        ? data.availableSlots
        : ['09:30 AM', '11:00 AM', '02:00 PM', '04:30 PM'],
      modes: Array.isArray(data.modes) && data.modes.length > 0
        ? data.modes
        : ['in-person', 'tele-consultation'],
      languages: Array.isArray(data.languages) && data.languages.length > 0
        ? data.languages
        : ['Hindi', 'English', 'Marathi'],
      about: data.about?.trim() || 'Specialist in diabetic retinopathy screening and clinical management.',
    };

    setDoctors((prev) => {
      const exists = prev.some((d) => d.id === newDoctor.id || d.name.toLowerCase() === newDoctor.name.toLowerCase());
      const next = exists ? prev.map((d) => (d.id === newDoctor.id ? newDoctor : d)) : [newDoctor, ...prev];
      try {
        localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    if (navigator.onLine) {
      try {
        await fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDoctor),
        });
      } catch (err) {
        console.warn('Backend doctor registration unavailable; stored locally:', err.message);
      }
    }

    return { success: true, doctor: newDoctor };
  }, []);

  /**
   * Load appointments from IndexedDB filtered by ownership.
   */
  const loadAppointments = useCallback(async () => {
    if (!user) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const db = await getDB();
      let all = await db.getAll('appointments');

      // Apply ownership filter — admin sees everything
      if (user.role !== 'admin') {
        all = all.filter((a) => a.ownerUserId === user.id);
      }

      // Sort newest first
      all.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      setAppointments(all);
    } catch (err) {
      console.error('Failed to load appointments from IndexedDB', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    setAppointments([]);
    loadAppointments();
    loadDoctors();
  }, [loadAppointments, loadDoctors]);

  /**
   * Check if a specific time slot is available for a doctor on a given date.
   */
  const isSlotAvailable = useCallback(
    (doctorId, date, time, excludeId = null) => {
      return !appointments.some((apt) => {
        if (excludeId && apt.id === excludeId) return false;
        if (apt.status === 'cancelled') return false;
        return apt.doctorId === doctorId && apt.date === date && apt.time === time;
      });
    },
    [appointments]
  );

  /**
   * Add a new appointment record.
   */
  const addAppointment = async (data) => {
    if (!user) throw new Error('Must be authenticated to book an appointment.');
    const db = await getDB();
    const id = data.id || generateClientId('apt');
    const newAppointment = {
      id,
      ownerUserId: user.id,
      patientId: data.patientId,
      patientName: data.patientName,
      patientPhone: data.patientPhone || '',
      patientVillage: data.patientVillage || '',
      patientDistrict: data.patientDistrict || '',
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      doctorRole: data.doctorRole || 'Ophthalmologist',
      doctorHospital: data.doctorHospital || 'Regional Eye Center',
      doctorFee: data.doctorFee ?? null,
      scanId: data.scanId || null,
      scanGrade: data.scanGrade ?? null,
      scanGradeLabel: data.scanGradeLabel || null,
      date: data.date,
      time: data.time,
      type: data.type || 'in-person',
      reason: data.reason || 'Clinical follow-up review',
      status: 'confirmed',
      notes: data.notes || '',
      sync_status: 'pending_sync',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.put('appointments', newAppointment);
    setAppointments((prev) => [newAppointment, ...prev]);

    await syncEngine.enqueueOperation({
      operationType: 'CREATE_APPOINTMENT',
      entityType: 'appointment',
      entityId: newAppointment.id,
      payload: newAppointment,
    });

    return newAppointment;
  };

  /**
   * Update appointment fields (status, notes, etc.)
   */
  const updateAppointment = async (appointmentId, updates) => {
    const db = await getDB();
    const existing = await db.get('appointments', appointmentId);
    if (!existing) return null;

    if (user?.role !== 'admin' && existing.ownerUserId !== user?.id) {
      console.warn('Unauthorized appointment update attempt blocked.');
      return null;
    }

    const updated = {
      ...existing,
      ...updates,
      sync_status: 'pending_sync',
      updatedAt: new Date().toISOString(),
    };

    await db.put('appointments', updated);
    setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? updated : a)));

    await syncEngine.enqueueOperation({
      operationType: 'UPDATE_APPOINTMENT',
      entityType: 'appointment',
      entityId: appointmentId,
      payload: updated,
    });

    return updated;
  };

  /**
   * Cancel an appointment with an optional cancellation reason.
   */
  const cancelAppointment = async (appointmentId, cancelReason = '') => {
    return updateAppointment(appointmentId, {
      status: 'cancelled',
      cancellationReason: cancelReason,
      cancelledAt: new Date().toISOString(),
    });
  };

  const getAppointmentById = useCallback(
    (id) => {
      return appointments.find((a) => a.id === id) || null;
    },
    [appointments]
  );

  const getAppointmentsForCurrentUser = useCallback(() => {
    return appointments;
  }, [appointments]);

  const getAppointmentsForPatient = useCallback(
    (patientId) => {
      return appointments.filter((a) => a.patientId === patientId);
    },
    [appointments]
  );

  const getAppointmentsForDoctor = useCallback(
    (doctorId) => {
      return appointments.filter((a) => a.doctorId === doctorId);
    },
    [appointments]
  );

  const getAppointmentForScan = useCallback(
    (scanId) => {
      if (!scanId) return null;
      return appointments.find((a) => a.scanId === scanId && a.status !== 'cancelled') || null;
    },
    [appointments]
  );

  const getDoctorById = useCallback(
    (doctorId) => {
      return doctors.find((d) => d.id === doctorId) || null;
    },
    [doctors]
  );

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        doctors,
        loading,
        addAppointment,
        updateAppointment,
        cancelAppointment,
        addDoctor,
        isSlotAvailable,
        getAppointmentById,
        getAppointmentsForCurrentUser,
        getAppointmentsForPatient,
        getAppointmentsForDoctor,
        getAppointmentForScan,
        getDoctorById,
        reload: loadAppointments,
        reloadDoctors: loadDoctors,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const ctx = useContext(AppointmentContext);
  if (!ctx) throw new Error('useAppointments must be used within AppointmentProvider');
  return ctx;
}
