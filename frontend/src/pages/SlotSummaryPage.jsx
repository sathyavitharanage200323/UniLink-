import React from 'react';
import { BarChart3, CalendarDays, Clock3, Layers3 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SlotModuleNav from '../components/SlotModuleNav';
import './LecturerHome.css';

export default function SlotSummaryPage({ currentUser, onLogout }) {
  const stats = [
    { label: 'Total Slots', value: 18, icon: Layers3, bg: '#ede9fe', color: '#7c3aed' },
    { label: 'Today Slots', value: 4, icon: CalendarDays, bg: '#dbeafe', color: '#2563eb' },
    { label: 'Upcoming Slots', value: 11, icon: Clock3, bg: '#dcfce7', color: '#16a34a' },
    { label: 'Used Slots', value: 7, icon: BarChart3, bg: '#fff7ed', color: '#ea580c' },
  ];

  return (
    <div className="lh-layout">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
      <SlotModuleNav />

      <main className="lh-main">
        <section className="lh-hero">
          <div className="lh-hero__inner">
            <div className="lh-hero__text">
              <div className="lh-hero__badge">
                <BarChart3 size={13} /> Slot Summary
              </div>
              <h1 className="lh-hero__name">Availability Analytics</h1>
              <p className="lh-hero__dept">Quick insights into slot usage and availability.</p>
            </div>
          </div>
        </section>

        <div style={{
          maxWidth: '1200px',
          margin: '24px auto 0',
          padding: '0 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 18,
        }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: 18,
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: s.bg,
                  color: s.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <s.icon size={20} />
              </div>

              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                  {s.value}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.92rem' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}