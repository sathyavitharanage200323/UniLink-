import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { ArrowLeft, Zap, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import './BookingPage.css';

const IT_REGEX = /^IT\d{8}$/;
const MAX_REASON = 300;

/* ─── AvailabilityGrid ─────────────────────────────────────── */
function AvailabilityGrid({ slots, selectedSlot, onSelect }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="bp-sidebar">
      <div className="bp-sidebar__header">
        <h2 className="bp-sidebar__title">Availability</h2>
        <p className="bp-sidebar__sub">Select a time slot</p>
      </div>
      <div className="bp-sidebar__scroll">
        {days.map(day => {
          const daySlots = slots.filter(s => s.day === day);
          if (daySlots.length === 0) return null;
          return (
            <div key={day} className="bp-day-group">
              <div className="bp-day-label">{day}</div>
              {daySlots.map(slot => {
                const isTaken = slot.status !== 'OPEN';
                const isSelected = selectedSlot?.id === slot.id;
                return (
                  <div
                    key={slot.id}
                    className={`bp-slot${isSelected ? ' bp-slot--selected' : ''}${isTaken ? ' bp-slot--taken' : ''}`}
                    onClick={() => !isTaken && onSelect(slot)}
                    title={isTaken ? 'This slot is already taken' : slot.time}
                  >
                    <div className="bp-slot__row">
                      <span className="bp-slot__time">
                        <Clock size={13} style={{ marginRight: 5, flexShrink: 0 }} />
                        {slot.time}
                      </span>
                      {isTaken
                        ? <span className="bp-slot__badge bp-slot__badge--taken">Taken</span>
                        : isSelected
                          ? <span className="bp-slot__badge bp-slot__badge--selected"><CheckCircle size={11} /> Selected</span>
                          : <span className="bp-slot__badge bp-slot__badge--open">Open</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {slots.length === 0 && (
          <div className="bp-empty-slots">No slots available for this lecturer.</div>
        )}
      </div>
    </div>
  );
}

/* ─── BookingForm ──────────────────────────────────────────── */
function BookingForm({ formData, onChange, onConfirm, isValid, loading, loadingMsg, selectedSlot }) {
  const itValid = IT_REGEX.test(formData.itNumber);
  const reasonLen = formData.reason.length;

  return (
    <div className="bp-form-card">
      <div className="bp-form-card__top">
        <h1 className="bp-form-card__title">Log Consultation Request</h1>
        {formData.isHighPriority && (
          <span className="bp-priority-badge">
            <Zap size={13} /> HIGH PRIORITY — Final Year Student
          </span>
        )}
        {selectedSlot && (
          <div className="bp-selected-slot-info">
            <CheckCircle size={14} style={{ color: '#16a34a' }} />
            <span>Slot selected: <strong>{selectedSlot.time}</strong> ({selectedSlot.day})</span>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="bp-field">
        <label className="bp-label">Full Name</label>
        <input
          className="bp-input"
          value={formData.studentName}
          onChange={e => onChange('studentName', e.target.value)}
          placeholder="e.g. John Doe"
        />
      </div>

      {/* IT Number */}
      <div className="bp-field">
        <label className="bp-label">IT Number</label>
        <div style={{ position: 'relative' }}>
          <input
            className={`bp-input${formData.itNumber && !itValid ? ' bp-input--error' : ''}`}
            value={formData.itNumber}
            onChange={e => onChange('itNumber', e.target.value)}
            placeholder="IT21000000"
          />
          {formData.itNumber && (
            <span className="bp-input-icon">
              {itValid
                ? <CheckCircle size={16} style={{ color: '#16a34a' }} />
                : <AlertCircle size={16} style={{ color: '#ef4444' }} />}
            </span>
          )}
        </div>
        {formData.itNumber && !itValid && (
          <p className="bp-field-hint bp-field-hint--error">Format: IT + 8 digits (e.g. IT21000000)</p>
        )}
      </div>

      {/* Year + Semester */}
      <div className="bp-row-2">
        <div className="bp-field">
          <label className="bp-label">Academic Year</label>
          <select
            className="bp-select"
            value={formData.academicYear}
            onChange={e => onChange('academicYear', e.target.value)}
          >
            <option value="">Select Year</option>
            <option value="Year 1">1st Year</option>
            <option value="Year 2">2nd Year</option>
            <option value="Year 3">3rd Year</option>
            <option value="Year 4">4th Year</option>
          </select>
        </div>
        <div className="bp-field">
          <label className="bp-label">Semester</label>
          <select
            className="bp-select"
            value={formData.semester}
            onChange={e => onChange('semester', e.target.value)}
          >
            <option value="">Select Semester</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
          </select>
        </div>
      </div>

      {/* Reason */}
      <div className="bp-field">
        <div className="bp-label-row">
          <label className="bp-label">Reason for Meeting</label>
          <span className={`bp-char-count${reasonLen > MAX_REASON ? ' bp-char-count--over' : ''}`}>
            {reasonLen}/{MAX_REASON}
          </span>
        </div>
        <textarea
          className="bp-textarea"
          rows={4}
          maxLength={MAX_REASON}
          value={formData.reason}
          onChange={e => onChange('reason', e.target.value)}
          placeholder="Describe your query in detail..."
        />
      </div>

      <button
        className="bp-confirm-btn"
        disabled={!isValid || loading}
        onClick={onConfirm}
      >
        {loading
          ? <><Loader2 size={16} className="bp-spin" /> {loadingMsg}</>
          : 'Confirm Appointment'}
      </button>
    </div>
  );
}

/* ─── StatusToast ──────────────────────────────────────────── */
function StatusToast({ show, success, message }) {
  if (!show) return null;
  return (
    <div className={`bp-toast${success ? ' bp-toast--success' : ' bp-toast--error'}`}>
      <div className="bp-toast__dot" />
      <div>
        <div className="bp-toast__title">{success ? 'Request Logged' : 'Booking Failed'}</div>
        <div className="bp-toast__msg">{message}</div>
      </div>
    </div>
  );
}

/* ─── Main BookingPage ─────────────────────────────────────── */
export default function BookingPage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const user = currentUser || JSON.parse(localStorage.getItem('user') || 'null');

  const [lecturers, setLecturers] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [toast, setToast] = useState({ show: false, success: false, message: '' });
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [formData, setFormData] = useState({
    studentName: user?.name || '',
    itNumber: user?.registrationNumber || '',
    academicYear: user?.academicYear || '',
    semester: user?.semester || '',
    reason: '',
    isHighPriority: false,
  });

  // Fetch all lecturers on mount
  useEffect(() => {
    api.get('/users/role/LECTURER')
      .then(r => setLecturers(r.data))
      .catch(err => console.error('Failed to load lecturers', err));
  }, []);

  // Fetch slots when lecturer changes
  useEffect(() => {
    if (!selectedLecturer) { setSlots([]); return; }
    setSlotsLoading(true);
    setSelectedSlot(null);
    api.get(`/availability/lecturer/${selectedLecturer.id}/available`)
      .then(r => {
        // Convert availability slots to display format
        const availableSlots = r.data.map(slot => ({
          id: slot.id,
          day: slot.dayOfWeek.charAt(0) + slot.dayOfWeek.slice(1).toLowerCase(),
          time: formatTimeRange(slot.startTime, slot.endTime),
          startTime: `2026-03-24T${slot.startTime}:00`,
          endTime: `2026-03-24T${slot.endTime}:00`,
          status: 'OPEN'
        }));
        setSlots(availableSlots);
      })
      .catch(err => console.error('Failed to load slots', err))
      .finally(() => setSlotsLoading(false));
  }, [selectedLecturer]);

  const formatTimeRange = (start, end) => {
    const formatTime = (time) => {
      const [h, m] = time.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${m} ${ampm}`;
    };
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'academicYear' ? { isHighPriority: value === 'Year 4' } : {}),
    }));
  }, []);

  // Validation
  const isValid =
    selectedSlot &&
    formData.studentName.trim().length > 2 &&
    IT_REGEX.test(formData.itNumber) &&
    formData.academicYear &&
    formData.semester &&
    formData.reason.trim().length > 10 &&
    formData.reason.length <= MAX_REASON;

  const handleConfirm = async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      setLoadingMsg('Connecting to server...');
      await new Promise(r => setTimeout(r, 800));

      setLoadingMsg('Submitting booking...');
      await new Promise(r => setTimeout(r, 800));

      await api.post('/appointments', {
        studentId: user?.id,
        lecturerId: selectedLecturer.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: `[${formData.academicYear} ${formData.semester}${formData.isHighPriority ? ' | HIGH PRIORITY' : ''}] ${formData.reason}`,
      });

      // Optimistic: mark slot as taken locally
      setSlots(prev => prev.map(s => s.id === selectedSlot.id ? { ...s, status: 'PENDING' } : s));
      setSelectedSlot(null);

      setToast({ show: true, success: true, message: 'Appointment request submitted. Awaiting lecturer confirmation.' });
      setTimeout(() => setToast(t => ({ ...t, show: false })), 5000);

      // Reset form reason
      setFormData(prev => ({ ...prev, reason: '' }));
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to book. Please try again.';
      setToast({ show: true, success: false, message: msg });
      setTimeout(() => setToast(t => ({ ...t, show: false })), 5000);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  return (
    <div className="bp-page">
      {user && <Header currentUser={user} onLogout={onLogout} unreadCount={0} />}

      <div className="bp-container">
        {/* Back button */}
        <button className="bp-back-btn" onClick={() => navigate('/student/home')}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        {/* Lecturer selector */}
        <div className="bp-lecturer-bar">
          <label className="bp-label" style={{ marginBottom: 8 }}>Select Lecturer</label>
          <div className="bp-lecturer-grid">
            {lecturers.map(lec => (
              <button
                key={lec.id}
                className={`bp-lecturer-card${selectedLecturer?.id === lec.id ? ' bp-lecturer-card--active' : ''}`}
                onClick={() => setSelectedLecturer(lec)}
              >
                <div className="bp-lecturer-avatar">
                  {lec.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="bp-lecturer-info">
                  <span className="bp-lecturer-name">{lec.name}</span>
                  <span className="bp-lecturer-dept">{lec.department || 'Lecturer'}</span>
                </div>
                {selectedLecturer?.id === lec.id && <CheckCircle size={16} style={{ color: '#2563eb', flexShrink: 0 }} />}
              </button>
            ))}
            {lecturers.length === 0 && (
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No lecturers found.</p>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="bp-grid">
          <div>
            {slotsLoading
              ? <div className="bp-sidebar bp-sidebar--loading"><Loader2 size={24} className="bp-spin" /> Loading slots...</div>
              : <AvailabilityGrid slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
            }
          </div>

          <BookingForm
            formData={formData}
            onChange={handleChange}
            onConfirm={handleConfirm}
            isValid={isValid}
            loading={loading}
            loadingMsg={loadingMsg}
            selectedSlot={selectedSlot}
          />
        </div>
      </div>

      <StatusToast show={toast.show} success={toast.success} message={toast.message} />
    </div>
  );
}
