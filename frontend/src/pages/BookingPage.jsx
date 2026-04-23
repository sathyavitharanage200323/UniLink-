import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { createAppointment } from '../api';
import {
  ArrowLeft, ArrowRight, Zap, Clock, CheckCircle, AlertCircle,
  Loader2, User, MapPin, Calendar
} from 'lucide-react';
import Header from '../components/Header';
import './BookingPage.css';

const IT_REGEX = /^IT\d{8}$/i;
const IT_EMAIL_REGEX = /^it\d{8}@my\.sliit\.lk$/i;
const PHONE_REGEX = /^(\+94|0)[0-9]{9}$/;
const MAX_REASON = 300;
const BACKEND = 'http://localhost:8082';

/* ── helpers ─────────────────────────────────────────────────────────── */
function fmtTime(t = '00:00') {
  const [h, m] = t.substring(0, 5).split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}
function fmtRange(s, e) { return `${fmtTime(s)} – ${fmtTime(e)}`; }
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

/* ── Step indicator ──────────────────────────────────────────────────── */
function StepBar({ step }) {
  const steps = ['Select Lecturer', 'Choose Slot', 'Book'];
  return (
    <div className="bp-stepbar">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className={`bp-step ${step === i + 1 ? 'bp-step--active' : step > i + 1 ? 'bp-step--done' : ''}`}>
            <div className="bp-step__circle">
              {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className="bp-step__label">{label}</span>
          </div>
          {i < steps.length - 1 && <div className={`bp-step__line ${step > i + 1 ? 'bp-step__line--done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Lecturer avatar ─────────────────────────────────────────────────── */
function LecturerAvatar({ lec, size = 48 }) {
  const [imgErr, setImgErr] = useState(false);
  const src = lec.profileImage
    ? `${BACKEND}/uploads/${lec.profileImage}`
    : lec.profileImageUrl || null;

  if (src && !imgErr) {
    return (
      <img
        src={src}
        alt={lec.name}
        onError={() => setImgErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div className="bp-avatar" style={{ width: size, height: size, fontSize: size * 0.32 }}>
      {initials(lec.name)}
    </div>
  );
}

/* ── Step 1 — Select Lecturer ────────────────────────────────────────── */
function StepLecturer({ lecturers, selected, onSelect, onNext }) {
  return (
    <div className="bp-step-panel">
      <h2 className="bp-panel-title">Choose a Lecturer</h2>
      <p className="bp-panel-sub">Select the lecturer you want to book a consultation with</p>

      <div className="bp-lec-grid">
        {lecturers.map(lec => {
          const active = selected?.id === lec.id;
          return (
            <button
              key={lec.id}
              className={`bp-lec-card ${active ? 'bp-lec-card--active' : ''}`}
              onClick={() => onSelect(lec)}
            >
              <LecturerAvatar lec={lec} size={64} />
              <div className="bp-lec-card__body">
                <div className="bp-lec-card__name">{lec.name}</div>
                <div className="bp-lec-card__dept">{lec.department}</div>
                {lec.expertise && (
                  <div className="bp-lec-card__exp">{lec.expertise}</div>
                )}
                {lec.officeLocation && (
                  <div className="bp-lec-card__meta">
                    <MapPin size={11} /> {lec.officeLocation}
                  </div>
                )}
                {lec.officeHours && (
                  <div className="bp-lec-card__meta">
                    <Clock size={11} /> {lec.officeHours}
                  </div>
                )}
              </div>
              {active && <CheckCircle size={20} className="bp-lec-card__check" />}
            </button>
          );
        })}
        {lecturers.length === 0 && (
          <p style={{ color: '#94a3b8', gridColumn: '1/-1', textAlign: 'center', padding: 32 }}>
            No lecturers found.
          </p>
        )}
      </div>

      <div className="bp-step-footer">
        <button className="bp-btn-next" disabled={!selected} onClick={onNext}>
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── Step 2 — Select Slot ────────────────────────────────────────────── */
function StepSlot({ lecturer, slots, slotsLoading, selectedSlotId, onSelect, onBack, onNext }) {
  const grouped = slots.reduce((acc, slot) => {
    const key = slot.slotDate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort();
  const selectedSlot = slots.find(s => String(s.id) === String(selectedSlotId));

  return (
    <div className="bp-step-panel">
      {/* Lecturer banner */}
      <div className="bp-lec-banner">
        <LecturerAvatar lec={lecturer} size={52} />
        <div>
          <div className="bp-lec-banner__name">{lecturer.name}</div>
          <div className="bp-lec-banner__dept">{lecturer.department}</div>
        </div>
      </div>

      <h2 className="bp-panel-title" style={{ marginTop: 20 }}>Pick a Time Slot</h2>
      <p className="bp-panel-sub">All times are in local time. Green = available.</p>

      {slotsLoading ? (
        <div className="bp-slots-loading"><Loader2 size={28} className="bp-spin" /> Loading slots…</div>
      ) : dates.length === 0 ? (
        <div className="bp-slots-empty">
          <Calendar size={40} style={{ color: '#cbd5e1', marginBottom: 8 }} />
          <p>No available slots for this lecturer right now.</p>
        </div>
      ) : (
        <div className="bp-slots-scroll">
          {dates.map(dateKey => {
            const daySlots = grouped[dateKey].slice().sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <div key={dateKey} className="bp-date-group">
                <div className="bp-date-label">
                  <Calendar size={13} /> {fmtDate(dateKey)}
                </div>
                <div className="bp-slots-row">
                  {daySlots.map(slot => {
                    const taken = slot.status !== 'AVAILABLE';
                    const sel = String(selectedSlotId) === String(slot.id);
                    return (
                      <button
                        key={slot.id}
                        className={`bp-slot-pill ${sel ? 'bp-slot-pill--sel' : ''} ${taken ? 'bp-slot-pill--taken' : ''}`}
                        onClick={() => !taken && onSelect(String(slot.id))}
                        disabled={taken}
                      >
                        <Clock size={12} />
                        {slot.time}
                        {slot.mode && <span className="bp-slot-mode">{slot.mode}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bp-step-footer">
        <button className="bp-btn-back" onClick={onBack}><ArrowLeft size={15} /> Back</button>
        <button className="bp-btn-next" disabled={!selectedSlot} onClick={onNext}>
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── Field wrapper (must be at module level to avoid remount on re-render) ── */
function Field({ label, hint, children, error }) {
  return (
    <div className="apf-field">
      <label className="apf-label">{label}</label>
      {children}
      {hint && !error && <p className="apf-hint">{hint}</p>}
      {error && <p className="apf-hint apf-hint--err">{error}</p>}
    </div>
  );
}

/* ── Step 3 — Booking Form ───────────────────────────────────────────── */
function StepForm({ lecturer, selectedSlot, formData, onChange, onConfirm, onBack, loading, loadingMsg }) {
  const itNum       = formData.itNumber.trim().toUpperCase();
  const itValid     = IT_REGEX.test(itNum);
  const itEmail     = formData.itEmail.trim().toLowerCase();
  const itEmailAuto = itValid ? `${itNum.toLowerCase()}@my.sliit.lk` : '';
  const itEmailValid = IT_EMAIL_REGEX.test(itEmail);
  const itEmailMatch = itEmail === itEmailAuto;
  const phoneValid  = PHONE_REGEX.test(formData.phoneNumber.trim());
  const nameValid   = formData.studentName.trim().length > 2;
  const reasonLen   = formData.reason.length;
  const reasonValid = reasonLen > 10 && reasonLen <= MAX_REASON;

  const isValid = nameValid && itValid && itEmailValid && itEmailMatch &&
    formData.academicYear && formData.semester && phoneValid && reasonValid;

  // Auto-fill IT email when IT number becomes valid
  const handleItChange = (val) => {
    onChange('itNumber', val);
    const upper = val.trim().toUpperCase();
    if (IT_REGEX.test(upper)) {
      onChange('itEmail', `${upper.toLowerCase()}@my.sliit.lk`);
    }
  };

  return (
    <div className="apf-wrap">
      {/* Lecturer + slot summary */}
      <div className="apf-summary">
        <div className="apf-summary__lec">
          <LecturerAvatar lec={lecturer} size={42} />
          <div>
            <div className="apf-summary__name">{lecturer.name}</div>
            <div className="apf-summary__dept">{lecturer.department}</div>
          </div>
        </div>
        <div className="apf-summary__divider" />
        <div className="apf-summary__slot">
          <Clock size={14} className="apf-summary__slot-icon" />
          <div>
            <div className="apf-summary__time">{selectedSlot.time}</div>
            <div className="apf-summary__date">{fmtDate(selectedSlot.slotDate)}</div>
            {selectedSlot.mode && (
              <div className="apf-summary__mode">
                {selectedSlot.mode === 'Online'
                  ? <><span className="apf-mode-dot apf-mode-dot--online" />Online</>
                  : <><span className="apf-mode-dot apf-mode-dot--physical" />Physical</>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="apf-title-row">
        <h2 className="apf-title">Consultation Request</h2>
        {formData.isHighPriority && (
          <span className="apf-priority"><Zap size={12} /> Final Year · High Priority</span>
        )}
      </div>

      <div className="apf-grid">
        {/* Full Name */}
        <Field label="Full Name" error={formData.studentName && !nameValid ? 'Name must be at least 3 characters' : ''}>
          <div className="apf-input-wrap">
            <User size={15} className="apf-input-icon" />
            <input className="apf-input apf-input--icon"
              value={formData.studentName}
              onChange={e => onChange('studentName', e.target.value)}
              placeholder="e.g. Sathya Kumari" />
            {nameValid && <CheckCircle size={15} className="apf-input-check" />}
          </div>
        </Field>

        {/* IT Number */}
        <Field label="IT Number"
          hint="Format: IT + 8 digits (e.g. IT23761650)"
          error={formData.itNumber && !itValid ? 'Invalid format — use IT + 8 digits' : ''}>
          <div className="apf-input-wrap">
            <span className="apf-input-prefix">IT</span>
            <input className="apf-input apf-input--prefix"
              value={formData.itNumber.replace(/^IT/i, '')}
              onChange={e => handleItChange('IT' + e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="23761650"
              maxLength={8} />
            {formData.itNumber && (
              itValid
                ? <CheckCircle size={15} className="apf-input-check" />
                : <AlertCircle size={15} className="apf-input-err-icon" />
            )}
          </div>
        </Field>

        {/* IT Email */}
        <Field label="IT Email Address"
          hint={itEmailAuto ? `Expected: ${itEmailAuto}` : 'Enter your SLIIT IT email'}
          error={itEmail && !itEmailValid ? 'Must be format: itXXXXXXXX@my.sliit.lk'
               : itEmail && itEmailValid && !itEmailMatch ? `Must match your IT number: ${itEmailAuto}`
               : ''}>
          <div className="apf-input-wrap">
            <span className="apf-input-prefix" style={{ fontSize: '0.7rem', letterSpacing: 0 }}>@</span>
            <input className={`apf-input apf-input--prefix${itEmail && (!itEmailValid || !itEmailMatch) ? ' apf-input--error' : ''}`}
              value={formData.itEmail}
              onChange={e => onChange('itEmail', e.target.value.toLowerCase())}
              placeholder="it23761650@my.sliit.lk"
              type="email" />
            {itEmail && itEmailValid && itEmailMatch && <CheckCircle size={15} className="apf-input-check" />}
            {itEmail && (!itEmailValid || !itEmailMatch) && <AlertCircle size={15} className="apf-input-err-icon" />}
          </div>
        </Field>

        {/* Phone */}
        <Field label="Phone Number"
          hint="Sri Lanka format: 07X XXXXXXX or +94 7X XXXXXXX"
          error={formData.phoneNumber && !phoneValid ? 'Enter a valid Sri Lanka phone number' : ''}>
          <div className="apf-input-wrap">
            <span className="apf-input-prefix">📞</span>
            <input className="apf-input apf-input--prefix"
              type="tel" value={formData.phoneNumber}
              onChange={e => onChange('phoneNumber', e.target.value)}
              placeholder="0771234567" />
            {formData.phoneNumber && phoneValid && <CheckCircle size={15} className="apf-input-check" />}
          </div>
        </Field>

        {/* Academic Year */}
        <Field label="Academic Year">
          <select className="apf-select" value={formData.academicYear}
            onChange={e => onChange('academicYear', e.target.value)}>
            <option value="">Select Year</option>
            <option value="Year 1">1st Year</option>
            <option value="Year 2">2nd Year</option>
            <option value="Year 3">3rd Year</option>
            <option value="Year 4">4th Year</option>
          </select>
        </Field>

        {/* Semester */}
        <Field label="Semester">
          <select className="apf-select" value={formData.semester}
            onChange={e => onChange('semester', e.target.value)}>
            <option value="">Select Semester</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
          </select>
        </Field>

        {/* Reason */}
        <div className="apf-field apf-field--full">
          <div className="apf-label-row">
            <label className="apf-label">Reason for Meeting</label>
            <span className={`apf-count${reasonLen > MAX_REASON ? ' apf-count--over' : ''}`}>{reasonLen}/{MAX_REASON}</span>
          </div>
          <textarea className="apf-textarea" rows={4} maxLength={MAX_REASON}
            value={formData.reason} onChange={e => onChange('reason', e.target.value)}
            placeholder="Describe your query in detail…" />
          {formData.reason && !reasonValid && reasonLen <= 10 && (
            <p className="apf-hint apf-hint--err">Please provide more detail (min 10 characters)</p>
          )}
        </div>

        {/* Image upload */}
        <div className="apf-field">
          <label className="apf-label">Upload Image <span className="apf-optional">Optional</span></label>
          <input type="file" accept="image/*" id="apf-img" className="apf-file-hidden"
            onChange={e => onChange('image', e.target.files?.[0] || null)} />
          <label htmlFor="apf-img" className={`apf-file-btn${formData.image ? ' apf-file-btn--filled' : ''}`}>
            {formData.image ? <>✓ {formData.image.name} <span className="apf-file-size">({(formData.image.size/1024/1024).toFixed(1)}MB)</span></> : '📷  Choose image (JPEG, PNG, WebP)'}
          </label>
        </div>

        {/* Document upload */}
        <div className="apf-field">
          <label className="apf-label">Upload Document <span className="apf-optional">Optional</span></label>
          <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" id="apf-doc" className="apf-file-hidden"
            onChange={e => onChange('document', e.target.files?.[0] || null)} />
          <label htmlFor="apf-doc" className={`apf-file-btn${formData.document ? ' apf-file-btn--filled' : ''}`}>
            {formData.document ? <>✓ {formData.document.name} <span className="apf-file-size">({(formData.document.size/1024/1024).toFixed(1)}MB)</span></> : '📄  Choose document (PDF, DOC, XLS)'}
          </label>
        </div>
      </div>

      {/* Validation summary */}
      {!isValid && (formData.studentName || formData.itNumber) && (
        <div className="apf-validation-summary">
          {!nameValid && formData.studentName && <span>• Full name required</span>}
          {!itValid && formData.itNumber && <span>• Valid IT number required</span>}
          {itValid && (!itEmailValid || !itEmailMatch) && itEmail && <span>• IT email must match your IT number</span>}
          {!phoneValid && formData.phoneNumber && <span>• Valid phone number required</span>}
          {!formData.academicYear && <span>• Select academic year</span>}
          {!formData.semester && <span>• Select semester</span>}
          {!reasonValid && formData.reason && <span>• Reason must be 10–300 characters</span>}
        </div>
      )}

      <div className="apf-footer">
        <button className="apf-btn-back" onClick={onBack} disabled={loading}>
          <ArrowLeft size={15} /> Back
        </button>
        <button className="apf-btn-confirm" disabled={!isValid || loading} onClick={onConfirm}>
          {loading
            ? <><Loader2 size={15} className="bp-spin" /> {loadingMsg}</>
            : <><CheckCircle size={15} /> Confirm Appointment</>}
        </button>
      </div>
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────── */
function StatusToast({ show, success, message }) {
  if (!show) return null;
  return (
    <div className={`bp-toast ${success ? 'bp-toast--success' : 'bp-toast--error'}`}>
      <div className="bp-toast__dot" />
      <div>
        <div className="bp-toast__title">{success ? 'Request Submitted' : 'Booking Failed'}</div>
        <div className="bp-toast__msg">{message}</div>
      </div>
    </div>
  );
}

/* ── Main BookingPage ────────────────────────────────────────────────── */
export default function BookingPage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const user = currentUser || JSON.parse(localStorage.getItem('unilink_user') || 'null');

  const [step, setStep] = useState(1);
  const [lecturers, setLecturers] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [toast, setToast] = useState({ show: false, success: false, message: '' });

  const [formData, setFormData] = useState({
    studentName: '',
    itNumber: '',
    itEmail: '',
    academicYear: '',
    semester: '',
    reason: '',
    phoneNumber: '',
    image: null,
    document: null,
    isHighPriority: false,
  });

  // Load lecturers
  useEffect(() => {
    api.get('/users/role/LECTURER')
      .then(r => setLecturers(r.data))
      .catch(err => console.error('Failed to load lecturers', err));
  }, []);

  // Load slots when lecturer selected
  useEffect(() => {
    if (!selectedLecturer) { setSlots([]); return; }
    setSlotsLoading(true);
    setSelectedSlotId('');
    api.get(`/availability/lecturer/${selectedLecturer.id}/available`)
      .then(r => {
        const mapped = (r.data || [])
          .filter(s => s?.slotDate && !isNaN(new Date(s.slotDate)))
          .map(s => {
            const st = (s.startTime || '00:00').substring(0, 5);
            const et = (s.endTime || '00:30').substring(0, 5);
            return {
              id: s.id,
              slotDate: s.slotDate,
              time: fmtRange(st, et),
              startTime: `${s.slotDate}T${st}:00`,
              endTime: `${s.slotDate}T${et}:00`,
              status: s.status || 'AVAILABLE',
              mode: s.mode || '',
            };
          });
        setSlots(mapped);
      })
      .catch(err => console.error('Failed to load slots', err))
      .finally(() => setSlotsLoading(false));
  }, [selectedLecturer]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'academicYear' ? { isHighPriority: value === 'Year 4' } : {}),
    }));
  }, []);

  const selectedSlot = slots.find(s => String(s.id) === String(selectedSlotId)) || null;

  const showToast = (success, message) => {
    setToast({ show: true, success, message });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 5000);
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !user?.id || !selectedLecturer?.id) return;
    setLoading(true);
    try {
      if (formData.image?.size > 15 * 1024 * 1024) throw new Error('Image exceeds 15 MB');
      if (formData.document?.size > 15 * 1024 * 1024) throw new Error('Document exceeds 15 MB');

      setLoadingMsg('Submitting booking…');
      await createAppointment({
        studentId: user.id,
        lecturerId: selectedLecturer.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: `[${formData.academicYear} ${formData.semester}${formData.isHighPriority ? ' | HIGH PRIORITY' : ''}] [NAME:${formData.studentName.trim()}] [IT:${formData.itNumber.trim()}] [ITEMAIL:${formData.itEmail.trim()}] [PHONE:${formData.phoneNumber.trim()}]${selectedSlot.mode ? ` [MODE:${selectedSlot.mode}]` : ''} ${formData.reason}`,
      });

      if (formData.image || formData.document) {
        setLoadingMsg('Uploading attachments…');
        const res = await api.get(`/appointments/student/${user.id}`);
        const latest = res.data?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        if (latest?.id) {
          const fd = new FormData();
          if (formData.image) fd.append('image', formData.image);
          if (formData.document) fd.append('document', formData.document);
          await api.patch(`/appointments/${latest.id}/attachments`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      showToast(true, 'Appointment request submitted. Awaiting lecturer confirmation.');
      setSlots(prev => prev.map(s => String(s.id) === String(selectedSlot.id) ? { ...s, status: 'PENDING' } : s));
      setSelectedSlotId('');
      setFormData(prev => ({ ...prev, reason: '', phoneNumber: '', itEmail: '', image: null, document: null }));
      setStep(1);
      setSelectedLecturer(null);
    } catch (err) {
      showToast(false, err?.response?.data?.message || err?.message || 'Failed to book. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  return (
    <div className="bp-page">
      {user && <Header currentUser={user} onLogout={onLogout} unreadCount={0} />}
      <div className="bp-container">
        <button className="bp-back-btn" onClick={() => navigate('/student/home')}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <div className="bp-wizard">
          <StepBar step={step} />

          {step === 1 && (
            <StepLecturer
              lecturers={lecturers}
              selected={selectedLecturer}
              onSelect={setSelectedLecturer}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && selectedLecturer && (
            <StepSlot
              lecturer={selectedLecturer}
              slots={slots}
              slotsLoading={slotsLoading}
              selectedSlotId={selectedSlotId}
              onSelect={setSelectedSlotId}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && selectedLecturer && selectedSlot && (
            <StepForm
              lecturer={selectedLecturer}
              selectedSlot={selectedSlot}
              formData={formData}
              onChange={handleChange}
              onConfirm={handleConfirm}
              onBack={() => setStep(2)}
              loading={loading}
              loadingMsg={loadingMsg}
            />
          )}
        </div>
      </div>
      <StatusToast show={toast.show} success={toast.success} message={toast.message} />
    </div>
  );
}
