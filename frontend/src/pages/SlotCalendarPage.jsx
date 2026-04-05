import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSlots, createSlot, updateSlot, deleteSlot } from '../api';
import './SlotCalendarPage.css';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SLOT_DURATION_MINUTES = 30;
const BREAK_MINUTES = 15;
const DAY_START = '09:00';
const DAY_END = '21:00';
const MAX_SLOTS_PER_DAY = 12;

function formatTimeDisplay(time) {
  if (!time) return '--';
  return time.slice(0, 5);
}

function timeToMinutes(time) {
  if (!time) return 0;
  const [h, m] = time.slice(0, 5).split(':').map(Number);
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

function addMinutesToTime(timeValue, minutesToAdd = SLOT_DURATION_MINUTES) {
  if (!timeValue) return '';
  const total = timeToMinutes(timeValue) + minutesToAdd;
  return minutesToTime(total);
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

function generateAllStartTimes() {
  const times = [];
  const start = timeToMinutes(DAY_START);
  const lastAllowedStart = timeToMinutes(DAY_END) - SLOT_DURATION_MINUTES;

  for (let mins = start; mins <= lastAllowedStart; mins += BREAK_MINUTES) {
    times.push(minutesToTime(mins));
  }

  return times;
}

function getNowRoundedMinutes() {
  const now = new Date();
  const raw = now.getHours() * 60 + now.getMinutes();
  return Math.ceil(raw / BREAK_MINUTES) * BREAK_MINUTES;
}

function isTodayKey(dateKey) {
  return dateKey === dateToKey(new Date());
}

function getValidStartTimesForDate(dateKey, allSlotsByDate, editingSlot = null) {
  if (!dateKey) return [];

  const allTimes = generateAllStartTimes();
  const sameDaySlots = (allSlotsByDate[dateKey] || []).filter((slot) =>
    editingSlot ? slot.id !== editingSlot.id : true
  );

  return allTimes.filter((time) => {
    const start = timeToMinutes(time);
    const end = start + SLOT_DURATION_MINUTES;

    if (start < timeToMinutes(DAY_START)) return false;
    if (end > timeToMinutes(DAY_END)) return false;

    if (isTodayKey(dateKey)) {
      const roundedNow = getNowRoundedMinutes();
      if (start < roundedNow) return false;
    }

    for (const slot of sameDaySlots) {
      const existingStart = timeToMinutes(slot.startTime);
      const existingEnd = timeToMinutes(slot.endTime);

      const gapAfterExisting = start - existingEnd;
      const gapBeforeExisting = existingStart - end;

      const enoughGapAfter = gapAfterExisting >= BREAK_MINUTES;
      const enoughGapBefore = gapBeforeExisting >= BREAK_MINUTES;

      if (!(enoughGapAfter || enoughGapBefore)) {
        return false;
      }
    }

    return true;
  });
}

function getSlotAccentClass(slot) {
  const liveState = getSlotLiveState(slot);

  if (liveState === 'Ongoing') return 'ongoing';
  if (liveState === 'Today') return 'today';
  if (liveState === 'Upcoming') return 'upcoming';
  return 'past';
}

export default function SlotCalendarPage({ currentUser, onLogout }) {
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState({ type: '', text: '' });

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
      const data = await getSlots(currentUser.id);
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load calendar slots.');
      setSlots([]);
    } finally {
      setLoading(false);
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

  const selectedDateKey = dateToKey(selectedDate);
  const selectedDateSlots = allSlotsByDate[selectedDateKey] || [];
  const selectedDateHasOngoing = hasOngoingSlotForDate(selectedDateKey, allSlotsByDate);

  const validQuickAddStartTimes = getValidStartTimesForDate(selectedDateKey, allSlotsByDate);
  const validEditStartTimes = editingSlot
    ? getValidStartTimesForDate(editingSlot.slotDate, allSlotsByDate, editingSlot)
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

    setEditingSlot(slot);
    const start = slot.startTime.slice(0, 5);
    setEditStartTime(start);
    setEditEndTime(addMinutesToTime(start, SLOT_DURATION_MINUTES).slice(0, 5));
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
      setQuickAddEndTime(addMinutesToTime(value, SLOT_DURATION_MINUTES));
    } else {
      setQuickAddEndTime('');
    }
  }

  function handleEditStartTimeChange(value) {
    setEditStartTime(value);
    if (value) {
      setEditEndTime(addMinutesToTime(value, SLOT_DURATION_MINUTES));
    } else {
      setEditEndTime('');
    }
  }

  function validateTodayTime(dateKey, start) {
    if (!isTodayKey(dateKey)) return '';
    const roundedNow = getNowRoundedMinutes();
    const startMinutes = timeToMinutes(start);
    if (startMinutes < roundedNow) {
      return 'You cannot add or update a slot for a time that has already passed today.';
    }
    return '';
  }

  async function handleSaveEdit() {
    if (!editingSlot) return;

    if (!editStartTime || !editEndTime) {
      setBanner({ type: 'error', text: 'Please select a valid start time.' });
      return;
    }

    const start = normalizeTime(editStartTime);
    const end = normalizeTime(editEndTime);

    if (getDurationMinutes(start, end) !== SLOT_DURATION_MINUTES) {
      setBanner({ type: 'error', text: `Each slot must be exactly ${SLOT_DURATION_MINUTES} minutes.` });
      return;
    }

    if (timeToMinutes(start) < timeToMinutes(DAY_START)) {
      setBanner({ type: 'error', text: `Slots can start only from ${DAY_START}.` });
      return;
    }

    if (timeToMinutes(end) > timeToMinutes(DAY_END)) {
      setBanner({ type: 'error', text: `Slots cannot go beyond ${DAY_END}.` });
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

    const validTimes = getValidStartTimesForDate(editingSlot.slotDate, allSlotsByDate, editingSlot);
    if (!validTimes.includes(start.slice(0, 5))) {
      setBanner({ type: 'error', text: `Invalid time. Keep a ${BREAK_MINUTES}-minute break between slots.` });
      return;
    }

    try {
      setSavingEdit(true);
      await updateSlot(editingSlot.id, {
        ...editingSlot,
        startTime: start,
        endTime: end,
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

    if (selectedDateSlots.length >= MAX_SLOTS_PER_DAY) {
      setBanner({ type: 'error', text: `Maximum ${MAX_SLOTS_PER_DAY} slots allowed per day.` });
      return;
    }

    if (!quickAddStartTime || !quickAddEndTime) {
      setBanner({ type: 'error', text: 'Please select a valid start time.' });
      return;
    }

    const start = normalizeTime(quickAddStartTime);
    const end = normalizeTime(quickAddEndTime);

    if (getDurationMinutes(start, end) !== SLOT_DURATION_MINUTES) {
      setBanner({ type: 'error', text: `Each slot must be exactly ${SLOT_DURATION_MINUTES} minutes.` });
      return;
    }

    if (timeToMinutes(start) < timeToMinutes(DAY_START)) {
      setBanner({ type: 'error', text: `Slots can start only from ${DAY_START}.` });
      return;
    }

    if (timeToMinutes(end) > timeToMinutes(DAY_END)) {
      setBanner({ type: 'error', text: `Slots cannot go beyond ${DAY_END}.` });
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

    if (!validQuickAddStartTimes.includes(start.slice(0, 5))) {
      setBanner({
        type: 'error',
        text: `Invalid time. There must be a ${BREAK_MINUTES}-minute break between slots.`,
      });
      return;
    }

    try {
      setAddingSlot(true);
      await createSlot({
        lecturerId: currentUser.id,
        slotDate: selectedDateKey,
        startTime: start,
        endTime: end,
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

  const selectedDateStatus = getStatus(selectedDateKey);
  const usedSlotsForDay = selectedDateSlots.length;
  const remainingSlotsForDay = Math.max(MAX_SLOTS_PER_DAY - usedSlotsForDay, 0);

  return (
    <div className="sc-layout">
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
                  className="sc-btn sc-btn--soft"
                  onClick={onLogout}
                >
                  Logout
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
                                  <div className="sc-slot-chip__top-line" />

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
                    <div className="sc-capacity-number">{MAX_SLOTS_PER_DAY}</div>
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
                  <div><strong>Allowed hours:</strong> {DAY_START} - {DAY_END}</div>
                  <div><strong>Slot duration:</strong> {SLOT_DURATION_MINUTES} mins</div>
                  <div><strong>Minimum break:</strong> {BREAK_MINUTES} mins</div>
                  <div><strong>Selected date:</strong> {selectedDateKey}</div>
                </div>

                {isPastDate(selectedDateKey) && (
                  <div className="sc-alert warning">
                    You cannot add new slots to a past date.
                  </div>
                )}

                {selectedDateSlots.length >= MAX_SLOTS_PER_DAY && !isPastDate(selectedDateKey) && (
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
                    disabled={isPastDate(selectedDateKey) || selectedDateSlots.length >= MAX_SLOTS_PER_DAY}
                  >
                    <option value="">Select valid time</option>
                    {validQuickAddStartTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
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
                    isPastDate(selectedDateKey) ||
                    selectedDateSlots.length >= MAX_SLOTS_PER_DAY
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
                <label>Start Time</label>
                <select
                  className="sc-input"
                  value={editStartTime}
                  onChange={(e) => handleEditStartTimeChange(e.target.value)}
                >
                  <option value="">Select valid time</option>
                  {validEditStartTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sc-field">
                <label>End Time</label>
                <input
                  className="sc-input readonly"
                  type="time"
                  value={editEndTime}
                  readOnly
                />
              </div>

              {editStartTime && editEndTime && (
                <div className="sc-duration-box">
                  Duration:{' '}
                  <strong>
                    {getDurationMinutes(
                      normalizeTime(editStartTime),
                      normalizeTime(editEndTime)
                    )}{' '}
                    mins
                  </strong>
                </div>
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
    </div>
  );
}