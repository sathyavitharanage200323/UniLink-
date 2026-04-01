import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Calendar, Clock, Save, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosInstance';
import './LecturerAvailabilityPage.css';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Generate 30-minute time slots from 8 AM to 6 PM
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour < 18; hour++) {
    for (let minute of [0, 30]) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      const startTime = `${h}:${m}`;
      const endHour = minute === 30 ? hour + 1 : hour;
      const endMinute = minute === 30 ? '00' : '30';
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute}`;
      
      const label = `${hour > 12 ? hour - 12 : hour}:${m.padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
      slots.push({ startTime, endTime, label });
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

/* ─── TimeSlotCell ───────────────────────────────────────────── */
function TimeSlotCell({ day, timeSlot, isAvailable, onToggle, disabled }) {
  return (
    <button
      className={`lap-cell${isAvailable ? ' lap-cell--available' : ' lap-cell--unavailable'}${disabled ? ' lap-cell--disabled' : ''}`}
      onClick={() => !disabled && onToggle(day, timeSlot)}
      disabled={disabled}
      title={`${DAY_LABELS[DAYS.indexOf(day)]} ${timeSlot.label}`}
    >
      <div className="lap-cell__indicator" />
    </button>
  );
}

/* ─── Main LecturerAvailabilityPage ──────────────────────────── */
export default function LecturerAvailabilityPage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) return;
    loadAvailability();
  }, [currentUser]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/availability/lecturer/${currentUser.id}`);
      const slots = response.data;
      
      // Convert to grid format
      const grid = {};
      DAYS.forEach(day => {
        grid[day] = {};
        TIME_SLOTS.forEach(ts => {
          grid[day][ts.startTime] = false;
        });
      });

      slots.forEach(slot => {
        const sTime = slot.startTime.length > 5 ? slot.startTime.substring(0, 5) : slot.startTime;
        if (grid[slot.dayOfWeek] && grid[slot.dayOfWeek][sTime] !== undefined) {
          grid[slot.dayOfWeek][sTime] = slot.available;
        }
      });

      setAvailability(grid);
    } catch (err) {
      console.error('Failed to load availability', err);
      // Initialize empty grid
      const grid = {};
      DAYS.forEach(day => {
        grid[day] = {};
        TIME_SLOTS.forEach(ts => {
          grid[day][ts.startTime] = false;
        });
      });
      setAvailability(grid);
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (day, timeSlot) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [timeSlot.startTime]: !prev[day][timeSlot.startTime]
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert grid to slot array
      const slots = [];
      DAYS.forEach(day => {
        TIME_SLOTS.forEach(ts => {
          if (availability[day]?.[ts.startTime] !== undefined) {
            slots.push({
              dayOfWeek: day,
              startTime: ts.startTime,
              endTime: ts.endTime,
              available: availability[day][ts.startTime]
            });
          }
        });
      });

      await api.post(`/availability/lecturer/${currentUser.id}`, slots);
      toast.success('Availability saved successfully!');
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save availability', err);
      toast.error('Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadAvailability();
    setHasChanges(false);
  };

  const handleSetAllAvailable = () => {
    const grid = {};
    DAYS.forEach(day => {
      grid[day] = {};
      TIME_SLOTS.forEach(ts => {
        grid[day][ts.startTime] = true;
      });
    });
    setAvailability(grid);
    setHasChanges(true);
  };

  const handleClearAll = () => {
    const grid = {};
    DAYS.forEach(day => {
      grid[day] = {};
      TIME_SLOTS.forEach(ts => {
        grid[day][ts.startTime] = false;
      });
    });
    setAvailability(grid);
    setHasChanges(true);
  };

  const availableCount = Object.values(availability).reduce((sum, day) => 
    sum + Object.values(day).filter(Boolean).length, 0
  );

  return (
    <div className="lap-page">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />

      <div className="lap-container">
        <button className="lap-back-btn" onClick={() => navigate('/lecturer/home')}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <div className="lap-header">
          <div>
            <h1 className="lap-title">
              <Calendar size={26} /> My Availability
            </h1>
            <p className="lap-subtitle">
              Click time blocks to toggle availability. Students can only book available slots.
            </p>
          </div>
          <div className="lap-stats-badge">
            <Clock size={18} />
            <div>
              <div className="lap-stats-badge__value">{availableCount}</div>
              <div className="lap-stats-badge__label">Available Slots</div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="lap-action-bar">
          <div className="lap-legend">
            <div className="lap-legend-item">
              <div className="lap-legend-box lap-legend-box--available" />
              <span>Available</span>
            </div>
            <div className="lap-legend-item">
              <div className="lap-legend-box lap-legend-box--unavailable" />
              <span>Unavailable</span>
            </div>
          </div>
          <div className="lap-actions">
            <button className="lap-btn lap-btn--outline" onClick={handleSetAllAvailable}>
              Set All Available
            </button>
            <button className="lap-btn lap-btn--outline" onClick={handleClearAll}>
              Clear All
            </button>
            <button className="lap-btn lap-btn--outline" onClick={handleReset} disabled={!hasChanges}>
              <RefreshCw size={14} /> Reset
            </button>
            <button 
              className="lap-btn lap-btn--primary" 
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? <><Loader2 size={14} className="lap-spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="lap-loading">
            <Loader2 size={40} className="lap-spin" />
            <p>Loading availability...</p>
          </div>
        ) : (
          <div className="lap-grid-wrapper">
            <div className="lap-grid">
              {/* Header row */}
              <div className="lap-grid__header">
                <div className="lap-grid__corner">Time</div>
                {DAY_LABELS.map(day => (
                  <div key={day} className="lap-grid__day-header">{day}</div>
                ))}
              </div>

              {/* Time rows */}
              {TIME_SLOTS.map(ts => (
                <div key={ts.startTime} className="lap-grid__row">
                  <div className="lap-grid__time-label">{ts.label}</div>
                  {DAYS.map(day => (
                    <TimeSlotCell
                      key={`${day}-${ts.startTime}`}
                      day={day}
                      timeSlot={ts}
                      isAvailable={availability[day]?.[ts.startTime] || false}
                      onToggle={toggleSlot}
                      disabled={loading || saving}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasChanges && (
          <div className="lap-save-reminder">
            <CheckCircle size={16} />
            You have unsaved changes. Click "Save Changes" to update your availability.
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
