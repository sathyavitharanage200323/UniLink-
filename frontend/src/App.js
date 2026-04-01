import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChatPage from './components/ChatPage';
import StudentHome from './pages/StudentHome';
import LecturerHome from './pages/LecturerHome';
import ManagementPage from './pages/ManagementPage';
import { AppointmentsPage, ComingSoonPage } from './pages/UtilityPages';
import ProfilePage from './pages/ProfilePage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import LecturerSchedulePage from './pages/LecturerSchedulePage.jsx';
import SlotCalendarPage from './pages/SlotCalendarPage.jsx';
import {
  loginUser,
  registerUser,
  getStudentAppointments,
  getLecturerAppointments,
} from './api';
import './App.css';

import LoginPage from './pages/LoginPage.jsx';


function AppRoutes({ activeUser, appointments, onLogin, onLogout, onUserUpdate }) {
  if (!activeUser) {
    return <LoginPage onLogin={onLogin} />;
  }

  const homeRedirect = activeUser.role === 'LECTURER' ? '/lecturer/home' : '/student/home';

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homeRedirect} replace />} />

      <Route
        path="/student/home"
        element={
          activeUser.role === 'STUDENT'
            ? <StudentHome currentUser={activeUser} appointments={appointments} onLogout={onLogout} />
            : <Navigate to="/lecturer/home" replace />
        }
      />

      <Route
        path="/lecturer/home"
        element={
          activeUser.role === 'LECTURER'
            ? <LecturerHome currentUser={activeUser} appointments={appointments} onLogout={onLogout} onUserUpdate={onUserUpdate} />
            : <Navigate to="/student/home" replace />
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
          activeUser.role === 'LECTURER'
            ? <ManagementPage currentUser={activeUser} onLogout={onLogout} />
            : <Navigate to="/student/home" replace />
        }
      />

      <Route
        path="/book"
        element={
          activeUser?.role === 'STUDENT'
              ? <BookingPage user={activeUser} onLogout={onLogout} />
              : <Navigate to="/lecturer/home" replace />
        }
      />

      <Route
        path="/lecturer/schedule"
        element={
          activeUser?.role === 'LECTURER'
            ? <LecturerSchedulePage currentUser={activeUser} onLogout={onLogout} />
            : <Navigate to="/student/home" replace />
        }
      />

      <Route
        path="/lecturer/availability"
        element={
          activeUser?.role === 'LECTURER'
            ? <SlotCalendarPage currentUser={activeUser} onLogout={onLogout} />
            : <Navigate to="/student/home" replace />
        }
      />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to={homeRedirect} replace />} />
    
        <Route
          path="/lecturer/calendar"
          element={
            activeUser?.role === 'LECTURER'
              ? <SlotCalendarPage currentUser={activeUser} onLogout={onLogout} />
              : <Navigate to="/student/home" replace />
          }
        />
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
      const appts = user.role === 'STUDENT'
        ? await getStudentAppointments(user.id)
        : await getLecturerAppointments(user.id);
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




