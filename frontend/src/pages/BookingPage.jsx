import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getUser, getLecturerAvailableSlots, createAppointment } from '../api';
import './SlotCalendarPage.css'; // Utilizing the calendar CSS styles
import Header from '../components/Header';
import Footer from '../components/Footer';

function BookingPage({ user, onLogout }) {
  const navigate = useNavigate();
  // Trying both depending on how routing is set up
  const { lecturerId: paramId } = useParams();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const lecturerId = paramId || queryParams.get('lecturerId');

  const [lecturer, setLecturer] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Booking Form State
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lecturerId) {
      alert("No lecturer specified!");
      navigate('/student-home');
      return;
    }

    const fetchData = async () => {
      try {
        const lecData = await getUser(lecturerId);
        setLecturer(lecData);
        // Only fetch available slots
        const slotsData = await getLecturerAvailableSlots(lecturerId);
        setSlots(slotsData || []);
      } catch (err) {
        console.error("Error fetching lecturer data", err);
      }
    };
    fetchData();
  }, [lecturerId, navigate]);

  const handleBook = async () => {
    if (!selectedSlot) return;

    if (!notes.trim()) {
      alert("Please provide a reason for the appointment.");
      return;
    }

    setLoading(true);
    try {
      await createAppointment({
        studentId: user.id,
        lecturerId: lecturerId,
        startTime: `${selectedSlot.slotDate}T${selectedSlot.startTime.substring(0,5)}:00`,
        endTime: `${selectedSlot.slotDate}T${selectedSlot.endTime.substring(0,5)}:00`,
        notes: notes
      });
      alert('Appointment booked successfully! Wait for lecturer confirmation.');
      navigate('/student-home');
    } catch (err) {
      console.error('Error booking appointment', err);
      alert('Failed to book appointment.');
    } finally {
      setLoading(false);
    }
  };

  // Filter slots for the selected date - must be available
  const slotsForDate = slots.filter(s => s.slotDate === selectedDate && s.available);

  // Helper date formatter
  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header currentUser={user} onLogout={onLogout} />
      <div className="calendar-container" style={{ flex: 1 }}>
        <div className="calendar-header">
          <div className="calendar-header-content">            <button className="btn-back" onClick={() => navigate('/student/home')}>← Back to Home</button>
            <br /><br />            <span className="header-badge">?? Book an Appointment</span>
            <h1>Smart Availability Calendar</h1>
            <p>Select a date to view {lecturer?.name || 'the lecturer'}'s available time slots, then proceed to book your session.</p>
          </div>
        </div>

        <div className="calendar-layout">
          {/* Left Column: Date Picker & Info */}
          <div className="left-column">
            <div className="date-picker-card">
              <h3>Select Date</h3>
              <div className="date-input-wrapper">
                <input 
                  type="date" 
                  className="calendar-date-input" 
                  value={selectedDate} 
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot(null); // reset slot when date changes
                  }}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="lecturer-info-card">
              <div className="lecturer-avatar">{lecturer?.name?.[0] || 'L'}</div>
              <h4>{lecturer?.name || 'Loading...'}</h4>
              <p>{lecturer?.email || 'N/A'}</p>
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
          </div>

          {/* Right Column: Slots display */}
          <div className="slots-display-card">
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
                    <span className="slot-time">{slot.startTime}</span>
                    <span className="slot-duration">30 min</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">?</div>
                <h3>No empty slots on this date</h3>
                <p>The lecturer has not added availability for {formattedDate}, or all slots are booked.</p>
              </div>
            )}

            {selectedSlot && (
              <div className="booking-action-bar">
                <div className="selected-info">
                  <span>Selected Time</span>
                  <strong>{selectedSlot.startTime} - {selectedSlot.endTime}</strong>
                </div>
                <button className="btn-book" onClick={handleBook} disabled={loading || !notes.trim()}>
                  {loading ? 'Booking...' : (notes.trim() ? 'Confirm Booking' : 'Enter reason to book')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default BookingPage;
