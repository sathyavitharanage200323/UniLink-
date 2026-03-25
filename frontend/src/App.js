import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ChatPage from './components/ChatPage';
import StudentHome from './pages/StudentHome';
import LecturerHome from './pages/LecturerHome';
import LecturerSlotsPage from './pages/LecturerSlotsPage';
import SlotCalendarPage from './pages/SlotCalendarPage';
import SlotHistoryPage from './pages/SlotHistoryPage';
import SlotSummaryPage from './pages/SlotSummaryPage';
import SlotGuidePage from './pages/SlotGuidePage';
import SlotSettingsPage from './pages/SlotSettingsPage';
import { AppointmentsPage, ProfilePage, ComingSoonPage } from './pages/UtilityPages';
import { getStudentAppointments, getLecturerAppointments } from './api';
import './App.css';

function AppRoutes({ activeUser, appointments, onLogout, onUserUpdate }) {
  const homeRedirect =
    activeUser.role === 'LECTURER' ? '/lecturer/home' : '/student/home';

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homeRedirect} replace />} />

      <Route
        path="/student/home"
        element={
          activeUser.role === 'STUDENT' ? (
            <StudentHome currentUser={activeUser} appointments={appointments} onLogout={onLogout} />
          ) : (
            <Navigate to="/lecturer/home" replace />
          )
        }
      />

      <Route
        path="/lecturer/home"
        element={
          activeUser.role === 'LECTURER' ? (
            <LecturerHome
              currentUser={activeUser}
              appointments={appointments}
              onLogout={onLogout}
            />
          ) : (
            <Navigate to="/student/home" replace />
          )
        }
      />

      <Route
        path="/lecturer/slots"
        element={
          activeUser.role === 'LECTURER' ? (
            <LecturerSlotsPage currentUser={activeUser} onLogout={onLogout} />
          ) : (
            <Navigate to="/student/home" replace />
          )
        }
      />

      <Route
        path="/lecturer/slots/calendar"
        element={
          activeUser.role === 'LECTURER' ? (
            <SlotCalendarPage currentUser={activeUser} onLogout={onLogout} />
          ) : (
            <Navigate to="/student/home" replace />
          )
        }
      />

      <Route
        path="/lecturer/slots/history"
        element={
          activeUser.role === 'LECTURER' ? (
            <SlotHistoryPage currentUser={activeUser} onLogout={onLogout} />
          ) : (
            <Navigate to="/student/home" replace />
          )
        }
      />

      <Route
        path="/lecturer/slots/summary"
        element={
          activeUser.role === 'LECTURER' ? (
            <SlotSummaryPage currentUser={activeUser} onLogout={onLogout} />
          ) : (
            <Navigate to="/student/home" replace />
          )
        }
      />

      <Route
        path="/lecturer/slots/guide"
        element={
          activeUser.role === 'LECTURER' ? (
            <SlotGuidePage currentUser={activeUser} onLogout={onLogout} />
          ) : (
            <Navigate to="/student/home" replace />
          )
        }
      />

      <Route
        path="/lecturer/slots/settings"
        element={
          activeUser.role === 'LECTURER' ? (
            <SlotSettingsPage currentUser={activeUser} onLogout={onLogout} />
          ) : (
            <Navigate to="/student/home" replace />
          )
        }
      />

      <Route
        path="/chat"
        element={
          <ChatPage currentUser={activeUser} appointments={appointments} onLogout={onLogout} />
        }
      />

      <Route
        path="/appointments"
        element={
          <AppointmentsPage
            currentUser={activeUser}
            appointments={appointments}
            onLogout={onLogout}
          />
        }
      />

      <Route
        path="/profile"
        element={
          <ProfilePage
            currentUser={activeUser}
            onLogout={onLogout}
            onUserUpdate={onUserUpdate}
          />
        }
      />

      <Route
        path="/coming-soon"
        element={<ComingSoonPage currentUser={activeUser} onLogout={onLogout} />}
      />

      <Route path="*" element={<Navigate to={homeRedirect} replace />} />
    </Routes>
  );
}

export default function App() {
  const [activeUser, setActiveUser] = useState({
    id: 1,
    name: 'Dr. Amara Silva',
    role: 'LECTURER',
    department: 'Information Technology',
    expertise: 'Artificial Intelligence',
    doNotDisturb: false,
  });

  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    loadAppointments();
  }, [activeUser]);

  async function loadAppointments() {
    try {
      const appts =
        activeUser.role === 'STUDENT'
          ? await getStudentAppointments(activeUser.id)
          : await getLecturerAppointments(activeUser.id);

      setAppointments(Array.isArray(appts) ? appts : []);
    } catch {
      setAppointments([]);
    }
  }

  const handleLogout = () => {
    alert('Demo mode enabled for presentation. Logout is disabled.');
  };

  const handleUserUpdate = (updatedUser) => {
    setActiveUser(updatedUser);
  };

  return (
    <BrowserRouter>
      <AppRoutes
        activeUser={activeUser}
        appointments={appointments}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
      />
      <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
    </BrowserRouter>
  );
}