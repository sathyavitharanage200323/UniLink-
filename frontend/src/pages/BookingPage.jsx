import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUsersByRole, getUser, getLecturerAvailableSlots, createAppointment } from '../api';
import './BookingPage.css'; // Utilizing the booking CSS styles
import Header from '../components/Header';
import Footer from '../components/Footer';

function BookingPage({ user, onLogout }) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const initialLecturerId = queryParams.get('lecturerId');

  const [lecturers, setLecturers] = useState([]);
  const [selectedLecturerId, setSelectedLecturerId] = useState(initialLecturerId || '');
  const [lecturer, setLecturer] = useState(null);

  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    // Fetch all lecturers so student can pick one
    const fetchLecturers = async () => {
      try {
        const lecs = await getUsersByRole('LECTURER');
        setLecturers(lecs || []);
      } catch (err) {
        console.error('Error fetching lecturers', err);
      }
    };
    fetchLecturers();
  }, []);

  useEffect(() => {
    if (!selectedLecturerId) {
      setLecturer(null);
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    const fetchLecturerData = async () => {
      try {
        const lecData = await getUser(selectedLecturerId);
        setLecturer(lecData);
        const slotsData = await getLecturerAvailableSlots(selectedLecturerId);
        setSlots(slotsData || []);
        setSelectedSlot(null); // Reset slot across lecturer change
      } catch (err) {
        console.error('Error fetching lecturer data', err);
      }
    };
    fetchLecturerData();
  }, [selectedLecturerId]);

  const handleBook = async () => {
    setBookingError('');
    if (!selectedLecturerId) {
      setBookingError('Please select a lecturer first.');
      return;
    }
    if (!selectedSlot) {
      setBookingError('Please select a time slot first.');
      return;
    }

    const trimmedNotes = notes.trim();
    if (!trimmedNotes) {
      setBookingError('Please provide a reason for the appointment.');
      return;
    }
    if (trimmedNotes.length < 10) {
      setBookingError('Please provide at least 10 characters for the reason.');
      return;
    }

    setLoading(true);
    try {
      await createAppointment({
        studentId: user.id,
        lecturerId: Number(selectedLecturerId),
        startTime: `${selectedSlot.slotDate}T${selectedSlot.startTime.substring(0,5)}:00`,
        endTime: `${selectedSlot.slotDate}T${selectedSlot.endTime.substring(0,5)}:00`,
        notes: trimmedNotes
      });
      setBookingError('');
      alert('Appointment booked successfully! Wait for lecturer confirmation.');
      navigate('/student/home');
    } catch (err) {
      console.error('Error booking appointment', err);
      setBookingError(err?.message || 'Failed to book appointment.');
    } finally {
      setLoading(false);
    }
  };

  // Filter slots for the selected date - must be available and not in the past
  const slotsForDate = slots.filter(s => {
    if (s.slotDate !== selectedDate) return false;
    if (s.status !== 'AVAILABLE') return false;
    
    // Time filter for today
    const today = new Date();
    const tYYYY = today.getFullYear();
    const tMM = String(today.getMonth() + 1).padStart(2, '0');
    const tDD = String(today.getDate()).padStart(2, '0');
    const todayKey = `${tYYYY}-${tMM}-${tDD}`;

    if (s.slotDate === todayKey) {
      const nowTime = today.toTimeString().substring(0, 5);
      if (s.startTime.substring(0,5) <= nowTime) return false;
    }
    return true;
  });

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header currentUser={user} onLogout={onLogout} />
      <div className="calendar-container" style={{ flex: 1 }}>
        <div className="calendar-header">
          <div className="calendar-header-content">
            <button className="btn-back" onClick={() => navigate('/student/home')}>← Back to Home</button>
            <br /><br />
            <span className="header-badge">📅 Book an Appointment</span>
            <h1>Smart Availability Calendar</h1>
            <p>Select a lecturer and a date to view their available time slots.</p>
          </div>
        </div>

        <div className="calendar-layout">
          <div className="left-column">
            
            {/* Lecturer Picker */}
            <div className="date-picker-card" style={{ marginBottom: '24px' }}>
              <h3>Select Lecturer</h3>
              <div className="date-input-wrapper">
                <select 
                  className="calendar-date-input"
                  value={selectedLecturerId} 
                  onChange={(e) => setSelectedLecturerId(e.target.value)}
                  style={{ width: '100%', padding: '10px' }}
                >
                  <option value="">-- Choose a Lecturer --</option>
                  {lecturers.map(l => (
                    <option key={l.id} value={l.id}>{l.name} - {l.email}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedLecturerId && lecturer && (
              <>
                <div className="lecturer-info-card" style={{ marginBottom: '24px' }}>
                  <div className="lecturer-avatar">{lecturer.name?.[0] || 'L'}</div>
                  <h4>{lecturer.name}</h4>
                  <p>{lecturer.email}</p>
                </div>
                
                <div className="date-picker-card">
                  <h3>Select Date</h3>
                  <div className="date-input-wrapper">
                    <input 
                      type="date" 
                      className="calendar-date-input" 
                      value={selectedDate} 
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(null);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {selectedSlot && (
                  <div className="date-picker-card" style={{ marginTop: '24px', textAlign: 'left' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Booking Details</h3>
                    <div className="date-input-wrapper">
                      <label>Reason for meeting</label>
                      <textarea
                        className="calendar-date-input"
                        rows="3"
                        placeholder="E.g., Need help with Chapter 3 assignment"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ resize: 'vertical' }}
                      ></textarea>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

          <div className="slots-display-card">
            {!selectedLecturerId ? (
               <div className="empty-state">
                 <div className="empty-icon">👨‍🏫</div>
                 <h3>No Lecturer Selected</h3>
                 <p>Please select a lecturer from the dropdown to view available slots.</p>
               </div>
            ) : (
              <>
                <div className="slots-display-header">
                  <h3>Available Slots</h3>
                  <span className="slots-date-badge">{formattedDate}</span>
                </div>

                {slotsForDate.length > 0 ? (
                  <div className="slots-grid">
                    {slotsForDate.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(slot => (
                      <button 
                        key={slot.id} 
                        className={`slot-btn ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <span className="slot-time">{slot.startTime.substring(0,5)}</span>
                        <span className="slot-duration">
                           {slot.mode === 'Online' ? '🌐 Online' : '🏢 ' + (slot.location || 'Physical')}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">⏳</div>
                    <h3>No available slots</h3>
                    <p>The lecturer has not added any open availability for this date.</p>
                  </div>
                )}

                {selectedSlot && (
                  <div className="booking-action-bar">
                    <div className="selected-info">
                      <span>Selected Time</span>
                      <strong>{selectedSlot.startTime.substring(0,5)} - {selectedSlot.endTime.substring(0,5)}</strong>
                    </div>
                    <button className="btn-book" onClick={handleBook} disabled={loading || !notes.trim()}>
                      {loading ? 'Booking...' : (notes.trim() ? 'Confirm Booking' : 'Enter reason')}
                    </button>
                  </div>
                )}

                {bookingError && (
                  <div className="empty-state" style={{ marginTop: '16px', borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
                    <h3 style={{ color: '#b91c1c' }}>Booking failed</h3>
                    <p style={{ color: '#7f1d1d' }}>{bookingError}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default BookingPage;
