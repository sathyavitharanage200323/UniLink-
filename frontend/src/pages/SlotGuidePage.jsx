import React from 'react';
import { BookOpenCheck, ShieldCheck, Clock3, CalendarDays } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SlotModuleNav from '../components/SlotModuleNav';
import './LecturerHome.css';

export default function SlotGuidePage({ currentUser, onLogout }) {
  const guides = [
    {
      icon: CalendarDays,
      title: 'No Past Dates',
      text: 'Lecturers cannot create availability slots for past dates.',
    },
    {
      icon: Clock3,
      title: 'Valid Time Range',
      text: 'End time must always be later than the selected start time.',
    },
    {
      icon: ShieldCheck,
      title: 'No Overlapping Slots',
      text: 'The system prevents conflicting or overlapping time slots.',
    },
    {
      icon: BookOpenCheck,
      title: 'Better Booking Flow',
      text: 'Proper slot management improves the student appointment booking experience.',
    },
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
                <BookOpenCheck size={13} /> Slot Guide
              </div>
              <h1 className="lh-hero__name">Guidelines & Validation Rules</h1>
              <p className="lh-hero__dept">Helpful notes about how slot management works.</p>
            </div>
          </div>
        </section>

        <div className="lh-content-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {guides.map((item) => (
            <section className="lh-card" key={item.title}>
              <div className="lh-card__body" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: '#ede9fe',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <item.icon size={20} />
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                    {item.title}
                  </div>
                  <div style={{ color: '#475569', lineHeight: 1.6 }}>
                    {item.text}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}