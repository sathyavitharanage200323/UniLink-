import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, LogOut, MessageSquare, Menu, X,
  Home, Calendar, User, GraduationCap,
} from 'lucide-react';
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
  const navigate = useNavigate();

  const isLecturer = currentUser?.role === 'LECTURER';
  const homeRoute  = isLecturer ? '/lecturer/home' : '/student/home';
  const initials   = (currentUser?.name ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function close() { setMenuOpen(false); }

  return (
    <header className={`header ${isLecturer ? 'header--lecturer' : 'header--student'}`}>
      <div className="header__inner">

        {/* ── Brand ── */}
        <Link to={homeRoute} className="header__brand" onClick={close}>
          <div className="header__logo-box">
            <GraduationCap size={20} />
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
            {unreadCount > 0 && (
              <span className="header__nav-badge">{unreadCount}</span>
            )}
          </Link>
          <Link to="/profile" className="header__nav-link" onClick={close}>
            <User size={15} /><span>Profile</span>
          </Link>
        </nav>

        {/* ── Right cluster ── */}
        <div className="header__right">
          {/* Notifications */}
          <button className="header__icon-btn" title="Notifications" aria-label="Notifications">
            <Bell size={19} />
            {unreadCount > 0 && <span className="header__notif-dot" />}
          </button>

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
