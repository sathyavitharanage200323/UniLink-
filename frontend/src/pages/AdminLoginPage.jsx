import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShieldCheck } from 'lucide-react';
import { loginUser } from '../api';

export default function AdminLoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error('Email and password are required');
      return;
    }

    setSubmitting(true);
    try {
      const user = await loginUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (user?.role !== 'ADMIN') {
        toast.error('Only admin accounts can sign in here');
        return;
      }

      await onLogin(user);
      toast.success('Admin login successful');
    } catch (err) {
      toast.error(err.message || 'Admin login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #0b132b 0%, #1c2541 45%, #3a506b 100%)',
      padding: 20,
    }}>
      <section style={{
        width: 'min(440px, 100%)',
        background: 'rgba(255, 255, 255, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: 16,
        padding: 24,
        backdropFilter: 'blur(8px)',
        color: '#f8fafc',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <ShieldCheck size={24} />
          <h1 style={{ margin: 0, fontSize: 24 }}>Admin Login</h1>
        </div>

        <p style={{ marginTop: 0, color: '#cbd5e1' }}>
          Use the administrator credentials to access global controls.
        </p>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <input
            type="email"
            placeholder="admin@gmail.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            style={inputStyle}
          />
          <button type="submit" disabled={submitting} style={buttonStyle}>
            {submitting ? 'Signing in...' : 'Sign In as Admin'}
          </button>
        </form>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <Link to="/" style={{ color: '#93c5fd', textDecoration: 'none' }}>
            Back to user login
          </Link>
        </div>
      </section>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  height: 42,
  borderRadius: 10,
  border: '1px solid rgba(255, 255, 255, 0.35)',
  background: 'rgba(255, 255, 255, 0.14)',
  color: '#f8fafc',
  padding: '0 12px',
  boxSizing: 'border-box',
  outline: 'none',
};

const buttonStyle = {
  height: 42,
  borderRadius: 10,
  border: 'none',
  background: '#E8650A',
  color: '#111827',
  fontWeight: 800,
  cursor: 'pointer',
};
