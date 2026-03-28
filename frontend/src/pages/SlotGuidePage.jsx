import React from 'react';
import {
  BookOpenCheck,
  ShieldCheck,
  Clock3,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Workflow,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SlotModuleNav from '../components/SlotModuleNav';
import './SlotGuidePage.css';

export default function SlotGuidePage({ currentUser, onLogout }) {
  const guides = [
    {
      icon: CalendarDays,
      title: 'No Past Dates',
      text: 'Lecturers cannot create availability slots for past dates. This ensures that only valid future or current dates are used for appointment scheduling.',
    },
    {
      icon: Clock3,
      title: 'Valid Time Range',
      text: 'Each slot must stay within the allowed working hours. The end time is automatically calculated and must always be later than the start time.',
    },
    {
      icon: ShieldCheck,
      title: 'No Overlapping Slots',
      text: 'The system prevents overlapping or conflicting slots on the same date. This helps avoid duplicate availability and scheduling confusion.',
    },
    {
      icon: BookOpenCheck,
      title: 'Better Booking Flow',
      text: 'Well-managed slots improve the appointment booking process for students and help lecturers maintain an organized timetable.',
    },
  ];

  const bestPractices = [
    'Create slots only for days when you are fully available.',
    'Maintain enough time gaps between appointments for better time management.',
    'Review your calendar regularly before adding or editing slots.',
    'Delete outdated or unnecessary slots to keep the schedule clean.',
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Create Slot',
      text: 'Lecturer adds a date and start time.',
    },
    {
      step: '02',
      title: 'System Validation',
      text: 'System checks date, time, overlap, and slot rules.',
    },
    {
      step: '03',
      title: 'Slot Saved',
      text: 'Valid slot is stored and shown in the slot list/calendar.',
    },
    {
      step: '04',
      title: 'Student Booking Flow',
      text: 'Students can later use available slots for appointments.',
    },
  ];

  const quickStats = [
    { label: 'Main Rules', value: '4', icon: ShieldCheck },
    { label: 'Best Practices', value: '4', icon: Sparkles },
    { label: 'Workflow Steps', value: '4', icon: Workflow },
  ];

  const lecturerName = currentUser?.name || 'Lecturer';
  const lecturerInitial = lecturerName.charAt(0).toUpperCase();

  return (
    <div className="sg-layout">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
      <SlotModuleNav />

      <main className="sg-main">
        <section className="sg-hero">
          <div className="sg-hero__content">
            <div className="sg-hero__left">
              <div className="sg-badge">
                <BookOpenCheck size={14} />
                Slot Guide
              </div>

              <h1>Guidelines & Validation Rules</h1>
              <p>
                This page explains the main rules, validations, and best practices
                used in the lecturer slot management module.
              </p>

              <div className="sg-hero__chips">
                <span className="sg-chip">Validation</span>
                <span className="sg-chip">Scheduling</span>
                <span className="sg-chip">Best Practices</span>
              </div>
            </div>

            <div className="sg-hero__avatar">
              <div className="sg-hero__avatar-circle">{lecturerInitial}</div>
              <div className="sg-hero__avatar-name">{lecturerName}</div>
              <div className="sg-hero__avatar-role">Lecturer Portal</div>
            </div>
          </div>
        </section>

        <section className="sg-stats">
          {quickStats.map((item) => (
            <div className="sg-stat-card" key={item.label}>
              <div className="sg-stat-icon">
                <item.icon size={22} />
              </div>
              <div>
                <h3>{item.value}</h3>
                <p>{item.label}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="sg-grid">
          <div className="sg-left-column">
            <div className="sg-section-card">
              <div className="sg-section-header">
                <h2>Core Validation Rules</h2>
                <p>Main rules followed by the slot management system</p>
              </div>

              <div className="sg-guide-grid">
                {guides.map((item) => (
                  <section className="sg-guide-card" key={item.title}>
                    <div className="sg-guide-card__icon">
                      <item.icon size={20} />
                    </div>

                    <div className="sg-guide-card__content">
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <div className="sg-section-card">
              <div className="sg-section-header">
                <h2>Best Practices for Lecturers</h2>
                <p>Helpful recommendations for smooth availability management</p>
              </div>

              <div className="sg-practice-list">
                {bestPractices.map((item) => (
                  <div className="sg-practice-item" key={item}>
                    <div className="sg-practice-icon">
                      <CheckCircle2 size={18} />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sg-right-column">
            <div className="sg-section-card">
              <div className="sg-section-header">
                <h2>How the Flow Works</h2>
                <p>Simple workflow of slot management</p>
              </div>

              <div className="sg-workflow">
                {workflowSteps.map((item) => (
                  <div className="sg-workflow-item" key={item.step}>
                    <div className="sg-workflow-step">{item.step}</div>
                    <div className="sg-workflow-content">
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sg-section-card sg-note-card">
              <div className="sg-section-header">
                <h2>Important Note</h2>
                <p>System behavior to remember</p>
              </div>

              <div className="sg-note-box">
                <div className="sg-note-box__icon">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3>Validation is applied before saving</h3>
                  <p>
                    Whenever a lecturer creates or edits a slot, the system checks
                    all validation rules first. Invalid slots are not saved to the
                    system database.
                  </p>
                </div>
              </div>
            </div>

            <div className="sg-section-card sg-summary-card">
              <div className="sg-section-header">
                <h2>Quick Summary</h2>
                <p>Purpose of this page</p>
              </div>

              <div className="sg-summary-content">
                <p>
                  This guide helps lecturers understand the rules behind slot
                  creation, time validation, overlapping prevention, and the
                  overall appointment scheduling flow.
                </p>

                <div className="sg-summary-tags">
                  <span>Clear Rules</span>
                  <span>Better Scheduling</span>
                  <span>Improved Booking Flow</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}