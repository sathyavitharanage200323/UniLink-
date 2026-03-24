import React from 'react';
import { History, CheckCircle2, XCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SlotModuleNav from '../components/SlotModuleNav';
import './LecturerHome.css';

export default function SlotHistoryPage({ currentUser, onLogout }) {
  const history = [
    { id: 1, date: '2026-03-20', time: '09:00 - 09:30', status: 'Completed' },
    { id: 2, date: '2026-03-19', time: '11:00 - 11:30', status: 'Completed' },
    { id: 3, date: '2026-03-18', time: '01:00 - 01:30', status: 'Cancelled' },
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
                <History size={13} /> Slot History
              </div>
              <h1 className="lh-hero__name">Past Slot Records</h1>
              <p className="lh-hero__dept">Review previously scheduled availability slots.</p>
            </div>
          </div>
        </section>

        <div className="lh-content-grid" style={{ gridTemplateColumns: '1fr' }}>
          <section className="lh-card">
            <div className="lh-card__header">
              <h2><History size={17} style={{ color: '#7c3aed' }} /> Slot Activity History</h2>
            </div>

            <div className="lh-card__body">
              <div style={{ display: 'grid', gap: 14 }}>
                {history.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 16,
                      padding: 16,
                      background: '#f8fafc',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.date}</div>
                      <div style={{ color: '#475569' }}>{item.time}</div>
                    </div>

                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        background: item.status === 'Completed' ? '#dcfce7' : '#fee2e2',
                        color: item.status === 'Completed' ? '#166534' : '#b91c1c',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {item.status === 'Completed' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}