import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { KeyRound, Mail, ShieldCheck } from 'lucide-react';
import {
  requestPasswordReset,
  verifyPasswordReset,
  confirmPasswordReset,
} from '../api';
import './ResetPasswordPage.css';

const STEPS = {
  EMAIL: 'EMAIL',
  CODE: 'CODE',
  RESET: 'RESET',
};

export default function ResetPasswordPage() {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset({ email: email.trim() });
      toast.success('If the account exists, a reset code has been sent');
      setStep(STEPS.CODE);
    } catch (err) {
      toast.error(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Code is required');
      return;
    }
    setLoading(true);
    try {
      await verifyPasswordReset({ email: email.trim(), code: code.trim() });
      toast.success('Code verified');
      setStep(STEPS.RESET);
    } catch (err) {
      toast.error(err.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset({ email: email.trim(), code: code.trim(), newPassword: password });
      toast.success('Password updated');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <section className="reset-card">
        <div className="reset-title">
          <KeyRound size={22} />
          <h1>Password Reset</h1>
        </div>
        <p className="reset-subtitle">
          Reset only works for student and lecturer accounts.
        </p>

        {step === STEPS.EMAIL && (
          <form onSubmit={handleRequest} className="reset-form">
            <label>
              Email
              <div className="reset-input">
                <Mail size={16} />
                <input
                  type="email"
                  placeholder="your-email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset code'}
            </button>
          </form>
        )}

        {step === STEPS.CODE && (
          <form onSubmit={handleVerify} className="reset-form">
            <label>
              6-digit code
              <div className="reset-input">
                <ShieldCheck size={16} />
                <input
                  type="text"
                  placeholder="Enter code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify code'}
            </button>
          </form>
        )}

        {step === STEPS.RESET && (
          <form onSubmit={handleReset} className="reset-form">
            <label>
              New password
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Reset password'}
            </button>
          </form>
        )}

        <div className="reset-footer">
          <Link to="/">Back to login</Link>
        </div>
      </section>
    </div>
  );
}
