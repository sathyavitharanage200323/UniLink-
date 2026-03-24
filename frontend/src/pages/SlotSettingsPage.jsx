import React, { useState } from 'react';
import { Settings2, TimerReset, BellRing, Shield } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SlotModuleNav from '../components/SlotModuleNav';
import './LecturerHome.css';

export default function SlotSettingsPage({ currentUser, onLogout }) {
  const [bufferTime, setBufferTime] = useState('10');
  const [maxBookings, setMaxBookings] = useState('6');
  const [notifications, setNotifications] = useState(true);
  const [conflictPrevention, setConflictPrevention] = useState(true);

  return (
    <div className="lh-layout">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
      <SlotModuleNav />

      <main className="lh-main">
        <section className="lh-hero">
          <div className="lh-hero__inner">
            <div className="lh-hero__text">
              <div className="lh-hero__badge">
                <Settings2 size={13} /> Slot Settings
              </div>
              <h1 className="lh-hero__name">Slot Preferences</h1>
              <p className="lh-hero__dept">Configure extra slot handling preferences.</p>
            </div>
          </div>
        </section>

        <div className="lh-content-grid" style={{ gridTemplateColumns: '1fr' }}>
          <section className="lh-card">
            <div className="lh-card__body" style={{ display: 'grid', gap: 18 }}>
              <div>
                <label style={labelStyle}><TimerReset size={15} /> Buffer Time (minutes)</label>
                <input
                  value={bufferTime}
                  onChange={(e) => setBufferTime(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}><Shield size={15} /> Maximum Daily Bookings</label>
                <input
                  value={maxBookings}
                  onChange={(e) => setMaxBookings(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={toggleRowStyle}>
                <span style={labelInlineStyle}><BellRing size={15} /> Enable Notifications</span>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
              </div>

              <div style={toggleRowStyle}>
                <span style={labelInlineStyle}><Shield size={15} /> Prevent Conflicting Slots</span>
                <input
                  type="checkbox"
                  checked={conflictPrevention}
                  onChange={(e) => setConflictPrevention(e.target.checked)}
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
  fontWeight: 700,
  color: '#334155',
};

const labelInlineStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 700,
  color: '#334155',
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #dbe2ea',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const toggleRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 0',
  borderBottom: '1px solid #e5e7eb',
};