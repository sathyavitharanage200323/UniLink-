import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSlots, createSlot, updateSlot, deleteSlot } from '../api';

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

function getStatusColors(status) {
  if (status === 'Today') {
    return {
      background: '#dbeafe',
      color: '#1d4ed8',
      border: '1px solid #93c5fd',
    };
  }
  if (status === 'Upcoming') {
    return {
      background: '#dcfce7',
      color: '#15803d',
      border: '1px solid #86efac',
    };
  }
  return {
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
  };
}

function getStartOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getEndOfWeek(date) {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
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

export default function SlotCalendarPage({ currentUser, onLogout }) {
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [dateModalOpen, setDateModalOpen] = useState(false);

  const [quickAddStartTime, setQuickAddStartTime] = useState('');
  const [quickAddEndTime, setQuickAddEndTime] = useState('');
  const [addingSlot, setAddingSlot] = useState(false);

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  async function loadSlots() {
    try {
      setLoading(true);
      setError('');
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
  const selectedDateSlots = slotsByDate[selectedDateKey] || [];
  const selectedDateAllSlots = allSlotsByDate[selectedDateKey] || [];

  const validQuickAddStartTimes = getValidStartTimesForDate(selectedDateKey, allSlotsByDate);
  const validEditStartTimes = editingSlot
    ? getValidStartTimesForDate(editingSlot.slotDate, allSlotsByDate, editingSlot)
    : [];

  const totalSlots = slots.length;
  const todaySlots = slots.filter((slot) => slot.slotDate === todayKey).length;
  const upcomingSlots = slots.filter((slot) => getStatus(slot.slotDate) === 'Upcoming').length;
  const thisMonthSlots = slots.filter((slot) => {
    const d = new Date(slot.slotDate);
    return (
      d.getFullYear() === currentMonth.getFullYear() &&
      d.getMonth() === currentMonth.getMonth()
    );
  }).length;

  const weekStart = getStartOfWeek(selectedDate);
  const weekEnd = getEndOfWeek(selectedDate);

  const thisWeekSlots = slots.filter((slot) => {
    const slotDate = new Date(slot.slotDate);
    return slotDate >= weekStart && slotDate <= weekEnd;
  });

  const thisWeekTodaySlots = thisWeekSlots.filter(
    (slot) => getStatus(slot.slotDate) === 'Today'
  ).length;
  const thisWeekUpcomingSlots = thisWeekSlots.filter(
    (slot) => getStatus(slot.slotDate) === 'Upcoming'
  ).length;

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
    setDateModalOpen(true);
  }

  function openEditModal(slot) {
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

  function openDateModal(dateObj) {
    setSelectedDate(dateObj);
    setQuickAddStartTime('');
    setQuickAddEndTime('');
    setDateModalOpen(true);
  }

  function closeDateModal() {
    setDateModalOpen(false);
    setQuickAddStartTime('');
    setQuickAddEndTime('');
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

  async function handleSaveEdit() {
    if (!editingSlot) return;

    if (!editStartTime || !editEndTime) {
      alert('Please select a valid start time.');
      return;
    }

    const start = normalizeTime(editStartTime);
    const end = normalizeTime(editEndTime);

    if (getDurationMinutes(start, end) !== SLOT_DURATION_MINUTES) {
      alert(`Each slot must be exactly ${SLOT_DURATION_MINUTES} minutes.`);
      return;
    }

    if (timeToMinutes(start) < timeToMinutes(DAY_START)) {
      alert(`Slots can start only from ${DAY_START}.`);
      return;
    }

    if (timeToMinutes(end) > timeToMinutes(DAY_END)) {
      alert(`Slots cannot go beyond ${DAY_END}.`);
      return;
    }

    const sameDateSlots = allSlotsByDate[editingSlot.slotDate] || [];
    if (hasSlotConflict(sameDateSlots, start, end, editingSlot.id)) {
      alert('This time overlaps with another slot on the same date.');
      return;
    }

    const validTimes = getValidStartTimesForDate(editingSlot.slotDate, allSlotsByDate, editingSlot);
    if (!validTimes.includes(start.slice(0, 5))) {
      alert(`Invalid time. Keep a ${BREAK_MINUTES}-minute break between slots.`);
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
      alert('Slot updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update slot.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(slotId) {
    const confirmed = window.confirm('Are you sure you want to delete this slot?');
    if (!confirmed) return;

    try {
      await deleteSlot(slotId);
      await loadSlots();
      alert('Slot deleted successfully.');
    } catch (err) {
      alert(err.message || 'Failed to delete slot.');
    }
  }

  async function handleQuickAddSlot() {
    if (isPastDate(selectedDateKey)) {
      alert('You cannot add slots to a past date.');
      return;
    }

    if (selectedDateAllSlots.length >= MAX_SLOTS_PER_DAY) {
      alert(`Maximum ${MAX_SLOTS_PER_DAY} slots allowed per day.`);
      return;
    }

    if (!quickAddStartTime || !quickAddEndTime) {
      alert('Please select a valid start time.');
      return;
    }

    const start = normalizeTime(quickAddStartTime);
    const end = normalizeTime(quickAddEndTime);

    if (getDurationMinutes(start, end) !== SLOT_DURATION_MINUTES) {
      alert(`Each slot must be exactly ${SLOT_DURATION_MINUTES} minutes.`);
      return;
    }

    if (timeToMinutes(start) < timeToMinutes(DAY_START)) {
      alert(`Slots can start only from ${DAY_START}.`);
      return;
    }

    if (timeToMinutes(end) > timeToMinutes(DAY_END)) {
      alert(`Slots cannot go beyond ${DAY_END}.`);
      return;
    }

    const exactDuplicate = selectedDateAllSlots.some(
      (slot) => slot.startTime === start && slot.endTime === end
    );

    if (exactDuplicate) {
      alert('This exact slot already exists for the selected date.');
      return;
    }

    if (hasSlotConflict(selectedDateAllSlots, start, end)) {
      alert('This time overlaps with another slot on the selected date.');
      return;
    }

    if (!validQuickAddStartTimes.includes(start.slice(0, 5))) {
      alert(`Invalid time. There must be a ${BREAK_MINUTES}-minute break between slots.`);
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
      alert('Slot added successfully.');
    } catch (err) {
      alert(err.message || 'Failed to add slot.');
    } finally {
      setAddingSlot(false);
    }
  }

  const pageStyles = {
    minHeight: '100vh',
    background: '#f3f4f6',
    fontFamily: 'Arial, sans-serif',
    color: '#0f172a',
  };

  const topBarStyles = {
    background: 'linear-gradient(90deg, #7c3aed, #db2777)',
    color: '#fff',
    padding: '22px 32px 28px',
    borderBottomLeftRadius: '28px',
    borderBottomRightRadius: '28px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  };

  const innerContainer = {
    maxWidth: '1400px',
    margin: '0 auto',
  };

  const navRow = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
  };

  const buttonBase = {
    border: 'none',
    borderRadius: '14px',
    padding: '12px 18px',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
  };

  const whiteGlassButton = {
    ...buttonBase,
    background: 'rgba(255,255,255,0.16)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.22)',
  };

  const statsGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginTop: '26px',
  };

  const statCard = {
    background: '#fff',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.05)',
  };

  const contentGrid = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    marginTop: '24px',
    alignItems: 'start',
  };

  const panelCard = {
    background: '#fff',
    borderRadius: '24px',
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.05)',
    overflow: 'hidden',
  };

  const panelHeader = {
    padding: '22px 24px',
    borderBottom: '1px solid #e5e7eb',
  };

  const panelBody = {
    padding: '22px 24px',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff',
  };

  const selectedDateStatus = getStatus(selectedDateKey);
  const selectedDateStatusStyle = getStatusColors(selectedDateStatus);
  const usedSlotsForDay = selectedDateAllSlots.length;
  const remainingSlotsForDay = Math.max(MAX_SLOTS_PER_DAY - usedSlotsForDay, 0);

  const capacityCardGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  };

  const capacityBaseCard = {
    borderRadius: '18px',
    padding: '16px',
    border: '1px solid',
    boxShadow: '0 8px 18px rgba(15, 23, 42, 0.05)',
  };

  return (
    <div style={pageStyles}>
      <div style={topBarStyles}>
        <div style={innerContainer}>
          <div style={navRow}>
            <div>
              <h1 style={{ margin: 0, fontSize: '30px', fontWeight: 800 }}>
                Slot Calendar View
              </h1>
              <p style={{ margin: '8px 0 0', opacity: 0.9 }}>
                View and manage lecturer availability by date
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                style={whiteGlassButton}
                onClick={() => navigate('/lecturer/slots')}
              >
                ← Back to Slots
              </button>

              <button
                type="button"
                style={whiteGlassButton}
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...innerContainer, padding: '24px' }}>
        <div style={statsGrid}>
          <div style={statCard}>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
              Total Slots
            </div>
            <div style={{ fontSize: '34px', fontWeight: 800 }}>{totalSlots}</div>
          </div>

          <div style={statCard}>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
              This Month
            </div>
            <div style={{ fontSize: '34px', fontWeight: 800 }}>{thisMonthSlots}</div>
          </div>

          <div style={statCard}>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
              Today&apos;s Slots
            </div>
            <div style={{ fontSize: '34px', fontWeight: 800 }}>{todaySlots}</div>
          </div>

          <div style={statCard}>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
              Upcoming Slots
            </div>
            <div style={{ fontSize: '34px', fontWeight: 800 }}>{upcomingSlots}</div>
          </div>
        </div>

        <div style={contentGrid}>
          <div style={panelCard}>
            <div style={panelHeader}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <h2 style={{ margin: 0, fontSize: '20px' }}>{monthLabel}</h2>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={{ ...buttonBase, background: '#ede9fe', color: '#6d28d9' }}
                    onClick={goToPreviousMonth}
                  >
                    ← Prev
                  </button>

                  <button
                    type="button"
                    style={{ ...buttonBase, background: '#ede9fe', color: '#6d28d9' }}
                    onClick={goToToday}
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    style={{ ...buttonBase, background: '#ede9fe', color: '#6d28d9' }}
                    onClick={goToNextMonth}
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
                {['All', 'Today', 'Upcoming', 'Past'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    style={{
                      ...buttonBase,
                      padding: '10px 16px',
                      background: filter === item ? '#8b5cf6' : '#f3f4f6',
                      color: filter === item ? '#fff' : '#475569',
                      boxShadow: filter === item ? '0 8px 18px rgba(139, 92, 246, 0.25)' : 'none',
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                  marginTop: '18px',
                  fontSize: '13px',
                  color: '#475569',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', padding: '8px 12px', borderRadius: '999px', border: '1px solid #bfdbfe' }}>
                  <span style={{ width: 14, height: 14, borderRadius: 999, background: '#2563eb', display: 'inline-block' }} />
                  Today
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', padding: '8px 12px', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
                  <span style={{ width: 14, height: 14, borderRadius: 999, background: '#16a34a', display: 'inline-block' }} />
                  Upcoming
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 12px', borderRadius: '999px', border: '1px solid #cbd5e1' }}>
                  <span style={{ width: 14, height: 14, borderRadius: 999, background: '#64748b', display: 'inline-block' }} />
                  Past
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#faf5ff', padding: '8px 12px', borderRadius: '999px', border: '1px solid #d8b4fe' }}>
                  <span style={{ width: 14, height: 14, borderRadius: 999, background: '#8b5cf6', display: 'inline-block' }} />
                  Selected
                </div>
              </div>
            </div>

            <div style={panelBody}>
              {loading ? (
                <p style={{ margin: 0 }}>Loading calendar...</p>
              ) : error ? (
                <p style={{ margin: 0, color: '#dc2626' }}>{error}</p>
              ) : (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '10px',
                      marginBottom: '12px',
                    }}
                  >
                    {dayNames.map((day) => (
                      <div
                        key={day}
                        style={{
                          textAlign: 'center',
                          fontWeight: 700,
                          color: '#64748b',
                          padding: '10px 0',
                        }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '10px',
                    }}
                  >
                    {calendarDays.map((dateObj, index) => {
                      if (!dateObj) {
                        return (
                          <div
                            key={`empty-${index}`}
                            style={{
                              minHeight: '130px',
                              background: '#f8fafc',
                              borderRadius: '18px',
                            }}
                          />
                        );
                      }

                      const key = dateToKey(dateObj);
                      const daySlots = slotsByDate[key] || [];
                      const isToday = key === todayKey;
                      const isSelected = isSameDate(dateObj, selectedDate);

                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => openDateModal(dateObj)}
                          style={{
                            minHeight: '130px',
                            borderRadius: '18px',
                            border: isSelected
                              ? '2px solid #8b5cf6'
                              : isToday
                              ? '2px solid #93c5fd'
                              : '1px solid #e5e7eb',
                            background: isSelected
                              ? 'linear-gradient(180deg, #faf5ff 0%, #ffffff 100%)'
                              : isToday
                              ? 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)'
                              : '#fff',
                            textAlign: 'left',
                            padding: '12px',
                            cursor: 'pointer',
                            boxShadow: isSelected
                              ? '0 10px 20px rgba(139, 92, 246, 0.12)'
                              : isToday
                              ? '0 8px 16px rgba(37, 99, 235, 0.10)'
                              : 'none',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '10px',
                            }}
                          >
                            <span style={{ fontWeight: 800, color: '#0f172a' }}>
                              {dateObj.getDate()}
                            </span>

                            {isSelected ? (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: '#ede9fe',
                                  color: '#6d28d9',
                                  padding: '4px 8px',
                                  borderRadius: '999px',
                                  border: '1px solid #d8b4fe',
                                }}
                              >
                                Selected
                              </span>
                            ) : isToday ? (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: '#dbeafe',
                                  color: '#1d4ed8',
                                  padding: '4px 8px',
                                  borderRadius: '999px',
                                  border: '1px solid #93c5fd',
                                }}
                              >
                                Today
                              </span>
                            ) : null}
                          </div>

                          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>
                            {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {daySlots.slice(0, 2).map((slot) => {
                              const status = getStatus(slot.slotDate);
                              const statusStyles = getStatusColors(status);

                              return (
                                <div
                                  key={slot.id}
                                  style={{
                                    background: '#f8fafc',
                                    borderRadius: '10px',
                                    padding: '6px 8px',
                                    border: '1px solid #e2e8f0',
                                  }}
                                >
                                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                                    {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                                  </div>
                                  <div
                                    style={{
                                      marginTop: '4px',
                                      display: 'inline-block',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      padding: '3px 8px',
                                      borderRadius: '999px',
                                      ...statusStyles,
                                    }}
                                  >
                                    {status}
                                  </div>
                                </div>
                              );
                            })}

                            {daySlots.length > 2 && (
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed' }}>
                                +{daySlots.length - 2} more
                              </div>
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

          <div style={panelCard}>
            <div style={panelHeader}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Selected Date Details</h2>
            </div>

            <div style={panelBody}>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '6px' }}>
                  Date
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800 }}>
                  {selectedDate.toDateString()}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    ...selectedDateStatusStyle,
                  }}
                >
                  {selectedDateStatus}
                </span>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '6px' }}>
                  Lecturer
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>
                  {currentUser?.name || 'Lecturer'}
                </div>
              </div>

              <div style={capacityCardGrid}>
                <div
                  style={{
                    ...capacityBaseCard,
                    background: 'linear-gradient(180deg, #ede9fe 0%, #faf5ff 100%)',
                    borderColor: '#d8b4fe',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6d28d9', fontWeight: 700, marginBottom: '8px' }}>
                    Daily Limit
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#581c87' }}>
                    {MAX_SLOTS_PER_DAY}
                  </div>
                </div>

                <div
                  style={{
                    ...capacityBaseCard,
                    background: 'linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%)',
                    borderColor: '#93c5fd',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 700, marginBottom: '8px' }}>
                    Used Slots
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#1e3a8a' }}>
                    {usedSlotsForDay}
                  </div>
                </div>

                <div
                  style={{
                    ...capacityBaseCard,
                    background: 'linear-gradient(180deg, #dcfce7 0%, #f0fdf4 100%)',
                    borderColor: '#86efac',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 700, marginBottom: '8px' }}>
                    Remaining
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#166534' }}>
                    {remainingSlotsForDay}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginBottom: '20px',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: 700 }}>
                  Daily Capacity Overview
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '12px',
                    background: '#e2e8f0',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      width: `${(usedSlotsForDay / MAX_SLOTS_PER_DAY) * 100}%`,
                      height: '100%',
                      background: usedSlotsForDay >= MAX_SLOTS_PER_DAY ? '#ef4444' : '#8b5cf6',
                      borderRadius: '999px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div style={{ fontSize: '13px', color: '#475569' }}>
                  {usedSlotsForDay} of {MAX_SLOTS_PER_DAY} daily slots used
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '18px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: '12px' }}>This Week Summary</div>
                <div style={{ display: 'grid', gap: '8px', color: '#475569' }}>
                  <div>Total weekly slots: <strong>{thisWeekSlots.length}</strong></div>
                  <div>Today in this week: <strong>{thisWeekTodaySlots}</strong></div>
                  <div>Upcoming in this week: <strong>{thisWeekUpcomingSlots}</strong></div>
                </div>
              </div>

              <div
                style={{
                  background: '#faf5ff',
                  borderRadius: '18px',
                  padding: '16px',
                  marginBottom: '20px',
                  border: '1px solid #e9d5ff',
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: '12px', color: '#6b21a8' }}>
                  Quick Add Slot
                </div>

                <div
                  style={{
                    marginBottom: '12px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    color: '#475569',
                    lineHeight: 1.6,
                  }}
                >
                  <div><strong>Allowed hours:</strong> {DAY_START} - {DAY_END}</div>
                  <div><strong>Slot duration:</strong> {SLOT_DURATION_MINUTES} mins</div>
                  <div><strong>Minimum break:</strong> {BREAK_MINUTES} mins</div>
                  <div><strong>Maximum slots per day:</strong> {MAX_SLOTS_PER_DAY}</div>
                  <div><strong>Remaining slots for this date:</strong> {remainingSlotsForDay}</div>
                </div>

                {isPastDate(selectedDateKey) && (
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: '#fff7ed',
                      color: '#c2410c',
                      border: '1px solid #fdba74',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    You cannot add new slots to a past date.
                  </div>
                )}

                {selectedDateAllSlots.length >= MAX_SLOTS_PER_DAY && !isPastDate(selectedDateKey) && (
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: '#fef2f2',
                      color: '#b91c1c',
                      border: '1px solid #fecaca',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Maximum slots reached for this date.
                  </div>
                )}

                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '13px',
                        color: '#64748b',
                      }}
                    >
                      Start Time
                    </label>
                    <select
                      value={quickAddStartTime}
                      onChange={(e) => handleQuickAddStartTimeChange(e.target.value)}
                      style={inputStyle}
                      disabled={isPastDate(selectedDateKey) || selectedDateAllSlots.length >= MAX_SLOTS_PER_DAY}
                    >
                      <option value="">Select valid time</option>
                      {validQuickAddStartTimes.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '13px',
                        color: '#64748b',
                      }}
                    >
                      End Time
                    </label>
                    <input
                      type="time"
                      value={quickAddEndTime}
                      readOnly
                      style={{ ...inputStyle, background: '#f8fafc' }}
                    />
                  </div>

                  {quickAddStartTime && quickAddEndTime && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px',
                        color: '#475569',
                      }}
                    >
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
                      selectedDateAllSlots.length >= MAX_SLOTS_PER_DAY
                    }
                    style={{
                      ...buttonBase,
                      background:
                        addingSlot ||
                        isPastDate(selectedDateKey) ||
                        selectedDateAllSlots.length >= MAX_SLOTS_PER_DAY
                          ? '#c4b5fd'
                          : '#8b5cf6',
                      color: '#fff',
                      width: '100%',
                    }}
                  >
                    {addingSlot ? 'Adding...' : 'Add Slot for Selected Date'}
                  </button>
                </div>
              </div>

              {selectedDateSlots.length === 0 ? (
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '18px',
                    padding: '18px',
                    color: '#64748b',
                    lineHeight: 1.6,
                  }}
                >
                  No slots available for this date.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {selectedDateSlots.map((slot) => {
                    const status = getStatus(slot.slotDate);
                    const statusStyles = getStatusColors(status);
                    const duration = getDurationMinutes(slot.startTime, slot.endTime);

                    return (
                      <div
                        key={slot.id}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '18px',
                          padding: '16px',
                          background: '#fff',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '10px',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
                              {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                            </div>

                            <div style={{ color: '#64748b', marginBottom: '8px' }}>
                              Duration: {duration} mins
                            </div>

                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 700,
                                ...statusStyles,
                              }}
                            >
                              {status}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => openEditModal(slot)}
                              style={{
                                ...buttonBase,
                                background: '#ede9fe',
                                color: '#6d28d9',
                                padding: '10px 14px',
                              }}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(slot.id)}
                              style={{
                                ...buttonBase,
                                background: '#fee2e2',
                                color: '#dc2626',
                                padding: '10px 14px',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                style={{
                  marginTop: '20px',
                  background: '#eff6ff',
                  borderRadius: '18px',
                  padding: '16px',
                  color: '#1d4ed8',
                  lineHeight: 1.6,
                }}
              >
                Tip: The highlighted cards now clearly show daily limit, used slots, and remaining capacity for the selected date.
              </div>
            </div>
          </div>
        </div>
      </div>

      {dateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 999,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '22px' }}>Slot Details</h3>
                <p style={{ margin: '6px 0 0', color: '#64748b' }}>
                  {selectedDate.toDateString()}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDateModal}
                style={{
                  ...buttonBase,
                  background: '#f3f4f6',
                  color: '#475569',
                  padding: '10px 14px',
                }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={capacityCardGrid}>
                <div
                  style={{
                    ...capacityBaseCard,
                    background: 'linear-gradient(180deg, #ede9fe 0%, #faf5ff 100%)',
                    borderColor: '#d8b4fe',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6d28d9', fontWeight: 700, marginBottom: '8px' }}>
                    Daily Limit
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#581c87' }}>
                    {MAX_SLOTS_PER_DAY}
                  </div>
                </div>

                <div
                  style={{
                    ...capacityBaseCard,
                    background: 'linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%)',
                    borderColor: '#93c5fd',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 700, marginBottom: '8px' }}>
                    Used Slots
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#1e3a8a' }}>
                    {usedSlotsForDay}
                  </div>
                </div>

                <div
                  style={{
                    ...capacityBaseCard,
                    background: 'linear-gradient(180deg, #dcfce7 0%, #f0fdf4 100%)',
                    borderColor: '#86efac',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 700, marginBottom: '8px' }}>
                    Remaining
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#166534' }}>
                    {remainingSlotsForDay}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: '#faf5ff',
                  borderRadius: '18px',
                  padding: '16px',
                  marginBottom: '20px',
                  border: '1px solid #e9d5ff',
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: '12px', color: '#6b21a8' }}>
                  Quick Add Slot
                </div>

                <div
                  style={{
                    marginBottom: '12px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    color: '#475569',
                    lineHeight: 1.6,
                  }}
                >
                  <div><strong>Allowed hours:</strong> {DAY_START} - {DAY_END}</div>
                  <div><strong>Slot duration:</strong> {SLOT_DURATION_MINUTES} mins</div>
                  <div><strong>Minimum break:</strong> {BREAK_MINUTES} mins</div>
                  <div><strong>Maximum slots per day:</strong> {MAX_SLOTS_PER_DAY}</div>
                  <div><strong>Remaining slots for this date:</strong> {remainingSlotsForDay}</div>
                </div>

                {isPastDate(selectedDateKey) && (
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: '#fff7ed',
                      color: '#c2410c',
                      border: '1px solid #fdba74',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    You cannot add new slots to a past date.
                  </div>
                )}

                {selectedDateAllSlots.length >= MAX_SLOTS_PER_DAY && !isPastDate(selectedDateKey) && (
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: '#fef2f2',
                      color: '#b91c1c',
                      border: '1px solid #fecaca',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Maximum slots reached for this date.
                  </div>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    gap: '12px',
                  }}
                >
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>
                      Start Time
                    </label>
                    <select
                      value={quickAddStartTime}
                      onChange={(e) => handleQuickAddStartTimeChange(e.target.value)}
                      style={inputStyle}
                      disabled={isPastDate(selectedDateKey) || selectedDateAllSlots.length >= MAX_SLOTS_PER_DAY}
                    >
                      <option value="">Select valid time</option>
                      {validQuickAddStartTimes.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={quickAddEndTime}
                      readOnly
                      style={{ ...inputStyle, background: '#f8fafc' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'end' }}>
                    <button
                      type="button"
                      onClick={handleQuickAddSlot}
                      disabled={
                        addingSlot ||
                        isPastDate(selectedDateKey) ||
                        selectedDateAllSlots.length >= MAX_SLOTS_PER_DAY
                      }
                      style={{
                        ...buttonBase,
                        background:
                          addingSlot ||
                          isPastDate(selectedDateKey) ||
                          selectedDateAllSlots.length >= MAX_SLOTS_PER_DAY
                            ? '#c4b5fd'
                            : '#8b5cf6',
                        color: '#fff',
                        width: '100%',
                      }}
                    >
                      {addingSlot ? 'Adding...' : 'Add Slot'}
                    </button>
                  </div>
                </div>

                {quickAddStartTime && quickAddEndTime && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '13px',
                      color: '#475569',
                    }}
                  >
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
              </div>

              {selectedDateSlots.length === 0 ? (
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '18px',
                    padding: '18px',
                    color: '#64748b',
                    lineHeight: 1.6,
                  }}
                >
                  No slots available for this date.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {selectedDateSlots.map((slot) => {
                    const status = getStatus(slot.slotDate);
                    const statusStyles = getStatusColors(status);
                    const duration = getDurationMinutes(slot.startTime, slot.endTime);

                    return (
                      <div
                        key={slot.id}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '18px',
                          padding: '16px',
                          background: '#fff',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '10px',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
                              {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                            </div>

                            <div style={{ color: '#64748b', marginBottom: '8px' }}>
                              Duration: {duration} mins
                            </div>

                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 700,
                                ...statusStyles,
                              }}
                            >
                              {status}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => openEditModal(slot)}
                              style={{
                                ...buttonBase,
                                background: '#ede9fe',
                                color: '#6d28d9',
                                padding: '10px 14px',
                              }}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(slot.id)}
                              style={{
                                ...buttonBase,
                                background: '#fee2e2',
                                color: '#dc2626',
                                padding: '10px 14px',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#fff',
              borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '22px' }}>Edit Slot</h3>
            </div>

            <div style={{ padding: '24px', display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>
                  Start Time
                </label>
                <select
                  value={editStartTime}
                  onChange={(e) => handleEditStartTimeChange(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select valid time</option>
                  {validEditStartTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>
                  End Time
                </label>
                <input
                  type="time"
                  value={editEndTime}
                  readOnly
                  style={{ ...inputStyle, background: '#f8fafc' }}
                />
              </div>

              {editStartTime && editEndTime && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    color: '#475569',
                  }}
                >
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

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  color: '#475569',
                  lineHeight: 1.6,
                }}
              >
                <div><strong>Allowed hours:</strong> {DAY_START} - {DAY_END}</div>
                <div><strong>Fixed duration:</strong> {SLOT_DURATION_MINUTES} mins</div>
                <div><strong>Required break:</strong> {BREAK_MINUTES} mins</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{
                    ...buttonBase,
                    background: '#f3f4f6',
                    color: '#475569',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  style={{
                    ...buttonBase,
                    background: '#8b5cf6',
                    color: '#fff',
                  }}
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}