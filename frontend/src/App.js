import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChatPage from './components/ChatPage';
import StudentHome from './pages/StudentHome';
import LecturerHome from './pages/LecturerHome';
import ManagementPage from './pages/ManagementPage';
import { AppointmentsPage, ProfilePage, ComingSoonPage } from './pages/UtilityPages';
import BookingPage from './pages/BookingPage.jsx';
import LecturerSchedulePage from './pages/LecturerSchedulePage.jsx';
import LecturerAvailabilityPage from './pages/LecturerAvailabilityPage.jsx';
import {
  loginUser,
  registerUser,
  getStudentAppointments,
  getLecturerAppointments,
} from './api';
import './App.css';

const DEPARTMENT_OPTIONS = [
  'Faculty Of Computing',
  'Faculty Of Engineering',
  'Faculty Of Business',
  'Faculty Of Humanities and Sciences',
];

const BATCH_OPTIONS = [
  'Artificial Intelligence',
  'Software Engineering',
  'Computer Science',
  'Information Technology',
  'Data Science',
  'Cyber Security',
  'Computer Systems & Network Engineering',
  'Information Systems Engineering',
  'Interactive Media',
  'Computer Systems Engineering',
];

const ACADEMIC_PERIODS = [
  { academicYear: 'Year 1', semester: 'Semester 1', label: 'Year 1 Semester 1' },
  { academicYear: 'Year 1', semester: 'Semester 2', label: 'Year 1 Semester 2' },
  { academicYear: 'Year 2', semester: 'Semester 1', label: 'Year 2 Semester 1' },
  { academicYear: 'Year 2', semester: 'Semester 2', label: 'Year 2 Semester 2' },
  { academicYear: 'Year 3', semester: 'Semester 1', label: 'Year 3 Semester 1' },
  { academicYear: 'Year 3', semester: 'Semester 2', label: 'Year 3 Semester 2' },
  { academicYear: 'Year 4', semester: 'Semester 1', label: 'Year 4 Semester 1' },
  { academicYear: 'Year 4', semester: 'Semester 2', label: 'Year 4 Semester 2' },
];

const LECTURER_DESIGNATIONS = [
  'Lecturer',
  'Lecturer In Charge',
  'Senior Lecturer',
  'Professor',
];

