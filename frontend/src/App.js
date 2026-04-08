import React, { useState } from 'react';
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
import { AppointmentsPage, ComingSoonPage } from './pages/UtilityPages';
import ProfilePage from './pages/ProfilePage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import LecturerSchedulePage from './pages/LecturerSchedulePage.jsx';
import SlotCalendarPage from './pages/SlotCalendarPage.jsx';
import {
  getAllAppointments,
  getStudentAppointments,
  getLecturerAppointments,
} from './api';
import './App.css';

import LoginPage from './pages/LoginPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';


function AppRoutes({ activeUser, appointments, onLogin, onLogout, onUserUpdate }) {
  if (!activeUser) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage onLogin={onLogin} />} />
        <Route path="/admin-login" element={<AdminLoginPage onLogin={onLogin} />} />
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
              ? <BookingPage user={activeUser} onLogout={onLogout} />
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

      <Route path="*" element={<Navigate to={homeRedirect} replace />} />
      </Routes>
  );
}

/* ── Root App ── */
export default function App() {
  const [activeUser,    setActiveUser]    = useState(null);
  const [appointments,  setAppointments]  = useState([]);

  const handleLogin = async (user) => {
    setActiveUser(user);
    try {
      let appts = [];
      if (user.role === 'STUDENT') {
        appts = await getStudentAppointments(user.id);
      } else if (user.role === 'LECTURER') {
        appts = await getLecturerAppointments(user.id);
      } else if (user.role === 'ADMIN') {
        appts = await getAllAppointments();
      }
      setAppointments(appts);
    } catch {
      // Backend offline or no appointments yet.
      setAppointments([]);
    }
  };

  const handleLogout = () => {
    setActiveUser(null);
    setAppointments([]);
  };

  const handleUserUpdate = (updatedUser) => {
    setActiveUser(updatedUser);
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




