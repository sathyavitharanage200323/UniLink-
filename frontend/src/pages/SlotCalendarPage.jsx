import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  getLecturerAvailability,
  createSlot,
  updateSlot,
  deleteSlot,
  copyTodaySlots,
} from '../api';
import { getLecturerPreferences } from '../api/lecturerPreferencesApi';
import './SlotCalendarPage.css';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_PREFS = {
  slotDuration: 30,
  breakTime: 15,
  workStartTime: '09:00',
  workEndTime: '21:00',
  maxSlotsPerDay: 12,
  preferredMode: 'BOTH',
};

function formatTimeDisplay(time) {
  if (!time) return '--';

  const clean = time.slice(0, 5);
  const [hours, minutes] = clean.split(':').map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return clean;

  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const period = hours >= 12 ? 'p.m.' : 'a.m.';

  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function timeToMinutes(time) {
  if (!time) return 0;
  const clean = time.slice(0, 5);
  const [h, m] = clean.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function normalizeTime(value) {
  if (!value) return '';
  if (value.length === 5) return `${value}:00`;
  return value;
}

function getDurationMinutes(startTime, endTime) {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

function isSameDate(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function dateToKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLongDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMediumDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isPastDate(slotDate) {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const slotOnly = new Date(slotDate);
  return slotOnly < todayOnly;
}

function getStatus(slotDate) {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const slotOnly = new Date(slotDate);

  if (slotOnly.getTime() === todayOnly.getTime()) return 'Today';
  if (slotOnly > todayOnly) return 'Upcoming';
  return 'Past';
}

function getSlotLiveState(slot) {
  const now = new Date();
  const nowKey = dateToKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (!slot?.slotDate) return 'Past';

  if (slot.slotDate < nowKey) return 'Past';
  if (slot.slotDate > nowKey) return 'Upcoming';

  const startMinutes = timeToMinutes(slot.startTime);
  const endMinutes = timeToMinutes(slot.endTime);

  if (nowMinutes >= startMinutes && nowMinutes < endMinutes) return 'Ongoing';
  if (nowMinutes < startMinutes) return 'Today';
  return 'Past';
}

function getSlotBadgeClass(slot) {
  const liveState = getSlotLiveState(slot);

  if (liveState === 'Ongoing') return 'ongoing';
  if (liveState === 'Today') return 'today';
  if (liveState === 'Upcoming') return 'upcoming';
  return 'past';
}

function getSlotAccentClass(slot) {
  const liveState = getSlotLiveState(slot);

  if (liveState === 'Ongoing') return 'ongoing';
  if (liveState === 'Today') return 'today';
  if (liveState === 'Upcoming') return 'upcoming';
  return 'past';
}

function hasOngoingSlotForDate(dateKey, allSlotsByDate) {
  const sameDaySlots = allSlotsByDate[dateKey] || [];
  return sameDaySlots.some((slot) => getSlotLiveState(slot) === 'Ongoing');
}

function hasSlotConflict(existingSlots, newStart, newEnd, ignoreId = null) {
  const newStartMinutes = timeToMinutes(newStart);
  const newEndMinutes = timeToMinutes(newEnd);

  return existingSlots.some((slot) => {
    if (ignoreId && slot.id === ignoreId) return false;

    const existingStart = timeToMinutes(slot.startTime);
    const existingEnd = timeToMinutes(slot.endTime);

    return newStartMinutes < existingEnd && newEndMinutes > existingStart;
  });
}

function getNowRoundedMinutes(breakMinutes) {
  const now = new Date();
  const raw = now.getHours() * 60 + now.getMinutes();
  return Math.ceil(raw / breakMinutes) * breakMinutes;
}

function isTodayKey(dateKey) {
  return dateKey === dateToKey(new Date());
}

export default function SlotCalendarPage({ currentUser, onLogout }) {
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [preferences, setPreferences] = useState(DEFAULT_PREFS);
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState({ type: '', text: '' });
  const [copyingSlots, setCopyingSlots] = useState(false);

  const [filter, setFilter] = useState('All');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingSlot, setViewingSlot] = useState(null);

  const [quickAddStartTime, setQuickAddStartTime] = useState('');
  const [quickAddEndTime, setQuickAddEndTime] = useState('');
  const [addingSlot, setAddingSlot] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      loadSlots();
      loadPreferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlots((prev) => [...prev]);
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  async function loadSlots() {
    try {
      setLoading(true);
      setError('');
      setBanner({ type: '', text: '' });
      const data = await getLecturerAvailability(currentUser.id);
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load calendar slots.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPreferences() {
    try {
      setLoadingPreferences(true);
      const data = await getLecturerPreferences(currentUser.id);

      setPreferences({
        slotDuration: Number(data.slotDuration ?? 30),
        breakTime: Number(data.breakTime ?? 15),
        workStartTime: data.workStartTime?.slice(0, 5) ?? '09:00',
        workEndTime: data.workEndTime?.slice(0, 5) ?? '21:00',
        maxSlotsPerDay: Number(data.maxSlotsPerDay ?? 12),
        preferredMode: data.preferredMode ?? 'BOTH',
      });
    } catch (err) {
      console.error(err);
      setPreferences(DEFAULT_PREFS);
    } finally {
      setLoadingPreferences(false);
    }
  }

  const today = new Date();
  const todayKey = dateToKey(today);
  const lecturerInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'L';

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const status = getStatus(slot.slotDate);
      if (filter === 'All') return true;
      return status === filter;
    });
  }, [slots, filter]);

  const slotsByDate = useMemo(() => {
    const grouped = {};
    filteredSlots.forEach((slot) => {
      if (!grouped[slot.slotDate]) grouped[slot.slotDate] = [];
      grouped[slot.slotDate].push(slot);
    });

    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return grouped;
  }, [filteredSlots]);

  const allSlotsByDate = useMemo(() => {
    const grouped = {};
    slots.forEach((slot) => {
      if (!grouped[slot.slotDate]) grouped[slot.slotDate] = [];
      grouped[slot.slotDate].push(slot);
    });

    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return grouped;
  }, [slots]);

  function getDefaultEndFromStart(startValue) {
    if (!startValue) return '';
    const total = timeToMinutes(startValue) + Number(preferences.slotDuration);
    return minutesToTime(total);
  }

  function generateAllStartTimes() {
    const times = [];
    const start = timeToMinutes(preferences.workStartTime);
    const lastAllowedStart = timeToMinutes(preferences.workEndTime) - Number(preferences.slotDuration);

    for (let mins = start; mins <= lastAllowedStart; mins += Number(preferences.breakTime)) {
      times.push(minutesToTime(mins));
    }

    return times;
  }

  function getValidStartTimesForDate(dateKey, editingSlotParam = null) {
    if (!dateKey) return [];

    const allTimes = generateAllStartTimes();
    const sameDaySlots = (allSlotsByDate[dateKey] || []).filter((slot) =>
      editingSlotParam ? slot.id !== editingSlotParam.id : true
    );

    return allTimes.filter((time) => {
      const start = timeToMinutes(time);
      const end = start + Number(preferences.slotDuration);

      if (start < timeToMinutes(preferences.workStartTime)) return false;
      if (end > timeToMinutes(preferences.workEndTime)) return false;

      if (isTodayKey(dateKey)) {
        const roundedNow = getNowRoundedMinutes(Number(preferences.breakTime));
        if (start < roundedNow) return false;
      }

      for (const slot of sameDaySlots) {
        const existingStart = timeToMinutes(slot.startTime);
        const existingEnd = timeToMinutes(slot.endTime);

        const gapAfterExisting = start - existingEnd;
        const gapBeforeExisting = existingStart - end;

        const enoughGapAfter = gapAfterExisting >= Number(preferences.breakTime);
        const enoughGapBefore = gapBeforeExisting >= Number(preferences.breakTime);

        if (!(enoughGapAfter || enoughGapBefore)) {
          return false;
        }
      }

      return true;
    });
  }

  const selectedDateKey = dateToKey(selectedDate);
  const selectedDateSlots = allSlotsByDate[selectedDateKey] || [];
  const selectedDateHasOngoing = hasOngoingSlotForDate(selectedDateKey, allSlotsByDate);

  const validQuickAddStartTimes = getValidStartTimesForDate(selectedDateKey);
  const validEditStartTimes = editingSlot
    ? getValidStartTimesForDate(editingSlot.slotDate, editingSlot)
    : [];

  const totalSlots = slots.length;
  const todaySlots = slots.filter((slot) => slot.slotDate === todayKey).length;
  const upcomingSlots = slots.filter((slot) => getStatus(slot.slotDate) === 'Upcoming').length;
  const pastSlots = slots.filter((slot) => getStatus(slot.slotDate) === 'Past').length;

  const monthLabel = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    for (let i = 0; i < startDay; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [currentMonth]);

  function goToPreviousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  function goToToday() {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  }

  function openEditModal(slot) {
    const status = getStatus(slot.slotDate);
    if (status === 'Past') {
      setBanner({ type: 'error', text: 'Past slots cannot be edited.' });
      return;
    }

    setEditingSlot({
      ...slot,
      useDefault: slot.useDefault ?? true,
      customMode: slot.customMode || '',
      customNote: slot.customNote || '',
    });

    const start = slot.startTime.slice(0, 5);
    setEditStartTime(start);
    setEditEndTime(slot.endTime ? slot.endTime.slice(0, 5) : getDefaultEndFromStart(start));
    setEditModalOpen(true);
  }

  function closeEditModal() {
    setEditModalOpen(false);
    setEditingSlot(null);
    setEditStartTime('');
    setEditEndTime('');
  }

  function openViewModal(slot) {
    setViewingSlot(slot);
    setViewModalOpen(true);
  }

  function closeViewModal() {
    setViewingSlot(null);
    setViewModalOpen(false);
  }

  function handleQuickAddStartTimeChange(value) {
    setQuickAddStartTime(value);
    if (value) {
      setQuickAddEndTime(getDefaultEndFromStart(value));
    } else {
      setQuickAddEndTime('');
    }
  }

  function handleEditStartTimeChange(value) {
    setEditStartTime(value);
    if (value) {
      setEditEndTime(getDefaultEndFromStart(value));
    } else {
      setEditEndTime('');
    }
  }

  function validateTodayTime(dateKey, start) {
    if (!isTodayKey(dateKey)) return '';
    const roundedNow = getNowRoundedMinutes(Number(preferences.breakTime));
    const startMinutes = timeToMinutes(start);
    if (startMinutes < roundedNow) {
      return 'You cannot add or update a slot for a time that has already passed today.';
    }
    return '';
  }

  async function handleSaveEdit() {
    if (!editingSlot) return;

    const start = normalizeTime(editStartTime);
    const end = normalizeTime(editEndTime);

    if (!editingSlot.useDefault) {
      if (!editStartTime || !editEndTime) {
        setBanner({ type: 'error', text: 'Please select a valid custom time.' });
        return;
      }

      if (getDurationMinutes(start, end) !== Number(preferences.slotDuration)) {
        setBanner({ type: 'error', text: `Each slot must be exactly ${preferences.slotDuration} minutes.` });
        return;
      }

      if (timeToMinutes(start) < timeToMinutes(preferences.workStartTime)) {
        setBanner({ type: 'error', text: `Slots can start only from ${formatTimeDisplay(preferences.workStartTime)}.` });
        return;
      }

      if (timeToMinutes(end) > timeToMinutes(preferences.workEndTime)) {
        setBanner({ type: 'error', text: `Slots cannot go beyond ${formatTimeDisplay(preferences.workEndTime)}.` });
        return;
      }

      const todayTimeMessage = validateTodayTime(editingSlot.slotDate, start);
      if (todayTimeMessage) {
        setBanner({ type: 'error', text: todayTimeMessage });
        return;
      }

      const sameDateSlots = allSlotsByDate[editingSlot.slotDate] || [];
      if (hasSlotConflict(sameDateSlots, start, end, editingSlot.id)) {
        setBanner({ type: 'error', text: 'This time overlaps with another slot on the same date.' });
        return;
      }

      const validTimes = getValidStartTimesForDate(editingSlot.slotDate, editingSlot);
      if (!validTimes.includes(start.slice(0, 5))) {
        setBanner({ type: 'error', text: `Invalid time. Keep a ${preferences.breakTime}-minute break between slots.` });
        return;
      }
    }

    try {
      setSavingEdit(true);

      await updateSlot(editingSlot.id, {
        ...editingSlot,
        startTime: start,
        endTime: end,
        useDefault: editingSlot.useDefault,
        customMode: editingSlot.customMode,
        customNote: editingSlot.customNote,
      });

      await loadSlots();
      closeEditModal();
      setBanner({ type: 'success', text: 'Slot updated successfully.' });
    } catch (err) {
      setBanner({ type: 'error', text: err.message || 'Failed to update slot.' });
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(slotId, slotDate) {
    const status = getStatus(slotDate);
    if (status === 'Past') {
      setBanner({ type: 'error', text: 'Past slots cannot be deleted from this calendar view.' });
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this slot?');
    if (!confirmed) return;

    try {
      await deleteSlot(slotId);
      if (viewingSlot?.id === slotId) {
        closeViewModal();
      }
      await loadSlots();
      setBanner({ type: 'success', text: 'Slot deleted successfully.' });
    } catch (err) {
      setBanner({ type: 'error', text: err.message || 'Failed to delete slot.' });
    }
  }

  async function handleQuickAddSlot() {
    if (isPastDate(selectedDateKey)) {
      setBanner({ type: 'error', text: 'You cannot add slots to a past date.' });
      return;
    }

    if (selectedDateSlots.length >= Number(preferences.maxSlotsPerDay)) {
      setBanner({ type: 'error', text: `Maximum ${preferences.maxSlotsPerDay} slots allowed per day.` });
      return;
    }

    if (!quickAddStartTime || !quickAddEndTime) {
      setBanner({ type: 'error', text: 'Please select a valid start time.' });
      return;
    }

    const start = normalizeTime(quickAddStartTime);
    const end = normalizeTime(quickAddEndTime);

    if (getDurationMinutes(start, end) !== Number(preferences.slotDuration)) {
      setBanner({ type: 'error', text: `Each slot must be exactly ${preferences.slotDuration} minutes.` });
      return;
    }

    if (timeToMinutes(start) < timeToMinutes(preferences.workStartTime)) {
      setBanner({ type: 'error', text: `Slots can start only from ${formatTimeDisplay(preferences.workStartTime)}.` });
      return;
    }

    if (timeToMinutes(end) > timeToMinutes(preferences.workEndTime)) {
      setBanner({ type: 'error', text: `Slots cannot go beyond ${formatTimeDisplay(preferences.workEndTime)}.` });
      return;
    }

    const todayTimeMessage = validateTodayTime(selectedDateKey, start);
    if (todayTimeMessage) {
      setBanner({ type: 'error', text: todayTimeMessage });
      return;
    }

    const exactDuplicate = selectedDateSlots.some(
      (slot) => slot.startTime === start && slot.endTime === end
    );

    if (exactDuplicate) {
      setBanner({ type: 'error', text: 'This exact slot already exists for the selected date.' });
      return;
    }

    if (hasSlotConflict(selectedDateSlots, start, end)) {
      setBanner({ type: 'error', text: 'This time overlaps with another slot on the selected date.' });
      return;
    }

    const validTimes = getValidStartTimesForDate(selectedDateKey);
    if (!validTimes.includes(start.slice(0, 5))) {
      setBanner({
        type: 'error',
        text: `Invalid time. There must be a ${preferences.breakTime}-minute break between slots.`,
      });
      return;
    }

    try {
      setAddingSlot(true);
      await createSlot(currentUser.id, {
        slotDate: selectedDateKey,
        startTime: start,
        endTime: end,
        useDefault: true,
        customMode: '',
        customNote: '',
      });
      setQuickAddStartTime('');
      setQuickAddEndTime('');
      await loadSlots();
      setBanner({ type: 'success', text: 'Slot added successfully.' });
    } catch (err) {
      setBanner({ type: 'error', text: err.message || 'Failed to add slot.' });
    } finally {
      setAddingSlot(false);
    }
  }

  async function handleCopyToday() {
    if (!currentUser?.id) return;
    const confirmed = window.confirm('Copy today\'s available slots to tomorrow?');
    if (!confirmed) return;

    try {
      setCopyingSlots(true);
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

  const selectedDateStatus = getStatus(selectedDateKey);
  const usedSlotsForDay = selectedDateSlots.length;
  const remainingSlotsForDay = Math.max(Number(preferences.maxSlotsPerDay) - usedSlotsForDay, 0);

  return (
    <div className="sc-layout">
      <Header currentUser={currentUser} onLogout={onLogout} />

      <div className="sc-main">
        <section className="sc-hero">
          <div className="sc-hero__content">
            <div>
              <div className="sc-badge">📅 Smart Availability Calendar</div>
              <h1>Slot Calendar View</h1>
              <p>
                View lecturer availability by date, manage daily slots, and update the schedule
                from one professional calendar dashboard.
              </p>

              <div className="sc-hero__actions">
                <button
                  type="button"
                  className="sc-btn sc-btn--outline"
                  onClick={() => navigate('/lecturer/slots')}
                >
                  ← Back to Slots
                </button>

                <button
                  type="button"
                  className="sc-btn sc-btn--outline"
                  onClick={() => navigate('/lecturer/preferences')}
                >
                  ⚙ Preferences
                </button>

                <button
                  type="button"
                  className="sc-btn sc-btn--soft"
                  onClick={onLogout}
                >
                  Logout
                </button>

                <button
                  type="button"
                  className="sc-btn sc-btn--outline"
                  onClick={handleCopyToday}
                  disabled={copyingSlots}
                >
                  <Copy size={16} /> {copyingSlots ? 'Copying...' : 'Copy Today -> Tomorrow'}
                </button>
              </div>
            </div>

            <div className="sc-hero__avatar">{lecturerInitial}</div>
          </div>
        </section>

        <section className="sc-stats">
          <div className="sc-stat-card">
            <div className="sc-stat-icon purple">📊</div>
            <div>
              <h3>{totalSlots}</h3>
              <p>Total Slots</p>
            </div>
          </div>

          <div className="sc-stat-card">
            <div className="sc-stat-icon blue">🕒</div>
            <div>
              <h3>{todaySlots}</h3>
              <p>Today&apos;s Slots</p>
            </div>
          </div>

          <div className="sc-stat-card">
            <div className="sc-stat-icon green">✨</div>
            <div>
              <h3>{upcomingSlots}</h3>
              <p>Upcoming Slots</p>
            </div>
          </div>

          <div className="sc-stat-card">
            <div className="sc-stat-icon gray">⌛</div>
            <div>
              <h3>{pastSlots}</h3>
              <p>Past Slots</p>
            </div>
          </div>
        </section>

        <section className="sc-grid">
          <div className="sc-card">
            <div className="sc-card__header">
              <div className="sc-header-row">
                <div>
                  <h2>{monthLabel}</h2>
                  <p className="sc-subtitle">Click a date to review or manage its availability.</p>
                </div>

                <div className="sc-month-actions">
                  <button type="button" className="sc-btn sc-btn--ghost" onClick={goToPreviousMonth}>
                    ← Prev
                  </button>
                  <button type="button" className="sc-btn sc-btn--ghost" onClick={goToToday}>
                    Today
                  </button>
                  <button type="button" className="sc-btn sc-btn--ghost" onClick={goToNextMonth}>
                    Next →
                  </button>
                </div>
              </div>

              <div className="sc-filter-row">
                {['All', 'Today', 'Upcoming', 'Past'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`sc-filter-btn ${filter === item ? 'active' : ''}`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="sc-legend-row">
                <div className="sc-legend-pill ongoing"><span />Ongoing</div>
                <div className="sc-legend-pill today"><span />Today</div>
                <div className="sc-legend-pill upcoming"><span />Upcoming</div>
                <div className="sc-legend-pill past"><span />Past</div>
                <div className="sc-legend-pill selected"><span />Selected</div>
              </div>
            </div>

            <div className="sc-card__body">
              {loading ? (
                <div className="sc-empty">Loading calendar...</div>
              ) : error ? (
                <div className="sc-error">{error}</div>
              ) : (
                <>
                  <div className="sc-days-header">
                    {dayNames.map((day) => (
                      <div key={day} className="sc-day-name">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="sc-calendar-grid">
                    {calendarDays.map((dateObj, index) => {
                      if (!dateObj) {
                        return <div key={`empty-${index}`} className="sc-calendar-empty" />;
                      }

                      const key = dateToKey(dateObj);
                      const daySlots = slotsByDate[key] || [];
                      const isToday = key === todayKey;
                      const isSelected = isSameDate(dateObj, selectedDate);
                      const hasOngoing = daySlots.some((slot) => getSlotLiveState(slot) === 'Ongoing');

                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setSelectedDate(dateObj)}
                          className={`sc-day-card ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${daySlots.length > 0 ? 'has-slots' : 'empty-day'}`}
                        >
                          <div className="sc-day-card__top">
                            <span className="sc-day-number">{dateObj.getDate()}</span>

                            {hasOngoing ? (
                              <span className="sc-mini-badge live">
                                <span className="sc-live-dot" />
                                Live
                              </span>
                            ) : isSelected ? (
                              <span className="sc-mini-badge selected">Selected</span>
                            ) : isToday ? (
                              <span className="sc-mini-badge today">Today</span>
                            ) : null}
                          </div>

                          <div className="sc-day-slot-count">
                            {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                          </div>

                          <div className="sc-day-slot-preview">
                            {daySlots.slice(0, 2).map((slot) => {
                              const liveState = getSlotLiveState(slot);

                              return (
                                <div key={slot.id} className={`sc-slot-chip ${getSlotAccentClass(slot)}`}>
                                  <div className={`sc-slot-chip__top-line ${getSlotAccentClass(slot)}`} />

                                  <div className="sc-slot-chip__header">
                                    <div className="sc-slot-chip__time">
                                      {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                                    </div>

                                    {liveState === 'Ongoing' && (
                                      <div className="sc-live-pill">
                                        <span className="sc-live-dot" />
                                        Live
                                      </div>
                                    )}
                                  </div>

                                  <div className={`sc-slot-chip__status ${getSlotBadgeClass(slot)}`}>
                                    {liveState}
                                  </div>
                                </div>
                              );
                            })}

                            {daySlots.length > 2 && (
                              <div className="sc-more-text">+{daySlots.length - 2} more</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="sc-card sc-side-card">
            <div className="sc-card__header">
              <div>
                <h2>Selected Date Details</h2>
                <p className="sc-subtitle">Quick review and slot management for the chosen date.</p>
              </div>
            </div>

            <div className="sc-card__body">
              {banner.text ? (
                <div className={`sc-banner ${banner.type === 'error' ? 'error' : 'success'}`}>
                  {banner.text}
                </div>
              ) : null}

              <div className="sc-info-panel">
                <div className="sc-label">Date</div>
                <div className="sc-big-date">{formatLongDate(selectedDate)}</div>

                <div className={`sc-status-badge ${selectedDateHasOngoing ? 'ongoing' : selectedDateStatus.toLowerCase()}`}>
                  {selectedDateHasOngoing ? (
                    <>
                      <span className="sc-live-dot" />
                      Ongoing Slot Active
                    </>
                  ) : (
                    selectedDateStatus
                  )}
                </div>

                <div className="sc-capacity-grid">
                  <div className="sc-capacity-card purple">
                    <div className="sc-capacity-label">Daily Limit</div>
                    <div className="sc-capacity-number">{preferences.maxSlotsPerDay}</div>
                  </div>

                  <div className="sc-capacity-card blue">
                    <div className="sc-capacity-label">Used Slots</div>
                    <div className="sc-capacity-number">{usedSlotsForDay}</div>
                  </div>

                  <div className="sc-capacity-card green">
                    <div className="sc-capacity-label">Remaining</div>
                    <div className="sc-capacity-number">{remainingSlotsForDay}</div>
                  </div>
                </div>
              </div>

              <div className="sc-quick-add">
                <div className="sc-panel-title">Quick Add Slot</div>

                <div className="sc-quick-add__rules">
                  <div><strong>Allowed hours:</strong> {formatTimeDisplay(preferences.workStartTime)} - {formatTimeDisplay(preferences.workEndTime)}</div>
                  <div><strong>Slot duration:</strong> {preferences.slotDuration} mins</div>
                  <div><strong>Minimum break:</strong> {preferences.breakTime} mins</div>
                  <div><strong>Preferred mode:</strong> {preferences.preferredMode}</div>
                  <div><strong>Selected date:</strong> {selectedDateKey}</div>
                  <div>
                    <strong>Need to change these?</strong>{' '}
                    <button
                      type="button"
                      className="sc-link-btn"
                      onClick={() => navigate('/lecturer/preferences')}
                    >
                      Open Preferences Page
                    </button>
                  </div>
                </div>

                {loadingPreferences && (
                  <div className="sc-alert info">
                    Loading lecturer preferences...
                  </div>
                )}

                {isPastDate(selectedDateKey) && (
                  <div className="sc-alert warning">
                    You cannot add new slots to a past date.
                  </div>
                )}

                {selectedDateSlots.length >= Number(preferences.maxSlotsPerDay) && !isPastDate(selectedDateKey) && (
                  <div className="sc-alert danger">
                    Maximum slots reached for this date.
                  </div>
                )}

                {isTodayKey(selectedDateKey) && !isPastDate(selectedDateKey) && (
                  <div className="sc-alert info">
                    Only future time slots are available for today.
                  </div>
                )}

                <div className="sc-field">
                  <label>Start Time</label>
                  <select
                    className="sc-input"
                    value={quickAddStartTime}
                    onChange={(e) => handleQuickAddStartTimeChange(e.target.value)}
                    disabled={
                      loadingPreferences ||
                      isPastDate(selectedDateKey) ||
                      selectedDateSlots.length >= Number(preferences.maxSlotsPerDay)
                    }
                  >
                    <option value="">Select valid time</option>
                    {validQuickAddStartTimes.map((time) => (
                      <option key={time} value={time}>
                        {formatTimeDisplay(time)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sc-field">
                  <label>End Time</label>
                  <input
                    className="sc-input readonly"
                    type="time"
                    value={quickAddEndTime}
                    readOnly
                  />
                </div>

                {quickAddStartTime && quickAddEndTime && (
                  <div className="sc-duration-box">
                    Duration:{' '}
                    <strong>
                      {getDurationMinutes(
                        normalizeTime(quickAddStartTime),
                        normalizeTime(quickAddEndTime)
                      )}{' '}
                      mins
                    </strong>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleQuickAddSlot}
                  disabled={
                    addingSlot ||
                    loadingPreferences ||
                    isPastDate(selectedDateKey) ||
                    selectedDateSlots.length >= Number(preferences.maxSlotsPerDay)
                  }
                  className="sc-btn sc-btn--primary sc-btn--full"
                >
                  {addingSlot ? 'Adding...' : 'Add Slot'}
                </button>
              </div>

              <div className="sc-slots-section">
                <div className="sc-panel-title">Slots for Selected Date</div>

                {selectedDateSlots.length === 0 ? (
                  <div className="sc-empty-card">No slots available for this date.</div>
                ) : (
                  <div className="sc-selected-slots">
                    {selectedDateSlots.map((slot) => {
                      const status = getStatus(slot.slotDate);
                      const liveState = getSlotLiveState(slot);
                      const visualClass = getSlotBadgeClass(slot);
                      const duration = getDurationMinutes(slot.startTime, slot.endTime);
                      const isPast = status === 'Past';

                      return (
                        <div key={slot.id} className={`sc-selected-slot-card ${visualClass}`}>
                          <div className={`sc-selected-slot-accent ${visualClass}`} />

                          <div className="sc-selected-slot-main">
                            <div className="sc-selected-slot-top">
                              <div className="sc-selected-slot-time">
                                {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                              </div>

                              {liveState === 'Ongoing' && (
                                <div className="sc-live-pill sc-live-pill--card">
                                  <span className="sc-live-dot" />
                                  Ongoing
                                </div>
                              )}
                            </div>

                            <div className="sc-selected-slot-duration">
                              Duration: {duration} mins
                            </div>

                            {!slot.useDefault && (
                              <div className="sc-slot-override-tag">
                                Custom Override Enabled
                              </div>
                            )}

                            <span className={`sc-status-badge ${visualClass}`}>
                              {liveState}
                            </span>
                          </div>

                          <div className="sc-selected-slot-actions">
                            <button
                              type="button"
                              className="sc-action-btn view"
                              onClick={() => openViewModal(slot)}
                            >
                              View
                            </button>

                            <button
                              type="button"
                              className="sc-action-btn edit"
                              onClick={() => openEditModal(slot)}
                              disabled={isPast}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="sc-action-btn delete"
                              onClick={() => handleDelete(slot.id, slot.slotDate)}
                              disabled={isPast}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {editModalOpen && (
        <div className="sc-modal-overlay" onClick={closeEditModal}>
          <div className="sc-modal sc-modal--small" onClick={(e) => e.stopPropagation()}>
            <div className="sc-modal__header">
              <div>
                <h3>Edit Slot</h3>
                <p>{editingSlot?.slotDate}</p>
              </div>
              <button type="button" className="sc-modal__close" onClick={closeEditModal}>
                ✕
              </button>
            </div>

            <div className="sc-modal__body">
              <div className="sc-field">
                <label>Use Lecturer Default Settings</label>
                <select
                  className="sc-input"
                  value={editingSlot?.useDefault ? 'yes' : 'no'}
                  onChange={(e) => {
                    const useDefault = e.target.value === 'yes';
                    const newStart = editingSlot.startTime.slice(0, 5);
                    setEditingSlot({ ...editingSlot, useDefault });
                    setEditStartTime(newStart);
                    setEditEndTime(getDefaultEndFromStart(newStart));
                  }}
                >
                  <option value="yes">Yes (Use Default)</option>
                  <option value="no">No (Override This Slot)</option>
                </select>
              </div>

              {editingSlot?.useDefault ? (
                <div className="sc-info-box">
                  This slot follows lecturer default preferences:
                  {' '}
                  {preferences.slotDuration} mins, {preferences.preferredMode}, {formatTimeDisplay(preferences.workStartTime)} - {formatTimeDisplay(preferences.workEndTime)}.
                </div>
              ) : (
                <>
                  <div className="sc-field">
                    <label>Custom Start Time</label>
                    <select
                      className="sc-input"
                      value={editStartTime}
                      onChange={(e) => handleEditStartTimeChange(e.target.value)}
                    >
                      <option value="">Select time</option>
                      {validEditStartTimes.map((time) => (
                        <option key={time} value={time}>{formatTimeDisplay(time)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sc-field">
                    <label>Custom End Time</label>
                    <input
                      className="sc-input"
                      type="time"
                      value={editEndTime}
                      readOnly
                    />
                  </div>

                  <div className="sc-field">
                    <label>Custom Mode</label>
                    <select
                      className="sc-input"
                      value={editingSlot?.customMode || ''}
                      onChange={(e) =>
                        setEditingSlot({ ...editingSlot, customMode: e.target.value })
                      }
                    >
                      <option value="">Select mode</option>
                      <option value="ONLINE">Online</option>
                      <option value="PHYSICAL">Physical</option>
                      <option value="BOTH">Both</option>
                    </select>
                  </div>

                  <div className="sc-field">
                    <label>Custom Note</label>
                    <input
                      className="sc-input"
                      type="text"
                      placeholder="e.g. Extended discussion / urgent meeting"
                      value={editingSlot?.customNote || ''}
                      onChange={(e) =>
                        setEditingSlot({ ...editingSlot, customNote: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              <div className="sc-modal-actions">
                <button type="button" className="sc-btn sc-btn--ghost" onClick={closeEditModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="sc-btn sc-btn--primary"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewModalOpen && viewingSlot && (
        <div className="sc-modal-overlay" onClick={closeViewModal}>
          <div className="sc-modal sc-modal--medium" onClick={(e) => e.stopPropagation()}>
            <div className="sc-modal__header">
              <div>
                <h3>Slot Details</h3>
                <p>{formatMediumDate(viewingSlot.slotDate)}</p>
              </div>
              <button type="button" className="sc-modal__close" onClick={closeViewModal}>
                ✕
              </button>
            </div>

            <div className="sc-modal__body">
              <div className="sc-details-grid">
                <div className="sc-detail-card">
                  <span className="sc-detail-label">Slot ID</span>
                  <span className="sc-detail-value">{viewingSlot.id}</span>
                </div>

                <div className="sc-detail-card">
                  <span className="sc-detail-label">Lecturer</span>
                  <span className="sc-detail-value">{currentUser?.name || 'Lecturer'}</span>
                </div>

                <div className="sc-detail-card">
                  <span className="sc-detail-label">Start Time</span>
                  <span className="sc-detail-value">{formatTimeDisplay(viewingSlot.startTime)}</span>
                </div>

                <div className="sc-detail-card">
                  <span className="sc-detail-label">End Time</span>
                  <span className="sc-detail-value">{formatTimeDisplay(viewingSlot.endTime)}</span>
                </div>

                <div className="sc-detail-card">
                  <span className="sc-detail-label">Duration</span>
                  <span className="sc-detail-value">
                    {getDurationMinutes(viewingSlot.startTime, viewingSlot.endTime)} minutes
                  </span>
                </div>

                <div className="sc-detail-card">
                  <span className="sc-detail-label">Status</span>
                  <span className="sc-detail-value">
                    <span className={`sc-status-badge ${getSlotBadgeClass(viewingSlot)}`}>
                      {getSlotLiveState(viewingSlot) === 'Ongoing' && (
                        <span className="sc-live-dot" />
                      )}
                      {getSlotLiveState(viewingSlot)}
                    </span>
                  </span>
                </div>

                <div className="sc-detail-card">
                  <span className="sc-detail-label">Uses Default</span>
                  <span className="sc-detail-value">{viewingSlot.useDefault ? 'Yes' : 'No'}</span>
                </div>

                <div className="sc-detail-card">
                  <span className="sc-detail-label">Custom Mode</span>
                  <span className="sc-detail-value">{viewingSlot.customMode || '--'}</span>
                </div>

                <div className="sc-detail-card">
                  <span className="sc-detail-label">Custom Note</span>
                  <span className="sc-detail-value">{viewingSlot.customNote || '--'}</span>
                </div>
              </div>

              <div className="sc-modal-actions">
                <button type="button" className="sc-btn sc-btn--ghost" onClick={closeViewModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}