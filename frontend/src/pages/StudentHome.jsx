import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, MessageSquare, Clock, CheckCircle,
  BookOpen, PlusCircle, ChevronRight, User,
  TrendingUp, ArrowRight, Bell, Star, MapPin, Video,
  Hash, GraduationCap, Zap, RefreshCw
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { chatApi } from '../api/chatApi';
import api from '../api/axiosInstance';
import './StudentHome.css';

/* ── Parse all fields from notes ─────────────────────────────────────── */
function parseApptNotes(notes = '') {
  const extract = (key) => {
    const m = notes.match(new RegExp(`\\[${key}:([^\\]]+)\\]`));
    return m ? m[1].trim() : '';
  };
  const metaMatch = notes.match(/^\[([^\]]+)\]/);
  const meta = metaMatch ? metaMatch[1].replace('| HIGH PRIORITY', '').trim() : '';
  const reason = notes.replace(/\[[^\]]+\]/g, '').trim();
  return {
    meta,
    name:     extract('NAME'),
    it:       extract('IT'),
    itEmail:  extract('ITEMAIL'),
    phone:    extract('PHONE'),
    mode:     extract('MODE'),
    reason,
    isHighPriority: notes.includes('HIGH PRIORITY'),
  };
}

/**
 * StudentHome – dashboard for students.
 *
 * Props:
 *   currentUser  – { id, name, role, department }
 *   appointments – array from App.js
 *   onLogout     – () => void
 */
