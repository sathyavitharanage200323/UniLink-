import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Calendar, Clock, Plus, X, Video, MapPin, 
  Trash2, Edit2, AlertCircle, Ban, Search, CheckCircle, Clock3
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  getLecturerAvailability,
  createSlot,
  updateSlot,
  deleteSlot,
  blockSlot
} from '../api';
import './SlotCalendarPage.css';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SlotCalendarPage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    mode: 'Physical',
    location: '',
    meetingLink: '',
  });

  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'LECTURER') {
      navigate('/');
      return;
    }
    fetchSlots();
  }, [currentUser]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await getLecturerAvailability(currentUser.id);
      setSlots(data || []);
    } catch (err) {
      toast.error('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const selectedDateString = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD local logic sometimes fails, better to use custom formatting
  const yyyy = selectedDate.getFullYear();
  const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const dd = String(selectedDate.getDate()).padStart(2, '0');
  const selDateKey = `${yyyy}-${mm}-${dd}`;

  const todayDate = new Date();
  const tYYYY = todayDate.getFullYear();
  const tMM = String(todayDate.getMonth() + 1).padStart(2, '0');
  const tDD = String(todayDate.getDate()).padStart(2, '0');
  const todayKey = `${tYYYY}-${tMM}-${tDD}`;

  const slotsForSelectedDate = slots.filter(s => s.slotDate === selDateKey).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // --- Handlers ---
  const handleStartTimeChange = (e) => {
    const start = e.target.value;
    if (!start) {
      setFormData({ ...formData, startTime: '', endTime: '' });
      return;
    }
    const [h, m] = start.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + 10); // Add 10 minutes automatically
    const endH = String(date.getHours()).padStart(2, '0');
    const endM = String(date.getMinutes()).padStart(2, '0');
    const end = `${endH}:${endM}`;
    
    setFormData({ ...formData, startTime: start, endTime: end });
  };

  // --- Helpers ---
  const getSlotStatus = (slot) => {
    const today = new Date();
    const slotD = new Date(slot.slotDate + 'T00:00:00');
    const dateOnlyToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateOnlySlot = new Date(slotD.getFullYear(), slotD.getMonth(), slotD.getDate());

    if (slot.status === 'BLOCKED') return 'BLOCKED';
    
    if (dateOnlySlot < dateOnlyToday) return 'EXPIRED';

    if (dateOnlySlot.getTime() === dateOnlyToday.getTime()) {
      const nowStr = today.toTimeString().substring(0, 5); // HH:MM
      const slotStart = slot.startTime.substring(0, 5);
      const slotEnd = slot.endTime.substring(0, 5);
      
      if (nowStr >= slotStart && nowStr < slotEnd) return 'ONGOING';
      if (nowStr >= slotEnd) return 'EXPIRED';
    }

    return slot.status; // AVAILABLE or BOOKED
  };

  const getStatusColorClass = (status) => {
    switch(status) {
      case 'AVAILABLE': return 'slot-available';
      case 'BOOKED': return 'slot-booked';
      case 'BLOCKED': return 'slot-blocked';
      case 'EXPIRED': return 'slot-expired';
      case 'ONGOING': return 'slot-ongoing';
      default: return 'slot-default';
    }
  };

  // --- Validate Form ---
  const validateForm = () => {
    if (!formData.startTime || !formData.endTime) {
      return 'Please specify start and end times.';
    }

    if (selDateKey < todayKey) {
      return 'Cannot add availability to past dates.';
    }

    if (selDateKey === todayKey) {
      const nowTime = todayDate.toTimeString().substring(0, 5);
      if (formData.startTime < nowTime) {
        return 'Start time cannot be in the past for today.';
      }
    }

    

    

    if (formData.startTime < '07:00' || formData.endTime > '21:00') {
      return 'Slots must be scheduled between 07:00 AM and 09:00 PM.';
    }

    if (formData.endTime <= formData.startTime) {
      return 'End time must be after start time.';
    }

    if (formData.mode === 'Online' && !formData.meetingLink) return 'Meeting link is required for Online slots.';
    if (formData.mode === 'Physical' && !formData.location) return 'Location is required for Physical slots.';

    // Client-side overlap validation
    const overlap = slotsForSelectedDate.find(s => {
      if (editingSlot && s.id === editingSlot.id) return false;
      return (formData.startTime < s.endTime.substring(0,5) && formData.endTime > s.startTime.substring(0,5));
    });
    if (overlap) return 'This time slot overlaps with an existing one.';
    
    if (!editingSlot && slotsForSelectedDate.length >= 12) {
      return 'Maximum 12 slots allowed per day.';
    }

    return null;
  };

  // --- Handlers ---
  const handleSaveSlot = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      toast.error(err);
      return;
    }

    const payload = {
      slotDate: selDateKey,
      startTime: formData.startTime + ':00',
      endTime: formData.endTime + ':00',
      mode: formData.mode,
      location: formData.location,
      meetingLink: formData.meetingLink,
      status: formData.status || 'AVAILABLE'
    };

    try {
      if (editingSlot) {
        if (editingSlot.status === 'BOOKED') {
          if (!window.confirm("This slot is already booked. Restrictions apply! Do you really want to edit?")) {
            return;
          }
        }
        await updateSlot(editingSlot.id, payload);
        toast.success('Slot updated!');
      } else {
        await createSlot(currentUser.id, payload);
        toast.success('Slot created!');
      }
      setShowForm(false);
      setEditingSlot(null);
      fetchSlots();
    } catch (error) {
      toast.error(error.message || error.response?.data?.message || 'Error occurred');
    }
  };

  const handleEdit = (slot) => {
    if (slot.status === 'EXPIRED') {
      toast.error('Cannot edit expired slots.');
      return;
    }
    setEditingSlot(slot);
    setFormData({
      startTime: slot.startTime.substring(0,5),
      endTime: slot.endTime.substring(0,5),
      mode: slot.mode,
      location: slot.location || '',
      meetingLink: slot.meetingLink || '',
      status: slot.status
    });
    setShowForm(true);
  };

  const handleDelete = async (slotId) => {
    try {
      await deleteSlot(slotId);
      toast.success('Slot deleted.');
      fetchSlots();
    } catch (e) {
      toast.error(e.response?.data?.message || "Error deleting slot (Maybe it's booked)");
    }
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    if (!blockReason.trim()) {
      toast.error('Reason is required.');
      return;
    }
    try {
      await blockSlot(showBlockModal.id, blockReason);
      toast.success('Slot blocked securely.');
      setShowBlockModal(null);
      setBlockReason('');
      fetchSlots();
    } catch (e) {
      toast.error('Failed to block.');
    }
  };

  // --- Calendar Generator ---
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div className="cal-container">
      <Header currentUser={currentUser} onLogout={onLogout} />
      
      <main className="cal-main">
        <div className="cal-header">
          <div>
            <h2>Manage Timetable</h2>
            <p>Define your availability strictly. Slots cannot overlap.</p>
          </div>
          {selDateKey >= todayKey ? (
            <button className="cal-btn-primary" onClick={() => {
              setEditingSlot(null);
              setFormData({ startTime: '', endTime: '', mode: 'Physical', location: '', meetingLink: '' });
              setShowForm(true);
            }}>
              <Plus size={18} /> Add Slot for {formatDateDisplay(selDateKey)}
            </button>
          ) : (
            <button className="cal-btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Cannot add availability to past dates">
              <Plus size={18} /> Past Date Selected
            </button>
          )}
        </div>

        <div className="cal-layout">
          
          {/* Calendar Sidebar */}
          <div className="cal-sidebar">
            <div className="cal-nav">
              <button onClick={handlePrevMonth}>&lt;</button>
              <h4>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h4>
              <button onClick={handleNextMonth}>&gt;</button>
            </div>
            
            <div className="cal-grid-header">
              {dayNames.map(d => <div key={d}>{d}</div>)}
            </div>
            
            <div className="cal-grid">
              {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={'empty-'+i} className="cal-cell empty"></div>)}
              {Array.from({ length: totalDays }).map((_, i) => {
                const dText = String(i + 1).padStart(2, '0');
                const iY = currentDate.getFullYear();
                const iM = String(currentDate.getMonth() + 1).padStart(2, '0');
                const iterKey = `${iY}-${iM}-${dText}`;
                const isSelected = selDateKey === iterKey;
                const isPast = iterKey < todayKey;
                
                // Dot indicators
                const daySlots = slots.filter(s => s.slotDate === iterKey);
                
                return (
                  <div 
                    key={iterKey} 
                    className={`cal-cell ${isSelected ? 'selected' : ''} ${isPast ? 'past-cell' : ''}`} 
                    onClick={() => {
                      setSelectedDate(new Date(iY, currentDate.getMonth(), i + 1));
                      setShowForm(false); // Close form when date changes
                    }}
                    style={isPast ? { opacity: 0.6, backgroundColor: '#f8fafc' } : {}}
                  >
                    <span>{i + 1}</span>
                    <div className="cal-dots">
                      {daySlots.slice(0,3).map((ds, idx) => (
                        <div key={idx} className={`cal-dot ${getStatusColorClass(getSlotStatus(ds))}`} title={getSlotStatus(ds)}></div>
                      ))}
                      {daySlots.length > 3 && <div className="cal-dot-more">+</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="cal-legends">
              <h5>Legend</h5>
              <div className="legend-item"><span className="dot slot-available"></span> Available</div>
              <div className="legend-item"><span className="dot slot-booked"></span> Booked</div>
              <div className="legend-item"><span className="dot slot-blocked"></span> Blocked</div>
              <div className="legend-item"><span className="dot slot-expired"></span> Past/Expired</div>
              <div className="legend-item"><span className="dot slot-ongoing"></span> Ongoing</div>
            </div>
          </div>

          {/* Slot Viewer */}
          <div className="cal-content">
             <div className="content-heading">
                <h3>{formatDateDisplay(selDateKey)}</h3>
                <span className="slot-count">{slotsForSelectedDate.length} slots</span>
             </div>

             {showForm && (
               <div className="slot-form-card overlay-card">
                 <h4>{editingSlot ? 'Edit Slot' : 'Create New Slot'}</h4>
                 <form onSubmit={handleSaveSlot}>
                   <div className="form-row">
                     <div className="form-group">
                       <label>Start Time</label>
                       <input type="time" value={formData.startTime} onChange={handleStartTimeChange} required />
                     </div>
                     <div className="form-group">
                       <label>End Time</label>
                       <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} required />
                     </div>
                     <div className="form-group">
                       <label>Mode</label>
                       <select value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})}>
                         <option>Physical</option>
                         <option>Online</option>
                       </select>
                     </div>
                   </div>
                   
                   {formData.mode === 'Physical' ? (
                     <div className="form-group full-w">
                       <label>Location(Room/Hall)</label>
                       <div className="input-with-icon">
                         <MapPin size={16} />
                         <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. A405" required={formData.mode === 'Physical'}/>
                       </div>
                     </div>
                   ) : (
                     <div className="form-group full-w">
                       <label>Meeting Link</label>
                       <div className="input-with-icon">
                         <Video size={16} />
                         <input type="url" value={formData.meetingLink} onChange={e => setFormData({...formData, meetingLink: e.target.value})} placeholder="https://zoom.us/..." required={formData.mode === 'Online'}/>
                       </div>
                     </div>
                   )}
                   
                   <div className="form-tips">
                     <AlertCircle size={14}/> <strong>Tip:</strong> Keep a 15-min gap between consecutive slots.
                   </div>

                   <div className="form-actions">
                     <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                     <button type="submit" className="btn-save">Save Slot</button>
                     {editingSlot && editingSlot.status !== 'BOOKED' && (
                       <button type="button" className="btn-delete" onClick={() => handleDelete(editingSlot.id)}>Delete</button>
                     )}
                   </div>
                 </form>
               </div>
             )}

             <div className="slots-list">
               {slotsForSelectedDate.length === 0 ? (
                 <div className="empty-state">
                   <Clock3 size={40} className="empty-icon" />
                   <p>No availability added perfectly for this day.</p>
                 </div>
               ) : (
                 slotsForSelectedDate.map(slot => {
                   const sStat = getSlotStatus(slot);
                   return (
                     <div key={slot.id} className={`slot-card border-${sStat.toLowerCase()}`}> 
                       <div className={`slot-ribbon b-${sStat.toLowerCase()}`}></div>
                       <div className="slot-info">
                         <div className="slot-times">
                           {slot.startTime.substring(0,5)} - {slot.endTime.substring(0,5)}
                           <span className={`badge badge-${sStat.toLowerCase()}`}>{sStat}</span>
                         </div>
                         <div className="slot-meta">
                           {slot.mode === 'Online' ? <><Video size={14}/> {slot.meetingLink}</> : <><MapPin size={14}/> {slot.location}</>}
                         </div>
                         {sStat === 'BLOCKED' && slot.blockReason && (
                           <div className="slot-meta alert-text"><Ban size={14} /> Reason: {slot.blockReason}</div>
                         )}
                       </div>
                       
                       <div className="slot-actions">
                         {sStat !== 'EXPIRED' && sStat !== 'BLOCKED' && (
                            <button onClick={() => handleEdit(slot)} title="Edit Slot" className="icon-btn">
                              <Edit2 size={16} />
                            </button>
                         )}
                         {(sStat === 'AVAILABLE' || sStat === 'BOOKED') && (
                            <button onClick={() => setShowBlockModal(slot)} title="Emergency Block" className="icon-btn btn-danger">
                              <Ban size={16} />
                            </button>
                         )}
                         {sStat === 'AVAILABLE' && (
                            <button onClick={() => handleDelete(slot.id)} title="Delete Slot" className="icon-btn btn-trash">
                              <Trash2 size={16} />
                            </button>
                         )}
                       </div>
                     </div>
                   )
                 })
               )}
             </div>
          </div>
        </div>
      </main>

      {/* Block Reason Modal */}
      {showBlockModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Block this Slot?</h4>
            <p>Blocking should only occur for emergency. Are you sure?</p>
            <form onSubmit={handleBlockSubmit}>
               <textarea 
                 value={blockReason} 
                 onChange={e=>setBlockReason(e.target.value)} 
                 placeholder="Enter block reason (e.g. Emergency Meeting)"
                 rows="3"
                 required
               ></textarea>
               <div className="modal-actions">
                 <button type="button" className="btn-cancel" onClick={() => setShowBlockModal(null)}>Cancel</button>
                 <button type="submit" className="btn-danger-solid">Block Now</button>
               </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function formatDateDisplay(dateString) {
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

