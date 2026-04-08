import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, CalendarClock, MessagesSquare, UserCircle, Bug } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AdminHome.css';

const cards = [
  {
    title: 'Management Console',
    desc: 'Edit or delete student and lecturer accounts.',
    icon: Users,
    path: '/management',
  },
  {
    title: 'System Appointments',
    desc: 'View all appointments across the platform.',
    icon: CalendarClock,
    path: '/appointments',
  },
  {
    title: 'Chat Oversight',
    desc: 'Open messaging workspace and monitor conversations.',
    icon: MessagesSquare,
    path: '/chat',
  },
  {
    title: 'Bug Reports',
    desc: 'Review user-reported bugs and publish fixes.',
    icon: Bug,
    path: '/admin/bug-reports',
  },
  {
    title: 'Admin Profile',
    desc: 'Update admin profile details and preferences.',
    icon: UserCircle,
    path: '/profile',
  },
];

export default function AdminHome({ currentUser, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="admin-home-page">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
      <main className="admin-home-main">
        <section className="admin-home-hero">
          <div className="admin-home-hero-title-row">
            <Settings size={22} />
            <h1>Administrator Control Center</h1>
          </div>
          <p>
            Full-access workspace for UniLink system administration.
          </p>
        </section>

        <section className="admin-home-grid">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                onClick={() => navigate(card.path)}
                className="admin-home-card"
              >
                <div className="admin-home-card-header">
                  <Icon size={18} />
                  <strong>{card.title}</strong>
                </div>
                <div className="admin-home-card-desc">{card.desc}</div>
                <span className="admin-home-card-cta">Open</span>
              </button>
            );
          })}
        </section>
      </main>
      <Footer />
    </div>
  );
}
