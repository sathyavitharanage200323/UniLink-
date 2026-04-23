import React, { useEffect, useMemo, useState } from 'react';
import './LecturerPreferencesPage.css';
import {
  getLecturerPreferences,
  saveLecturerPreferences,
} from '../api/lecturerPreferencesApi';

const DEFAULT_PREFERENCES = {
  lecturerId: 1,
  slotDuration: 30,
  breakTime: 15,
  workStartTime: '09:00',
  workEndTime: '21:00',
  maxSlotsPerDay: 12,
  preferredMode: 'BOTH',
};

function timeToMinutes(time) {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(mins) {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

export default function LecturerPreferencesPage({ currentUser }) {
  const lecturerId = currentUser?.id || 1;

  const [preferences, setPreferences] = useState({
    ...DEFAULT_PREFERENCES,
    lecturerId,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // auto hide message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    loadPreferences();
  }, [lecturerId]);

  async function loadPreferences() {
    try {
      setLoading(true);
      const data = await getLecturerPreferences(lecturerId);

      setPreferences({
        lecturerId: data?.lecturerId ?? lecturerId,
        slotDuration: Number(data?.slotDuration ?? 30),
        breakTime: Number(data?.breakTime ?? 15),
        workStartTime: data?.workStartTime?.slice(0, 5) ?? '09:00',
        workEndTime: data?.workEndTime?.slice(0, 5) ?? '21:00',
        maxSlotsPerDay: Number(data?.maxSlotsPerDay ?? 12),
        preferredMode: data?.preferredMode ?? 'BOTH',
      });

      setMessage({ type: 'success', text: 'Preferences loaded' });
    } catch {
      setMessage({ type: 'error', text: 'Load failed' });
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function validate() {
    if (timeToMinutes(preferences.workEndTime) <= timeToMinutes(preferences.workStartTime)) {
      return 'End time must be greater than start time';
    }
    return null;
  }

  async function handleSave() {
    const error = validate();
    if (error) return setMessage({ type: 'error', text: error });

    try {
      setSaving(true);

      const payload = {
        ...preferences,
        lecturerId,
        slotDuration: Number(preferences.slotDuration),
        breakTime: Number(preferences.breakTime),
        maxSlotsPerDay: Number(preferences.maxSlotsPerDay),
      };

      await saveLecturerPreferences(payload);

      setMessage({ type: 'success', text: 'Preferences saved successfully ✔' });
    } catch {
      setMessage({ type: 'error', text: 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setPreferences({ ...DEFAULT_PREFERENCES, lecturerId });
    setMessage({ type: 'success', text: 'Reset done' });
  }

  const previewSlots = useMemo(() => {
    const slots = [];

    let current = timeToMinutes(preferences.workStartTime);
    const end = timeToMinutes(preferences.workEndTime);

    const duration = Number(preferences.slotDuration);
    const breakTime = Number(preferences.breakTime);
    const max = Number(preferences.maxSlotsPerDay);

    while (current + duration <= end && slots.length < max) {
      const start = current;
      const finish = start + duration;

      slots.push({
        startTime: formatTime(start),
        endTime: formatTime(finish),
      });

      current = finish + breakTime;
    }

    return slots;
  }, [preferences]);

  return (
    <div className="prefV2-page">

      <div className="prefV2-hero">
        <h1>Lecturer Preferences</h1>
        <p>Configure scheduling rules</p>

        <div className="buttonGroup">
          <button className="navBtn" onClick={() => window.history.back()}>
            ← Back
          </button>

          <button className="navBtn" onClick={loadPreferences}>
            ↻ Reload
          </button>
        </div>
      </div>

      <div className="prefV2-grid">

        {/* FORM */}
        <div className="prefV2-card scroll">

          <h2>Settings</h2>

          <label>Slot Duration</label>
          <select name="slotDuration" value={preferences.slotDuration} onChange={handleChange}>
            <option value={30}>30 Minutes</option>
            <option value={45}>45 Minutes</option>
            <option value={60}>60 Minutes</option>
          </select>

          <label>Break Time</label>
          <select name="breakTime" value={preferences.breakTime} onChange={handleChange}>
            <option value={0}>No Break</option>
            <option value={10}>10 Minutes</option>
            <option value={15}>15 Minutes</option>
            <option value={30}>30 Minutes</option>
          </select>

          <label>Start Time</label>
          <input type="time" name="workStartTime" value={preferences.workStartTime} onChange={handleChange} />

          <label>End Time</label>
          <input type="time" name="workEndTime" value={preferences.workEndTime} onChange={handleChange} />

          <label>Max Slots Per Day</label>
          <input type="number" name="maxSlotsPerDay" value={preferences.maxSlotsPerDay} onChange={handleChange} />

          <button className="saveBtn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>

          <button className="secondaryBtn" onClick={handleReset}>
            Reset
          </button>

          {message && (
            <div className={`infoBox ${message.type === 'error' ? 'errorBox' : 'successBox'}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* PREVIEW */}
        <div className="prefV2-card scroll">

          <h2>Live Preview</h2>

          <div className="infoBox">
            Total Slots: {previewSlots.length} / Max Allowed: {preferences.maxSlotsPerDay}
          </div>

          {previewSlots.map((slot, i) => (
            <div className="slotCard" key={i}>
              <div className="time">
                {slot.startTime} - {slot.endTime}
              </div>
              <div className="meta">
                Duration {preferences.slotDuration} mins + Break {preferences.breakTime} mins
              </div>
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}