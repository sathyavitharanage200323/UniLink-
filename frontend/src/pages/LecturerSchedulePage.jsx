import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Calendar, Clock, User, AlertCircle, CheckCircle,
  XCircle, RefreshCw, Zap, MessageSquare, Archive, Filter,
  ChevronDown, ChevronUp, Loader2, Video, MapPin,
  Phone, Mail, GraduationCap, FileText, Hash, BookOpen
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosInstance';
import './LecturerSchedulePage.css';

const BACKEND = 'http://localhost:8082';

/* ── Parse all fields from notes ─────────────────────────────────────── */
function parseNotes(notes = '') {
  const extract = (key) => {
    const m = notes.match(new RegExp(`\\[${key}:([^\\]]+)\\]`));
    return m ? m[1].trim() : '';
  };
  const metaMatch = notes.match(/^\[([^\]]+)\]/);
  const meta = metaMatch ? metaMatch[1].replace('| HIGH PRIORITY', '').trim() : '';
  const reason = notes.replace(/\[[^\]]+\]/g, '').trim();
  return {
    meta,
    bookingName:  extract('NAME'),
    itNumber:     extract('IT'),
    itEmail:      extract('ITEMAIL'),
    bookingPhone: extract('PHONE'),
    mode:         extract('MODE'),
    reason,
  };
}

const STATUS_CFG = {
  PENDING:   { label: 'Pending',   color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', Icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', Icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', Icon: XCircle },
  COMPLETED: { label: 'Completed', color: '#6b7280', bg: '#f8fafc', border: '#e2e8f0', Icon: Archive },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color,
      border: `1.5px solid ${cfg.border}`,
      borderRadius: 20, padding: '4px 12px',
      fontSize: '0.75rem', fontWeight: 700,
    }}>
      <cfg.Icon size={12} /> {cfg.label}
    </span>
  );
}

