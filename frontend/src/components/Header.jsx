import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Bell, LogOut, MessageSquare, Menu, X,
  Home, Calendar, User, Bug,
} from 'lucide-react';
import { ThemeToggle } from '../theme/ThemeToggle';
import { chatApi } from '../api/chatApi';
import {
  getAllAppointments,
  getLecturerAppointments,
  getStudentAppointments,
} from '../api';
import './Header.css';

/**
 * Header — shared navigation bar for all pages.
 *
 * Props:
 *   currentUser  – { id, name, role, department }
 *   onLogout     – () => void
 *   unreadCount  – number (optional, default 0)
 */
export default function Header({ currentUser, onLogout, unreadCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [liveUnreadCount, setLiveUnreadCount] = useState(null);
  const [chatNotifications, setChatNotifications] = useState([]);
  const [appointmentNotifications, setAppointmentNotifications] = useState([]);
  const prevUnreadRef = useRef(0);
  const appointmentStatusRef = useRef(new Map());
  const appointmentInitRef = useRef(false);
  const upcomingNotifiedRef = useRef(new Set());
  const dailySummaryDateRef = useRef('');
  const navigate = useNavigate();

  const isLecturer = currentUser?.role === 'LECTURER';
  const isAdmin = currentUser?.role === 'ADMIN';
  const homeRoute  = isAdmin ? '/admin/home' : (isLecturer ? '/lecturer/home' : '/student/home');
  const bugRoute = isAdmin ? '/admin/bug-reports' : '/reports';
  const notificationsEnabled = currentUser?.role === 'STUDENT'
    ? currentUser?.notificationEnabled !== false
    : true;
  const effectiveUnreadCount = liveUnreadCount === null ? unreadCount : liveUnreadCount;
  const hasAnyNotifications = (effectiveUnreadCount > 0 || appointmentNotifications.length > 0) && notificationsEnabled;
  const initials   = (currentUser?.name ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function close() { setMenuOpen(false); }

  function parseAppointmentTime(appointment) {
    if (!appointment?.startTime) return null;
    const date = new Date(appointment.startTime);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function createAppointmentNotification(id, title, meta, route = '/appointments') {
    return {
      id,
      title,
      meta,
      route,
      type: 'appointment',
      time: Date.now(),
    };
  }

  const fetchAppointmentsForRole = useCallback(async () => {
    if (!currentUser?.id) return [];
    if (currentUser.role === 'STUDENT') {
      return await getStudentAppointments(currentUser.id);
    }
    if (currentUser.role === 'LECTURER') {
      return await getLecturerAppointments(currentUser.id);
    }
    return await getAllAppointments();
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    let timerId;
    let isMounted = true;

    async function loadNotifications() {
      if (!currentUser?.id) return;
      try {
        const roomsRes = await chatApi.getRoomsForUser(currentUser.id);
        const rooms = roomsRes.data || [];

        const withUnread = await Promise.all(
          rooms.map(async (room) => {
            if (room?.roomStatus === 'RESOLVED' || room?.roomStatus === 'CLOSED') {
              return { ...room, unread: 0 };
            }
            try {
              const unreadRes = await chatApi.getUnreadCount(room.roomId, currentUser.id);
              return { ...room, unread: unreadRes.data?.count || 0 };
            } catch {
              return { ...room, unread: 0 };
            }
          })
        );

        const totalUnread = withUnread.reduce((sum, r) => sum + (r.unread || 0), 0);
        const newNotifications = withUnread
          .filter((r) => (r.unread || 0) > 0)
          .map((r) => ({
            id: `chat-${r.roomId}`,
            title: isLecturer ? (r.studentName || 'Student') : (r.lecturerName || 'Lecturer'),
            meta: `${r.roomType === 'DIRECT' ? 'Direct message' : `Session #${r.appointmentId}`} · ${r.unread} unread`,
            route: '/chat',
            type: 'chat',
            time: Date.now(),
          }));

        if (!isMounted) return;
        setLiveUnreadCount(totalUnread);
        setChatNotifications(newNotifications);

        if (notificationsEnabled && totalUnread > prevUnreadRef.current) {
          const delta = totalUnread - prevUnreadRef.current;
          toast.info(`${delta} new message${delta > 1 ? 's' : ''} received`, {
            position: 'bottom-right',
            autoClose: 2500,
          });
        }
        prevUnreadRef.current = totalUnread;
      } catch {
        // Keep existing count on polling failures
      }
    }

    loadNotifications();
    timerId = setInterval(loadNotifications, 8000);
    return () => {
      isMounted = false;
      clearInterval(timerId);
    };
  }, [currentUser?.id, isLecturer, notificationsEnabled]);

  useEffect(() => {
    let timerId;
    let isMounted = true;

    async function pollAppointmentNotifications() {
      if (!currentUser?.id) return;
      try {
        const appointments = await fetchAppointmentsForRole();
        if (!isMounted || !Array.isArray(appointments)) return;

        const now = new Date();
        const currentStatusMap = new Map();
        const newEvents = [];

        appointments.forEach((appointment) => {
          currentStatusMap.set(appointment.id, appointment.status);
        });

        if (appointmentInitRef.current) {
          appointments.forEach((appointment) => {
            const prevStatus = appointmentStatusRef.current.get(appointment.id);
            const slotLabel = parseAppointmentTime(appointment)?.toLocaleString() || 'Scheduled slot';
            const studentName = appointment?.student?.name || 'Student';

            if (!prevStatus && appointment.status === 'PENDING' && currentUser.role !== 'STUDENT') {
              newEvents.push(
                createAppointmentNotification(
                  `booked-${appointment.id}-${appointment.status}`,
                  'New Slot Booked',
                  `${studentName} booked ${slotLabel}`
                )
              );
            }

            if (prevStatus && prevStatus !== appointment.status) {
              if (appointment.status === 'CANCELLED') {
                newEvents.push(
                  createAppointmentNotification(
                    `cancelled-${appointment.id}-${Date.now()}`,
                    'Slot Cancelled',
                    `${studentName} appointment on ${slotLabel} was cancelled`
                  )
                );
              }
              if (appointment.status === 'CONFIRMED') {
                newEvents.push(
                  createAppointmentNotification(
                    `confirmed-${appointment.id}-${Date.now()}`,
                    'Slot Confirmed',
                    `Appointment confirmed for ${slotLabel}`
                  )
                );
              }
            }

            const startTime = parseAppointmentTime(appointment);
            const isConfirmed = appointment.status === 'CONFIRMED';
            if (startTime && isConfirmed) {
              const minutesToStart = Math.floor((startTime.getTime() - now.getTime()) / 60000);
              if (minutesToStart >= 0 && minutesToStart <= 60 && !upcomingNotifiedRef.current.has(appointment.id)) {
                upcomingNotifiedRef.current.add(appointment.id);
                newEvents.push(
                  createAppointmentNotification(
                    `upcoming-${appointment.id}`,
                    'Upcoming Appointment',
                    `Starts in ${minutesToStart} minute${minutesToStart === 1 ? '' : 's'}`
                  )
                );
              }
            }
          });
        }

        const todayKey = now.toISOString().slice(0, 10);
        if (dailySummaryDateRef.current !== todayKey) {
          const todayCount = appointments.filter((appointment) => {
            const d = parseAppointmentTime(appointment);
            return d && d.toISOString().slice(0, 10) === todayKey && appointment.status !== 'CANCELLED';
          }).length;
          newEvents.push(
            createAppointmentNotification(
              `daily-summary-${todayKey}`,
              'Daily Schedule Summary',
              `You have ${todayCount} appointment${todayCount === 1 ? '' : 's'} today`
            )
          );
          dailySummaryDateRef.current = todayKey;
        }

        appointmentStatusRef.current = currentStatusMap;
        appointmentInitRef.current = true;

        if (newEvents.length > 0) {
          setAppointmentNotifications((prev) => [...newEvents, ...prev]);
          if (notificationsEnabled) {
            toast.info(`${newEvents.length} appointment notification${newEvents.length > 1 ? 's' : ''} available.`, {
              position: 'bottom-right',
              autoClose: 2500,
            });
          }
        }
      } catch {
        // Keep current notifications on polling failures.
      }
    }

    if (notificationsEnabled) {
      pollAppointmentNotifications();
      timerId = setInterval(pollAppointmentNotifications, 60000);
    } else {
      setAppointmentNotifications([]);
    }

    return () => {
      isMounted = false;
      clearInterval(timerId);
    };
  }, [currentUser?.id, currentUser?.role, notificationsEnabled, fetchAppointmentsForRole]);

  const allNotifications = useMemo(() => {
    if (!notificationsEnabled) return [];
    return [...appointmentNotifications, ...chatNotifications]
      .sort((a, b) => (b.time || 0) - (a.time || 0));
  }, [appointmentNotifications, chatNotifications, notificationsEnabled]);

  const notificationTotal = notificationsEnabled ? allNotifications.length : 0;
  const notificationBadge = notificationTotal > 99 ? '99+' : String(notificationTotal);

  return (
    <header className={`header ${isLecturer ? 'header--lecturer' : 'header--student'}`}>
      <div className="header__inner">

        {/* ── Brand ── */}
        <Link to={homeRoute} className="header__brand" onClick={close}>
          <div className="header__logo-box">
            <img src="/Logo2.png" alt="UniLink" style={{ width: 26, height: 26, objectFit: 'contain' }} />
          </div>
          <span className="header__brand-text">
            Uni<strong>Link</strong>
          </span>
        </Link>

        {/* ── Nav links ── */}
        <nav className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
          <Link to={homeRoute} className="header__nav-link" onClick={close}>
            <Home size={15} /><span>Home</span>
          </Link>
          <Link to="/appointments" className="header__nav-link" onClick={close}>
            <Calendar size={15} /><span>Appointments</span>
          </Link>
          <Link to="/chat" className="header__nav-link" onClick={close}>
            <MessageSquare size={15} /><span>Messages</span>
            {effectiveUnreadCount > 0 && (
              <span className="header__nav-badge">{effectiveUnreadCount}</span>
            )}
          </Link>
          <Link to="/notifications" className="header__nav-link" onClick={close}>
            <Bell size={15} /><span>Notifications</span>
            {notificationTotal > 0 && (
              <span className="header__nav-badge">{notificationBadge}</span>
            )}
          </Link>
          <Link to={bugRoute} className="header__nav-link" onClick={close}>
            <Bug size={15} /><span>Reports</span>
          </Link>
          <Link to="/profile" className="header__nav-link" onClick={close}>
            <User size={15} /><span>Profile</span>
          </Link>
        </nav>

        {/* ── Right cluster ── */}
        <div className="header__right">
          {/* Notifications */}
          <button
            className={`header__icon-btn ${hasAnyNotifications ? 'header__icon-btn--active' : ''}`}
            title="Notifications"
            aria-label="Notifications"
            onClick={() => navigate('/notifications')}
          >
            <Bell size={19} />
            {hasAnyNotifications && <span className="header__notif-dot" />}
            {notificationTotal > 0 && (
              <span className="header__notif-count">{notificationBadge}</span>
            )}
          </button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User chip */}
          <button className="header__user-chip" onClick={() => navigate('/profile')} title="Profile">
            <div className="header__avatar">{initials}</div>
            <div className="header__user-meta">
              <span className="header__user-name">{currentUser?.name}</span>
              <span className="header__user-role">
                {isAdmin ? 'Admin' : (isLecturer ? 'Lecturer' : 'Student')}
              </span>
            </div>
          </button>

          {/* Logout */}
          <button className="header__logout-btn" onClick={onLogout} title="Logout">
            <LogOut size={17} />
            <span>Logout</span>
          </button>

          {/* Hamburger */}
          <button
            className="header__hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

      </div>
    </header>
  );
}
