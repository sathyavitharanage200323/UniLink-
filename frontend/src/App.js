import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ChatPage from './components/ChatPage';
import StudentHome from './pages/StudentHome';
import LecturerHome from './pages/LecturerHome';
import AdminHome from './pages/AdminHome';
import ManagementPage from './pages/ManagementPage';
import BugReportPage from './pages/BugReportPage';
import AdminBugReportsPage from './pages/AdminBugReportsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { AppointmentsPage, ComingSoonPage } from './pages/UtilityPages';
import ProfilePage from './pages/ProfilePage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import LecturerSchedulePage from './pages/LecturerSchedulePage.jsx';
import SlotCalendarPage from './pages/SlotCalendarPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import LecturerSlotsPage from './pages/LecturerSlotsPage.jsx';
import LecturerPreferencesPage from './pages/LecturerPreferencesPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import {
  getAllAppointments,
  getStudentAppointments,
  getLecturerAppointments,
} from './api';

import './App.css';

function AppRoutes({ activeUser, appointments, onLogin, onLogout, onUserUpdate }) {
  if (!activeUser) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage onLogin={onLogin} />} />
        <Route path="/admin-login" element={<AdminLoginPage onLogin={onLogin} />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const isStudent = activeUser.role === 'STUDENT';
  const isLecturer = activeUser.role === 'LECTURER';
  const isAdmin = activeUser.role === 'ADMIN';

  const homeRedirect = isAdmin ? '/admin/home' : (isLecturer ? '/lecturer/home' : '/student/home');

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homeRedirect} replace />} />

      <Route
        path="/student/home"
        element={
          isStudent
            ? <StudentHome currentUser={activeUser} appointments={appointments} onLogout={onLogout} />
            : <Navigate to={homeRedirect} replace />
        }
      />

      <Route
        path="/lecturer/home"
        element={
          isLecturer
            ? <LecturerHome currentUser={activeUser} appointments={appointments} onLogout={onLogout} onUserUpdate={onUserUpdate} />
            : <Navigate to={homeRedirect} replace />
        }
      />

      <Route
        path="/admin/home"
        element={
          isAdmin
            ? <AdminHome currentUser={activeUser} onLogout={onLogout} />
            : <Navigate to={homeRedirect} replace />
        }
      />

      <Route
        path="/chat"
        element={
          <ChatPage
            currentUser={activeUser}
            appointments={appointments}
            onLogout={onLogout}
            onUserUpdate={onUserUpdate}
          />
        }
      />

      <Route
        path="/appointments"
        element={<AppointmentsPage currentUser={activeUser} appointments={appointments} onLogout={onLogout} />}
      />

      <Route
        path="/profile"
        element={<ProfilePage currentUser={activeUser} onLogout={onLogout} onUserUpdate={onUserUpdate} />}
      />

      <Route
        path="/notifications"
        element={<NotificationsPage currentUser={activeUser} onLogout={onLogout} />}
      />

      <Route
        path="/coming-soon"
        element={<ComingSoonPage currentUser={activeUser} onLogout={onLogout} />}
      />

      <Route
        path="/management"
        element={
          (isLecturer || isAdmin)
            ? <ManagementPage currentUser={activeUser} onLogout={onLogout} />
            : <Navigate to={homeRedirect} replace />
        }
      />

      <Route
        path="/reports"
        element={
          (isStudent || isLecturer)
            ? <BugReportPage currentUser={activeUser} onLogout={onLogout} />
            : <Navigate to={homeRedirect} replace />
        }
      />

      <Route
        path="/admin/bug-reports"
        element={
          isAdmin
            ? <AdminBugReportsPage currentUser={activeUser} onLogout={onLogout} />
            : <Navigate to={homeRedirect} replace />
        }
      />

      <Route
        path="/book"
        element={
          isStudent
            ? <BookingPage currentUser={activeUser} onLogout={onLogout} />
            : <Navigate to={homeRedirect} replace />
        }
      />

      <Route
        path="/lecturer/schedule"
        element={
          isLecturer
            ? <LecturerSchedulePage currentUser={activeUser} onLogout={onLogout} />
            : <Navigate to={homeRedirect} replace />
        }
      />

      <Route
        path="/lecturer/slots"
        element={
          isLecturer
            ? <LecturerSlotsPage currentUser={activeUser} onLogout={onLogout} />
            : <Navigate to={homeRedirect} replace />
        }
      />

      <Route
        path="/lecturer/availability"
        element={
          isLecturer
            ? <SlotCalendarPage currentUser={activeUser} onLogout={onLogout} />
            : <Navigate to={homeRedirect} replace />
        }
      />

      <Route
        path="/lecturer/calendar"
        element={
          isLecturer
            ? <SlotCalendarPage currentUser={activeUser} onLogout={onLogout} />
            : <Navigate to={homeRedirect} replace />
        }
      />

      <Route
        path="/lecturer/preferences"
        element={
          isLecturer
            ? <LecturerPreferencesPage currentUser={activeUser} />
            : <Navigate to={homeRedirect} replace />
        }
      />

      <Route path="*" element={<Navigate to={homeRedirect} replace />} />
    </Routes>
  );
}

export default function App() {
  // ── Restore session from localStorage on mount ──────────────────────
  const [activeUser, setActiveUser] = useState(() => {
    try {
      const saved = localStorage.getItem('unilink_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem('unilink_appointments');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // ── Silently refresh appointments in background after restore ────────
  useEffect(() => {
    if (!activeUser?.id) return;
    const refresh = async () => {
      try {
        let appts = [];
        if (activeUser.role === 'STUDENT')       appts = await getStudentAppointments(activeUser.id);
        else if (activeUser.role === 'LECTURER') appts = await getLecturerAppointments(activeUser.id);
        else if (activeUser.role === 'ADMIN')    appts = await getAllAppointments();
        setAppointments(appts);
        localStorage.setItem('unilink_appointments', JSON.stringify(appts));
      } catch { /* keep cached */ }
    };
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser?.id]);

  const handleLogin = async (user) => {
    setActiveUser(user);
    localStorage.setItem('unilink_user', JSON.stringify(user));
    try {
      let appts = [];
      if (user.role === 'STUDENT')        appts = await getStudentAppointments(user.id);
      else if (user.role === 'LECTURER')  appts = await getLecturerAppointments(user.id);
      else if (user.role === 'ADMIN')     appts = await getAllAppointments();
      setAppointments(appts);
      localStorage.setItem('unilink_appointments', JSON.stringify(appts));
    } catch {
      setAppointments([]);
    }
  };

  const handleLogout = () => {
    setActiveUser(null);
    setAppointments([]);
    localStorage.removeItem('unilink_user');
    localStorage.removeItem('unilink_appointments');
  };

  const handleUserUpdate = (updatedUser) => {
    setActiveUser(updatedUser);
    localStorage.setItem('unilink_user', JSON.stringify(updatedUser));
  };

  return (
    <BrowserRouter>
      <AppRoutes
        activeUser={activeUser}
        appointments={appointments}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
      />
      <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
    </BrowserRouter>
  );
}