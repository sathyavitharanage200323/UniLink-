import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLecturerAvailability, updateLecturerAvailability } from '../api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LecturerSlotsPage.css';
import './LecturerHome.css';
import { Calendar, Clock, Users, BookOpen } from 'lucide-react';

function LecturerSlotsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [slotDate, setSlotDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewFilter, setViewFilter] = useState('upcoming');

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await getLecturerAvailability(user.id);
      setSlots(data || []);
    } catch (err) {
      console.error('Error fetching slots', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (start) => {
    if (!start) return '';
    const [hours, minutes] = start.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + 30, 0);
    return date.toTimeString().substring(0, 5);
  };

  const handleStartTimeChange = (e) => {
    const start = e.target.value;
    setStartTime(start);
    setEndTime(calculateEndTime(start));
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!slotDate || !startTime || !endTime) {
      alert('Please fill out all fields.');
      return;
    }

    const newSlot = {
      slotDate,
      startTime,
      endTime,
      available: true
    };

    // Keep existing slots and add the new one
    const updatedSlots = [...slots, newSlot];

    try {
      await updateLecturerAvailability(user.id, updatedSlots);
      setSlotDate('');
      setStartTime('');
      setEndTime('');
      fetchSlots();
      alert('Slot added successfully!');
    } catch (err) {
      console.error('Error adding slot', err);
      alert('Failed to add slot.');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Are you sure you want to remove this slot?")) return;
    try {
      const updatedSlots = slots.filter(s => s.id !== slotId);
      await updateLecturerAvailability(user.id, updatedSlots);
      fetchSlots();
    } catch (err) {
      console.error('Error deleting slot', err);
      alert('Failed to delete slot.');
    }
  };

  // Group slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.slotDate]) acc[slot.slotDate] = [];
    acc[slot.slotDate].push(slot);
    return acc;
  }, {});

  const generateTimeOptions = () => {
    const times = [];
    for (let h = 9; h <= 20; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        times.push(`${hh}:${mm}`);
      }
    }
    return times;
  };

  const initials = (user?.name ?? 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="lh-layout">
      <Header currentUser={user} onLogout={onLogout} />
      <main className="lh-main">
        <section className="lh-hero">
          <div className="lh-hero__inner">
            <div className="lh-hero__text">
              <div className="lh-hero__badge">
                <Calendar size={13} style={{ marginRight: '6px' }} /> Available Slot Management
              </div>
              <h1 className="lh-hero__name">My Available Slots</h1>
              <p className="lh-hero__dept" style={{ opacity: 0.9, maxWidth: '600px', marginBottom: '24px' }}>
                Set your availability for student appointments by adding specific time slots.
              </p>
              <div className="lh-hero__actions">
                <button className="lh-btn lh-btn--outline" onClick={() => navigate('/lecturer/home')} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                  ? Back to Home
                </button>
              </div>
            </div>
            <div className="lh-hero__visual">
              <div className="lh-hero__avatar-ring">{initials}</div>
              <div className="lh-hero__role-tag">
                <BookOpen size={13} /> {user?.name} � {user?.department ?? 'IT'}
              </div>
            </div>
          </div>
        </section>

        <div className="lh-container" style={{ marginTop: '-40px', position: 'relative', zIndex: 10 }}>
          <div className="lh-quick-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: '1000px', margin: '0 auto', gap: '20px' }}>
            <div className="lh-stat-card" style={{ background: 'white', padding: '24px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div className="lh-stat-icon" style={{ background: '#f3e8ff', color: '#a855f7', width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={28} />
              </div>
              <div>
                <div className="lh-stat-value" style={{ fontSize: '2rem', fontWeight: 800 }}>30m</div>
                <div className="lh-stat-label" style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>Slot Duration</div>
              </div>
            </div>
            
            <div className="lh-stat-card" style={{ background: 'white', padding: '24px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div className="lh-stat-icon" style={{ background: '#dcfce7', color: '#22c55e', width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={28} />
              </div>
              <div>
                <div className="lh-stat-value" style={{ fontSize: '2rem', fontWeight: 800 }}>{slots.length}</div>
                <div className="lh-stat-label" style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>Total Slots</div>
              </div>
            </div>
            
            <div className="lh-stat-card" style={{ background: 'white', padding: '24px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div className="lh-stat-icon" style={{ background: '#e0f2fe', color: '#3b82f6', width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={28} />
              </div>
              <div>
                <div className="lh-stat-value" style={{ fontSize: '2rem', fontWeight: 800 }}>{slots.filter(s => !s.available).length}</div>
                <div className="lh-stat-label" style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>Booked Slots</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lh-container lh-content-grid" style={{ paddingTop: '32px', maxWidth: '1200px', margin: '0 auto', gap: '30px' }}>
          
          <section className="lh-card">
            <div className="lh-card__header">
              <h2><Calendar size={18} style={{ color: '#7c3aed' }} /> Add New Slot</h2>
            </div>
            <div className="lh-card__body" style={{ padding: '24px' }}>
              <div className="note-box" style={{ background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '16px', marginBottom: '24px', color: '#6b21a8', fontSize: '0.9rem' }}>
                Here you can add your availability slots. By default, <strong>appointment duration is 30 minutes</strong>.
                There will be a 15-minute gap between consecutive slot options.
              </div>

              <form onSubmit={handleAddSlot}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#334155' }}>Date</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="time-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#334155' }}>Start Time</label>
                    <select 
                      className="form-control" 
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: 'white' }}
                      value={startTime} 
                      onChange={handleStartTimeChange} 
                      required
                    >
                      <option value="" disabled>Select time</option>
                      {generateTimeOptions().map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#334155' }}>End Time</label>
                    <input
                      type="time"
                      className="form-control"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: '#f8fafc', color: '#94a3b8' }}
                      value={endTime}
                      disabled
                    />
                  </div>
                </div>

                <div className="rule-box" style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '0.9rem', color: '#475569' }}>
                  <p style={{ margin: '0 0 6px 0' }}><strong>Lecturer Name:</strong> {user?.name}</p>
                  <p style={{ margin: '0 0 6px 0' }}><strong>Duration:</strong> 30 min / appointment</p>
                  <p style={{ margin: 0 }}><strong>Rule:</strong> Automatically checks for conflicts</p>
                </div>

                <div className="form-actions" style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="submit" 
                    className="lh-btn lh-btn--primary"
                    style={{ flex: 1, padding: '12px', fontSize: '1rem' }}
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Slot'}
                  </button>
                  <button 
                    type="button" 
                    className="lh-btn lh-btn--outline"
                    style={{ flex: 1, padding: '12px', fontSize: '1rem' }}
                    onClick={() => {
                      setSlotDate('');
                      setStartTime('');
                      setEndTime('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="lh-card">
            <div className="lh-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2><Clock size={18} style={{ color: '#0ea5e9' }} /> Available Slots</h2>
              <div className="filter-tabs" style={{ display: 'flex', background: '#f1f5f9', borderRadius: '999px', padding: '4px' }}>
                <button 
                  style={{ padding: '4px 12px', borderRadius: '999px', border: 'none', background: viewFilter === 'upcoming' ? 'white' : 'transparent', color: viewFilter === 'upcoming' ? '#0f172a' : '#64748b', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', boxShadow: viewFilter === 'upcoming' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                  onClick={() => setViewFilter('upcoming')}
                >
                  Upcoming
                </button>
                <button 
                  style={{ padding: '4px 12px', borderRadius: '999px', border: 'none', background: viewFilter === 'past' ? 'white' : 'transparent', color: viewFilter === 'past' ? '#0f172a' : '#64748b', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', boxShadow: viewFilter === 'past' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                  onClick={() => setViewFilter('past')}
                >
                  Past
                </button>
              </div>
            </div>
            <div className="lh-card__body" style={{ padding: '24px', maxHeight: '500px', overflowY: 'auto' }}>
              {Object.keys(groupedSlots).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', margin: '40px 0' }}>
                  No slots found. Start by adding one.
                </div>
              ) : (
                Object.keys(groupedSlots).sort().map(dateStr => (
                  <div key={dateStr} className="list-date-group" style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '1rem', color: '#1e293b', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={15} color="#64748b" /> 
                      {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h4>
                    {groupedSlots[dateStr].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(slot => (
                      <div key={slot.id || (dateStr+slot.startTime)} className="slot-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', marginBottom: '8px', border: '1px solid #f1f5f9' }}>
                        <div>
                          <div className="slot-time" style={{ fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} color="#64748b" /> {slot.startTime} - {slot.endTime}
                          </div>
                          <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, marginTop: '6px', background: !slot.available ? '#fee2e2' : '#dcfce7', color: !slot.available ? '#ef4444' : '#166534' }}>
                            {!slot.available ? 'Booked' : 'Available'}
                          </div>
                        </div>
                        {slot.available && (
                          <button 
                            style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.2rem' }}
                            title="Remove Slot" 
                            onClick={() => handleDeleteSlot(slot.id)}
                            onMouseOver={(e) => e.currentTarget.style.background = '#fecaca'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#fee2e2'}
                          >
                            �
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
export default LecturerSlotsPage;
