import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock3,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Layers3,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SlotModuleNav from '../components/SlotModuleNav';
import { createSlot, deleteSlot, getSlots, updateSlot } from '../api';
import './LecturerHome.css';

const emptyForm = {
  slotDate: '',
  startTime: '',
  endTime: '',
};

export default function LecturerSlotsPage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const lecturerId = currentUser?.id;

  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sortedSlots = useMemo(() => {
    return [...slots].sort((a, b) => {
      const aValue = `${a.slotDate} ${a.startTime}`;
      const bValue = `${b.slotDate} ${b.startTime}`;
      return aValue.localeCompare(bValue);
    });
  }, [slots]);

  const todayISO = new Date().toISOString().split('T')[0];

  const summary = useMemo(() => {
    const total = sortedSlots.length;
    const todayCount = sortedSlots.filter((slot) => slot.slotDate === todayISO).length;
    const upcoming = sortedSlots.filter((slot) => slot.slotDate >= todayISO).length;

    return { total, todayCount, upcoming };
  }, [sortedSlots, todayISO]);

  useEffect(() => {
    if (lecturerId) {
      loadSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecturerId]);

  async function loadSlots() {
    try {
      setPageLoading(true);
      setError('');
      const data = await getSlots(lecturerId);
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Could not load available slots from backend.');
      setSlots([]);
    } finally {
      setPageLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setMessage('');
  }

  function isPastDate(date) {
    return date < todayISO;
  }

  function hasOverlap() {
    const newStart = `${form.slotDate}T${form.startTime}`;
    const newEnd = `${form.slotDate}T${form.endTime}`;

    return sortedSlots.some((slot) => {
      if (editingId && slot.id === editingId) return false;
      if (slot.slotDate !== form.slotDate) return false;

      const existingStart = `${slot.slotDate}T${String(slot.startTime).slice(0, 5)}`;
      const existingEnd = `${slot.slotDate}T${String(slot.endTime).slice(0, 5)}`;

      return newStart < existingEnd && newEnd > existingStart;
    });
  }

  function validateForm() {
    if (!form.slotDate || !form.startTime || !form.endTime) {
      setError('Please fill in date, start time, and end time.');
      return false;
    }

    if (isPastDate(form.slotDate)) {
      setError('You cannot create a slot for a past date.');
      return false;
    }

    if (form.startTime >= form.endTime) {
      setError('End time must be later than start time.');
      return false;
    }

    if (hasOverlap()) {
      setError('This slot overlaps with an existing slot. Please choose another time range.');
      return false;
    }

    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validateForm()) return;

    const payload = {
      lecturerId,
      slotDate: form.slotDate,
      startTime: form.startTime,
      endTime: form.endTime,
    };

    try {
      setLoading(true);

      if (editingId) {
        await updateSlot(editingId, payload);
        setMessage('Slot updated successfully.');
      } else {
        await createSlot(payload);
        setMessage('Slot added successfully.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadSlots();
    } catch (err) {
      setError('Something went wrong while saving the slot.');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(slot) {
    setEditingId(slot.id);
    setForm({
      slotDate: slot.slotDate || '',
      startTime: String(slot.startTime || '').slice(0, 5),
      endTime: String(slot.endTime || '').slice(0, 5),
    });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm('Are you sure you want to delete this slot?');
    if (!confirmed) return;

    try {
      setError('');
      setMessage('');
      await deleteSlot(id);
      setMessage('Slot deleted successfully.');
      await loadSlots();
    } catch (err) {
      setError('Could not delete the slot.');
    }
  }

  return (
    <div className="lh-layout">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
      <SlotModuleNav />

      <main className="lh-main">
        <section className="lh-hero">
          <div className="lh-hero__inner">
            <div className="lh-hero__text">
              <div className="lh-hero__badge">
                <CalendarDays size={13} /> Available Slot Management
              </div>

              <h1 className="lh-hero__name">Manage Your Available Slots</h1>

              <p className="lh-hero__dept">
                Add, update, and remove your available appointment times.
              </p>

              <div className="lh-hero__actions">
                <button
                  className="lh-btn lh-btn--outline"
                  onClick={() => navigate('/lecturer/home')}
                >
                  <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <button
                  className="lh-btn lh-btn--outline"
                  onClick={() => navigate('/lecturer/slots/calendar')}
                >
                  <CalendarDays size={16} /> Calendar View
                </button>
              </div>
            </div>

            <div className="lh-hero__visual">
              <div className="lh-hero__avatar-ring">
                {currentUser?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'L'}
              </div>

              <div className="lh-hero__role-tag">
                <Clock3 size={13} /> Lecturer Availability
              </div>
            </div>
          </div>
        </section>

        <div style={summaryGridStyle}>
          <div style={summaryCardStyle}>
            <div style={summaryIconStyle('#ede9fe', '#7c3aed')}>
              <Layers3 size={20} />
            </div>
            <div>
              <div style={summaryValueStyle}>{summary.total}</div>
              <div style={summaryLabelStyle}>Total Slots</div>
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryIconStyle('#dbeafe', '#2563eb')}>
              <CalendarDays size={20} />
            </div>
            <div>
              <div style={summaryValueStyle}>{summary.todayCount}</div>
              <div style={summaryLabelStyle}>Today&apos;s Slots</div>
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryIconStyle('#dcfce7', '#16a34a')}>
              <Clock3 size={20} />
            </div>
            <div>
              <div style={summaryValueStyle}>{summary.upcoming}</div>
              <div style={summaryLabelStyle}>Upcoming Slots</div>
            </div>
          </div>
        </div>

        <div className="lh-content-grid">
          <section className="lh-card">
            <div className="lh-card__header">
              <h2>
                <Plus size={17} style={{ color: '#16a34a' }} />{' '}
                {editingId ? 'Edit Slot' : 'Add New Slot'}
              </h2>
            </div>

            <div className="lh-card__body">
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Date</label>
                    <input
                      type="date"
                      name="slotDate"
                      value={form.slotDate}
                      onChange={handleChange}
                      min={todayISO}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Start Time</label>
                      <input
                        type="time"
                        name="startTime"
                        value={form.startTime}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>End Time</label>
                      <input
                        type="time"
                        name="endTime"
                        value={form.endTime}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div style={errorStyle}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {message && (
                  <div style={successStyle}>
                    <CheckCircle2 size={16} />
                    <span>{message}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
                  <button className="lh-btn lh-btn--primary" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingId ? 'Update Slot' : 'Add Slot'}
                  </button>

                  <button
                    className="lh-btn lh-btn--outline"
                    type="button"
                    onClick={resetForm}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="lh-card">
            <div className="lh-card__header">
              <h2>
                <CalendarDays size={17} style={{ color: '#7c3aed' }} /> My Available Slots
              </h2>
            </div>

            <div className="lh-card__body">
              {pageLoading ? (
                <div className="lh-empty">
                  <Clock3 size={38} />
                  <p>Loading slots...</p>
                </div>
              ) : sortedSlots.length === 0 ? (
                <div className="lh-empty">
                  <CalendarDays size={38} />
                  <p>No available slots added yet</p>
                  <span style={{ color: '#94a3b8', fontSize: '0.92rem', marginTop: 6 }}>
                    Add your first available slot using the form.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  {sortedSlots.map((slot) => (
                    <div
                      key={slot.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 16,
                        padding: 16,
                        background: '#f8fafc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 14,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                          {slot.slotDate}
                        </div>
                        <div style={{ color: '#475569', fontSize: '0.95rem' }}>
                          {String(slot.startTime).slice(0, 5)} - {String(slot.endTime).slice(0, 5)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          className="lh-btn lh-btn--sm"
                          style={{ background: '#dbeafe', color: '#1d4ed8' }}
                          onClick={() => handleEdit(slot)}
                        >
                          <Pencil size={13} /> Edit
                        </button>

                        <button
                          className="lh-btn lh-btn--sm"
                          style={{ background: '#fee2e2', color: '#dc2626' }}
                          onClick={() => handleDelete(slot.id)}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  fontWeight: 700,
  color: '#334155',
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #dbe2ea',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const errorStyle = {
  marginTop: 14,
  background: '#fee2e2',
  color: '#b91c1c',
  padding: '12px 14px',
  borderRadius: 12,
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const successStyle = {
  marginTop: 14,
  background: '#dcfce7',
  color: '#166534',
  padding: '12px 14px',
  borderRadius: 12,
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const summaryGridStyle = {
  maxWidth: '1200px',
  margin: '24px auto 0',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '18px',
  padding: '0 20px',
};

const summaryCardStyle = {
  background: '#ffffff',
  borderRadius: 20,
  padding: '18px',
  boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
};

const summaryIconStyle = (bg, color) => ({
  width: 48,
  height: 48,
  borderRadius: 14,
  background: bg,
  color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const summaryValueStyle = {
  fontSize: '1.45rem',
  fontWeight: 800,
  color: '#0f172a',
  lineHeight: 1.1,
};

const summaryLabelStyle = {
  fontSize: '0.92rem',
  color: '#64748b',
  marginTop: 4,
};