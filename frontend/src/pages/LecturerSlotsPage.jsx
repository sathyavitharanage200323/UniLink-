import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, Copy } from 'lucide-react';
import {
  createSlot,
  deleteSlot,
  getLecturerAvailability,
  updateSlot,
  copyTodaySlots,
} from '../api';
import './LecturerSlotsPage.css';

const START_HOUR = 9;
const END_HOUR = 21;
const SLOT_MINUTES = 30;
const BREAK_MINUTES = 15;

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function normalizeTime(value) {
  if (!value) return '';
  return value.length === 5 ? `${value}:00` : value;
}

function timeLabel(value) {
  const normalized = normalizeTime(value);
  if (!normalized) return '--:--';
  return normalized.slice(0, 5);
}

function minutesBetween(start, end) {
  const [sh, sm] = normalizeTime(start).split(':').map(Number);
  const [eh, em] = normalizeTime(end).split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function addMinutes(time, minsToAdd) {
  const [h, m] = normalizeTime(time).split(':').map(Number);
  const total = h * 60 + m + minsToAdd;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${pad(nh)}:${pad(nm)}:00`;
}

function generateStartTimes() {
  const values = [];
  const first = START_HOUR * 60;
  const lastStart = END_HOUR * 60 - SLOT_MINUTES;

  for (let mins = first; mins <= lastStart; mins += BREAK_MINUTES) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    values.push(`${pad(h)}:${pad(m)}:00`);
  }

  return values;
}

function getSlotStatus(slot) {
  const now = new Date();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slotDate = new Date(slot.slotDate);
  slotDate.setHours(0, 0, 0, 0);

  const slotEnd = new Date(`${slot.slotDate}T${timeLabel(slot.endTime)}:00`);

  if (slot.isBlocked) {
    return { label: 'Blocked', className: 'blocked' };
  }

  if (slot.isBooked) {
    return { label: 'Booked', className: 'booked' };
  }

  if (slotEnd < now || slotDate < today) {
    return { label: 'Expired', className: 'expired' };
  }

  if (slotDate.getTime() === today.getTime()) {
    return { label: 'Today', className: 'today' };
  }

  return { label: 'Available', className: 'available' };
}

function hasConflict(slots, slotDate, startTime, endTime, ignoreId = null) {
  const nextStart = normalizeTime(startTime);
  const nextEnd = normalizeTime(endTime);

  return slots.some((slot) => {
    if (ignoreId && slot.id === ignoreId) return false;
    if (slot.slotDate !== slotDate) return false;
    if (slot.isBlocked) return false;

    const existingStart = normalizeTime(slot.startTime);
    const existingEnd = normalizeTime(slot.endTime);

    return nextStart < existingEnd && nextEnd > existingStart;
  });
}

function formatDateDisplay(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}) {
  if (!open) return null;

  return (
    <div className="ls-modal-overlay" onClick={onCancel}>
      <div
        className="ls-modal ls-modal--small"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ls-modal__header">
          <h3>{title}</h3>
          <button
            type="button"
            className="ls-modal__close"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>

        <div className="ls-modal__body">
          <p style={{ margin: 0 }}>{message}</p>
        </div>

        <div className="ls-modal__actions">
          <button
            type="button"
            className="ls-btn ls-btn--ghost"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`ls-btn ${danger ? 'ls-btn--danger' : 'ls-btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LecturerSlotsPage({ currentUser, onLogout }) {
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ type: '', text: '' });
  const [copyingSlots, setCopyingSlots] = useState(false);

  const [slotDate, setSlotDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    danger: false,
    confirmText: 'Confirm',
  });

  const todayDateString = useMemo(() => toDateInputValue(new Date()), []);
  const startTimeOptions = useMemo(() => generateStartTimes(), []);
  const lecturerInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'L';

  const loadSlots = useCallback(async () => {
    try {
      setLoading(true);
      setBanner({ type: '', text: '' });
      const data = await getLecturerAvailability(currentUser.id);
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      setSlots([]);
      setBanner({ type: 'error', text: err.message || 'Failed to load slots.' });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      loadSlots();
    }
  }, [currentUser?.id, loadSlots]);

  useEffect(() => {
    if (!banner.text) return undefined;

    const timer = setTimeout(() => {
      setBanner({ type: '', text: '' });
    }, 4000);

    return () => clearTimeout(timer);
  }, [banner]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        if (confirmState.open) {
          closeConfirmModal();
          return;
        }

        if (selectedSlot) {
          setSelectedSlot(null);
        }
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [confirmState.open, selectedSlot]);

  function openConfirmModal({
    title,
    message,
    onConfirm,
    danger = false,
    confirmText = 'Confirm',
  }) {
    setConfirmState({
      open: true,
      title,
      message,
      onConfirm,
      danger,
      confirmText,
    });
  }

  function closeConfirmModal() {
    setConfirmState({
      open: false,
      title: '',
      message: '',
      onConfirm: null,
      danger: false,
      confirmText: 'Confirm',
    });
  }

  function clearForm() {
    setSlotDate('');
    setStartTime('');
    setEndTime('');
    setEditingId(null);
    setBanner({ type: '', text: '' });
  }

  function closeModal() {
    setSelectedSlot(null);
  }

  function handleStartTimeChange(value) {
    const normalized = normalizeTime(value);
    setStartTime(normalized);

    if (normalized) {
      setEndTime(addMinutes(normalized, SLOT_MINUTES));
    } else {
      setEndTime('');
    }
  }

  function validateForm() {
    if (!slotDate) {
      return 'Please select a date.';
    }

    if (!startTime || !endTime) {
      return 'Please select a valid start time.';
    }

    if (slotDate < todayDateString) {
      return 'You cannot create slots for past dates.';
    }

    const duration = minutesBetween(startTime, endTime);

    if (duration !== SLOT_MINUTES) {
      return `Each slot must be exactly ${SLOT_MINUTES} minutes.`;
    }

    if (normalizeTime(startTime) < `${pad(START_HOUR)}:00:00`) {
      return `Slots can start only from ${pad(START_HOUR)}:00.`;
    }

    if (normalizeTime(endTime) > `${pad(END_HOUR)}:00:00`) {
      return `Slots cannot end after ${pad(END_HOUR)}:00.`;
    }

    if (normalizeTime(endTime) <= normalizeTime(startTime)) {
      return 'End time must be later than start time.';
    }

    if (hasConflict(slots, slotDate, startTime, endTime, editingId)) {
      return 'This slot overlaps with an existing slot on the selected date.';
    }

    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setBanner({ type: 'error', text: validationMessage });
      return;
    }

    const payload = {
      lecturerId: currentUser.id,
      slotDate,
      startTime: normalizeTime(startTime),
      endTime: normalizeTime(endTime),
      isBlocked: false,
      isBooked: false,
    };

    try {
      if (editingId) {
        const existingSlot = slots.find((slot) => slot.id === editingId);

        await updateSlot(editingId, {
          ...payload,
          isBlocked: existingSlot?.isBlocked || false,
          isBooked: existingSlot?.isBooked || false,
        });

        setBanner({ type: 'success', text: 'Slot updated successfully.' });
      } else {
        await createSlot(currentUser.id, payload);
        setBanner({ type: 'success', text: 'Slot added successfully.' });
      }

      clearForm();
      await loadSlots();
    } catch (err) {
      setBanner({ type: 'error', text: err.message || 'Failed to save slot.' });
    }
  }

  async function handleCopyTodayConfirmed() {
    try {
      setCopyingSlots(true);
      closeConfirmModal();
      const res = await copyTodaySlots(currentUser.id);
      const created = res?.created ?? 0;
      const skipped = res?.skipped ?? 0;
      const note = skipped ? ` (${skipped} skipped)` : '';
      setBanner({ type: 'success', text: `Copied ${created} slot(s) to tomorrow${note}.` });
      await loadSlots();
    } catch (err) {
      setBanner({ type: 'error', text: err.message || 'Failed to copy slots.' });
    } finally {
      setCopyingSlots(false);
    }
  }

  function handleCopyToday() {
    if (!currentUser?.id) return;

    openConfirmModal({
      title: 'Copy Today Slots',
      message: "Are you sure you want to copy today's available slots to tomorrow?",
      onConfirm: handleCopyTodayConfirmed,
      confirmText: 'Copy Slots',
    });
  }

  function handleEdit(slot) {
    const slotStatus = getSlotStatus(slot);

    if (slotStatus.className === 'expired') {
      setBanner({ type: 'error', text: 'Expired slots cannot be edited.' });
      return;
    }

    setEditingId(slot.id);
    setSlotDate(slot.slotDate);
    setStartTime(normalizeTime(slot.startTime));
    setEndTime(normalizeTime(slot.endTime));
    setBanner({ type: '', text: '' });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleView(slot) {
    setSelectedSlot(slot);
  }

  async function confirmDelete(id) {
    try {
      closeConfirmModal();
      await deleteSlot(id);

      if (editingId === id) {
        clearForm();
      }

      if (selectedSlot?.id === id) {
        closeModal();
      }

      setBanner({ type: 'success', text: 'Slot deleted successfully.' });
      await loadSlots();
    } catch (err) {
      setBanner({ type: 'error', text: err.message || 'Failed to delete slot.' });
    }
  }

  function handleDelete(id) {
    openConfirmModal({
      title: 'Delete Slot',
      message: 'Are you sure you want to delete this slot?',
      onConfirm: () => confirmDelete(id),
      danger: true,
      confirmText: 'Delete',
    });
  }

  async function handleToggleBlock(slot) {
    const slotStatus = getSlotStatus(slot);

    if (slotStatus.className === 'expired') {
      setBanner({ type: 'error', text: 'Expired slots cannot be blocked or unblocked.' });
      return;
    }

    try {
      const updatedSlot = {
        lecturerId: slot.lecturerId,
        slotDate: slot.slotDate,
        startTime: normalizeTime(slot.startTime),
        endTime: normalizeTime(slot.endTime),
        isBlocked: !slot.isBlocked,
        isBooked: slot.isBooked || false,
      };

      await updateSlot(slot.id, updatedSlot);

      if (editingId === slot.id) {
        clearForm();
      }

      if (selectedSlot?.id === slot.id) {
        setSelectedSlot({
          ...slot,
          isBlocked: !slot.isBlocked,
        });
      }

      setBanner({
        type: 'success',
        text: slot.isBlocked ? 'Slot unblocked successfully.' : 'Slot blocked successfully.',
      });

      await loadSlots();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err.message || 'Failed to update slot status.',
      });
    }
  }

  const totalSlots = slots.length;
  const todaySlots = slots.filter((slot) => getSlotStatus(slot).className === 'today').length;
  const availableSlots = slots.filter((slot) => getSlotStatus(slot).className === 'available').length;
  const bookedSlots = slots.filter((slot) => getSlotStatus(slot).className === 'booked').length;
  const blockedSlots = slots.filter((slot) => getSlotStatus(slot).className === 'blocked').length;
  const expiredSlots = slots.filter((slot) => getSlotStatus(slot).className === 'expired').length;

  const filteredSlots = useMemo(() => {
    let data = [...slots];

    data.sort((a, b) => {
      const first = `${a.slotDate} ${normalizeTime(a.startTime)}`;
      const second = `${b.slotDate} ${normalizeTime(b.startTime)}`;
      return first.localeCompare(second);
    });

    if (filter === 'TODAY') {
      data = data.filter((slot) => getSlotStatus(slot).className === 'today');
    } else if (filter === 'UPCOMING') {
      data = data.filter((slot) => getSlotStatus(slot).className === 'available');
    } else if (filter === 'BOOKED') {
      data = data.filter((slot) => getSlotStatus(slot).className === 'booked');
    } else if (filter === 'BLOCKED') {
      data = data.filter((slot) => getSlotStatus(slot).className === 'blocked');
    } else if (filter === 'EXPIRED') {
      data = data.filter((slot) => getSlotStatus(slot).className === 'expired');
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();

      data = data.filter((slot) => {
        const date = slot.slotDate?.toLowerCase?.() ?? '';
        const start = normalizeTime(slot.startTime).toLowerCase();
        const end = normalizeTime(slot.endTime).toLowerCase();
        const status = getSlotStatus(slot).label.toLowerCase();

        return (
          date.includes(q) ||
          start.includes(q) ||
          end.includes(q) ||
          status.includes(q)
        );
      });
    }

    return data;
  }, [slots, filter, search]);

  return (
    <div className="ls-layout">
      <div className="ls-main">
        <section className="ls-hero">
          <div className="ls-hero__content">
            <div className="ls-hero__left">
              <div className="ls-badge">✨ Lecturer Availability Portal</div>

              <h1>Available Slot Management</h1>
              <p>
                Manage lecturer availability with smart time-based validation,
                status control, clean scheduling, and a presentation-ready dashboard.
              </p>

              <div className="ls-hero__actions">
                <button
                  type="button"
                  className="ls-btn ls-btn--outline"
                  onClick={() => navigate('/lecturer/home')}
                >
                  ← Back to Dashboard
                </button>

                <button
                  type="button"
                  className="ls-btn ls-btn--soft"
                  onClick={() => navigate('/lecturer/calendar')}
                >
                  📅 Calendar View
                </button>

                <button
                  type="button"
                  className="ls-btn ls-btn--outline"
                  onClick={handleCopyToday}
                  disabled={copyingSlots}
                >
                  <Copy size={16} /> {copyingSlots ? 'Copying...' : 'Copy Today -> Tomorrow'}
                </button>

                <button
                  type="button"
                  className="ls-btn ls-btn--guide"
                  onClick={() => navigate('/lecturer/slots/guide')}
                >
                  <BookOpenCheck size={16} />
                  Slot Guide
                </button>

                <button
                  type="button"
                  className="ls-btn ls-btn--outline"
                  onClick={() => navigate('/lecturer/settings')}
                >
                  ⚙ Settings
                </button>

                <button
                  type="button"
                  className="ls-btn ls-btn--soft"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="ls-hero__avatar">
              {lecturerInitial}
            </div>
          </div>
        </section>

        <section className="ls-stats ls-stats--six">
          <div className="ls-stat-card">
            <div className="ls-stat-icon purple">📊</div>
            <div>
              <h3>{totalSlots}</h3>
              <p>Total Slots</p>
            </div>
          </div>

          <div className="ls-stat-card">
            <div className="ls-stat-icon blue">🕒</div>
            <div>
              <h3>{todaySlots}</h3>
              <p>Today&apos;s Slots</p>
            </div>
          </div>

          <div className="ls-stat-card">
            <div className="ls-stat-icon green">✅</div>
            <div>
              <h3>{availableSlots}</h3>
              <p>Available Slots</p>
            </div>
          </div>

          <div className="ls-stat-card">
            <div className="ls-stat-icon pink">📌</div>
            <div>
              <h3>{bookedSlots}</h3>
              <p>Booked Slots</p>
            </div>
          </div>

          <div className="ls-stat-card">
            <div className="ls-stat-icon orange">⛔</div>
            <div>
              <h3>{blockedSlots}</h3>
              <p>Blocked Slots</p>
            </div>
          </div>

          <div className="ls-stat-card">
            <div className="ls-stat-icon gray">⌛</div>
            <div>
              <h3>{expiredSlots}</h3>
              <p>Expired Slots</p>
            </div>
          </div>
        </section>

        <section className="ls-grid">
          <div className="ls-card">
            <div className="ls-card__header">
              <h2>{editingId ? '✏️ Edit Slot' : '➕ Add New Slot'}</h2>
            </div>

            <div className="ls-form">
              <div className="ls-note">
                <strong>Scheduling Note:</strong> Current default rules are 09:00 AM to
                09:00 PM, 30-minute slots, and a 15-minute interval pattern.
                {' '}
                <button
                  type="button"
                  className="ls-inline-link"
                  onClick={() => navigate('/lecturer/settings')}
                >
                  Change in Settings
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="ls-field">
                  <label htmlFor="slotDate">Date</label>
                  <input
                    id="slotDate"
                    className="ls-input"
                    type="date"
                    value={slotDate}
                    min={todayDateString}
                    onChange={(e) => setSlotDate(e.target.value)}
                  />
                </div>

                <div className="ls-row">
                  <div className="ls-field">
                    <label htmlFor="startTime">Start Time</label>
                    <select
                      id="startTime"
                      className="ls-select"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                    >
                      <option value="">Select time</option>
                      {startTimeOptions.map((time) => (
                        <option key={time} value={time}>
                          {timeLabel(time)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ls-field">
                    <label htmlFor="endTime">End Time</label>
                    <input
                      id="endTime"
                      className="ls-input"
                      type="time"
                      value={timeLabel(endTime)}
                      readOnly
                    />
                  </div>
                </div>

                <div className="ls-helper-box">
                  <div className="ls-helper-item">
                    <strong>Lecturer:</strong> {currentUser?.name || 'Lecturer'}
                  </div>
                  <div className="ls-helper-item">
                    <strong>Duration:</strong>{' '}
                    {startTime && endTime ? `${minutesBetween(startTime, endTime)} mins` : '--'}
                  </div>
                  <div className="ls-helper-item">
                    <strong>Rules:</strong> 09:00 - 21:00 | 30 min slot | 15 min gap pattern |
                    {' '}
                    <button
                      type="button"
                      className="ls-inline-link"
                      onClick={() => navigate('/lecturer/settings')}
                    >
                      Edit Settings
                    </button>
                  </div>
                </div>

                {banner.text ? (
                  <div
                    className={`ls-message ${
                      banner.type === 'error' ? 'ls-message--error' : 'ls-message--success'
                    }`}
                  >
                    {banner.text}
                  </div>
                ) : null}

                <div className="ls-form-actions">
                  <button type="submit" className="ls-btn ls-btn--primary">
                    {editingId ? 'Update Slot' : 'Add Slot'}
                  </button>

                  <button
                    type="button"
                    className="ls-btn ls-btn--ghost"
                    onClick={clearForm}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="ls-card">
            <div className="ls-card__header">
              <h2>📘 My Available Slots</h2>
            </div>

            <div className="ls-toolbar">
              <div className="ls-search">
                <span>🔎</span>
                <input
                  type="text"
                  placeholder="Search by date, time, or status"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="ls-filters">
                {[
                  { key: 'ALL', label: 'All' },
                  { key: 'TODAY', label: 'Today' },
                  { key: 'UPCOMING', label: 'Available' },
                  { key: 'BOOKED', label: 'Booked' },
                  { key: 'BLOCKED', label: 'Blocked' },
                  { key: 'EXPIRED', label: 'Expired' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`ls-filter-btn ${filter === item.key ? 'active' : ''}`}
                    onClick={() => setFilter(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ls-slot-list">
              {loading ? (
                <div className="ls-empty-state">
                  <p>Loading slots...</p>
                  <span>Please wait while we fetch the latest availability details.</span>
                </div>
              ) : filteredSlots.length === 0 ? (
                <div className="ls-empty-state">
                  <div style={{ fontSize: '44px' }}>🗂️</div>
                  <p>No available slots found</p>
                  <span>Add your first slot using the form or change the current filter.</span>
                </div>
              ) : (
                filteredSlots.map((slot) => {
                  const slotStatus = getSlotStatus(slot);

                  return (
                    <div key={slot.id} className="ls-slot-item">
                      <div>
                        <div className="ls-slot-date">{formatDateDisplay(slot.slotDate)}</div>

                        <div className="ls-slot-time">
                          {timeLabel(slot.startTime)} - {timeLabel(slot.endTime)}
                        </div>

                        <div className="ls-slot-meta">
                          <span>{minutesBetween(slot.startTime, slot.endTime)} mins</span>
                          <span className={`ls-status-badge ${slotStatus.className}`}>
                            {slotStatus.label}
                          </span>
                        </div>
                      </div>

                      <div className="ls-slot-item__right">
                        <button
                          type="button"
                          className="ls-action-btn view"
                          onClick={() => handleView(slot)}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="ls-action-btn edit"
                          onClick={() => handleEdit(slot)}
                          disabled={slot.isBooked}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="ls-action-btn block"
                          onClick={() => handleToggleBlock(slot)}
                          disabled={slot.isBooked}
                        >
                          {slot.isBlocked ? 'Unblock' : 'Block'}
                        </button>

                        <button
                          type="button"
                          className="ls-action-btn delete"
                          onClick={() => handleDelete(slot.id)}
                          disabled={slot.isBooked}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      {selectedSlot ? (
        <div className="ls-modal-overlay" onClick={closeModal}>
          <div
            className="ls-modal ls-modal--large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ls-modal__header">
              <h3>📄 Slot Details</h3>
              <button
                type="button"
                className="ls-modal__close"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            <div className="ls-modal__body">
              <div className="ls-detail-grid">
                <div className="ls-detail-card">
                  <span className="ls-detail-label">Slot ID</span>
                  <span className="ls-detail-value">{selectedSlot.id}</span>
                </div>

                <div className="ls-detail-card">
                  <span className="ls-detail-label">Lecturer</span>
                  <span className="ls-detail-value">{currentUser?.name || 'Lecturer'}</span>
                </div>

                <div className="ls-detail-card">
                  <span className="ls-detail-label">Date</span>
                  <span className="ls-detail-value">{formatDateDisplay(selectedSlot.slotDate)}</span>
                </div>

                <div className="ls-detail-card">
                  <span className="ls-detail-label">Start Time</span>
                  <span className="ls-detail-value">{timeLabel(selectedSlot.startTime)}</span>
                </div>

                <div className="ls-detail-card">
                  <span className="ls-detail-label">End Time</span>
                  <span className="ls-detail-value">{timeLabel(selectedSlot.endTime)}</span>
                </div>

                <div className="ls-detail-card">
                  <span className="ls-detail-label">Duration</span>
                  <span className="ls-detail-value">
                    {minutesBetween(selectedSlot.startTime, selectedSlot.endTime)} minutes
                  </span>
                </div>

                <div className="ls-detail-card">
                  <span className="ls-detail-label">Status</span>
                  <span className="ls-detail-value">
                    <span className={`ls-status-badge ${getSlotStatus(selectedSlot).className}`}>
                      {getSlotStatus(selectedSlot).label}
                    </span>
                  </span>
                </div>

                <div className="ls-detail-card">
                  <span className="ls-detail-label">Blocked</span>
                  <span className="ls-detail-value">{selectedSlot.isBlocked ? 'Yes' : 'No'}</span>
                </div>

                <div className="ls-detail-card">
                  <span className="ls-detail-label">Booked</span>
                  <span className="ls-detail-value">{selectedSlot.isBooked ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="ls-modal__actions">
                <button
                  type="button"
                  className="ls-btn ls-btn--ghost"
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirmModal}
        danger={confirmState.danger}
      />
    </div>
  );
}