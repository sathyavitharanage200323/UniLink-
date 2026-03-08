import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, MessageSquare, Clock, Users,
  ChevronRight, ArrowRight, Settings,
  BellOff, Bell, Shield, CheckCircle,
  BookOpen, Star, FileText, Zap, GraduationCap,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LecturerHome.css';

/**
 * LecturerHome — dashboard for lecturers.
 *
 * Props:
 *   currentUser  – { id, name, role, department, expertise, doNotDisturb }
 *   appointments – array from App.js
 *   onLogout     – () => void
 */
export default function LecturerHome({ currentUser, appointments = [], onLogout }) {
  const navigate = useNavigate();
  const [dnd, setDnd] = useState(currentUser?.doNotDisturb ?? false);

  /* ── Derived appointment lists ── */
  const confirmedAppts = appointments.filter((a) => a.status === 'CONFIRMED');
  const pendingAppts   = appointments.filter((a) => a.status === 'PENDING');

  /* Merge with demo for display */
  const todaySchedule  = confirmedAppts.length > 0 ? confirmedAppts : DEMO_SCHEDULE;
  const studentThreads  = confirmedAppts.length > 0
    ? confirmedAppts.map((a) => ({
        id: a.id,
        name: a.student?.name ?? 'Student',
        dept: a.student?.department ?? '',
        lastMsg: 'Click to open the conversation',
        unread: 0,
        time: a.startTime,
        appointment: a,
      }))
    : DEMO_CHATS;
  const pendingRequests = pendingAppts.length > 0 ? pendingAppts : DEMO_PENDING;

  /* Stats */
  const stats = [
    { label: "Today's Students", value: todaySchedule.length,       icon: Users,           bg: '#faf5ff', color: '#7c3aed' },
    { label: 'Pending Requests', value: pendingRequests.length || 2, icon: Clock,           bg: '#fff7ed', color: '#ea580c' },
    { label: 'Active Chats',     value: studentThreads.length,       icon: MessageSquare,   bg: '#f0fdf4', color: '#16a34a' },
    { label: 'DND Status',       value: dnd ? 'ON' : 'OFF',           icon: dnd ? BellOff : Bell, bg: dnd ? '#fef9c3' : '#f8fafc', color: dnd ? '#a16207' : '#6b7280' },
  ];

  const initials = getInitials(currentUser?.name);

  return (
    <div className="lh-layout">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={studentThreads.filter((t) => t.unread > 0).length} />

      <main className="lh-main">

        {/* ─────────── HERO ─────────── */}
        <section className="lh-hero">
          <div className="lh-hero__inner">
            <div className="lh-hero__text">
              <div className="lh-hero__badge">
                <GraduationCap size={13} /> Lecturer Dashboard
              </div>
              <h1 className="lh-hero__name">{currentUser?.name}</h1>
              <p className="lh-hero__dept">
                {currentUser?.department ?? 'Information Technology'} Department
              </p>
              {currentUser?.expertise && (
                <p className="lh-hero__expertise">
                  Expertise: {currentUser.expertise}
                </p>
              )}
              <div className="lh-hero__actions">
                <button
                  className="lh-btn lh-btn--primary"
                  onClick={() => navigate('/appointments')}
                >
                  <Calendar size={16} /> View Schedule
                </button>
                <button
                  className="lh-btn lh-btn--outline"
                  onClick={() => navigate('/chat')}
                >
                  <MessageSquare size={16} /> Student Messages
                </button>
              </div>
            </div>

            <div className="lh-hero__visual">
              <div className="lh-hero__avatar-ring">{initials}</div>
              <div className="lh-hero__role-tag">
                <BookOpen size={13} /> Lecturer · {currentUser?.department ?? 'IT'}
              </div>
            </div>
          </div>
        </section>

        {/* ─────────── STATS ─────────── */}
        <section className="lh-stats">
          <div className="lh-stats__grid">
            {stats.map((s) => (
              <div className="lh-stat-card" key={s.label}>
                <div className="lh-stat-icon" style={{ background: s.bg, color: s.color }}>
                  <s.icon size={22} />
                </div>
                <div>
                  <div className="lh-stat-value">{s.value}</div>
                  <div className="lh-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DND banner */}
        {dnd && (
          <div className="lh-container">
            <div className="lh-dnd-banner">
              <BellOff size={16} />
              Do Not Disturb is active — students will receive your auto-reply message.
            </div>
          </div>
        )}

        {/* ─────────── CONTENT GRID ─────────── */}
        <div className="lh-content-grid">

          {/* ── Today's Schedule ── */}
          <section className="lh-card">
            <div className="lh-card__header">
              <h2><Calendar size={17} style={{ color: '#7c3aed' }} /> Today's Schedule</h2>
              <button className="lh-link-btn" onClick={() => navigate('/appointments')}>
                Full schedule <ChevronRight size={14} />
              </button>
            </div>
            <div className="lh-card__body">
              {todaySchedule.slice(0, 4).map((a) => {
                const t        = formatTime(a.startTime);
                const student  = a.student?.name ?? a.studentName ?? 'Student';
                const notes    = a.notes ?? 'Appointment';
                const status   = a.status ?? 'CONFIRMED';
                return (
                  <div className="lh-schedule-item" key={a.id}>
                    <div className="lh-schedule-time">
                      <span className="lh-time-hour">{t.hour}</span>
                      <span className="lh-time-ampm">{t.ampm}</span>
                    </div>
                    <div
                      className={`lh-schedule-dot lh-schedule-dot--${status.toLowerCase()}`}
                    />
                    <div className="lh-schedule-info">
                      <strong>{student}</strong>
                      <span>{notes}</span>
                    </div>
                    <span className={`lh-status lh-status--${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </div>
                );
              })}
              {todaySchedule.length === 0 && (
                <div className="lh-empty">
                  <Calendar size={38} />
                  <p>No appointments scheduled for today</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Student Chats ── */}
          <section className="lh-card">
            <div className="lh-card__header">
              <h2><MessageSquare size={17} style={{ color: '#7c3aed' }} /> Student Chats</h2>
              <button className="lh-link-btn" onClick={() => navigate('/chat')}>
                All chats <ChevronRight size={14} />
              </button>
            </div>
            <div className="lh-card__body">
              {studentThreads.map((t) => (
                <button
                  key={t.id}
                  className="lh-chat-item"
                  onClick={() => navigate('/chat')}
                >
                  <div className="lh-chat-avatar-wrap">
                    <div className="lh-chat-avatar">{getInitials(t.name)}</div>
                    {t.unread > 0 && (
                      <span className="lh-unread-badge">{t.unread}</span>
                    )}
                  </div>
                  <div className="lh-chat-info">
                    <div className="lh-chat-row1">
                      <strong>Chat with {t.name}</strong>
                      <span className="lh-chat-time">{fmtRelative(t.time)}</span>
                    </div>
                    <div className="lh-chat-preview">{t.lastMsg}</div>
                    {t.dept && (
                      <div className="lh-chat-dept">{t.dept} · Student</div>
                    )}
                  </div>
                  <ArrowRight size={15} className="lh-chat-arrow" />
                </button>
              ))}
              {studentThreads.length === 0 && (
                <div className="lh-empty">
                  <MessageSquare size={38} />
                  <p>No active student chats</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Pending Requests ── */}
          <section className="lh-card">
            <div className="lh-card__header">
              <h2><Clock size={17} style={{ color: '#ea580c' }} /> Pending Requests</h2>
              <button className="lh-link-btn" onClick={() => navigate('/appointments')}>
                View all <ChevronRight size={14} />
              </button>
            </div>
            <div className="lh-card__body">
              {pendingRequests.slice(0, 4).map((r) => {
                const student = r.student?.name ?? r.studentName ?? 'Student';
                return (
                  <div className="lh-request-item" key={r.id}>
                    <div className="lh-request-avatar">{getInitials(student)}</div>
                    <div className="lh-request-info">
                      <strong>{student}</strong>
                      <span>{r.notes ?? 'Appointment request'}</span>
                      <span style={{ fontSize: '0.72rem', color: '#7c3aed', marginTop: 2, display: 'block' }}>
                        {fmtDate(r.startTime)}
                      </span>
                    </div>
                    <div className="lh-request-actions">
                      <button className="lh-btn lh-btn--sm lh-btn--success">
                        <CheckCircle size={12} /> Accept
                      </button>
                      <button className="lh-btn lh-btn--sm lh-btn--danger">
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
              {pendingRequests.length === 0 && (
                <div className="lh-empty">
                  <CheckCircle size={38} />
                  <p>All caught up — no pending requests!</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Settings Panel ── */}
          <section className="lh-card">
            <div className="lh-card__header">
              <h2><Settings size={17} style={{ color: '#6b7280' }} /> Availability Settings</h2>
            </div>
            <div className="lh-card__body" style={{ padding: '8px 24px 16px' }}>

              {/* DND Toggle */}
              <div className="lh-dnd-row">
                <div className="lh-dnd-label">
                  <strong>🔕 Do Not Disturb</strong>
                  <span>Students will receive your auto-reply while DND is active</span>
                </div>
                <label className="lh-toggle">
                  <input
                    type="checkbox"
                    checked={dnd}
                    onChange={(e) => setDnd(e.target.checked)}
                  />
                  <div className={`lh-toggle-track ${dnd ? 'on' : ''}`}>
                    <div className="lh-toggle-thumb" />
                  </div>
                </label>
              </div>

              {/* Accept appointments */}
              <div className="lh-dnd-row">
                <div className="lh-dnd-label">
                  <strong>📅 Accept Appointments</strong>
                  <span>Automatically accept confirmed appointment requests</span>
                </div>
                <label className="lh-toggle">
                  <input type="checkbox" defaultChecked />
                  <div className="lh-toggle-track on">
                    <div className="lh-toggle-thumb" style={{ transform: 'translateX(20px)' }} />
                  </div>
                </label>
              </div>

              {/* Profanity filter */}
              <div className="lh-dnd-row">
                <div className="lh-dnd-label">
                  <strong>🛡️ Profanity Filter</strong>
                  <span>Automatically filter inappropriate language in chats</span>
                </div>
                <label className="lh-toggle">
                  <input type="checkbox" defaultChecked />
                  <div className="lh-toggle-track on">
                    <div className="lh-toggle-thumb" style={{ transform: 'translateX(20px)' }} />
                  </div>
                </label>
              </div>

            </div>
          </section>

        </div>

        {/* ─────────── QUICK ACTIONS ─────────── */}
        <div className="lh-full-width">
          <div className="lh-card">
            <div className="lh-card__header">
              <h2><Star size={17} style={{ color: '#f59e0b' }} /> Quick Actions</h2>
            </div>
            <div className="lh-quick-grid">
              <button className="lh-quick-btn" onClick={() => navigate('/chat')}>
                <div className="lh-quick-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <MessageSquare size={24} />
                </div>
                <span>Student Chats</span>
              </button>
              <button className="lh-quick-btn" onClick={() => navigate('/appointments')}>
                <div className="lh-quick-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
                  <Calendar size={24} />
                </div>
                <span>My Schedule</span>
              </button>
              <button className="lh-quick-btn" onClick={() => navigate('/chat')}>
                <div className="lh-quick-icon" style={{ background: '#fff7ed', color: '#d97706' }}>
                  <Zap size={24} />
                </div>
                <span>Quick Responses</span>
              </button>
              <button className="lh-quick-btn" onClick={() => navigate('/chat')}>
                <div className="lh-quick-icon" style={{ background: '#fdf2f8', color: '#db2777' }}>
                  <Shield size={24} />
                </div>
                <span>Moderation</span>
              </button>
              <button className="lh-quick-btn" onClick={() => navigate('/profile')}>
                <div className="lh-quick-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}>
                  <BookOpen size={24} />
                </div>
                <span>My Profile</span>
              </button>
              <button className="lh-quick-btn">
                <div className="lh-quick-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <FileText size={24} />
                </div>
                <span>Export Reports</span>
              </button>
              <button className="lh-quick-btn">
                <div className="lh-quick-icon" style={{ background: '#faf5ff', color: '#9333ea' }}>
                  <Users size={24} />
                </div>
                <span>Student List</span>
              </button>
              <button className="lh-quick-btn">
                <div className="lh-quick-icon" style={{ background: '#f8fafc', color: '#64748b' }}>
                  <Settings size={24} />
                </div>
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}

/* ── Helpers ── */
function getInitials(name) {
  return (name ?? 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}
function formatTime(iso) {
  const d    = new Date(iso);
  const h    = d.getHours();
  const m    = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = (h % 12 || 12) + ':' + m;
  return { hour, ampm };
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}
function fmtRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

/* ── Demo data ── */
const DEMO_SCHEDULE = [
  { id: 101, studentName: 'Kavindu Perera',    startTime: new Date().toISOString(),                       status: 'CONFIRMED', notes: 'Final year project' },
  { id: 102, studentName: 'Sithumi Rajapaksa', startTime: new Date(Date.now() + 3600000).toISOString(),   status: 'CONFIRMED', notes: 'Research methodology' },
  { id: 103, studentName: 'Ashan Bandara',     startTime: new Date(Date.now() + 7200000).toISOString(),   status: 'CONFIRMED', notes: 'Thesis review' },
  { id: 104, studentName: 'Malsha Peris',      startTime: new Date(Date.now() + 10800000).toISOString(),  status: 'PENDING',   notes: 'Assignment discussion' },
];
const DEMO_CHATS = [
  { id: 101, name: 'Kavindu Perera',    dept: 'Information Technology', lastMsg: 'Thank you for the feedback on my project!',      unread: 1, time: new Date().toISOString() },
  { id: 102, name: 'Sithumi Rajapaksa', dept: 'Computer Science',       lastMsg: 'Could you clarify the submission deadline?',      unread: 3, time: new Date(Date.now() - 1800000).toISOString() },
  { id: 103, name: 'Ashan Bandara',     dept: 'Information Technology', lastMsg: 'The thesis outline has been uploaded.',           unread: 0, time: new Date(Date.now() - 7200000).toISOString() },
];
const DEMO_PENDING = [
  { id: 201, studentName: 'Malsha Peris',   startTime: new Date(Date.now() + 86400000).toISOString(), notes: 'Assignment feedback session' },
  { id: 202, studentName: 'Dinesh Kumara',  startTime: new Date(Date.now() + 172800000).toISOString(), notes: 'Project scope discussion' },
];
