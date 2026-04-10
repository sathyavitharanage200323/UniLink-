import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Calendar, Clock, User, AlertCircle, CheckCircle,
  XCircle, RefreshCw, Zap, MessageSquare, Archive, Filter,
  ChevronDown, ChevronUp, Loader2, Video, MapPin
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosInstance';
import './LecturerSchedulePage.css';

/* â”€â”€â”€ Priority Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function PriorityBadge({ isHighPriority }) {
  if (!isHighPriority) return null;
  return (
    <span className="lsp-priority-badge">
      <Zap size={11} /> HIGH PRIORITY
    </span>
  );
}

/* â”€â”€â”€ Status Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StatusBadge({ status }) {
  const config = {
    PENDING: { label: 'Pending', icon: Clock, color: '#ea580c' },
    CONFIRMED: { label: 'Confirmed', icon: CheckCircle, color: '#16a34a' },
    CANCELLED: { label: 'Cancelled', icon: XCircle, color: '#dc2626' },
    COMPLETED: { label: 'Completed', icon: Archive, color: '#6b7280' },
  };
  const { label, icon: Icon, color } = config[status] || config.PENDING;
  return (
    <span className="lsp-status-badge" style={{ color, borderColor: color }}>
      <Icon size={12} /> {label}
    </span>
  );
}

/* â”€â”€â”€ Appointment Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function AppointmentCard({ appointment, onAction, isExpanded, onToggle, onRefresh }) {
  const [actionLoading, setActionLoading] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [showDelayForm, setShowDelayForm] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState('15');
  const [delayReason, setDelayReason] = useState('');

  const student = appointment.student || {};
  const notes = appointment.notes || '';
  const isHighPriority = notes.includes('HIGH PRIORITY') || notes.includes('Year 4');
  const isPending = appointment.status === 'PENDING';
  const isConfirmed = appointment.status === 'CONFIRMED';

  const handleAccept = async () => {
    if (!meetingLink && !meetingLocation) {
      toast.error('Please provide either a meeting link or location');
      return;
    }
    setActionLoading('accept');
    try {
      await onAction(appointment.id, 'CONFIRMED', { meetingLink, meetingLocation });
      toast.success('Appointment confirmed! Student will receive email notification.');
      setShowAcceptForm(false);
      setMeetingLink('');
      setMeetingLocation('');
    } catch (err) {
      toast.error('Failed to confirm appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }
    setActionLoading('decline');
    try {
      await onAction(appointment.id, 'CANCELLED', { reason: declineReason });
      toast.success('Appointment declined. Student will receive notification.');
      setShowDeclineForm(false);
      setDeclineReason('');
    } catch (err) {
      toast.error('Failed to decline appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    setActionLoading('complete');
    try {
      await onAction(appointment.id, 'COMPLETED');
      toast.success('Appointment marked as completed');
    } catch (err) {
      toast.error('Failed to complete appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Please select both date and time');
      return;
    }
    if (!rescheduleReason.trim()) {
      toast.error('Please provide a reason for rescheduling');
      return;
    }
    setActionLoading('reschedule');
    try {
      const startDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // +1 hour
      
      await api.patch(`/appointments/${appointment.id}/time`, {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        reason: rescheduleReason
      });
      
      console.log('Reschedule notification sent:', { 
        appointmentId: appointment.id, 
        newTime: startDateTime, 
        reason: rescheduleReason 
      });
      
      toast.success('Appointment rescheduled! Student will receive notification.');
      setShowRescheduleForm(false);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleReason('');
      
      // Refresh appointments without page reload
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Reschedule error:', err);
      console.error('Error response:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelay = async () => {
    if (!delayReason.trim()) {
      toast.error('Please provide a reason for the delay');
      return;
    }
    setActionLoading('delay');
    try {
      const currentStart = new Date(appointment.startTime);
      const currentEnd = new Date(appointment.endTime);
      const delayMs = parseInt(delayMinutes) * 60 * 1000;
      
      const newStart = new Date(currentStart.getTime() + delayMs);
      const newEnd = new Date(currentEnd.getTime() + delayMs);
      
      await api.patch(`/appointments/${appointment.id}/time`, {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        reason: `Delayed by ${delayMinutes} minutes. ${delayReason}`
      });
      
      console.log('Delay notification sent:', { 
        appointmentId: appointment.id, 
        delayMinutes: delayMinutes, 
        reason: delayReason 
      });
      
      toast.success(`Meeting delayed by ${delayMinutes} minutes. Student will receive notification.`);
      setShowDelayForm(false);
      setDelayMinutes('15');
      setDelayReason('');
      
      // Refresh appointments without page reload
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Delay error:', err);
      console.error('Error response:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to delay appointment');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={`lsp-card${isHighPriority ? ' lsp-card--priority' : ''}${appointment.rescheduledAt ? ' lsp-card--rescheduled' : ''}`}>
      <div className="lsp-card__header" onClick={onToggle}>
        <div className="lsp-card__left">
          <div className="lsp-card__avatar">
            {student.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
          </div>
          <div className="lsp-card__info">
            <div className="lsp-card__name">
              {student.name || 'Student'}
              <PriorityBadge isHighPriority={isHighPriority} />
              {appointment.rescheduledAt && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
                  borderRadius: 4, padding: '1px 6px', fontSize: '0.68rem', fontWeight: 700
                }}>
                  <RefreshCw size={10} /> RESCHEDULED
                </span>
              )}
            </div>
            <div className="lsp-card__meta">
              <span><User size={12} /> {student.registrationNumber || 'N/A'}</span>
              <span><Clock size={12} /> {new Date(appointment.startTime).toLocaleString('en-GB', { 
                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
              })}</span>
            </div>
            {appointment.rescheduledAt && appointment.rescheduleReason && (
              <div style={{
                marginTop: 4, fontSize: '0.75rem', color: '#dc2626',
                display: 'flex', alignItems: 'center', gap: 4
              }}>
                <span style={{ fontWeight: 600 }}>Reason:</span> {appointment.rescheduleReason}
              </div>
            )}
          </div>
        </div>
        <div className="lsp-card__right">
          <StatusBadge status={appointment.status} />
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {isExpanded && (
        <div className="lsp-card__body">
          <div className="lsp-card__section">
            <h4 className="lsp-card__section-title">Request Details</h4>
            <p className="lsp-card__notes">{notes || 'No additional notes provided.'}</p>
            {student.department && (
              <p className="lsp-card__detail"><strong>Department:</strong> {student.department}</p>
            )}
            {student.email && (
              <p className="lsp-card__detail"><strong>Email:</strong> {student.email}</p>
            )}
            {appointment.phoneNumber && (
              <p className="lsp-card__detail"><strong>Phone:</strong> {appointment.phoneNumber}</p>
            )}
          </div>

          {/* Display uploaded image if available */}
          {appointment.imagePath && (
            <div className="lsp-card__section">
              <h4 className="lsp-card__section-title">Uploaded Image</h4>
              <div className="lsp-card__image-container">
                <img 
                  src={`http://localhost:9090/uploads/${appointment.imagePath}`}
                  alt="Student uploaded"
                  className="lsp-card__image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }}
                />
                <div className="lsp-card__image-error" style={{ display: 'none' }}>
                  <AlertCircle size={24} /> Image not available
                </div>
              </div>
            </div>
          )}

          {/* Display document link if available */}
          {appointment.documentPath && (
            <div className="lsp-card__section">
              <h4 className="lsp-card__section-title">Attached Document</h4>
              <a 
                href={`http://localhost:9090/uploads/${appointment.documentPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="lsp-card__document-link"
              >
                📄 Download Document
              </a>
            </div>
          )}

          {isPending && (
            <div className="lsp-card__actions">
              {!showAcceptForm && !showDeclineForm && !showRescheduleForm && (
                <>
                  <button
                    className="lsp-btn lsp-btn--success"
                    onClick={() => setShowAcceptForm(true)}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={14} /> Accept
                  </button>
                  <button
                    className="lsp-btn lsp-btn--danger"
                    onClick={() => setShowDeclineForm(true)}
                    disabled={actionLoading}
                  >
                    <XCircle size={14} /> Decline
                  </button>
                  <button
                    className="lsp-btn lsp-btn--outline"
                    onClick={() => setShowRescheduleForm(true)}
                    disabled={actionLoading}
                  >
                    <RefreshCw size={14} /> Request Reschedule
                  </button>
                </>
              )}

              {showAcceptForm && (
                <div className="lsp-action-form">
                  <h4 className="lsp-action-form__title">Confirm Appointment</h4>
                  <div className="lsp-field">
                    <label className="lsp-label">
                      <Video size={14} /> Meeting Link (Teams/Zoom)
                    </label>
                    <input
                      className="lsp-input"
                      value={meetingLink}
                      onChange={e => setMeetingLink(e.target.value)}
                      placeholder="https://teams.microsoft.com/..."
                    />
                  </div>
                  <div className="lsp-field">
                    <label className="lsp-label">
                      <MapPin size={14} /> Or Physical Location
                    </label>
                    <input
                      className="lsp-input"
                      value={meetingLocation}
                      onChange={e => setMeetingLocation(e.target.value)}
                      placeholder="e.g. Room 301, Building A"
                    />
                  </div>
                  <div className="lsp-action-form__buttons">
                    <button
                      className="lsp-btn lsp-btn--success"
                      onClick={handleAccept}
                      disabled={actionLoading === 'accept'}
                    >
                      {actionLoading === 'accept' ? <><Loader2 size={14} className="lsp-spin" /> Confirming...</> : 'Confirm & Send Email'}
                    </button>
                    <button
                      className="lsp-btn lsp-btn--outline"
                      onClick={() => setShowAcceptForm(false)}
                      disabled={actionLoading === 'accept'}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showDeclineForm && (
                <div className="lsp-action-form">
                  <h4 className="lsp-action-form__title">Decline Appointment</h4>
                  <div className="lsp-field">
                    <label className="lsp-label">Reason for Declining</label>
                    <textarea
                      className="lsp-textarea"
                      rows={3}
                      value={declineReason}
                      onChange={e => setDeclineReason(e.target.value)}
                      placeholder="e.g. Faculty meeting scheduled at this time"
                    />
                  </div>
                  <div className="lsp-action-form__buttons">
                    <button
                      className="lsp-btn lsp-btn--danger"
                      onClick={handleDecline}
                      disabled={actionLoading === 'decline'}
                    >
                      {actionLoading === 'decline' ? <><Loader2 size={14} className="lsp-spin" /> Declining...</> : 'Decline & Send Email'}
                    </button>
                    <button
                      className="lsp-btn lsp-btn--outline"
                      onClick={() => setShowDeclineForm(false)}
                      disabled={actionLoading === 'decline'}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showRescheduleForm && (
                <div className="lsp-action-form">
                  <h4 className="lsp-action-form__title">Request Reschedule</h4>
                  <div className="lsp-field">
                    <label className="lsp-label">
                      <Calendar size={14} /> New Date
                    </label>
                    <input
                      type="date"
                      className="lsp-input"
                      value={rescheduleDate}
                      onChange={e => setRescheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="lsp-field">
                    <label className="lsp-label">
                      <Clock size={14} /> New Time
                    </label>
                    <input
                      type="time"
                      className="lsp-input"
                      value={rescheduleTime}
                      onChange={e => setRescheduleTime(e.target.value)}
                    />
                  </div>
                  <div className="lsp-field">
                    <label className="lsp-label">Reason for Rescheduling</label>
                    <textarea
                      className="lsp-textarea"
                      rows={3}
                      value={rescheduleReason}
                      onChange={e => setRescheduleReason(e.target.value)}
                      placeholder="e.g. Conflict with another meeting"
                    />
                  </div>
                  <div className="lsp-action-form__buttons">
                    <button
                      className="lsp-btn lsp-btn--primary"
                      onClick={handleReschedule}
                      disabled={actionLoading === 'reschedule'}
                    >
                      {actionLoading === 'reschedule' ? <><Loader2 size={14} className="lsp-spin" /> Rescheduling...</> : 'Reschedule & Notify Student'}
                    </button>
                    <button
                      className="lsp-btn lsp-btn--outline"
                      onClick={() => setShowRescheduleForm(false)}
                      disabled={actionLoading === 'reschedule'}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isConfirmed && (
            <div className="lsp-card__actions">
              {!showDelayForm && (
                <>
                  <button
                    className="lsp-btn lsp-btn--primary"
                    onClick={handleComplete}
                    disabled={actionLoading === 'complete'}
                  >
                    {actionLoading === 'complete' ? <><Loader2 size={14} className="lsp-spin" /> Completing...</> : <><Archive size={14} /> Mark as Completed</>}
                  </button>
                  <button
                    className="lsp-btn lsp-btn--outline"
                    onClick={() => setShowDelayForm(true)}
                    disabled={actionLoading}
                  >
                    <Clock size={14} /> Delay Meeting
                  </button>
                  <button className="lsp-btn lsp-btn--outline">
                    <MessageSquare size={14} /> Open Chat
                  </button>
                </>
              )}

              {showDelayForm && (
                <div className="lsp-action-form">
                  <h4 className="lsp-action-form__title">Delay Meeting</h4>
                  <div className="lsp-field">
                    <label className="lsp-label">
                      <Clock size={14} /> Delay Duration
                    </label>
                    <select
                      className="lsp-input"
                      value={delayMinutes}
                      onChange={e => setDelayMinutes(e.target.value)}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                    </select>
                  </div>
                  <div className="lsp-field">
                    <label className="lsp-label">Reason for Delay</label>
                    <textarea
                      className="lsp-textarea"
                      rows={3}
                      value={delayReason}
                      onChange={e => setDelayReason(e.target.value)}
                      placeholder="e.g. Running late from previous meeting"
                    />
                  </div>
                  <div className="lsp-action-form__buttons">
                    <button
                      className="lsp-btn lsp-btn--primary"
                      onClick={handleDelay}
                      disabled={actionLoading === 'delay'}
                    >
                      {actionLoading === 'delay' ? <><Loader2 size={14} className="lsp-spin" /> Delaying...</> : 'Delay & Notify Student'}
                    </button>
                    <button
                      className="lsp-btn lsp-btn--outline"
                      onClick={() => setShowDelayForm(false)}
                      disabled={actionLoading === 'delay'}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* â”€â”€â”€ Main LecturerSchedulePage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function LecturerSchedulePage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, CONFIRMED, COMPLETED
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    setLoading(true);
    api.get(`/appointments/lecturer/${currentUser.id}`)
      .then(r => setAppointments(r.data))
      .catch(err => {
        console.error('Failed to load appointments', err);
        toast.error('Failed to load appointments');
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handleAction = async (appointmentId, newStatus, metadata = {}) => {
    await api.patch(`/appointments/${appointmentId}/status`, { status: newStatus, ...metadata });
    
    // Refresh appointments
    await refreshAppointments();
  };

  const refreshAppointments = async () => {
    try {
      const r = await api.get(`/appointments/lecturer/${currentUser.id}`);
      setAppointments(r.data);
    } catch (err) {
      console.error('Failed to refresh appointments', err);
    }
  };

  // Sort: HIGH PRIORITY (Year 4) first, then by startTime
  const sortedAppointments = [...appointments].sort((a, b) => {
    const aPriority = (a.notes || '').includes('HIGH PRIORITY') || (a.notes || '').includes('Year 4');
    const bPriority = (b.notes || '').includes('HIGH PRIORITY') || (b.notes || '').includes('Year 4');
    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;
    return new Date(a.startTime) - new Date(b.startTime);
  });

  const filteredAppointments = filter === 'ALL'
    ? sortedAppointments
    : sortedAppointments.filter(a => a.status === filter);

  const pendingCount = appointments.filter(a => a.status === 'PENDING').length;
  const confirmedCount = appointments.filter(a => a.status === 'CONFIRMED').length;
  const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;

  return (
    <div className="lsp-page">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />

      <div className="lsp-container">
        <button className="lsp-back-btn" onClick={() => navigate('/lecturer/home')}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <div className="lsp-header">
          <div>
            <h1 className="lsp-title">
              <Calendar size={24} /> Appointment Triage Dashboard
            </h1>
            <p className="lsp-subtitle">
              Manage pending requests, confirm appointments, and track completed sessions
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="lsp-stats">
          <div className="lsp-stat">
            <div className="lsp-stat__icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
              <Clock size={20} />
            </div>
            <div>
              <div className="lsp-stat__value">{pendingCount}</div>
              <div className="lsp-stat__label">Pending</div>
            </div>
          </div>
          <div className="lsp-stat">
            <div className="lsp-stat__icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div className="lsp-stat__value">{confirmedCount}</div>
              <div className="lsp-stat__label">Confirmed</div>
            </div>
          </div>
          <div className="lsp-stat">
            <div className="lsp-stat__icon" style={{ background: '#f8fafc', color: '#6b7280' }}>
              <Archive size={20} />
            </div>
            <div>
              <div className="lsp-stat__value">{completedCount}</div>
              <div className="lsp-stat__label">Completed</div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="lsp-filter-bar">
          <div className="lsp-filter-label">
            <Filter size={16} /> Filter:
          </div>
          <div className="lsp-filter-buttons">
            {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED'].map(f => (
              <button
                key={f}
                className={`lsp-filter-btn${filter === f ? ' lsp-filter-btn--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments list */}
        <div className="lsp-list">
          {loading ? (
            <div className="lsp-loading">
              <Loader2 size={32} className="lsp-spin" />
              <p>Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="lsp-empty">
              <AlertCircle size={48} style={{ color: '#cbd5e1' }} />
              <p>No {filter.toLowerCase()} appointments found</p>
            </div>
          ) : (
            filteredAppointments.map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onAction={handleAction}
                onRefresh={refreshAppointments}
                isExpanded={expandedId === appt.id}
                onToggle={() => setExpandedId(expandedId === appt.id ? null : appt.id)}
              />
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

