import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Calendar, Clock, Save, RefreshCw,
  Loader2, CheckCircle, AlertCircle, Globe,
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosInstance';
import { BACKEND_BASE_URL } from '../config';
import './LecturerAvailabilityPage.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS       = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
const DAY_SHORT  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_FULL   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const TIMEZONES = [
  { label: 'Sri Lanka (UTC+5:30)', value: 'Asia/Colombo' },
  { label: 'India (UTC+5:30)',     value: 'Asia/Kolkata'  },
  { label: 'UTC',                  value: 'UTC'           },
  { label: 'London',               value: 'Europe/London' },
  { label: 'New York',             value: 'America/New_York' },
];

const generateTimeSlots = () => {
  const slots = [];
  for (let h = 8; h < 18; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2,'0');
      const mm = String(m).padStart(2,'0');
      const endH = m === 30 ? h + 1 : h;
      const endM = m === 30 ? '00' : '30';
      slots.push({
        startTime: `${hh}:${mm}`,
        endTime:   `${String(endH).padStart(2,'0')}:${endM}`,
        label:     `${h > 12 ? h - 12 : h}:${mm} ${h >= 12 ? 'PM' : 'AM'}`,
      });
    }
  }
  return slots;
};
const TIME_SLOTS = generateTimeSlots();

function fmtTz(timeStr, tz) {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true, timeZone: tz });
  } catch { return timeStr; }
}

function emptyGrid() {
  const g = {};
  DAYS.forEach(day => { g[day] = {}; TIME_SLOTS.forEach(ts => { g[day][ts.startTime] = false; }); });
  return g;
}

/** Convert API slot array → { grid, conflicts } */
function parseSlots(slots) {
  const grid = emptyGrid();
  const conflicts = {};
  (slots || []).forEach(slot => {
    // Backend returns dayOfWeek directly on weekly slots
    const day = slot.dayOfWeek;
    const st  = slot.startTime ? slot.startTime.substring(0, 5) : null; // "HH:mm:ss" → "HH:mm"
    if (!day || !st || grid[day] === undefined) return;
    // available field is set by DTO.from() as status === AVAILABLE
    grid[day][st] = slot.available === true || slot.status === 'AVAILABLE';
    if (slot.hasConflict) conflicts[`${day}|${st}`] = true;
  });
  return { grid, conflicts };
}

