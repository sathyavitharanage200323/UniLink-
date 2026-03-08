import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChatPage from './components/ChatPage';
import StudentHome from './pages/StudentHome';
import LecturerHome from './pages/LecturerHome';
import { getUsers, getStudentAppointments, getLecturerAppointments } from './api';
import './App.css';

/* ── Fallback users shown when backend is offline ── */
const FALLBACK_USERS = [
  {
    id: 1,
    name: 'Dr. Amara Silva',
    role: 'LECTURER',
    department: 'Information Technology',
    expertise: 'Artificial Intelligence, Machine Learning',
    doNotDisturb: false,
    autoReplyMessage: 'I am currently unavailable. I will respond shortly.',
  },
  {
    id: 2,
    name: 'Kavindu Perera',
    role: 'STUDENT',
    department: 'Information Technology',
    doNotDisturb: false,
  },
];

/* ── Login screen — loads real users from the backend ── */
function LoginPage({ onLogin }) {
  const [users,    setUsers]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [offline,  setOffline] = useState(false);

  useEffect(() => {
    getUsers()
      .then((data) => {
        // Show lecturers first, then students
        const sorted = [...data].sort((a, b) => {
          if (a.role === b.role) return a.name.localeCompare(b.name);
          return a.role === 'LECTURER' ? -1 : 1;
        });
        setUsers(sorted);
      })
      .catch(() => {
        setOffline(true);
        setUsers(FALLBACK_USERS);
        toast.warn('Backend offline — showing demo users', { autoClose: 4000 });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 50%, #be185d 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      gap: 40,
      padding: '0 20px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{
          width: 70, height: 70, borderRadius: 20,
          background: 'rgba(255,255,255,0.18)',
          border: '2px solid rgba(255,255,255,0.40)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: '2rem',
        }}>🎓</div>
        <h1 style={{ fontSize: '2.6rem', fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          UniLink
        </h1>
        <p style={{ opacity: 0.80, fontSize: '1rem', margin: 0 }}>
          University Lecturer Appointment Booking System
        </p>
        <p style={{ opacity: 0.55, fontSize: '0.85rem', marginTop: 6 }}>
          Real-Time Chat · Appointments · Messages
        </p>
      </div>

      {/* Loading spinner */}
      {loading && (
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
          Loading users…
        </div>
      )}

      {/* User cards */}
      {!loading && (
        <>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => onLogin(u)}
                style={{
                  padding: '24px 32px',
                  borderRadius: 18,
                  border: '2px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(12px)',
                  cursor: 'pointer',
                  color: 'white',
                  textAlign: 'center',
                  minWidth: 210,
                  transition: 'transform 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.24)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '2.4rem', marginBottom: 10 }}>
                  {u.role === 'LECTURER' ? '👩‍🏫' : '🧑‍💻'}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>{u.name}</div>
                <div style={{
                  display: 'inline-block',
                  padding: '3px 12px',
                  borderRadius: 999,
                  background: u.role === 'LECTURER' ? 'rgba(167,139,250,0.40)' : 'rgba(96,165,250,0.40)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}>
                  {u.role}
                </div>
                <div style={{ opacity: 0.70, fontSize: '0.78rem' }}>{u.department}</div>
                <div style={{
                  marginTop: 16,
                  padding: '8px 20px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.22)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: '1.5px solid rgba(255,255,255,0.35)',
                }}>
                  Continue as {u.role === 'LECTURER' ? 'Lecturer' : 'Student'} →
                </div>
              </button>
            ))}
          </div>

          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textAlign: 'center' }}>
            {offline ? 'Demo mode — backend offline' : `${users.length} user(s) loaded from database`}
          </p>
        </>
      )}
    </div>
  );
}

/* ── Router component ── */
function AppRoutes({ activeUser, appointments, onLogin, onLogout }) {
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
            ? <LecturerHome currentUser={activeUser} appointments={appointments} onLogout={onLogout} />
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
          />
        }
      />

      {/* Catch-all */}
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
      const appts = user.role === 'STUDENT'
        ? await getStudentAppointments(user.id)
        : await getLecturerAppointments(user.id);
      setAppointments(appts);
    } catch {
      // Backend offline or no appointments yet — pages will use their built-in demo fallback
      setAppointments([]);
    }
  };

  const handleLogout = () => {
    setActiveUser(null);
    setAppointments([]);
  };

  return (
    <BrowserRouter>
      <AppRoutes
        activeUser={activeUser}
        appointments={appointments}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
    </BrowserRouter>
  );
}

