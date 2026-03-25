import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ArrowLeft,
  Plus,
  Clock3,
  Pencil,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  CalendarRange,
  Layers3,
  X,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { createSlot, deleteSlot, getSlots, updateSlot } from '../api';
import './LecturerSlotsPage.css';

const initialForm = {
  slotDate: '',
  startTime: '',
  endTime: '',
};

export default function LecturerSlotsPage({ currentUser, onLogout }) {
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const lecturerId = Number(currentUser?.id) || 1;
  const todayDateString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadSlots();
  }, []);

  async function loadSlots() {
    try {
      setPageLoading(true);
      setError('');
      const data = await getSlots(lecturerId);
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load available slots from backend.');
    } finally {
      setPageLoading(false);
    }
  }

  function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  function normalizeTime(value) {
    return String(value).slice(0, 5);
  }

  function generateValidStartTimes() {
    const times = [];

    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        const time = `${hh}:${mm}`;

        const mins = timeToMinutes(time);

        // earliest start = 09:00, last allowed start = 20:30
        if (mins >= timeToMinutes('09:00') && mins <= timeToMinutes('20:30')) {
          times.push(time);
        }
      }
    }

    return times;
  }

  const allTimes = generateValidStartTimes();

  function addThirtyMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + 30;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;

    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  }

  function getDurationMinutes(start, end) {
    return timeToMinutes(end) - timeToMinutes(start);
  }

  function isPastDate(dateStr) {
    if (!dateStr) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(dateStr);
    selected.setHours(0, 0, 0, 0);

    return selected < today;
  }

  function getValidStartTimesForDate(date) {
    if (!date) return allTimes;

    const sameDaySlots = slots.filter(
      (slot) => slot.slotDate === date && slot.id !== editingId
    );

    return allTimes.filter((time) => {
      const newStart = timeToMinutes(time);
      const newEnd = newStart + 30;

      // must stay within 09:00 AM to 09:00 PM window
      if (newStart < timeToMinutes('09:00')) {
        return false;
      }

      if (newEnd > timeToMinutes('21:00')) {
        return false;
      }

      for (const slot of sameDaySlots) {
        const existingStart = timeToMinutes(normalizeTime(slot.startTime));
        const existingEnd = timeToMinutes(normalizeTime(slot.endTime));

        const gapAfterExisting = newStart - existingEnd;
        const gapBeforeExisting = existingStart - newEnd;

        const enoughGapAfterExisting = gapAfterExisting >= 15;
        const enoughGapBeforeExisting = gapBeforeExisting >= 15;

        if (!(enoughGapAfterExisting || enoughGapBeforeExisting)) {
          return false;
        }
      }

      return true;
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === 'slotDate') {
        updated.startTime = '';
        updated.endTime = '';
      }

      if (name === 'startTime' && value) {
        updated.endTime = addThirtyMinutes(value);
      }

      return updated;
    });
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setError('');
    setSuccess('');
  }

  function validateForm() {
    setError('');
    setSuccess('');

    if (!lecturerId) {
      setError('Lecturer ID is missing.');
      return false;
    }

    if (!form.slotDate || !form.startTime || !form.endTime) {
      setError('Please fill in all required fields.');
      return false;
    }

    if (isPastDate(form.slotDate)) {
      setError('You cannot add a slot for a past date.');
      return false;
    }

    if (form.startTime >= form.endTime) {
      setError('End time must be later than start time.');
      return false;
    }

    const startMinutes = timeToMinutes(form.startTime);
    const endMinutes = timeToMinutes(form.endTime);
    const duration = getDurationMinutes(form.startTime, form.endTime);

    if (startMinutes < timeToMinutes('09:00')) {
      setError('Slots can start only from 9:00 AM onwards.');
      return false;
    }

    if (endMinutes > timeToMinutes('21:00')) {
      setError('Slots cannot go beyond 9:00 PM.');
      return false;
    }

    if (duration !== 30) {
      setError('Each slot must be exactly 30 minutes long.');
      return false;
    }

    const duplicate = slots.find((slot) => {
      if (slot.id === editingId) return false;

      return (
        slot.slotDate === form.slotDate &&
        normalizeTime(slot.startTime) === form.startTime &&
        normalizeTime(slot.endTime) === form.endTime
      );
    });

    if (duplicate) {
      setError('This exact slot already exists.');
      return false;
    }

    const validTimes = getValidStartTimesForDate(form.slotDate);

    if (!validTimes.includes(form.startTime)) {
      setError(
        'Invalid time. There must be a 15-minute break between slots, slots start from 9:00 AM, and cannot go beyond 9:00 PM.'
      );
      return false;
    }

    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      lecturerId,
      slotDate: form.slotDate,
      startTime: form.startTime,
      endTime: form.endTime,
    };

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (editingId) {
        const updated = await updateSlot(editingId, payload);

        setSlots((prev) =>
          prev.map((slot) => (slot.id === editingId ? updated : slot))
        );

        setSuccess('Slot updated successfully.');
      } else {
        const created = await createSlot(payload);

        setSlots((prev) => [...prev, created]);
        setSuccess('Slot added successfully.');
      }

      resetForm();
      await loadSlots();
    } catch (err) {
      setError(err.message || 'Something went wrong while saving the slot.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm('Are you sure you want to delete this slot?');
    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');

      await deleteSlot(id);

      setSlots((prev) => prev.filter((slot) => slot.id !== id));

      if (editingId === id) {
        resetForm();
      }

      setSuccess('Slot deleted successfully.');
    } catch (err) {
      setError(err.message || 'Could not delete slot.');
    }
  }

  function handleEdit(slot) {
    setEditingId(slot.id);
    setForm({
      slotDate: slot.slotDate,
      startTime: normalizeTime(slot.startTime),
      endTime: normalizeTime(slot.endTime),
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const filteredSlots = useMemo(() => {
    let data = [...slots];

    data.sort((a, b) => {
      const first = `${a.slotDate} ${normalizeTime(a.startTime)}`;
      const second = `${b.slotDate} ${normalizeTime(b.startTime)}`;
      return first.localeCompare(second);
    });

    if (filter === 'TODAY') {
      data = data.filter((slot) => slot.slotDate === todayDateString);
    } else if (filter === 'UPCOMING') {
      data = data.filter((slot) => slot.slotDate >= todayDateString);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((slot) => {
        const date = slot.slotDate?.toLowerCase?.() ?? '';
        const start = normalizeTime(slot.startTime).toLowerCase();
        const end = normalizeTime(slot.endTime).toLowerCase();
        return date.includes(q) || start.includes(q) || end.includes(q);
      });
    }

    return data;
  }, [slots, filter, search, todayDateString]);

  const totalSlots = slots.length;
  const todaySlots = slots.filter((slot) => slot.slotDate === todayDateString).length;
  const upcomingSlots = slots.filter((slot) => slot.slotDate > todayDateString).length;

  const formDuration =
    form.startTime && form.endTime && form.startTime < form.endTime
      ? getDurationMinutes(form.startTime, form.endTime)
      : 0;

  const validStartTimes = getValidStartTimesForDate(form.slotDate);

  return (
    <div className="ls-layout">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />

      <main className="ls-main">
        <section className="ls-hero">
          <div className="ls-hero__content">
            <div>
              <div className="ls-badge">
                <CalendarDays size={14} />
                Lecturer Availability
              </div>
              <h1>Manage Your Available Slots</h1>
              <p>
                Add, edit, search, and organize your lecturer availability for appointments.
              </p>

              <div className="ls-hero__actions">
                <button
                  className="ls-btn ls-btn--outline"
                  onClick={() => navigate('/lecturer/home')}
                >
                  <ArrowLeft size={16} />
                  Back to Dashboard
                </button>

                <button
                  className="ls-btn ls-btn--soft"
                  onClick={() => navigate('/lecturer/slots/calendar')}
                >
                  <CalendarRange size={16} />
                  Calendar View
                </button>
              </div>
            </div>

            <div className="ls-hero__avatar">
              {getInitials(currentUser?.name)}
            </div>
          </div>
        </section>

        <section className="ls-stats">
          <div className="ls-stat-card">
            <div className="ls-stat-icon purple">
              <Layers3 size={22} />
            </div>
            <div>
              <h3>{totalSlots}</h3>
              <p>Total Slots</p>
            </div>
          </div>

          <div className="ls-stat-card">
            <div className="ls-stat-icon blue">
              <CalendarDays size={22} />
            </div>
            <div>
              <h3>{todaySlots}</h3>
              <p>Today&apos;s Slots</p>
            </div>
          </div>

          <div className="ls-stat-card">
            <div className="ls-stat-icon green">
              <Clock3 size={22} />
            </div>
            <div>
              <h3>{upcomingSlots}</h3>
              <p>Upcoming Slots</p>
            </div>
          </div>
        </section>

        <section className="ls-grid">
          <div className="ls-card">
            <div className="ls-card__header">
              <h2>
                <Plus size={20} />
                {editingId ? 'Edit Slot' : 'Add New Slot'}
              </h2>
              {editingId && (
                <button className="ls-small-btn" onClick={resetForm}>
                  <X size={15} />
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="ls-form">
              <div className="ls-field">
                <label>Date</label>
                <input
                  className="ls-input"
                  type="date"
                  name="slotDate"
                  value={form.slotDate}
                  onChange={handleChange}
                  min={todayDateString}
                />
              </div>

              <div className="ls-row">
                <div className="ls-field">
                  <label>Start Time</label>
                  <select
                    className="ls-select"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleChange}
                    disabled={!form.slotDate}
                  >
                    <option value="">Select time</option>
                    {validStartTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ls-field">
                  <label>End Time</label>
                  <input
                    className="ls-input"
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    readOnly
                  />
                </div>
              </div>

              {form.slotDate && (
                <div className="ls-note">
                  <strong>Only valid times are shown.</strong> Slots start from 9:00 AM, each
                  slot is 30 minutes, there must be a 15-minute break, and slots cannot go beyond
                  9:00 PM.
                </div>
              )}

              <div className="ls-helper-box">
                <div className="ls-helper-item">
                  <strong>Lecturer:</strong> {currentUser?.name ?? 'Demo Lecturer'}
                </div>
                <div className="ls-helper-item">
                  <strong>Duration:</strong> {formDuration > 0 ? `${formDuration} minutes` : '--'}
                </div>
              </div>

              {error && (
                <div className="ls-message ls-message--error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="ls-message ls-message--success">
                  <CheckCircle2 size={18} />
                  <span>{success}</span>
                </div>
              )}

              <div className="ls-form-actions">
                <button className="ls-btn ls-btn--primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Slot' : 'Add Slot'}
                </button>

                <button
                  className="ls-btn ls-btn--ghost"
                  type="button"
                  onClick={resetForm}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          <div className="ls-card">
            <div className="ls-card__header">
              <h2>
                <CalendarDays size={20} />
                My Available Slots
              </h2>
            </div>

            <div className="ls-toolbar">
              <div className="ls-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by date or time"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="ls-filters">
                <button
                  className={`ls-filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setFilter('ALL')}
                  type="button"
                >
                  <Filter size={14} />
                  All
                </button>
                <button
                  className={`ls-filter-btn ${filter === 'TODAY' ? 'active' : ''}`}
                  onClick={() => setFilter('TODAY')}
                  type="button"
                >
                  Today
                </button>
                <button
                  className={`ls-filter-btn ${filter === 'UPCOMING' ? 'active' : ''}`}
                  onClick={() => setFilter('UPCOMING')}
                  type="button"
                >
                  Upcoming
                </button>
              </div>
            </div>

            {pageLoading ? (
              <div className="ls-empty-state">
                <p>Loading slots...</p>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="ls-empty-state">
                <CalendarRange size={54} />
                <p>No available slots found</p>
                <span>Add your first slot using the form or change the current filter.</span>
              </div>
            ) : (
              <div className="ls-slot-list">
                {filteredSlots.map((slot) => {
                  const status = getSlotStatus(slot.slotDate);
                  const duration = getDurationMinutes(
                    normalizeTime(slot.startTime),
                    normalizeTime(slot.endTime)
                  );

                  return (
                    <div className="ls-slot-item" key={slot.id}>
                      <div className="ls-slot-item__left">
                        <div className="ls-slot-date">{formatDate(slot.slotDate)}</div>
                        <div className="ls-slot-time">
                          {normalizeTime(slot.startTime)} - {normalizeTime(slot.endTime)}
                        </div>
                        <div className="ls-slot-meta">
                          <span>{duration} mins</span>
                          <span className={`ls-status-badge ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>

                      <div className="ls-slot-item__right">
                        <button
                          className="ls-action-btn edit"
                          onClick={() => handleEdit(slot)}
                          type="button"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          className="ls-action-btn delete"
                          onClick={() => handleDelete(slot.id)}
                          type="button"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getSlotStatus(slotDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = new Date(slotDate);
  selected.setHours(0, 0, 0, 0);

  if (selected.getTime() === today.getTime()) {
    return { label: 'Today', className: 'today' };
  }
  if (selected > today) {
    return { label: 'Upcoming', className: 'upcoming' };
  }
  return { label: 'Past', className: 'past' };
}

function getInitials(name) {
  return (name ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}