// ── Cell component ────────────────────────────────────────────────────────────
function SlotCell({ day, ts, isAvailable, hasConflict, onToggle, onDragStart, onDragEnter, disabled, tz }) {
  const title = `${DAY_FULL[DAYS.indexOf(day)]} ${fmtTz(ts.startTime, tz)}${hasConflict ? ' — has appointment' : ''}`;
  let cls = 'lap-cell';
  if (hasConflict)      cls += ' lap-cell--conflict';
  else if (isAvailable) cls += ' lap-cell--available';
  else                  cls += ' lap-cell--unavailable';
  if (disabled)         cls += ' lap-cell--disabled';

  return (
    <button
      className={cls}
      onClick={() => !disabled && !hasConflict && onToggle(day, ts)}
      onMouseDown={e => { e.preventDefault(); if (!disabled && !hasConflict) onDragStart(day, ts); }}
      onMouseEnter={() => { if (!disabled && !hasConflict) onDragEnter(day, ts); }}
      title={title}
      aria-label={title}
      aria-pressed={isAvailable}
    >
      <div className="lap-cell__dot" />
      {hasConflict && <div className="lap-cell__conflict-dot" />}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LecturerAvailabilityPage({ currentUser, onLogout }) {
  const navigate = useNavigate();

  const [grid,       setGrid]       = useState(emptyGrid);
  const [conflicts,  setConflicts]  = useState({});
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [tz,         setTz]         = useState('Asia/Colombo');
  const [wsStatus,   setWsStatus]   = useState('connecting'); // connecting | live | offline

  // Drag-to-select
  const isDragging  = useRef(false);
  const dragValue   = useRef(null);
  // Track whether we have unsaved changes (ref mirrors state for WS handler)
  const hasChangesRef = useRef(false);
  hasChangesRef.current = hasChanges;

  // ── Load from API ───────────────────────────────────────────────────────────
  const loadAvailability = useCallback(async (silent = false) => {
    if (!currentUser?.id) return;
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/availability/lecturer/${currentUser.id}`);
      const { grid: g, conflicts: c } = parseSlots(res.data);
      setGrid(g);
      setConflicts(c);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to load availability', err);
      if (!silent) toast.error('Failed to load availability');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => { loadAvailability(); }, [loadAvailability]);

  // ── WebSocket real-time sync ────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;
    let client;
    try {
      client = new Client({
        webSocketFactory: () => new SockJS(`${BACKEND_BASE_URL}/ws`),
        reconnectDelay: 5000,
        onConnect: () => {
          setWsStatus('live');
          client.subscribe(`/topic/availability/${currentUser.id}`, frame => {
            try {
              const slots = JSON.parse(frame.body);
              const { grid: g, conflicts: c } = parseSlots(slots);
              // Only apply WS update if no unsaved local changes
              if (!hasChangesRef.current) {
                setGrid(g);
                setConflicts(c);
              } else {
                // Still update conflict markers even with unsaved changes
                setConflicts(c);
              }
            } catch (e) { console.error('WS parse error', e); }
          });
        },
        onDisconnect:    () => setWsStatus('offline'),
        onWebSocketClose: () => setWsStatus('offline'),
        onStompError:    () => setWsStatus('offline'),
      });
      client.activate();
    } catch (e) {
      setWsStatus('offline');
    }
    return () => { try { client?.deactivate(); } catch {} };
  }, [currentUser?.id]);

  // ── Toggle single cell ──────────────────────────────────────────────────────
  const toggleSlot = useCallback((day, ts) => {
    setGrid(prev => ({ ...prev, [day]: { ...prev[day], [ts.startTime]: !prev[day][ts.startTime] } }));
    setHasChanges(true);
  }, []);

  // ── Drag-to-select ──────────────────────────────────────────────────────────
  const handleDragStart = useCallback((day, ts) => {
    isDragging.current = true;
    dragValue.current  = !grid[day]?.[ts.startTime]; // paint opposite of current
    setGrid(prev => ({ ...prev, [day]: { ...prev[day], [ts.startTime]: dragValue.current } }));
    setHasChanges(true);
  }, [grid]);

  const handleDragEnter = useCallback((day, ts) => {
    if (!isDragging.current) return;
    setGrid(prev => ({ ...prev, [day]: { ...prev[day], [ts.startTime]: dragValue.current } }));
    setHasChanges(true);
  }, []);

  useEffect(() => {
    const stop = () => { isDragging.current = false; dragValue.current = null; };
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = [];
      DAYS.forEach(day => {
        TIME_SLOTS.forEach(ts => {
          payload.push({
            dayOfWeek: day,
            startTime: ts.startTime,
            endTime:   ts.endTime,
            available: grid[day]?.[ts.startTime] === true,
          });
        });
      });
      await api.post(`/availability/lecturer/${currentUser.id}/weekly`, payload);
      toast.success('Availability saved!');
      setHasChanges(false);
      // Reload to sync conflict markers from server
      await loadAvailability(true);
    } catch (err) {
      console.error('Save failed', err);
      toast.error(err?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset  = () => { loadAvailability(); };
  const handleSetAll = (val) => {
    const g = emptyGrid();
    DAYS.forEach(day => TIME_SLOTS.forEach(ts => { g[day][ts.startTime] = val; }));
    setGrid(g);
    setHasChanges(true);
  };

  const availableCount = Object.values(grid).reduce((s, day) => s + Object.values(day).filter(Boolean).length, 0);
  const conflictCount  = Object.keys(conflicts).length;

  return (
    <div className="lap-page">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />

      <div className="lap-container">
        <button className="lap-back-btn" onClick={() => navigate('/lecturer/home')}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        {/* ── Header ── */}
        <div className="lap-header">
          <div className="lap-header__text">
            <h1 className="lap-title"><Calendar size={24} /> My Weekly Availability</h1>
            <p className="lap-subtitle">Click or drag cells to toggle. Students only see available slots.</p>
          </div>
          <div className="lap-header__right">
            {/* Timezone */}
            <div className="lap-tz">
              <Globe size={13} />
              <select value={tz} onChange={e => setTz(e.target.value)} aria-label="Timezone">
                {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {/* Stats */}
            <div className="lap-badge">
              <Clock size={16} />
              <span className="lap-badge__val">{availableCount}</span>
              <span className="lap-badge__lbl">Available</span>
            </div>
            {conflictCount > 0 && (
              <div className="lap-badge lap-badge--warn">
                <AlertCircle size={16} />
                <span className="lap-badge__val">{conflictCount}</span>
                <span className="lap-badge__lbl">Conflicts</span>
              </div>
            )}
            {/* WS status */}
            <div className="lap-ws">
              <span className={`lap-ws__dot lap-ws__dot--${wsStatus}`} />
              <span className="lap-ws__lbl">{wsStatus === 'live' ? 'Live' : wsStatus === 'connecting' ? 'Connecting…' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* ── Action bar ── */}
        <div className="lap-bar">
          <div className="lap-legend">
            <span className="lap-legend__item"><span className="lap-legend__box lap-legend__box--on" />Available</span>
            <span className="lap-legend__item"><span className="lap-legend__box lap-legend__box--off" />Unavailable</span>
            <span className="lap-legend__item"><span className="lap-legend__box lap-legend__box--conflict" />Has appointment</span>
          </div>
          <div className="lap-actions">
            <button className="lap-btn lap-btn--ghost" onClick={() => handleSetAll(true)}>Set All</button>
            <button className="lap-btn lap-btn--ghost" onClick={() => handleSetAll(false)}>Clear All</button>
            <button className="lap-btn lap-btn--ghost" onClick={handleReset} disabled={saving}>
              <RefreshCw size={13} /> Reset
            </button>
            <button className="lap-btn lap-btn--primary" onClick={handleSave} disabled={!hasChanges || saving}>
              {saving
                ? <><Loader2 size={13} className="lap-spin" /> Saving…</>
                : <><Save size={13} /> Save Changes</>}
            </button>
          </div>
        </div>

        {/* ── Conflict banner ── */}
        {conflictCount > 0 && (
          <div className="lap-conflict-banner">
            <AlertCircle size={15} />
            {conflictCount} slot{conflictCount > 1 ? 's have' : ' has'} a confirmed appointment (shown in orange). Removing them won't cancel the appointment.
          </div>
        )}

        {/* ── Unsaved changes reminder ── */}
        {hasChanges && (
          <div className="lap-unsaved">
            <CheckCircle size={14} /> You have unsaved changes — click Save Changes to apply.
          </div>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div className="lap-loading"><Loader2 size={36} className="lap-spin" /><p>Loading…</p></div>
        ) : (
          <div className="lap-grid-wrap" onMouseLeave={() => { isDragging.current = false; }}>
            <div className="lap-grid">
              {/* Day headers */}
              <div className="lap-grid__row lap-grid__row--header">
                <div className="lap-grid__time-col">Time</div>
                {DAYS.map((d, i) => (
                  <div key={d} className="lap-grid__day-col" title={DAY_FULL[i]}>{DAY_SHORT[i]}</div>
                ))}
              </div>
              {/* Time rows */}
              {TIME_SLOTS.map(ts => (
                <div key={ts.startTime} className="lap-grid__row">
                  <div className="lap-grid__time-col">
                    <span className="lap-time__local">{ts.label}</span>
                    {tz !== 'Asia/Colombo' && (
                      <span className="lap-time__tz">{fmtTz(ts.startTime, tz)}</span>
                    )}
                  </div>
                  {DAYS.map(day => (
                    <div key={day} className="lap-grid__day-col">
                      <SlotCell
                        day={day} ts={ts}
                        isAvailable={grid[day]?.[ts.startTime] === true}
                        hasConflict={!!conflicts[`${day}|${ts.startTime}`]}
                        onToggle={toggleSlot}
                        onDragStart={handleDragStart}
                        onDragEnter={handleDragEnter}
                        disabled={loading || saving}
                        tz={tz}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