function AppointmentCard({ appointment, onAction, isExpanded, onToggle, onRefresh, onOpenChat }) {
  const [actionLoading, setActionLoading]           = useState(null);
  const [showAcceptForm, setShowAcceptForm]         = useState(false);
  const [showDeclineForm, setShowDeclineForm]       = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [showDelayForm, setShowDelayForm]           = useState(false);
  const [meetingLink, setMeetingLink]               = useState('');
  const [meetingLocation, setMeetingLocation]       = useState('');
  const [confirmMsg, setConfirmMsg]                 = useState('');
  const [declineReason, setDeclineReason]           = useState('');
  const [rescheduleDate, setRescheduleDate]         = useState('');
  const [rescheduleTime, setRescheduleTime]         = useState('');
  const [rescheduleReason, setRescheduleReason]     = useState('');
  const [delayMinutes, setDelayMinutes]             = useState('15');
  const [delayReason, setDelayReason]               = useState('');

  const student = appointment.student || {};
  const { meta, bookingName, itNumber, bookingPhone, reason, itEmail, mode } = parseNotes(appointment.notes || '');
  const isHighPriority = (appointment.notes || '').includes('HIGH PRIORITY');
  const isPending      = appointment.status === 'PENDING';
  const isConfirmed    = appointment.status === 'CONFIRMED';
  const displayName    = bookingName || student.name || 'Student';
  const displayIT      = itNumber || student.registrationNumber || 'N/A';
  const displayPhone   = bookingPhone || appointment.phoneNumber || student.phone || '—';
  const cfg            = STATUS_CFG[appointment.status] || STATUS_CFG.PENDING;

  const handleAccept = async () => {
    if (!meetingLink && !meetingLocation) { toast.error('Provide a meeting link or location'); return; }
    setActionLoading('accept');
    try {
      await onAction(appointment.id, 'CONFIRMED', { meetingLink, meetingLocation, confirmMsg });
      toast.success('Confirmed! Student notified by email.');
      setShowAcceptForm(false); setMeetingLink(''); setMeetingLocation(''); setConfirmMsg('');
    } catch { toast.error('Failed to confirm'); } finally { setActionLoading(null); }
  };
  const handleDecline = async () => {
    if (!declineReason.trim()) { toast.error('Please provide a reason'); return; }
    setActionLoading('decline');
    try {
      await onAction(appointment.id, 'CANCELLED', { reason: declineReason });
      toast.success('Declined. Student notified.');
      setShowDeclineForm(false); setDeclineReason('');
    } catch { toast.error('Failed to decline'); } finally { setActionLoading(null); }
  };
  const handleComplete = async () => {
    setActionLoading('complete');
    try { await onAction(appointment.id, 'COMPLETED'); toast.success('Marked as completed'); }
    catch { toast.error('Failed'); } finally { setActionLoading(null); }
  };
  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) { toast.error('Select date and time'); return; }
    if (!rescheduleReason.trim()) { toast.error('Provide a reason'); return; }
    setActionLoading('reschedule');
    try {
      const s = new Date(`${rescheduleDate}T${rescheduleTime}`);
      const e = new Date(s.getTime() + 3600000);
      await api.patch(`/appointments/${appointment.id}/time`, { startTime: s.toISOString(), endTime: e.toISOString(), reason: rescheduleReason });
      toast.success('Rescheduled! Student notified.');
      setShowRescheduleForm(false); setRescheduleDate(''); setRescheduleTime(''); setRescheduleReason('');
      if (onRefresh) await onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setActionLoading(null); }
  };
  const handleDelay = async () => {
    if (!delayReason.trim()) { toast.error('Provide a reason'); return; }
    setActionLoading('delay');
    try {
      const ms = parseInt(delayMinutes) * 60000;
      const s  = new Date(new Date(appointment.startTime).getTime() + ms);
      const e  = new Date(new Date(appointment.endTime).getTime() + ms);
      await api.patch(`/appointments/${appointment.id}/time`, { startTime: s.toISOString(), endTime: e.toISOString(), reason: `Delayed ${delayMinutes}min. ${delayReason}` });
      toast.success(`Delayed ${delayMinutes} min. Student notified.`);
      setShowDelayForm(false); setDelayMinutes('15'); setDelayReason('');
      if (onRefresh) await onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setActionLoading(null); }
  };

  return (
    <div className={`lsc-card${isHighPriority ? ' lsc-card--priority' : ''}${appointment.rescheduledAt ? ' lsc-card--rescheduled' : ''}`}>
      {/* Header */}
      <div className="lsc-card-header" onClick={onToggle}>
        <div className="lsc-card-header__left">
          <div className="lsc-avatar" style={{ background: `linear-gradient(135deg,${cfg.color}bb,${cfg.color}55)` }}>
            {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="lsc-card-header__name">
              {displayName}
              {isHighPriority && <span className="lsc-badge lsc-badge--priority"><Zap size={10} /> HIGH PRIORITY</span>}
              {appointment.rescheduledAt && <span className="lsc-badge lsc-badge--reschedule"><RefreshCw size={10} /> RESCHEDULED</span>}
            </div>
            <div className="lsc-card-header__meta">
              <span><Hash size={11} /> {displayIT}</span>
              <span><Clock size={11} /> {new Date(appointment.startTime).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              {meta && <span><GraduationCap size={11} /> {meta}</span>}
              {appointment.createdAt && (
                <span style={{ color: '#475569', fontSize: '0.72rem' }}>
                  Submitted: {new Date(appointment.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="lsc-card-header__right">
          <StatusBadge status={appointment.status} />
          <span className="lsc-chevron">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="lsc-card-body">
          <div className="lsc-body-grid">

            {/* Student details */}
            <div className="lsc-panel lsc-panel--student">
              <div className="lsc-panel__title"><User size={14} /> Student Details</div>
              <div className="lsc-big-avatar">
                {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="lsc-big-name">{displayName}</div>
              <div className="lsc-fields">
                {[
                  { icon: Hash,          label: 'IT Number',   value: displayIT,           iconBg: '#eff6ff', iconColor: '#2563eb' },
                  { icon: Mail,          label: 'IT Email',    value: itEmail || (displayIT && displayIT !== 'N/A' ? `${displayIT.toLowerCase()}@my.sliit.lk` : null), iconBg: '#f0fdf4', iconColor: '#16a34a' },
                  { icon: Phone,         label: 'Phone',       value: displayPhone,         iconBg: '#fdf4ff', iconColor: '#9333ea' },
                  { icon: BookOpen,      label: 'Department',  value: student.department,   iconBg: '#fff7ed', iconColor: '#ea580c' },
                  { icon: GraduationCap, label: 'Academic',    value: meta || [student.academicYear, student.semester].filter(Boolean).join(' – '), iconBg: '#eff6ff', iconColor: '#0891b2' },
                  { icon: GraduationCap, label: 'Batch',       value: student.batch,        iconBg: '#fef9c3', iconColor: '#ca8a04' },
                ].filter(r => r.value).map(({ icon: Icon, label, value, iconBg, iconColor }) => (
                  <div key={label} className="lsc-field-row">
                    <span className="lsc-field-row__icon" style={{ background: iconBg, color: iconColor }}><Icon size={13} /></span>
                    <div>
                      <div className="lsc-field-row__label">{label}</div>
                      <div className="lsc-field-row__value">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consultation request */}
            <div className="lsc-panel lsc-panel--request">
              <div className="lsc-panel__title"><FileText size={14} /> Consultation Request</div>

              <div className="lsc-time-card">
                <div className="lsc-time-card__date"><Calendar size={14} /> {new Date(appointment.startTime).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div className="lsc-time-card__time"><Clock size={14} /> {new Date(appointment.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – {new Date(appointment.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                {mode && (
                  <div className="lsc-time-card__mode">
                    <span className={`lsc-mode-dot lsc-mode-dot--${mode.toLowerCase()}`} />
                    {mode} Meeting
                  </div>
                )}
              </div>

              <div className="lsc-reason-card">
                <div className="lsc-reason-card__label">Reason for Meeting</div>
                <p className="lsc-reason-card__text">{reason || 'No reason provided.'}</p>
              </div>

              {appointment.rescheduledAt && appointment.rescheduleReason && (
                <div className="lsc-notice lsc-notice--warn">
                  <RefreshCw size={13} />
                  <span><strong>Rescheduled:</strong> {appointment.rescheduleReason}</span>
                </div>
              )}

              {appointment.imagePath && (
                <div className="lsc-attach">
                  <div className="lsc-attach__label">📷 Uploaded Image</div>
                  <div className="lsc-attach__img-wrap">
                    <img src={`${BACKEND}/uploads/${appointment.imagePath}`} alt="Uploaded" className="lsc-attach__img"
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    <div className="lsc-attach__img-err" style={{ display: 'none' }}><AlertCircle size={16} /> Not available</div>
                  </div>
                </div>
              )}

              {appointment.documentPath && (
                <div className="lsc-attach">
                  <div className="lsc-attach__label">📄 Attached Document</div>
                  <a href={`${BACKEND}/uploads/${appointment.documentPath}`} target="_blank" rel="noopener noreferrer" className="lsc-doc-link">Download Document ↗</a>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="lsc-actions">
            {isPending && !showAcceptForm && !showDeclineForm && !showRescheduleForm && (
              <>
                <button className="lsc-btn lsc-btn--green"  onClick={() => setShowAcceptForm(true)}     disabled={!!actionLoading}><CheckCircle size={14} /> Accept</button>
                <button className="lsc-btn lsc-btn--red"    onClick={() => setShowDeclineForm(true)}    disabled={!!actionLoading}><XCircle size={14} /> Decline</button>
                <button className="lsc-btn lsc-btn--ghost"  onClick={() => setShowRescheduleForm(true)} disabled={!!actionLoading}><RefreshCw size={14} /> Reschedule</button>
              </>
            )}
            {isConfirmed && !showDelayForm && (
              <>
                <button className="lsc-btn lsc-btn--blue"   onClick={handleComplete}              disabled={actionLoading === 'complete'}>
                  {actionLoading === 'complete' ? <><Loader2 size={13} className="lsc-spin" /> Completing…</> : <><Archive size={14} /> Mark Completed</>}
                </button>
                <button className="lsc-btn lsc-btn--ghost"  onClick={() => setShowDelayForm(true)} disabled={!!actionLoading}><Clock size={14} /> Delay Meeting</button>
                <button className="lsc-btn lsc-btn--purple" onClick={() => onOpenChat(appointment)}><MessageSquare size={14} /> Open Chat</button>
              </>
            )}

            {showAcceptForm && (
              <div className="lsc-form-panel">
                <div className="lsc-form-panel__title">Confirm Appointment</div>
                <div className="lsc-form-row"><label className="lsc-form-label"><Video size={13} /> Meeting Link (Teams/Zoom)</label>
                  <input className="lsc-form-input" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://teams.microsoft.com/..." /></div>
                <div className="lsc-form-row"><label className="lsc-form-label"><MapPin size={13} /> Or Physical Location</label>
                  <input className="lsc-form-input" value={meetingLocation} onChange={e => setMeetingLocation(e.target.value)} placeholder="e.g. Room 301, Block A" /></div>
                <div className="lsc-form-row"><label className="lsc-form-label">💬 Message to Student (Optional)</label>
                  <textarea className="lsc-form-textarea" rows={2} value={confirmMsg} onChange={e => setConfirmMsg(e.target.value)} placeholder="e.g. Please bring your project files. See you then!" /></div>
                <div className="lsc-form-btns">
                  <button className="lsc-btn lsc-btn--green" onClick={handleAccept} disabled={actionLoading === 'accept'}>
                    {actionLoading === 'accept' ? <><Loader2 size={13} className="lsc-spin" /> Confirming…</> : 'Confirm & Email Student'}</button>
                  <button className="lsc-btn lsc-btn--ghost" onClick={() => setShowAcceptForm(false)}>Cancel</button>
                </div>
              </div>
            )}
            {showDeclineForm && (
              <div className="lsc-form-panel">
                <div className="lsc-form-panel__title">Decline Appointment</div>
                <div className="lsc-form-row"><label className="lsc-form-label">Reason for Declining</label>
                  <textarea className="lsc-form-textarea" rows={3} value={declineReason} onChange={e => setDeclineReason(e.target.value)} placeholder="e.g. Faculty meeting at this time" /></div>
                <div className="lsc-form-btns">
                  <button className="lsc-btn lsc-btn--red" onClick={handleDecline} disabled={actionLoading === 'decline'}>
                    {actionLoading === 'decline' ? <><Loader2 size={13} className="lsc-spin" /> Declining…</> : 'Decline & Email Student'}</button>
                  <button className="lsc-btn lsc-btn--ghost" onClick={() => setShowDeclineForm(false)}>Cancel</button>
                </div>
              </div>
            )}
            {showRescheduleForm && (
              <div className="lsc-form-panel">
                <div className="lsc-form-panel__title">Request Reschedule</div>
                <div className="lsc-form-2col">
                  <div className="lsc-form-row"><label className="lsc-form-label"><Calendar size={13} /> New Date</label>
                    <input type="date" className="lsc-form-input" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} /></div>
                  <div className="lsc-form-row"><label className="lsc-form-label"><Clock size={13} /> New Time</label>
                    <input type="time" className="lsc-form-input" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} /></div>
                </div>
                <div className="lsc-form-row"><label className="lsc-form-label">Reason</label>
                  <textarea className="lsc-form-textarea" rows={3} value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value)} placeholder="e.g. Conflict with another meeting" /></div>
                <div className="lsc-form-btns">
                  <button className="lsc-btn lsc-btn--blue" onClick={handleReschedule} disabled={actionLoading === 'reschedule'}>
                    {actionLoading === 'reschedule' ? <><Loader2 size={13} className="lsc-spin" /> Rescheduling…</> : 'Reschedule & Notify'}</button>
                  <button className="lsc-btn lsc-btn--ghost" onClick={() => setShowRescheduleForm(false)}>Cancel</button>
                </div>
              </div>
            )}
            {showDelayForm && (
              <div className="lsc-form-panel">
                <div className="lsc-form-panel__title">Delay Meeting</div>
                <div className="lsc-form-2col">
                  <div className="lsc-form-row"><label className="lsc-form-label"><Clock size={13} /> Duration</label>
                    <select className="lsc-form-input" value={delayMinutes} onChange={e => setDelayMinutes(e.target.value)}>
                      <option value="15">15 minutes</option><option value="30">30 minutes</option>
                      <option value="45">45 minutes</option><option value="60">1 hour</option>
                    </select></div>
                  <div className="lsc-form-row"><label className="lsc-form-label">Reason</label>
                    <textarea className="lsc-form-textarea" rows={2} value={delayReason} onChange={e => setDelayReason(e.target.value)} placeholder="e.g. Running late" /></div>
                </div>
                <div className="lsc-form-btns">
                  <button className="lsc-btn lsc-btn--blue" onClick={handleDelay} disabled={actionLoading === 'delay'}>
                    {actionLoading === 'delay' ? <><Loader2 size={13} className="lsc-spin" /> Delaying…</> : 'Delay & Notify Student'}</button>
                  <button className="lsc-btn lsc-btn--ghost" onClick={() => setShowDelayForm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LecturerSchedulePage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('ALL');
  const [expandedId, setExpandedId]     = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    setLoading(true);
    api.get(`/appointments/lecturer/${currentUser.id}`)
      .then(r => setAppointments(r.data))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const refresh = async () => {
    try { const r = await api.get(`/appointments/lecturer/${currentUser.id}`); setAppointments(r.data); }
    catch (e) { console.error(e); }
  };
  const handleAction = async (id, status, meta = {}) => {
    await api.patch(`/appointments/${id}/status`, { status, ...meta });
    await refresh();
  };
  const handleOpenChat = (appt) =>
    navigate('/chat', { state: { appointmentId: appt.id, studentId: appt.student?.id } });

  // Sort by createdAt ascending (order they were made)
  const sorted = [...appointments].sort((a, b) =>
    new Date(a.createdAt) - new Date(b.createdAt)
  );
  const filtered = filter === 'ALL' ? sorted : sorted.filter(a => a.status === filter);
  const counts = { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
  appointments.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });

  return (
    <div className="lsc-page">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
      <div className="lsc-container">
        <button className="lsc-back-btn" onClick={() => navigate('/lecturer/home')}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <div className="lsc-hero">
          <h1 className="lsc-hero__title">Appointment Dashboard</h1>
          <p className="lsc-hero__sub">Review student requests, manage your schedule, and track consultations</p>
        </div>

        <div className="lsc-stats">
          {[
            { key: 'PENDING',   label: 'Pending',   Icon: Clock,       grad: 'linear-gradient(135deg,#fff7ed,#fed7aa)', color: '#ea580c' },
            { key: 'CONFIRMED', label: 'Confirmed', Icon: CheckCircle, grad: 'linear-gradient(135deg,#f0fdf4,#bbf7d0)', color: '#16a34a' },
            { key: 'COMPLETED', label: 'Completed', Icon: Archive,     grad: 'linear-gradient(135deg,#f8fafc,#e2e8f0)', color: '#6b7280' },
            { key: 'CANCELLED', label: 'Cancelled', Icon: XCircle,     grad: 'linear-gradient(135deg,#fef2f2,#fecaca)', color: '#dc2626' },
          ].map(({ key, label, Icon, grad, color }) => (
            <button key={key} className={`lsc-stat${filter === key ? ' lsc-stat--active' : ''}`}
              onClick={() => setFilter(filter === key ? 'ALL' : key)} style={{ background: grad }}>
              <Icon size={22} style={{ color }} />
              <div className="lsc-stat__count" style={{ color }}>{counts[key]}</div>
              <div className="lsc-stat__label">{label}</div>
            </button>
          ))}
        </div>

        <div className="lsc-filter-row">
          <Filter size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
          {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(f => (
            <button key={f} className={`lsc-filter-pill${filter === f ? ' lsc-filter-pill--on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        <div className="lsc-list">
          {loading ? (
            <div className="lsc-empty"><Loader2 size={36} className="lsc-spin" style={{ color: '#2563eb' }} /><p>Loading…</p></div>
          ) : filtered.length === 0 ? (
            <div className="lsc-empty"><AlertCircle size={48} style={{ color: '#cbd5e1' }} /><p>No {filter.toLowerCase()} appointments</p></div>
          ) : (
            filtered.map(appt => (
              <AppointmentCard key={appt.id} appointment={appt} onAction={handleAction}
                onRefresh={refresh} onOpenChat={handleOpenChat}
                isExpanded={expandedId === appt.id}
                onToggle={() => setExpandedId(expandedId === appt.id ? null : appt.id)} />
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
