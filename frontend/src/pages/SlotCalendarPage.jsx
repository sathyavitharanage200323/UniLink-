import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Table2,
  History,
  BarChart3,
  Info,
  ArrowLeft,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getSlots } from '../api';
import './LecturerHome.css';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_ROWS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

export default function SlotCalendarPage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const lecturerId = currentUser?.id;

  const [slots, setSlots] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (lecturerId) {
      loadSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecturerId]);

  async function loadSlots() {
    try {
      setPageLoading(true);
      setError('');
      const data = await getSlots(lecturerId);
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Could not load calendar slots from backend.');
      setSlots([]);
    } finally {
      setPageLoading(false);
    }
  }

  const weekDates = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayDiff = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayDiff + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const weekDateStrings = useMemo(
    () => weekDates.map((d) => formatDateISO(d)),
    [weekDates]
  );

  const todayISO = formatDateISO(new Date());

  const weekSlots = useMemo(() => {
    return slots.filter((slot) => weekDateStrings.includes(slot.slotDate));
  }, [slots, weekDateStrings]);

  const totalWeekSlots = weekSlots.length;
  const todaySlots = weekSlots.filter((s) => s.slotDate === todayISO).length;
  const upcomingWeekSlots = weekSlots.filter((s) => s.slotDate >= todayISO).length;

  function getSlotsForDay(dateStr) {
    return weekSlots
      .filter((slot) => slot.slotDate === dateStr)
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  }

  return (
    <div className="lh-layout">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />

      <main style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.topBar}>
            <div>
              <div style={styles.badge}>
                <CalendarDays size={13} /> Slot Calendar View
              </div>
              <h1 style={styles.title}>Weekly Availability Calendar</h1>
              <p style={styles.subtitle}>
                Visualize lecturer slots in a calendar-style schedule view.
              </p>
            </div>

            <button
              className="lh-btn lh-btn--outline"
              onClick={() => navigate('/lecturer/slots')}
            >
              <ArrowLeft size={15} /> Back to Manage Slots
            </button>
          </div>

          <div style={styles.layout}>
            <aside style={styles.sidebar}>
              <div style={styles.sidebarBrand}>Slot Module</div>

              <button style={styles.sideBtn} onClick={() => navigate('/lecturer/home')}>
                <LayoutDashboard size={16} /> Dashboard
              </button>

              <button style={styles.sideBtn} onClick={() => navigate('/lecturer/slots')}>
                <Table2 size={16} /> Manage Slots
              </button>

              <button style={styles.sideBtnActive}>
                <CalendarDays size={16} /> Calendar View
              </button>

              <button style={styles.sideBtn} onClick={() => navigate('/lecturer/slot-history')}>
                <History size={16} /> Slot History
              </button>

              <button style={styles.sideBtn} onClick={() => navigate('/lecturer/slot-summary')}>
                <BarChart3 size={16} /> Summary
              </button>

              <button style={styles.sideBtn} onClick={() => navigate('/lecturer/slot-guide')}>
                <Info size={16} /> Guide
              </button>
            </aside>

            <section style={styles.mainArea}>
              <div style={styles.summaryRow}>
                <div style={styles.summaryCard}>
                  <div style={styles.summaryValue}>{totalWeekSlots}</div>
                  <div style={styles.summaryLabel}>This Week Slots</div>
                </div>

                <div style={styles.summaryCard}>
                  <div style={styles.summaryValue}>{todaySlots}</div>
                  <div style={styles.summaryLabel}>Today Slots</div>
                </div>

                <div style={styles.summaryCard}>
                  <div style={styles.summaryValue}>{upcomingWeekSlots}</div>
                  <div style={styles.summaryLabel}>Upcoming This Week</div>
                </div>
              </div>

              <div style={styles.calendarCard}>
                <div style={styles.calendarHeader}>
                  <div>
                    <h2 style={styles.calendarTitle}>Weekly Schedule Board</h2>
                    <p style={styles.calendarSub}>
                      {formatLongDate(weekDates[0])} - {formatLongDate(weekDates[6])}
                    </p>
                  </div>

                  <div style={styles.navRow}>
                    <button style={styles.navBtn} onClick={() => setWeekOffset((p) => p - 1)}>
                      <ChevronLeft size={16} />
                    </button>
                    <button style={styles.todayBtn} onClick={() => setWeekOffset(0)}>
                      Current Week
                    </button>
                    <button style={styles.navBtn} onClick={() => setWeekOffset((p) => p + 1)}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {pageLoading ? (
                  <div style={styles.emptyState}>Loading calendar...</div>
                ) : error ? (
                  <div style={styles.errorBox}>{error}</div>
                ) : (
                  <div style={styles.calendarGrid}>
                    <div style={styles.timeColumn}>
                      <div style={styles.timeHeader}>Time</div>
                      {TIME_ROWS.map((time) => (
                        <div key={time} style={styles.timeCell}>
                          {time}
                        </div>
                      ))}
                    </div>

                    {weekDates.map((date, index) => {
                      const dateStr = formatDateISO(date);
                      const daySlots = getSlotsForDay(dateStr);
                      const isToday = dateStr === todayISO;

                      return (
                        <div key={dateStr} style={styles.dayColumn}>
                          <div
                            style={{
                              ...styles.dayHeader,
                              ...(isToday ? styles.todayHeader : {}),
                            }}
                          >
                            <div style={styles.dayName}>{WEEK_DAYS[index]}</div>
                            <div style={styles.dayDate}>{date.getDate()}</div>
                          </div>

                          <div style={styles.dayBody}>
                            {daySlots.length === 0 ? (
                              <div style={styles.noSlotText}>No slots</div>
                            ) : (
                              daySlots.map((slot) => (
                                <div key={slot.id} style={styles.slotBlock}>
                                  <div style={styles.slotBlockTitle}>Available Slot</div>
                                  <div style={styles.slotBlockTime}>
                                    {String(slot.startTime).slice(0, 5)} - {String(slot.endTime).slice(0, 5)}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <aside style={styles.rightPanel}>
              <div style={styles.infoCard}>
                <div style={styles.avatarCircle}>
                  {currentUser?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'L'}
                </div>
                <div style={styles.infoName}>{currentUser?.name || 'Lecturer'}</div>
                <div style={styles.infoDept}>{currentUser?.department || 'Department'}</div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.smallTitle}>Quick Notes</div>
                <ul style={styles.noteList}>
                  <li>No overlapping slots allowed</li>
                  <li>Past dates are blocked</li>
                  <li>Use Manage Slots page for CRUD</li>
                  <li>Calendar view gives weekly visualization</li>
                </ul>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.smallTitle}>Quick Actions</div>
                <button style={styles.quickActionBtn} onClick={() => navigate('/lecturer/slots')}>
                  Open Manage Slots
                </button>
                <button style={styles.quickActionBtn} onClick={() => navigate('/lecturer/home')}>
                  Back to Dashboard
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

function formatLongDate(date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f3f4f6',
    padding: '24px 20px 32px',
  },
  wrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: '#ede9fe',
    color: '#7c3aed',
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: '0.8rem',
    fontWeight: 700,
    marginBottom: 10,
  },
  title: {
    margin: 0,
    fontSize: '2.1rem',
    color: '#111827',
    fontWeight: 900,
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#6b7280',
    fontSize: '0.98rem',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr 280px',
    gap: 20,
    alignItems: 'start',
  },
  sidebar: {
    background: '#ffffff',
    borderRadius: 24,
    padding: 18,
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
    display: 'grid',
    gap: 10,
  },
  sidebarBrand: {
    fontSize: '1rem',
    fontWeight: 800,
    color: '#4338ca',
    marginBottom: 8,
  },
  sideBtn: {
    border: 'none',
    background: '#f8fafc',
    color: '#334155',
    borderRadius: 14,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    fontWeight: 600,
    textAlign: 'left',
  },
  sideBtnActive: {
    border: 'none',
    background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
    color: '#ffffff',
    borderRadius: 14,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    fontWeight: 700,
    textAlign: 'left',
  },
  mainArea: {
    display: 'grid',
    gap: 18,
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  summaryCard: {
    background: '#ffffff',
    borderRadius: 20,
    padding: '18px 20px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
  },
  summaryValue: {
    fontSize: '1.8rem',
    fontWeight: 900,
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#64748b',
    fontWeight: 600,
    fontSize: '0.92rem',
  },
  calendarCard: {
    background: '#ffffff',
    borderRadius: 24,
    padding: 20,
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  calendarTitle: {
    margin: 0,
    fontSize: '1.3rem',
    fontWeight: 800,
    color: '#111827',
  },
  calendarSub: {
    margin: '6px 0 0',
    color: '#6b7280',
    fontSize: '0.9rem',
  },
  navRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  navBtn: {
    border: '1px solid #e5e7eb',
    background: '#fff',
    width: 40,
    height: 40,
    borderRadius: 12,
    cursor: 'pointer',
  },
  todayBtn: {
    border: 'none',
    background: '#ede9fe',
    color: '#6d28d9',
    padding: '10px 14px',
    borderRadius: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: '90px repeat(7, 1fr)',
    gap: 12,
    alignItems: 'start',
  },
  timeColumn: {
    display: 'grid',
    gap: 8,
  },
  timeHeader: {
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    color: '#475569',
    background: '#f8fafc',
    borderRadius: 14,
  },
  timeCell: {
    minHeight: 56,
    background: '#f8fafc',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    fontSize: '0.88rem',
    fontWeight: 600,
  },
  dayColumn: {
    display: 'grid',
    gap: 8,
  },
  dayHeader: {
    height: 60,
    background: '#f8fafc',
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid transparent',
  },
  todayHeader: {
    background: '#ede9fe',
    border: '1px solid #c4b5fd',
  },
  dayName: {
    fontWeight: 800,
    fontSize: '0.9rem',
    color: '#0f172a',
  },
  dayDate: {
    fontSize: '0.84rem',
    color: '#64748b',
    marginTop: 4,
  },
  dayBody: {
    minHeight: 560,
    background: '#fcfcfd',
    border: '1px solid #eef2f7',
    borderRadius: 16,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  slotBlock: {
    background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
    border: '1px solid #c7d2fe',
    borderRadius: 14,
    padding: '12px 10px',
  },
  slotBlockTitle: {
    fontWeight: 800,
    color: '#3730a3',
    fontSize: '0.86rem',
    marginBottom: 6,
  },
  slotBlockTime: {
    color: '#475569',
    fontSize: '0.82rem',
    fontWeight: 600,
  },
  noSlotText: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    textAlign: 'center',
    marginTop: 10,
  },
  rightPanel: {
    display: 'grid',
    gap: 16,
  },
  infoCard: {
    background: '#ffffff',
    borderRadius: 20,
    padding: 18,
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: '1.4rem',
    margin: '0 auto 12px',
  },
  infoName: {
    textAlign: 'center',
    fontWeight: 800,
    color: '#111827',
    marginBottom: 4,
  },
  infoDept: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.92rem',
  },
  smallTitle: {
    fontWeight: 800,
    color: '#111827',
    marginBottom: 12,
  },
  noteList: {
    margin: 0,
    paddingLeft: 18,
    color: '#475569',
    fontSize: '0.92rem',
    display: 'grid',
    gap: 8,
  },
  quickActionBtn: {
    width: '100%',
    border: 'none',
    background: '#f5f3ff',
    color: '#6d28d9',
    borderRadius: 12,
    padding: '12px 14px',
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 10,
  },
  emptyState: {
    background: '#f8fafc',
    borderRadius: 16,
    padding: 30,
    textAlign: 'center',
    color: '#64748b',
    fontWeight: 600,
  },
  errorBox: {
    background: '#fee2e2',
    color: '#b91c1c',
    borderRadius: 14,
    padding: 14,
    fontWeight: 600,
  },
};