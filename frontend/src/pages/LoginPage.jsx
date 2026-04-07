import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser, registerUser } from '../api';
import '../App.css';

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

export default function LoginPage({ onLogin }) {
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
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(registerForm.password)) {
      return 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character';
    }
    if (registerForm.password !== registerForm.confirmPassword) return 'Passwords do not match';
    
    if (registerForm.role === 'STUDENT') {
      const studentIdRegex = /^IT\d{8}$/i;
      if (!studentIdRegex.test(registerForm.registrationNumber.trim())) {
        return 'Registration number must start with IT followed by 8 digits (e.g. IT12345678)';
      }
    }

    if (registerForm.role === 'LECTURER') {
      const lecturerIdRegex = /^(LP|LI|SL|PR)[A-Za-z0-9]{4,8}$/i;
      if (!lecturerIdRegex.test(registerForm.employeeCode.trim())) {
        return 'Invalid Employee Code format';
      }
    }

    const phoneRegex = /^(0\d{9})$/;
    if (!phoneRegex.test(registerForm.phone.trim())) {
      return 'Phone number must be exactly 10 digits starting with 0';
    }

    if (!registerForm.department.trim()) return 'Department is required';
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
      background: 'linear-gradient(135deg, rgba(15, 40, 84, 0.85) 0%, rgba(28, 77, 141, 0.85) 50%, rgba(73, 136, 196, 0.85) 100%), url("/background.jpg") center/cover no-repeat',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      gap: 40,
      padding: '0 20px',
    }}>
      {}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <img className="animated-logo" src="/Logo2.png" alt="Unilink Logo" style={{ height: '300px', maxWidth: '90vw', objectFit: 'contain' }} />
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
              color: tab === 'LOGIN' ? '#0F2854' : 'white', fontWeight: 700,
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
              color: tab === 'REGISTER' ? '#0F2854' : 'white', fontWeight: 700,
            }}
          >
            Register
          </button>
        </div>

        <div style={{ marginBottom: 14, textAlign: 'right' }}>
          <Link to="/admin-login" style={{ color: '#dbeafe', textDecoration: 'none', fontWeight: 600 }}>
            Admin login
          </Link>
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
  color: '#0F2854',
  fontWeight: 800,
  cursor: 'pointer',
};


