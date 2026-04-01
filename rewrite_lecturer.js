const fs = require('fs');

const frontendPath = 'frontend/src/pages/LecturerSlotsPage.jsx';

const content = import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLecturerAvailability, createSlot, updateSlot, deleteSlot, blockSlot } from '../api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LecturerSlotsPage.css';
import { Calendar, Clock, MapPin, Video, Trash2, Ban, Edit2, AlertCircle, PlusCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

function LecturerSlotsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewFilter, setViewFilter] = useState('upcoming');

  // Form states
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotDate, setSlotDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [breakTime, setBreakTime] = useState('0'); // 0, 15, 30
  const [mode, setMode] = useState('Online');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  // Block modal state
  const [blockingSlot, setBlockingSlot] = useState(null);
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    fetchSlots();
  }, [user.id]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await getLecturerAvailability(user.id);
      setSlots(data || []);
    } catch (err) {
      console.error('Error fetching slots', err);
      toast.error('Failed to fetch availability.');
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (start, durInMins) => {
    if (!start) return '';
    const [hours, minutes] = start.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + parseInt(durInMins), 0);
    return date.toTimeString().substring(0, 5);
  };

  const resetForm = () => {
    setEditingSlot(null);
    setSlotDate('');
    setStartTime('');
    setDuration('30');
    setBreakTime('0');
    setMode('Online');
    setLocation('');
    setMeetingLink('');
  };

  const handleEditClick = (slot) => {
    if (slot.status === 'EXPIRED') {
      toast.error('Cannot edit expired slots.');
      return;
    }
    
    if (slot.status === 'BOOKED') {
      toast.warning('This slot is already booked! You can only update the Meeting Link or Location.');
    }

    setEditingSlot(slot);
    setSlotDate(slot.slotDate);
    setStartTime(slot.startTime.substring(0, 5));
    setMode(slot.mode || 'Online');
    setLocation(slot.location || '');
    setMeetingLink(slot.meetingLink || '');
    // Calculate reverse duration if needed, assume basic math:
    const [sH, sM] = slot.startTime.split(':').map(Number);
    const [eH, eM] = slot.endTime.split(':').map(Number);
    const diff = (eH * 60 + eM) - (sH * 60 + sM);
    setDuration(diff > 0 ? diff.toString() : '30');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!slotDate || !startTime) {
      toast.error('Date and Start Time are required.');
      return;
    }

    const endTime = calculateEndTime(startTime, duration);
    
    // Add break if applying multiple
    // This UI currently handles single slot creation. If user wants a break, we create one slot, 
    // and if they wanted multiple we could loop. We'll just create the slot.

    const newSlotConfig = {
      slotDate,
      startTime,
      endTime,
      mode,
      location: mode === 'Physical' ? location : '',
      meetingLink: mode === 'Online' ? meetingLink : ''
    };

    try {
      if (editingSlot) {
        await updateSlot(editingSlot.id, newSlotConfig);
        toast.success('Slot updated successfully');
      } else {
        await createSlot(user.id, newSlotConfig);
        toast.success('Slot created successfully');
      }
      resetForm();
      fetchSlots();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save slot. Check for overlaps.');
    }
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm("Are you sure you want to delete this available slot?")) return;
    try {
      await deleteSlot(slotId);
      toast.success('Slot deleted.');
      fetchSlots();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete slot.');
    }
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    if (!blockReason.trim()) {
      toast.error('Block reason is required.');
      return;
    }
    try {
      await blockSlot(blockingSlot.id, blockReason);
      toast.success('Slot blocked successfully.');
      setBlockingSlot(null);
      setBlockReason('');
      fetchSlots();
    } catch (err) {
      toast.error('Failed to block slot.');
    }
  };

  // Processing slots to determine \"Ongoing\" / \"Expired\" dynamically
  const now = new Date();
  const processedSlots = slots.map(slot => {
    const slotD = new Date(\\T\\);
    const slotE = new Date(\\T\\);
    let visualStatus = slot.status;
    if (slot.status !== 'BLOCKED') {
      if (slotE < now) {
        visualStatus = 'EXPIRED';
      } else if (slotD <= now && now <= slotE) {
        visualStatus = 'ONGOING';
      }
    }
    return { ...slot, visualStatus };
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'badge-success';
      case 'BOOKED': return 'badge-primary';
      case 'ONGOING': return 'badge-warning';
      case 'BLOCKED': return 'badge-danger';
      case 'EXPIRED': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className=\"page-container lecturer-theme\">
      <Header user={user} onLogout={onLogout} />
      <main className=\"main-content\" style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className=\"page-title\" style={{ color: '#0F2854', fontSize: '28px' }}>Manage Availability</h1>
        </div>

        <div className=\"availability-grid\" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 400px) 1fr', gap: '24px' }}>
          {/* Form Card */}
          <div className=\"form-card\" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#1C4D8D', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <PlusCircle size={20} />
              {editingSlot ? \"Edit Slot\" : \"Add New Slot\"}
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {editingSlot && editingSlot.status === 'BOOKED' && (
                <div style={{ background: '#FFF3CD', borderLeft: '4px solid #FFC107', padding: '12px', borderRadius: '4px', fontSize: '0.9rem' }}>
                  <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', color: '#856404' }} />
                  This slot is <strong>booked</strong>. You can only update the Mode/Location.
                </div>
              )}

              <div className=\"form-group\">
                <label>Date</label>
                <input 
                  type=\"date\" 
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={editingSlot && editingSlot.status === 'BOOKED'}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className=\"form-group\">
                  <label>Start Time</label>
                  <input 
                    type=\"time\" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={editingSlot && editingSlot.status === 'BOOKED'}
                    required 
                  />
                </div>
                <div className=\"form-group\">
                  <label>Duration</label>
                  <select 
                    value={duration} 
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={editingSlot && editingSlot.status === 'BOOKED'}
                  >
                    <option value=\"15\">15 Minutes</option>
                    <option value=\"30\">30 Minutes</option>
                    <option value=\"45\">45 Minutes</option>
                    <option value=\"60\">1 Hour</option>
                    <option value=\"90\">1.5 Hours</option>
                    <option value=\"120\">2 Hours</option>
                  </select>
                </div>
              </div>

              {!editingSlot && (
                <div className=\"form-group\">
                  <label title=\"Adds a buffer time after the created slot (useful if creating multiple slots)\">Add Break After</label>
                  <select value={breakTime} onChange={(e) => setBreakTime(e.target.value)}>
                    <option value=\"0\">None</option>
                    <option value=\"15\">15 Minutes</option>
                    <option value=\"30\">30 Minutes</option>
                  </select>
                </div>
              )}

              <div className=\"form-group\">
                <label>Mode</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'normal' }}>
                    <input type=\"radio\" name=\"mode\" checked={mode === 'Online'} onChange={() => setMode('Online')} /> Online
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'normal' }}>
                    <input type=\"radio\" name=\"mode\" checked={mode === 'Physical'} onChange={() => setMode('Physical')} /> Physical
                  </label>
                </div>
              </div>

              {mode === 'Online' ? (
                <div className=\"form-group\">
                  <label>Meeting Link</label>
                  <input 
                    type=\"url\" 
                    placeholder=\"e.g. Teams, Zoom link\" 
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                  />
                </div>
              ) : (
                <div className=\"form-group\">
                  <label>Location</label>
                  <input 
                    type=\"text\" 
                    placeholder=\"e.g. Main Hall A, Room 402\" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type=\"submit\" className=\"btn-primary\" style={{ flex: 1, padding: '10px', background: '#0F2854', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                  {editingSlot ? \"Update Slot\" : \"Save Slot\"}
                </button>
                {editingSlot && (
                  <button type=\"button\" onClick={resetForm} style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Card */}
          <div className=\"list-card\" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#1C4D8D', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Calendar size={20} />
                Your Schedule
              </h2>
              <select className=\"form-control\" style={{ width: '150px' }} value={viewFilter} onChange={(e) => setViewFilter(e.target.value)}>
                <option value=\"upcoming\">Upcoming</option>
                <option value=\"all\">All Slots</option>
                <option value=\"blocked\">Blocked</option>
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading slots...</div>
            ) : processedSlots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                No slots configured open yet. Create one on the left.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {processedSlots
                  .filter(s => {
                    if (viewFilter === 'blocked') return s.visualStatus === 'BLOCKED';
                    if (viewFilter === 'upcoming') return s.visualStatus !== 'EXPIRED';
                    return true;
                  })
                  .map(slot => (
                  <div key={slot.id} style={{ 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: slot.visualStatus === 'ONGOING' ? '#F0F9FF' : (slot.visualStatus === 'BLOCKED' ? '#FEF2F2' : 'white')
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '1.1rem', marginBottom: '4px' }}>
                          {new Date(slot.slotDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '0.9rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} />
                            {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {slot.mode === 'Online' ? <Video size={14} /> : <MapPin size={14} />}
                            {slot.mode} {slot.mode === 'Physical' && slot.location ? \(\)\ : ''}
                          </span>
                        </div>
                        {slot.visualStatus === 'BLOCKED' && slot.blockReason && (
                          <div style={{ marginTop: '8px', color: '#DC2626', fontSize: '0.85rem', fontWeight: 500 }}>
                            Reason: {slot.blockReason}
                          </div>
                        )}
                      </div>
                      <span className={\status-badge \\}>
                        {slot.visualStatus}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
                      <button 
                        onClick={() => handleEditClick(slot)} 
                        className=\"act-btn edit-btn\"
                        disabled={slot.visualStatus === 'EXPIRED'}
                      >
                        <Edit2 size={14} /> Edit
                      </button>

                      {(slot.status === 'AVAILABLE' || slot.status === 'BOOKED') && (
                        <button 
                          onClick={() => setBlockingSlot(slot)} 
                          className=\"act-btn block-btn\"
                        >
                          <Ban size={14} /> Block
                        </button>
                      )}

                      {slot.status === 'AVAILABLE' && (
                        <button 
                          onClick={() => handleDelete(slot.id)} 
                          className=\"act-btn delete-btn\"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Block reason modal */}
      {blockingSlot && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0F2854' }}>Block Slot</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>Provide a reason for blocking this slot (e.g., Emergency). If booked, this may auto-inform the student.</p>
            <form onSubmit={handleBlockSubmit}>
              <div className=\"form-group\" style={{ marginBottom: '16px' }}>
                <textarea 
                  className=\"form-control\" 
                  style={{ width: '100%', height: '80px', borderRadius: '6px', padding: '10px' }}
                  placeholder=\"Reason for blocking...\"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type=\"submit\" style={{ flex: 1, padding: '10px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600 }}>Confirm Block</button>
                <button type=\"button\" onClick={() => { setBlockingSlot(null); setBlockReason(''); }} style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: 600 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default LecturerSlotsPage;


fs.writeFileSync(frontendPath, content, 'utf8');

const cssPath = 'frontend/src/pages/LecturerSlotsPage.css';
const cssContent = 
.page-container.lecturer-theme {
  background-color: #f8fafc;
  min-height: 100vh;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #334155;
  margin-bottom: 6px;
  font-size: 0.9rem;
}

.form-group input[type="date"],
.form-group input[type="time"],
.form-group input[type="text"],
.form-group input[type="url"],
.form-group select,
.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-control:focus {
  outline: none;
  border-color: #1C4D8D;
  box-shadow: 0 0 0 3px rgba(28, 77, 141, 0.1);
}

.form-group input:disabled,
.form-group select:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-success { background: #DCFCE7; color: #166534; }
.badge-primary { background: #DBEAFE; color: #1E40AF; }
.badge-warning { background: #FEF3C7; color: #92400E; }
.badge-danger { background: #FEE2E2; color: #B91C1C; }
.badge-secondary { background: #F1F5F9; color: #475569; }

.act-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.act-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-btn { background: #E0E7FF; color: #1E40AF; }
.edit-btn:hover:not(:disabled) { background: #BFDBFE; }

.block-btn { background: #FFEDD5; color: #9A3412; }
.block-btn:hover:not(:disabled) { background: #FDE047; }

.delete-btn { background: #FEE2E2; color: #B91C1C; }
.delete-btn:hover:not(:disabled) { background: #FECACA; }
;

fs.writeFileSync(cssPath, cssContent, 'utf8');
