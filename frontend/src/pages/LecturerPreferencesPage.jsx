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

function formatTimeAmPm(time) {
  if (!time) return '--';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;

  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const period = h >= 12 ? 'p.m.' : 'a.m.';
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function calculateMaxSlotsPerDay({ workStartTime, workEndTime, slotDuration, breakTime }) {
  const start = timeToMinutes(workStartTime);
  const end = timeToMinutes(workEndTime);
  const duration = Number(slotDuration);
  const gap = Number(breakTime);

  if (duration <= 0 || gap < 0 || end <= start) {
    return 0;
  }

  let count = 0;
  let current = start;
  const maxIterations = 1000;

  while (current + duration <= end && count < maxIterations) {
    count += 1;
    current += duration + gap;
  }

  return count;
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
    if (autoMaxSlots <= 0) {
      return 'No valid slots can be generated with the selected start/end time and duration';
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
        maxSlotsPerDay: autoMaxSlots,
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

  const autoMaxSlots = useMemo(() => {
    return calculateMaxSlotsPerDay({
      workStartTime: preferences.workStartTime,
      workEndTime: preferences.workEndTime,
      slotDuration: preferences.slotDuration,
      breakTime: preferences.breakTime,
    });
  }, [
    preferences.workStartTime,
    preferences.workEndTime,
    preferences.slotDuration,
    preferences.breakTime,
  ]);

  const previewSlots = useMemo(() => {
    const slots = [];

    let current = timeToMinutes(preferences.workStartTime);
    const end = timeToMinutes(preferences.workEndTime);

    const duration = Number(preferences.slotDuration);
    const breakTime = Number(preferences.breakTime);
    const max = autoMaxSlots;

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
  }, [preferences, autoMaxSlots]);

  const availableMinutes = Math.max(
    timeToMinutes(preferences.workEndTime) - timeToMinutes(preferences.workStartTime),
    0
  );
  const availableHours = Math.floor(availableMinutes / 60);
  const availableRemainingMinutes = availableMinutes % 60;

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
            <option value={10}>10 Minutes</option>
            <option value={15}>15 Minutes</option>
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

          <label>Max Slots Per Day (Auto)</label>
          <input type="number" value={autoMaxSlots} readOnly title="Automatically calculated from Start Time and End Time" />

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
            Full Available Time:{' '}
            <strong>
              {formatTimeAmPm(preferences.workStartTime)} - {formatTimeAmPm(preferences.workEndTime)}
            </strong>
            <br />
            Total Window: {availableHours}h {availableRemainingMinutes}m
          </div>

          <div className="infoBox">
            Total Slots: {previewSlots.length} / Max Allowed: {autoMaxSlots}
          </div>

          {previewSlots.length === 0 && (
            <div className="infoBox errorBox">
              No slots can be generated with the current time range and settings.
            </div>
          )}

          {previewSlots.map((slot, i) => (
            <div className="slotCard" key={i}>
              <div className="time">
                {formatTimeAmPm(slot.startTime)} - {formatTimeAmPm(slot.endTime)}
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