export default function StudentHome({ currentUser, appointments = [], onLogout }) {
  const navigate   = useNavigate();
  const [displayThreads, setDisplayThreads] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [liveAppointments, setLiveAppointments] = useState(appointments);

  /* ── Derived appointment lists ── */
  const confirmedAppts = liveAppointments.filter((a) => a.status === 'CONFIRMED');
  const pendingAppts   = liveAppointments.filter((a) => a.status === 'PENDING');
  const completedCount = liveAppointments.filter((a) => a.status === 'COMPLETED').length;

  // Show ALL appointments sorted by startTime descending (newest first)
  const displayAppts = [...liveAppointments]
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  // Update live appointments when prop changes
  useEffect(() => {
    setLiveAppointments(appointments);
  }, [appointments]);

  // Polling - refresh appointments every 5 seconds for real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const pollAppointments = async () => {
      try {
        const res = await api.get(`/appointments/student/${currentUser.id}`);
        setLiveAppointments(res.data || []);
      } catch (err) {
        console.error('Error polling appointments:', err);
      }
    };

    // Poll immediately and then every 5 seconds
    pollAppointments();
    const pollInterval = setInterval(pollAppointments, 5000);

    return () => clearInterval(pollInterval);
  }, [currentUser?.id]);

  useEffect(() => {
    async function loadThreads() {
      if (!currentUser?.id) return;
      try {
        const roomsRes = await chatApi.getRoomsForUser(currentUser.id);
        const rooms = roomsRes.data || [];
        const mapped = await Promise.all(
          rooms.map(async (r) => {
            const isResolved = r.roomStatus === 'RESOLVED' || r.roomStatus === 'CLOSED';
            let unread = 0;
            if (!isResolved) {
              try {
                const unreadRes = await chatApi.getUnreadCount(r.roomId, currentUser.id);
                unread = unreadRes.data?.count || 0;
              } catch {
                unread = 0;
              }
            }
            return {
              id: r.roomId,
              name: r.lecturerName || 'Lecturer',
              dept: r.lecturerDepartment || '',
              lastMsg: r.roomType === 'DIRECT' ? 'Direct message' : `Session #${r.appointmentId}`,
              unread,
              status: r.roomStatus,
            };
          })
        );
        setDisplayThreads(mapped);
        setUnreadCount(mapped.reduce((sum, t) => sum + (t.unread || 0), 0));
      } catch {
        setDisplayThreads([]);
        setUnreadCount(0);
      }
    }
    loadThreads();
  }, [currentUser?.id]);

  /* Stats */
  const stats = [
    {
      label: 'Upcoming',
      value: displayAppts.length,
      icon: Calendar,
      bg: '#eff6ff',
      color: '#2563eb',
    },
    {
      label: 'Pending',
      value: pendingAppts.length,
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
      value: unreadCount,
      icon: MessageSquare,
      bg: '#faf5ff',
      color: '#7c3aed',
    },
  ];

  const initials = getInitials(currentUser?.name);

  return (
    <div className="sh-layout">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={unreadCount} />

      <main className="sh-main">

        {/* ─────────────── HERO ─────────────── */}
        <section className="sh-hero">
          <div className="sh-hero__inner">
            <div className="sh-hero__text">
              <p className="sh-hero__greeting">Good {timeOfDay()}, 👋</p>
              <h1 className="sh-hero__name">{currentUser?.name}</h1>
              <p className="sh-hero__sub">
                You have{' '}
                <strong>{displayAppts.length} upcoming appointments</strong>{' '}
                and <strong>{unreadCount} unread messages</strong>. Keep up the great work!
              </p>
              <div className="sh-hero__actions">
                <button
                  className="sh-btn sh-btn--primary"
                  onClick={() => navigate('/book')}
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

        {/* ─────────────── STATS ─────────────── */}
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

        {/* ─────────────── CONTENT GRID ─────────────── */}
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
              {displayAppts.slice(0, 4).map((a) => {
                const isRescheduled = a.rescheduledAt;
                const parsed = parseApptNotes(a.notes || '');
                const statusColor = isRescheduled ? '#dc2626' : (a.status === 'PENDING' ? '#d97706' : '#0f766e');
                const statusBg    = isRescheduled ? '#fee2e2' : (a.status === 'PENDING' ? '#fef9c3' : '#dcfce7');
                const statusLabel = isRescheduled ? 'RESCHEDULED' : (a.status ?? 'CONFIRMED');

                return (
                  <div className="sh-appt-card" key={a.id}
                    style={isRescheduled ? { borderLeft: '3px solid #dc2626' } : {}}>

                    {/* Header row */}
                    <div className="sh-appt-card__header">
                      <div className="sh-appt-avatar">{getInitials(a.lecturer?.name ?? 'L')}</div>
                      <div className="sh-appt-card__lec">
                        <div className="sh-appt-card__lec-name">{a.lecturer?.name ?? 'Lecturer'}</div>
                        <div className="sh-appt-card__lec-dept">{a.lecturer?.department}</div>
                      </div>
                      <span className="sh-status" style={{ background: statusBg, color: statusColor, border: `1px solid ${statusColor}` }}>
                        {parsed.isHighPriority && <Zap size={10} />} {statusLabel}
                      </span>
                    </div>

                    {/* Time + mode */}
                    <div className="sh-appt-card__time">
                      <Clock size={13} style={{ color: '#2563eb', flexShrink: 0 }} />
                      <span>{fmtDate(a.startTime)}</span>
                      {parsed.mode && (
                        <span className={`sh-mode-pill sh-mode-pill--${parsed.mode.toLowerCase()}`}>
                          {parsed.mode === 'Online' ? <Video size={11} /> : <MapPin size={11} />}
                          {parsed.mode}
                        </span>
                      )}
                    </div>

                    {/* Academic info */}
                    {parsed.meta && (
                      <div className="sh-appt-card__meta">
                        <GraduationCap size={12} style={{ color: '#64748b' }} />
                        {parsed.meta}
                      </div>
                    )}

                    {/* Reason — only show when PENDING, hide after confirmed */}
                    {a.status === 'PENDING' && parsed.reason && (
                      <div className="sh-appt-card__reason">"{parsed.reason}"</div>
                    )}

                    {/* Confirmed details — meeting link / location / message */}
                    {a.status === 'CONFIRMED' && (a.meetingLink || a.meetingLocation || a.confirmationMessage) && (
                      <div className="sh-appt-card__confirmed">
                        {a.confirmationMessage && (
                          <div className="sh-appt-card__confirm-msg">
                            💬 {a.confirmationMessage}
                          </div>
                        )}
                        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                          {a.meetingLink && (
                            <a href={a.meetingLink} target="_blank" rel="noopener noreferrer" className="sh-appt-card__link">
                              <Video size={13} /> Join Meeting
                            </a>
                          )}
                          {a.meetingLocation && (
                            <span className="sh-appt-card__location">
                              <MapPin size={13} /> {a.meetingLocation}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reschedule reason */}
                    {isRescheduled && a.rescheduleReason && (
                      <div className="sh-appt-card__reschedule">
                        <RefreshCw size={11} /> Rescheduled: {a.rescheduleReason}
                      </div>
                    )}
                  </div>
                );
              })}
              {displayAppts.length === 0 && (
                <div className="sh-empty">
                  <Calendar size={38} />
                  <p>No upcoming appointments</p>
                  <button
                    className="sh-btn sh-btn--sm sh-btn--primary"
                    onClick={() => navigate('/book')}
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
                      <span className="sh-chat-time">{t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'resolved' : 'open'}</span>
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

        {/* ─────────────── QUICK ACTIONS ─────────────── */}
        <div className="sh-full-width">
          <div className="sh-card">
            <div className="sh-card__header">
              <h2><Star size={17} style={{ color: '#f59e0b' }} /> Quick Actions</h2>
            </div>
            <div className="sh-quick-grid">
              <button className="sh-quick-btn" onClick={() => navigate('/book')}>
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
              <button className="sh-quick-btn" onClick={() => navigate('/coming-soon')}>
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
              <button className="sh-quick-btn" onClick={() => navigate('/coming-soon')}>
                <div className="sh-quick-icon" style={{ background: '#f0fdf4', color: '#0891b2' }}>
                  <BookOpen size={24} />
                </div>
                <span>Resources</span>
              </button>
              <button className="sh-quick-btn" onClick={() => navigate('/coming-soon')}>
                <div className="sh-quick-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                  <Bell size={24} />
                </div>
                <span>Notifications</span>
              </button>
              <button className="sh-quick-btn" onClick={() => navigate('/coming-soon')}>
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