/* ── Login/Register screen ── */
function LoginPage({ onLogin }) {
  const [tab, setTab] = useState('LOGIN');
  const [submitting, setSubmitting] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    department: '',
    phone: '',
    registrationNumber: '',
    batch: '',
    academicYear: '',
    semester: '',
    employeeCode: '',
    designation: '',
    officeLocation: '',
    officeHours: '',
    expertise: '',
    bio: '',
  });

  const selectedAcademicPeriod = ACADEMIC_PERIODS.find(
    (p) => p.academicYear === registerForm.academicYear && p.semester === registerForm.semester
  )?.label || '';

  const validateLogin = () => {
    if (!loginForm.email.trim()) return 'Email is required';
    if (!loginForm.password) return 'Password is required';
    return null;
  };

  const validateRegister = () => {
    if (registerForm.name.trim().length < 3) return 'Name must be at least 3 characters';
    if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(registerForm.email)) return 'Enter a valid email';
    if (registerForm.password.length < 8) return 'Password must be at least 8 characters';
    if (registerForm.password !== registerForm.confirmPassword) return 'Passwords do not match';
    if (!registerForm.department.trim()) return 'Department is required';
    if (registerForm.role === 'STUDENT' && !registerForm.registrationNumber.trim()) {
      return 'Registration number is required for student';
    }
    if (registerForm.role === 'LECTURER' && !registerForm.employeeCode.trim()) {
      return 'Employee code is required for lecturer';
    }
    if (registerForm.role === 'LECTURER' && !registerForm.designation.trim()) {
      return 'Designation is required for lecturer';
    }
    return null;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const error = validateLogin();
    if (error) {
      toast.error(error);
      return;
    }
    setSubmitting(true);
    try {
      const user = await loginUser(loginForm);
      await onLogin(user);
      toast.success('Login successful');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const error = validateRegister();
    if (error) {
      toast.error(error);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        role: registerForm.role,
        department: registerForm.department.trim(),
        phone: registerForm.phone.trim(),
        registrationNumber: registerForm.registrationNumber.trim(),
        batch: registerForm.batch.trim(),
        academicYear: registerForm.academicYear.trim(),
        semester: registerForm.semester.trim(),
        employeeCode: registerForm.employeeCode.trim(),
        designation: registerForm.designation.trim(),
        officeLocation: registerForm.officeLocation.trim(),
        officeHours: registerForm.officeHours.trim(),
        expertise: registerForm.expertise.trim(),
        bio: registerForm.bio.trim(),
      };
      const user = await registerUser(payload);
      await onLogin(user);
      toast.success('Registration successful');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

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

      <div style={{
        width: 'min(860px, 100%)',
        borderRadius: 18,
        padding: 24,
        background: 'rgba(255,255,255,0.16)',
        border: '1px solid rgba(255,255,255,0.24)',
        backdropFilter: 'blur(12px)',
        color: 'white',
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => setTab('LOGIN')}
            style={{
              border: 'none', borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
              background: tab === 'LOGIN' ? 'white' : 'rgba(255,255,255,0.2)',
              color: tab === 'LOGIN' ? '#0f172a' : 'white', fontWeight: 700,
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setTab('REGISTER')}
            style={{
              border: 'none', borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
              background: tab === 'REGISTER' ? 'white' : 'rgba(255,255,255,0.2)',
              color: tab === 'REGISTER' ? '#0f172a' : 'white', fontWeight: 700,
            }}
          >
            Register
          </button>
        </div>

        {tab === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'grid', gap: 12 }}>
            <input
              value={loginForm.email}
              onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="University email"
              type="email"
              className="auth-field"
              style={authInputStyle}
            />
            <input
              value={loginForm.password}
              onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Password"
              type="password"
              className="auth-field"
              style={authInputStyle}
            />
            <button type="submit" disabled={submitting} style={authButtonStyle}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))' }}>
              <input className="auth-field" value={registerForm.name} onChange={(e) => setRegisterForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" style={authInputStyle} />
              <input className="auth-field" type="email" value={registerForm.email} onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" style={authInputStyle} />
              <input className="auth-field" type="password" value={registerForm.password} onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))} placeholder="Password (min 8 chars)" style={authInputStyle} />
              <input className="auth-field" type="password" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm((p) => ({ ...p, confirmPassword: e.target.value }))} placeholder="Confirm password" style={authInputStyle} />
              <select className="auth-field" value={registerForm.role} onChange={(e) => setRegisterForm((p) => ({ ...p, role: e.target.value }))} style={authInputStyle}>
                <option value="STUDENT">STUDENT</option>
                <option value="LECTURER">LECTURER</option>
              </select>
              <select
                className="auth-field"
                value={registerForm.department}
                onChange={(e) => setRegisterForm((p) => ({ ...p, department: e.target.value }))}
                style={authInputStyle}
              >
                <option value="">Select department</option>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input className="auth-field" value={registerForm.phone} onChange={(e) => setRegisterForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" style={authInputStyle} />

              {registerForm.role === 'STUDENT' ? (
                <>
                  <input className="auth-field" value={registerForm.registrationNumber} onChange={(e) => setRegisterForm((p) => ({ ...p, registrationNumber: e.target.value }))} placeholder="Registration number" style={authInputStyle} />
                  <select
                    className="auth-field"
                    value={registerForm.batch}
                    onChange={(e) => setRegisterForm((p) => ({ ...p, batch: e.target.value }))}
                    style={authInputStyle}
                  >
                    <option value="">Select batch / program</option>
                    {BATCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <select
                    className="auth-field"
                    value={selectedAcademicPeriod}
                    onChange={(e) => {
                      const period = ACADEMIC_PERIODS.find((p) => p.label === e.target.value);
                      setRegisterForm((p) => ({
                        ...p,
                        academicYear: period ? period.academicYear : '',
                        semester: period ? period.semester : '',
                      }));
                    }}
                    style={authInputStyle}
                  >
                    <option value="">Select academic year and semester</option>
                    {ACADEMIC_PERIODS.map((p) => (
                      <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <input className="auth-field" value={registerForm.employeeCode} onChange={(e) => setRegisterForm((p) => ({ ...p, employeeCode: e.target.value }))} placeholder="Employee code" style={authInputStyle} />
                  <select className="auth-field" value={registerForm.designation} onChange={(e) => setRegisterForm((p) => ({ ...p, designation: e.target.value }))} style={authInputStyle}>
                    <option value="">Select designation</option>
                    {LECTURER_DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <input className="auth-field" value={registerForm.expertise} onChange={(e) => setRegisterForm((p) => ({ ...p, expertise: e.target.value }))} placeholder="Expertise" style={authInputStyle} />
                  <input className="auth-field" value={registerForm.officeLocation} onChange={(e) => setRegisterForm((p) => ({ ...p, officeLocation: e.target.value }))} placeholder="Office location" style={authInputStyle} />
                  <input className="auth-field" value={registerForm.officeHours} onChange={(e) => setRegisterForm((p) => ({ ...p, officeHours: e.target.value }))} placeholder="Office hours" style={authInputStyle} />
                </>
              )}
            </div>
            {registerForm.role === 'LECTURER' && (
              <textarea
                className="auth-field"
                value={registerForm.bio}
                onChange={(e) => setRegisterForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Short bio"
                style={{ ...authInputStyle, minHeight: 90, resize: 'vertical' }}
              />
            )}

            <button type="submit" disabled={submitting} style={authButtonStyle}>
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const authInputStyle = {
  width: '100%',
  height: 42,
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.45)',
  background: 'rgba(255,255,255,0.16)',
  color: 'white',
  WebkitTextFillColor: 'white',
  caretColor: 'white',
  padding: '0 12px',
  boxSizing: 'border-box',
  outline: 'none',
};

const authButtonStyle = {
  border: 'none',
  borderRadius: 10,
  height: 42,
  background: 'white',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
};

/* ── Router component ── */
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
            ? <BookingPage currentUser={activeUser} onLogout={onLogout} />
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
            ? <LecturerAvailabilityPage currentUser={activeUser} onLogout={onLogout} />
            : <Navigate to="/student/home" replace />
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

