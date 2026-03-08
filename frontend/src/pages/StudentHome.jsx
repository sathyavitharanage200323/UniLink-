import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, MessageSquare, Clock, CheckCircle,
  BookOpen, PlusCircle, ChevronRight, User,
  TrendingUp, ArrowRight, Bell, Star,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './StudentHome.css';

/**
 * StudentHome — dashboard for students.
 *
 * Props:
 *   currentUser  – { id, name, role, department }
 *   appointments – array from App.js
 *   onLogout     – () => void
 */
export default function StudentHome({ currentUser, appointments = [], onLogout }) {
  const navigate   = useNavigate();

  /* ── Derived appointment lists ── */
  const confirmedAppts = appointments.filter((a) => a.status === 'CONFIRMED');
  const pendingAppts   = appointments.filter((a) => a.status === 'PENDING');
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  /* Demo data merged with real (shows something even with empty props) */
  const displayAppts = confirmedAppts.length > 0 ? confirmedAppts : DEMO_APPTS;
  const displayThreads = confirmedAppts.length > 0
    ? confirmedAppts.map((a) => ({
        id: a.id,
        name: a.lecturer?.name ?? 'Lecturer',
        dept: a.lecturer?.department ?? '',
        lastMsg: 'Click to open the conversation',
        unread: 0,
        time: a.startTime,
        appointment: a,
      }))
    : DEMO_THREADS;

  /* Stats */
  const stats = [
    {
      label: 'Upcoming',
      value: confirmedAppts.length || 3,
      icon: Calendar,
      bg: '#eff6ff',
      color: '#2563eb',
    },
    {
      label: 'Pending',
      value: pendingAppts.length || 2,
      icon: Clock,
      bg: '#fffbeb',
      color: '#d97706',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle,
      bg: '#f0fdf4',
      color: '#16a34a',
    },
    {
      label: 'Unread Msgs',
      value: 5,
      icon: MessageSquare,
      bg: '#faf5ff',
      color: '#7c3aed',
    },
  ];

  const initials = getInitials(currentUser?.name);

  return (
    <div className="sh-layout">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={5} />

      <main className="sh-main">

        {/* ─────────── HERO ─────────── */}
        <section className="sh-hero">
          <div className="sh-hero__inner">
            <div className="sh-hero__text">
              <p className="sh-hero__greeting">Good {timeOfDay()}, 👋</p>
              <h1 className="sh-hero__name">{currentUser?.name}</h1>
              <p className="sh-hero__sub">
                You have{' '}
                <strong>{confirmedAppts.length || 3} upcoming appointments</strong>{' '}
                and <strong>5 unread messages</strong>. Keep up the great work!
              </p>
              <div className="sh-hero__actions">
                <button
                  className="sh-btn sh-btn--primary"
                  onClick={() => navigate('/appointments')}
                >
                  <PlusCircle size={16} /> Book Appointment
                </button>
                <button
                  className="sh-btn sh-btn--outline"
                  onClick={() => navigate('/chat')}
                >
                  <MessageSquare size={16} /> Open Messages
                </button>
              </div>
            </div>

            <div className="sh-hero__visual">
              <div className="sh-hero__avatar-ring">{initials}</div>
              <div className="sh-hero__dept-tag">
                <BookOpen size={13} />
                {currentUser?.department ?? 'IT'} · Student
              </div>
            </div>
          </div>
        </section>

        {/* ─────────── STATS ─────────── */}
        <section className="sh-stats">
          <div className="sh-stats__grid">
            {stats.map((s) => (
              <div className="sh-stat-card" key={s.label}>
                <div
                  className="sh-stat-icon"
                  style={{ background: s.bg, color: s.color }}
                >
                  <s.icon size={22} />
                </div>
                <div>
                  <div className="sh-stat-value">{s.value}</div>
                  <div className="sh-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────── CONTENT GRID ─────────── */}
        <div className="sh-content-grid">

          {/* ── Upcoming Appointments ── */}
          <section className="sh-card">
            <div className="sh-card__header">
              <h2><Calendar size={17} style={{ color: '#2563eb' }} /> Upcoming Appointments</h2>
              <button className="sh-link-btn" onClick={() => navigate('/appointments')}>
                View all <ChevronRight size={14} />
              </button>
            </div>
            <div className="sh-card__body">
              {displayAppts.slice(0, 4).map((a) => (
                <div className="sh-appt-item" key={a.id}>
                  <div className="sh-appt-avatar">
                    {getInitials(a.lecturer?.name ?? 'L')}
                  </div>
                  <div className="sh-appt-info">
                    <strong>{a.lecturer?.name ?? 'Lecturer'}</strong>
                    <span>{a.notes ?? 'Appointment'}</span>
                    <span className="sh-appt-time">
                      <Clock size={11} /> {fmtDate(a.startTime)}
                    </span>
                  </div>
                  <span className={`sh-status sh-status--${(a.status ?? 'confirmed').toLowerCase()}`}>
                    {a.status ?? 'CONFIRMED'}
                  </span>
                </div>
              ))}
              {displayAppts.length === 0 && (
                <div className="sh-empty">
                  <Calendar size={38} />
                  <p>No upcoming appointments</p>
                  <button
                    className="sh-btn sh-btn--sm sh-btn--primary"
                    onClick={() => navigate('/appointments')}
                  >
                    Book Now
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── My Chats ── */}
          <section className="sh-card">
            <div className="sh-card__header">
              <h2><MessageSquare size={17} style={{ color: '#2563eb' }} /> My Chats</h2>
              <button className="sh-link-btn" onClick={() => navigate('/chat')}>
                All chats <ChevronRight size={14} />
              </button>
            </div>
            <div className="sh-card__body">
              {displayThreads.map((t) => (
                <button
                  key={t.id}
                  className="sh-chat-item"
                  onClick={() => navigate('/chat')}
                >
                  <div className="sh-chat-avatar-wrap">
                    <div className="sh-chat-avatar">
                      {getInitials(t.name)}
                    </div>
                    {t.unread > 0 && (
                      <span className="sh-unread-badge">{t.unread}</span>
                    )}
                  </div>
                  <div className="sh-chat-info">
                    <div className="sh-chat-row1">
                      <strong>Chat with {t.name}</strong>
                      <span className="sh-chat-time">{fmtRelative(t.time)}</span>
                    </div>
                    <div className="sh-chat-preview">{t.lastMsg}</div>
                    {t.dept && (
                      <div className="sh-chat-dept">{t.dept} Department</div>
                    )}
                  </div>
                  <ArrowRight size={15} className="sh-chat-arrow" />
                </button>
              ))}
              {displayThreads.length === 0 && (
                <div className="sh-empty">
                  <MessageSquare size={38} />
                  <p>No active chats yet</p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* ─────────── QUICK ACTIONS ─────────── */}
        <div className="sh-full-width">
          <div className="sh-card">
            <div className="sh-card__header">
              <h2><Star size={17} style={{ color: '#f59e0b' }} /> Quick Actions</h2>
            </div>
            <div className="sh-quick-grid">
              <button className="sh-quick-btn" onClick={() => navigate('/appointments')}>
                <div className="sh-quick-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <PlusCircle size={24} />
                </div>
                <span>Book Appointment</span>
              </button>
              <button className="sh-quick-btn" onClick={() => navigate('/chat')}>
                <div className="sh-quick-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <MessageSquare size={24} />
                </div>
                <span>My Messages</span>
              </button>
              <button className="sh-quick-btn" onClick={() => navigate('/profile')}>
                <div className="sh-quick-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}>
                  <User size={24} />
                </div>
                <span>My Profile</span>
              </button>
              <button className="sh-quick-btn">
                <div className="sh-quick-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
                  <TrendingUp size={24} />
                </div>
                <span>View Progress</span>
              </button>
              <button className="sh-quick-btn" onClick={() => navigate('/appointments')}>
                <div className="sh-quick-icon" style={{ background: '#fdf2f8', color: '#db2777' }}>
                  <Calendar size={24} />
                </div>
                <span>My Schedule</span>
              </button>
              <button className="sh-quick-btn">
                <div className="sh-quick-icon" style={{ background: '#f0fdf4', color: '#0891b2' }}>
                  <BookOpen size={24} />
                </div>
                <span>Resources</span>
              </button>
              <button className="sh-quick-btn">
                <div className="sh-quick-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                  <Bell size={24} />
                </div>
                <span>Notifications</span>
              </button>
              <button className="sh-quick-btn">
                <div className="sh-quick-icon" style={{ background: '#f8fafc', color: '#64748b' }}>
                  <CheckCircle size={24} />
                </div>
                <span>Completed</span>
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
  return (name ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}
function fmtRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

/* ── Demo data (shown when real appointments are not loaded) ── */
const DEMO_APPTS = [
  {
    id: 101,
    lecturer: { name: 'Dr. Amara Silva', department: 'IT' },
    startTime: new Date().toISOString(),
    status: 'CONFIRMED',
    notes: 'Final year project discussion',
  },
  {
    id: 102,
    lecturer: { name: 'Dr. Nimal Fernando', department: 'CS' },
    startTime: new Date(Date.now() + 86400000).toISOString(),
    status: 'CONFIRMED',
    notes: 'Algorithm assignment review',
  },
  {
    id: 103,
    lecturer: { name: 'Dr. Priya Mendis', department: 'IT' },
    startTime: new Date(Date.now() + 172800000).toISOString(),
    status: 'PENDING',
    notes: 'Research methodology guidance',
  },
];
const DEMO_THREADS = [
  {
    id: 101,
    name: 'Dr. Amara Silva',
    dept: 'Information Technology',
    lastMsg: 'Please review the project timeline before our meeting.',
    unread: 2,
    time: new Date().toISOString(),
  },
  {
    id: 102,
    name: 'Dr. Nimal Fernando',
    dept: 'Computer Science',
    lastMsg: 'Your assignment submission has been reviewed. Well done!',
    unread: 0,
    time: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 103,
    name: 'Dr. Priya Mendis',
    dept: 'Information Technology',
    lastMsg: 'Session confirmed for Thursday 2 PM.',
    unread: 1,
    time: new Date(Date.now() - 86400000).toISOString(),
  },
];
