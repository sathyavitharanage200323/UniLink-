import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Bell, LogOut, MessageSquare, Menu, X,
  Home, Calendar, User, GraduationCap,
} from 'lucide-react';
import { chatApi } from '../api/chatApi';
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [liveUnreadCount, setLiveUnreadCount] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const prevUnreadRef = useRef(0);
  const navigate = useNavigate();

  const isLecturer = currentUser?.role === 'LECTURER';
  const homeRoute  = isLecturer ? '/lecturer/home' : '/student/home';
  const effectiveUnreadCount = liveUnreadCount === null ? unreadCount : liveUnreadCount;
  const initials   = (currentUser?.name ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function close() { setMenuOpen(false); }

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
            roomId: r.roomId,
            unread: r.unread,
            name: isLecturer ? (r.studentName || 'Student') : (r.lecturerName || 'Lecturer'),
            roomType: r.roomType,
            label: r.roomType === 'DIRECT' ? 'Direct message' : `Session #${r.appointmentId}`,
          }));

        if (!isMounted) return;
        setLiveUnreadCount(totalUnread);
        setNotifications(newNotifications);

        if (totalUnread > prevUnreadRef.current) {
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
  }, [currentUser?.id, isLecturer]);

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
          <Link to="/profile" className="header__nav-link" onClick={close}>
            <User size={15} /><span>Profile</span>
          </Link>
        </nav>

        {/* ── Right cluster ── */}
        <div className="header__right">
          {/* Notifications */}
          <button
            className="header__icon-btn"
            title="Notifications"
            aria-label="Notifications"
            onClick={() => setNotifOpen((v) => !v)}
          >
            <Bell size={19} />
            {effectiveUnreadCount > 0 && <span className="header__notif-dot" />}
          </button>
          {notifOpen && (
            <div className="header__notif-panel">
              <div className="header__notif-title">Notifications</div>
              {notifications.length === 0 ? (
                <div className="header__notif-empty">No new messages</div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.roomId}
                    className="header__notif-item"
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/chat');
                    }}
                  >
                    <div className="header__notif-item-name">{n.name}</div>
                    <div className="header__notif-item-meta">{n.label} · {n.unread} unread</div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* User chip */}
          <button className="header__user-chip" onClick={() => navigate('/profile')} title="Profile">
            <div className="header__avatar">{initials}</div>
            <div className="header__user-meta">
              <span className="header__user-name">{currentUser?.name}</span>
              <span className="header__user-role">
                {isLecturer ? 'Lecturer' : 'Student'}
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
