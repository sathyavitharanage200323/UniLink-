import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Calendar, User, Wrench, ArrowLeft, Clock, BellOff, Bell, AlertCircle, CheckCircle, RefreshCw, Camera, Video, MapPin, GraduationCap, MessageSquare, XCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { userApi } from '../api/chatApi';
import api from '../api/axiosInstance';
import { BACKEND_BASE_URL } from '../config';

const BACKEND = BACKEND_BASE_URL;

const DEPARTMENT_OPTIONS = [
	'Faculty Of Computing',
	'Faculty Of Engineering',
	'Faculty Of Business',
	'Faculty Of Humanities and Sciences',
];

const BATCH_OPTIONS = [
	'Artificial Intelligence',
	'Software Engineering',
	'Computer Science',
	'Information Technology',
	'Data Science',
	'Cyber Security',
	'Computer Systems & Network Engineering',
	'Information Systems Engineering',
	'Interactive Media',
	'Computer Systems Engineering',
];

const ACADEMIC_PERIODS = [
	{ academicYear: 'Year 1', semester: 'Semester 1', label: 'Year 1 Semester 1' },
	{ academicYear: 'Year 1', semester: 'Semester 2', label: 'Year 1 Semester 2' },
	{ academicYear: 'Year 2', semester: 'Semester 1', label: 'Year 2 Semester 1' },
	{ academicYear: 'Year 2', semester: 'Semester 2', label: 'Year 2 Semester 2' },
	{ academicYear: 'Year 3', semester: 'Semester 1', label: 'Year 3 Semester 1' },
	{ academicYear: 'Year 3', semester: 'Semester 2', label: 'Year 3 Semester 2' },
	{ academicYear: 'Year 4', semester: 'Semester 1', label: 'Year 4 Semester 1' },
	{ academicYear: 'Year 4', semester: 'Semester 2', label: 'Year 4 Semester 2' },
];

/* ── Reschedule action buttons (stateful to prevent double-click) ─────── */
function RescheduleButtons({ appointmentId, onDone }) {
	const [loading, setLoading] = React.useState(null);
	const [done, setDone] = React.useState(false);
	if (done) return null;
	const handle = async (action) => {
		if (loading) return;
		setLoading(action);
		setDone(true);
		try {
			if (action === 'accept') {
				await api.patch(`/appointments/${appointmentId}/status`, { status: 'CONFIRMED' });
				toast.success('Appointment confirmed!');
			} else {
				await api.patch(`/appointments/${appointmentId}/status`, { status: 'CANCELLED', reason: 'Student declined the rescheduled time.' });
				toast.info('Appointment declined.');
			}
			onDone();
		} catch (err) {
			setDone(false);
			toast.error(err?.response?.data?.message || 'Failed. Please try again.');
		} finally { setLoading(null); }
	};
	return (
		<div style={{ display:'flex', gap:10, marginTop:4 }}>
			<button onClick={() => handle('accept')} disabled={!!loading}
				style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:10, border:'none', background:'#16a34a', color:'white', fontWeight:700, fontSize:'0.82rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
				<CheckCircle size={14} /> {loading === 'accept' ? 'Confirming…' : 'Accept New Time'}
			</button>
			<button onClick={() => handle('decline')} disabled={!!loading}
				style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:10, border:'1.5px solid #dc2626', background:'white', color:'#dc2626', fontWeight:700, fontSize:'0.82rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
				<XCircle size={14} /> {loading === 'decline' ? 'Declining…' : 'Decline'}
			</button>
		</div>
	);
}

export function AppointmentsPage({ currentUser, appointments = [], onLogout }) {
	const navigate = useNavigate();
	const isLecturer = currentUser?.role === 'LECTURER';
	const [list, setList] = useState(appointments);
	const [refreshing, setRefreshing] = useState(false);
	const [filter, setFilter] = useState('ALL');

	const fetchAppts = async () => {
		if (!currentUser?.id) return;
		try {
			const ep = isLecturer ? `/appointments/lecturer/${currentUser.id}` : `/appointments/student/${currentUser.id}`;
			const res = await api.get(ep);
			setList(res.data || []);
		} catch { /* keep cached */ }
	};

	useEffect(() => {
		fetchAppts();
		const t = setInterval(fetchAppts, 10000);
		return () => clearInterval(t);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUser?.id, isLecturer]);

	const handleRefresh = async () => {
		setRefreshing(true);
		await fetchAppts();
		setRefreshing(false);
	};

	const extract = (notes, key) => { const m = (notes||'').match(new RegExp(`\\[${key}:([^\\]]+)\\]`)); return m ? m[1].trim() : ''; };
	const parseMeta = (notes) => { const m = (notes||'').match(/^\[([^\]]+)\]/); return m ? m[1].replace('| HIGH PRIORITY','').trim() : ''; };
	const parseReason = (notes) => (notes||'').replace(/\[[^\]]+\]/g,'').trim();

	const sorted = [...list].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
	const filtered = filter === 'ALL' ? sorted : sorted.filter(a => a.status === filter);

	const counts = { ALL: list.length, PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
	list.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });

	const STATUS_CFG = {
		PENDING:   { color:'#d97706', bg:'#fffbeb', border:'#fde68a', dot:'#f59e0b' },
		CONFIRMED: { color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', dot:'#22c55e' },
		CANCELLED: { color:'#dc2626', bg:'#fef2f2', border:'#fecaca', dot:'#ef4444' },
		COMPLETED: { color:'#6b7280', bg:'#f8fafc', border:'#e2e8f0', dot:'#9ca3af' },
	};

	return (
		<div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#f0f4ff 0%,#f8fafc 60%,#eff6ff 100%)', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
			<Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
			<main style={{ flex:1, maxWidth:860, margin:'0 auto', width:'100%', padding:'24px 16px 60px' }}>

				{/* Back */}
				<button onClick={() => navigate(isLecturer ? '/lecturer/home' : '/student/home')}
					style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.7)', backdropFilter:'blur(12px)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:10, padding:'8px 14px', fontSize:'0.875rem', fontWeight:600, color:'#3a3a3c', cursor:'pointer', marginBottom:20 }}>
					<ArrowLeft size={15} /> Back
				</button>

				{/* Header card */}
				<div style={{ background:'rgba(255,255,255,0.72)', backdropFilter:'blur(20px) saturate(180%)', border:'1px solid rgba(0,0,0,0.07)', borderRadius:20, padding:'20px 24px', marginBottom:16, boxShadow:'0 4px 24px rgba(0,0,0,0.07)' }}>
					<div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
						<div>
							<h1 style={{ margin:0, fontSize:'1.5rem', fontWeight:800, color:'#1c1c1e', display:'flex', alignItems:'center', gap:10 }}>
								<Calendar size={22} style={{ color:'#007aff' }} /> My Appointments
							</h1>
							<p style={{ margin:'4px 0 0', color:'#636366', fontSize:'0.82rem' }}>{list.length} total · auto-refreshes every 10s</p>
						</div>
						<div style={{ display:'flex', gap:10, alignItems:'center' }}>
							{!isLecturer && (
								<button onClick={() => navigate('/book')}
									style={{ display:'inline-flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#007aff,#0055d4)', color:'white', border:'none', borderRadius:12, padding:'10px 18px', fontWeight:700, fontSize:'0.875rem', cursor:'pointer', boxShadow:'0 4px 12px rgba(0,122,255,0.3)' }}>
									+ Book New
								</button>
							)}
							<button onClick={handleRefresh} disabled={refreshing}
								style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:10, padding:'9px 14px', fontSize:'0.82rem', fontWeight:600, color:'#3a3a3c', cursor:'pointer' }}>
								<RefreshCw size={14} style={{ animation: refreshing ? 'apf-rotate 0.8s linear infinite' : 'none' }} /> Refresh
							</button>
						</div>
					</div>

					{/* Filter pills */}
					<div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap' }}>
						{['ALL','PENDING','CONFIRMED','COMPLETED','CANCELLED'].map(f => {
							const active = filter === f;
							const cfg = STATUS_CFG[f];
							return (
								<button key={f} onClick={() => setFilter(f)} style={{
									display:'inline-flex', alignItems:'center', gap:5,
									padding:'6px 14px', borderRadius:20,
									border: active ? 'none' : '1px solid rgba(0,0,0,0.1)',
									background: active ? (cfg ? cfg.color : '#007aff') : 'rgba(0,0,0,0.04)',
									color: active ? 'white' : '#636366',
									fontWeight:700, fontSize:'0.75rem', cursor:'pointer',
									boxShadow: active ? `0 2px 8px ${cfg ? cfg.color+'55' : 'rgba(0,122,255,0.3)'}` : 'none',
									transition:'all 0.15s',
								}}>
									{cfg && <span style={{ width:7, height:7, borderRadius:'50%', background: active ? 'rgba(255,255,255,0.7)' : cfg.dot, flexShrink:0 }} />}
									{f} {f !== 'ALL' && <span style={{ opacity:0.75 }}>({counts[f]})</span>}
								</button>
							);
						})}
					</div>
				</div>

				{/* Appointment cards */}
				<div style={{ display:'flex', flexDirection:'column', gap:12 }}>
					{/* Rescheduled appointments — pinned at top with alert styling */}
					{filtered.filter(a => a.rescheduledAt).map(a => {
						const mode = extract(a.notes, 'MODE');
						return (
							<div key={`rs-${a.id}`} style={{ background:'linear-gradient(135deg,rgba(220,38,38,0.07),rgba(255,255,255,0.85))', backdropFilter:'blur(16px)', border:'2px solid #ef4444', borderLeft:'5px solid #dc2626', borderRadius:18, padding:'16px 18px', display:'flex', flexDirection:'column', gap:10, boxShadow:'0 4px 20px rgba(220,38,38,0.15)', animation:'pulse-red 2s ease-in-out infinite' }}>
								<div style={{ display:'flex', alignItems:'center', gap:10 }}>
									<div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#dc2626,#ea580c)', color:'white', fontWeight:800, fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
										{(a.lecturer?.name||'L').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
									</div>
									<div style={{ flex:1 }}>
										<div style={{ fontWeight:700, fontSize:'0.95rem', color:'#1c1c1e' }}>{a.lecturer?.name ?? 'Lecturer'}</div>
										<div style={{ fontSize:'0.72rem', color:'#636366' }}>{a.lecturer?.department}</div>
									</div>
									<span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#dc2626', color:'white', borderRadius:20, padding:'4px 12px', fontSize:'0.72rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.04em' }}>
										↺ RESCHEDULED
									</span>
								</div>
								<div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', fontSize:'0.85rem', fontWeight:700, color:'#1c1c1e' }}>
									<Clock size={14} style={{ color:'#dc2626' }} />
									New time: {new Date(a.startTime).toLocaleString('en-GB', { weekday:'long', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
									{mode && <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background:mode==='Online'?'#eff6ff':'#f0fdf4', color:mode==='Online'?'#2563eb':'#16a34a', border:`1px solid ${mode==='Online'?'#bfdbfe':'#bbf7d0'}` }}>{mode==='Online'?<Video size={11} />:<MapPin size={11} />} {mode}</span>}
								</div>
								{a.rescheduleReason && (
									<div style={{ fontSize:'0.82rem', color:'#dc2626', background:'rgba(220,38,38,0.07)', border:'1px solid #fecaca', borderRadius:10, padding:'8px 12px', fontWeight:500 }}>
										<strong>Reason:</strong> {a.rescheduleReason}
									</div>
								)}
								{a.confirmationMessage && (
									<div style={{ fontSize:'0.85rem', color:'#1c1c1e', display:'flex', gap:6 }}>💬 {a.confirmationMessage}</div>
								)}
								{(a.meetingLink || a.meetingLocation) && (
									<div style={{ display:'flex', gap:10, flexWrap:'wrap', padding:'8px 12px', background:'linear-gradient(135deg,rgba(240,253,244,0.9),rgba(239,246,255,0.9))', border:'1px solid #bbf7d0', borderRadius:10 }}>
										{a.meetingLink && <a href={a.meetingLink} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:5, color:'#007aff', fontWeight:700, fontSize:'0.82rem', textDecoration:'none', padding:'5px 12px', background:'rgba(0,122,255,0.08)', borderRadius:8 }}><Video size={13} /> Join Meeting</a>}
										{a.meetingLocation && <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:'#16a34a', fontWeight:600, fontSize:'0.82rem' }}><MapPin size={13} /> {a.meetingLocation}</span>}
									</div>
								)}
								{/* Student accept/decline buttons for rescheduled appointment */}
								<RescheduleButtons appointmentId={a.id} onDone={handleRefresh} />
							</div>
						);
					})}

					{filtered.length === 0 && (
						<div style={{ background:'rgba(255,255,255,0.7)', backdropFilter:'blur(12px)', border:'1px solid rgba(0,0,0,0.07)', borderRadius:16, padding:'40px 20px', textAlign:'center', color:'#aeaeb2' }}>
							<Calendar size={40} style={{ marginBottom:10, opacity:0.4 }} />
							<p style={{ margin:0, fontWeight:600 }}>No {filter.toLowerCase()} appointments</p>
						</div>
					)}
					{filtered.filter(a => !a.rescheduledAt).map((a) => {
						const meta   = parseMeta(a.notes);
						const reason = parseReason(a.notes);
						const mode   = extract(a.notes, 'MODE');
						const isHP   = (a.notes||'').includes('HIGH PRIORITY');
						const sc     = a.rescheduledAt ? STATUS_CFG.CANCELLED : (STATUS_CFG[a.status] || STATUS_CFG.PENDING);
						const personName = isLecturer ? (a.student?.name ?? 'Student') : (a.lecturer?.name ?? 'Lecturer');
						const personDept = isLecturer ? a.student?.department : a.lecturer?.department;

						return (
							<div key={a.id} style={{
								background:'rgba(255,255,255,0.78)',
								backdropFilter:'blur(20px) saturate(180%)',
								WebkitBackdropFilter:'blur(20px) saturate(180%)',
								border:`1px solid ${sc.border}`,
								borderLeft: `4px solid ${sc.color}`,
								borderRadius:18, padding:'16px 18px',
								boxShadow:'0 2px 16px rgba(0,0,0,0.06)',
								display:'flex', flexDirection:'column', gap:10,
								transition:'box-shadow 0.15s, transform 0.15s',
							}}>
								{/* Header */}
								<div style={{ display:'flex', alignItems:'center', gap:12 }}>
									<div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#007aff,#5856d6)', color:'white', fontWeight:800, fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 8px rgba(0,122,255,0.3)' }}>
										{personName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
									</div>
									<div style={{ flex:1, minWidth:0 }}>
										<div style={{ fontWeight:700, fontSize:'0.95rem', color:'#1c1c1e', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{personName}</div>
										<div style={{ fontSize:'0.72rem', color:'#636366', marginTop:1 }}>{personDept}</div>
									</div>
									<div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
										{isHP && <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:20, padding:'2px 8px', fontSize:'0.68rem', fontWeight:700 }}>HIGH PRIORITY</span>}
										{a.rescheduledAt && <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:20, padding:'2px 8px', fontSize:'0.68rem', fontWeight:700 }}>RESCHEDULED</span>}
										<span style={{ background:sc.bg, color:sc.color, border:`1.5px solid ${sc.border}`, borderRadius:20, padding:'4px 12px', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.03em' }}>
											{a.rescheduledAt ? 'Rescheduled' : a.status}
										</span>
									</div>
								</div>

								{/* Time + mode */}
								<div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
									<span style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.82rem', fontWeight:600, color:'#3a3a3c' }}>
										<Clock size={13} style={{ color:'#007aff' }} />
										{new Date(a.startTime).toLocaleString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
									</span>
									{mode && (
										<span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background:mode==='Online'?'#eff6ff':'#f0fdf4', color:mode==='Online'?'#007aff':'#16a34a', border:`1px solid ${mode==='Online'?'#bfdbfe':'#bbf7d0'}` }}>
											{mode==='Online'?<Video size={11} />:<MapPin size={11} />} {mode}
										</span>
									)}
								</div>

								{/* Academic */}
								{meta && <div style={{ fontSize:'0.75rem', color:'#636366', display:'flex', alignItems:'center', gap:5 }}>{meta}</div>}

								{/* Confirmed details */}
								{a.status === 'CONFIRMED' && (a.meetingLink || a.meetingLocation || a.confirmationMessage) && (
									<div style={{ display:'flex', flexDirection:'column', gap:8, padding:'12px 14px', background:'linear-gradient(135deg,rgba(240,253,244,0.9),rgba(239,246,255,0.9))', border:'1px solid #bbf7d0', borderRadius:12, backdropFilter:'blur(8px)' }}>
										{a.confirmationMessage && (
											<div style={{ fontSize:'0.85rem', color:'#1c1c1e', fontWeight:500, display:'flex', alignItems:'flex-start', gap:7 }}>
												<MessageSquare size={14} style={{ color: "#16a34a", flexShrink:0 }} />
												<span>{a.confirmationMessage}</span>
											</div>
										)}
										<div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
											{a.meetingLink && (
												<a href={a.meetingLink} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:5, color:'#007aff', fontWeight:700, fontSize:'0.82rem', textDecoration:'none', padding:'6px 12px', background:'rgba(0,122,255,0.08)', borderRadius:10, border:'1px solid rgba(0,122,255,0.15)' }}>
													Join Meeting
												</a>
											)}
											{a.meetingLocation && (
												<span style={{ display:'inline-flex', alignItems:'center', gap:5, color:'#16a34a', fontWeight:600, fontSize:'0.82rem', padding:'6px 12px', background:'rgba(22,163,74,0.06)', borderRadius:10, border:'1px solid rgba(22,163,74,0.15)' }}>
													{a.meetingLocation}
												</span>
											)}
										</div>
									</div>
								)}

								{/* Cancelled reason */}
								{a.status === 'CANCELLED' && a.rescheduleReason && (
									<div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.75rem', color:'#dc2626', fontWeight:600, background:'rgba(254,242,242,0.8)', border:'1px solid #fecaca', borderRadius:10, padding:'7px 12px' }}>
										{a.rescheduleReason}
									</div>
								)}

								{/* Reschedule reason */}
								{a.rescheduledAt && a.rescheduleReason && (
									<div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.75rem', color:'#dc2626', fontWeight:600, background:'rgba(254,242,242,0.8)', border:'1px solid #fecaca', borderRadius:10, padding:'7px 12px' }}>
										RESCHEDULED: {a.rescheduleReason}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</main>
			<Footer />
		</div>
	);
}
export function ProfilePage({ currentUser, onLogout, onUserUpdate }) {
	const navigate = useNavigate();
	const isLecturer = currentUser?.role === 'LECTURER';
	const isStudent = currentUser?.role === 'STUDENT';
	const [profileImagePreview, setProfileImagePreview] = useState(
		currentUser?.profileImage ? `${BACKEND}/uploads/${currentUser.profileImage}` : null
	);
	const [uploadingImage, setUploadingImage] = useState(false);

	const [formData, setFormData] = useState({
		name: currentUser?.name || '',
		department: currentUser?.department || '',
		phone: currentUser?.phone || '',
		expertise: currentUser?.expertise || '',
		registrationNumber: currentUser?.registrationNumber || '',
		batch: currentUser?.batch || '',
		academicYear: currentUser?.academicYear || '',
		semester: currentUser?.semester || '',
		employeeCode: currentUser?.employeeCode || '',
		designation: currentUser?.designation || '',
		officeLocation: currentUser?.officeLocation || '',
		officeHours: currentUser?.officeHours || '',
		bio: currentUser?.bio || '',
		currentPassword: '',
		newPassword: '',
		confirmNewPassword: '',
	});

	const [dndEnabled, setDndEnabled] = useState(currentUser?.doNotDisturb ?? false);
	const [autoReplyMessage, setAutoReplyMessage] = useState(currentUser?.autoReplyMessage ?? '');
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState(null);
	const [profileStatus, setProfileStatus] = useState(null);
	const [deleteConfirmText, setDeleteConfirmText] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);
	const selectedAcademicPeriod = ACADEMIC_PERIODS.find(
		(p) => p.academicYear === formData.academicYear && p.semester === formData.semester
	)?.label || '';

	useEffect(() => {
		setFormData({
			name: currentUser?.name || '',
			department: currentUser?.department || '',
			phone: currentUser?.phone || '',
			expertise: currentUser?.expertise || '',
			registrationNumber: currentUser?.registrationNumber || '',
			batch: currentUser?.batch || '',
			academicYear: currentUser?.academicYear || '',
			semester: currentUser?.semester || '',
			employeeCode: currentUser?.employeeCode || '',
			designation: currentUser?.designation || '',
			officeLocation: currentUser?.officeLocation || '',
			officeHours: currentUser?.officeHours || '',
			bio: currentUser?.bio || '',
			currentPassword: '',
			newPassword: '',
			confirmNewPassword: '',
		});
		setDndEnabled(currentUser?.doNotDisturb ?? false);
		setAutoReplyMessage(currentUser?.autoReplyMessage ?? '');
	}, [currentUser]);

	const handleProfileImageChange = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			setProfileStatus({ type: 'error', message: 'Image must be under 5MB' });
			return;
		}
		// Show preview immediately
		setProfileImagePreview(URL.createObjectURL(file));
		setUploadingImage(true);
		try {
			const formData = new FormData();
			formData.append('image', file);
			const res = await api.post(`/users/${currentUser.id}/profile-image`, formData);
			if (onUserUpdate) onUserUpdate(res.data);
			setProfileStatus({ type: 'success', message: 'Profile photo updated!' });
		} catch {
			setProfileStatus({ type: 'error', message: 'Failed to upload image.' });
		} finally {
			setUploadingImage(false);
		}
	};

	const handleFormChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleAcademicPeriodChange = (e) => {
		const period = ACADEMIC_PERIODS.find((p) => p.label === e.target.value);
		setFormData((prev) => ({
			...prev,
			academicYear: period ? period.academicYear : '',
			semester: period ? period.semester : '',
		}));
	};

	const handleProfileSave = async (e) => {
		e.preventDefault();
		if (!currentUser?.id) return;

		if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
			setProfileStatus({ type: 'error', message: 'New password and confirm password do not match.' });
			return;
		}

		setIsSaving(true);
		setProfileStatus(null);

		try {
			const payload = {
				name: formData.name,
				department: formData.department,
				phone: formData.phone,
				expertise: isLecturer ? formData.expertise : null,
				registrationNumber: isStudent ? formData.registrationNumber : null,
				batch: isStudent ? formData.batch : null,
				academicYear: isStudent ? formData.academicYear : null,
				semester: isStudent ? formData.semester : null,
				employeeCode: isLecturer ? formData.employeeCode : null,
				designation: isLecturer ? formData.designation : null,
				officeLocation: isLecturer ? formData.officeLocation : null,
				officeHours: isLecturer ? formData.officeHours : null,
				bio: isLecturer ? formData.bio : null,
				currentPassword: formData.newPassword ? formData.currentPassword : null,
				newPassword: formData.newPassword || null,
			};

			const response = await userApi.updateProfile(currentUser.id, payload);
			const updatedUser = response.data;

			if (onUserUpdate) {
				onUserUpdate(updatedUser);
			}

			setFormData((prev) => ({
				...prev,
				currentPassword: '',
				newPassword: '',
				confirmNewPassword: '',
			}));
			setProfileStatus({ type: 'success', message: 'Profile updated successfully.' });
		} catch (error) {
			const errorMessage = error?.response?.data?.message || 'Failed to update profile. Please try again.';
			setProfileStatus({ type: 'error', message: errorMessage });
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (!currentUser?.id) return;
		if (deleteConfirmText !== 'DELETE') {
			setProfileStatus({ type: 'error', message: 'Type DELETE to confirm account deletion.' });
			return;
		}

		setIsDeleting(true);
		setProfileStatus(null);

		try {
			await userApi.deleteAccount(currentUser.id);
			setProfileStatus({ type: 'success', message: 'Account deleted successfully.' });
			setTimeout(() => {
				if (onLogout) {
					onLogout();
				}
				navigate('/');
			}, 700);
		} catch (error) {
			const errorMessage = error?.response?.data?.message || 'Failed to delete account. Please try again.';
			setProfileStatus({ type: 'error', message: errorMessage });
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDndToggle = async () => {
		if (!isLecturer || !currentUser?.id) return;

		const newDndState = !dndEnabled;
		setIsSaving(true);
		setSaveStatus(null);

		try {
			await userApi.toggleDnd(currentUser.id, newDndState, autoReplyMessage);
			setDndEnabled(newDndState);
			setSaveStatus({ type: 'success', message: `Do Not Disturb ${newDndState ? 'enabled' : 'disabled'}` });
			if (onUserUpdate) {
				onUserUpdate({ ...currentUser, doNotDisturb: newDndState, autoReplyMessage });
			}
			setTimeout(() => setSaveStatus(null), 3000);
		} catch {
			setSaveStatus({ type: 'error', message: 'Failed to update settings. Please try again.' });
		} finally {
			setIsSaving(false);
		}
	};

	const handleSaveAutoReply = async () => {
		if (!isLecturer || !currentUser?.id) return;

		setIsSaving(true);
		setSaveStatus(null);

		try {
			await userApi.toggleDnd(currentUser.id, dndEnabled, autoReplyMessage);
			setSaveStatus({ type: 'success', message: 'Auto-reply message saved successfully' });
			if (onUserUpdate) {
				onUserUpdate({ ...currentUser, doNotDisturb: dndEnabled, autoReplyMessage });
			}
			setTimeout(() => setSaveStatus(null), 3000);
		} catch {
			setSaveStatus({ type: 'error', message: 'Failed to save auto-reply message. Please try again.' });
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
			<Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
			<main style={{ flex: 1, maxWidth: 860, margin: '0 auto', width: '100%', padding: '28px 16px' }}>
				<button
					type="button"
					onClick={() => navigate(isLecturer ? '/lecturer/home' : '/student/home')}
					style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #cbd5e1', background: 'white', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}
				>
					<ArrowLeft size={16} /> Back
				</button>

				<section style={{ marginTop: 14, background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
					<h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
						<User size={20} /> My Profile
					</h1>

					{profileStatus && (
						<div style={{
							marginTop: 16,
							padding: 12,
							borderRadius: 10,
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							background: profileStatus.type === 'success' ? '#f0fdf4' : '#fef9c3',
							border: `1px solid ${profileStatus.type === 'success' ? '#bbf7d0' : '#fed7aa'}`,
							color: profileStatus.type === 'success' ? '#166534' : '#a16207',
						}}>
							{profileStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
							<span>{profileStatus.message}</span>
						</div>
					)}

					<form onSubmit={handleProfileSave} style={{ marginTop: 16, display: 'grid', gap: 14 }}>
						{/* Profile Photo */}
						<div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
							<div style={{ position: 'relative', flexShrink: 0 }}>
								{profileImagePreview ? (
									<img
										src={profileImagePreview}
										alt="Profile"
										style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e2e8f0' }}
									/>
								) : (
									<div style={{
										width: 80, height: 80, borderRadius: '50%',
										background: 'linear-gradient(135deg, #0f766e, #0891b2)',
										display: 'flex', alignItems: 'center', justifyContent: 'center',
										fontSize: '1.6rem', fontWeight: 800, color: 'white', border: '3px solid #e2e8f0'
									}}>
										{(currentUser?.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
									</div>
								)}
								<label htmlFor="profile-image-upload" style={{
									position: 'absolute', bottom: 0, right: 0,
									width: 26, height: 26, borderRadius: '50%',
									background: '#0f766e', color: 'white',
									display: 'flex', alignItems: 'center', justifyContent: 'center',
									cursor: 'pointer', border: '2px solid white',
									boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
								}}>
									<Camera size={13} />
								</label>
								<input
									id="profile-image-upload"
									type="file"
									accept="image/*"
									style={{ display: 'none' }}
									onChange={handleProfileImageChange}
								/>
							</div>
							<div>
								<div style={{ fontWeight: 700, color: '#1e293b' }}>{currentUser?.name}</div>
								<div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{currentUser?.email}</div>
								<div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
									{uploadingImage ? 'Uploading...' : 'Click the camera icon to change photo'}
								</div>
							</div>
						</div>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
							<div>
								<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Full Name</label>
								<input name="name" value={formData.name} onChange={handleFormChange} required style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1' }} />
							</div>
							<div>
								<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Email</label>
								<input value={currentUser?.email || ''} readOnly style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
							</div>
							<div>
								<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Department</label>
								<select
									name="department"
									value={formData.department}
									onChange={handleFormChange}
									style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', background: 'white' }}
								>
									<option value="">Select department</option>
									{DEPARTMENT_OPTIONS.map((dept) => (
										<option key={dept} value={dept}>{dept}</option>
									))}
								</select>
							</div>
							<div>
								<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Phone</label>
								<input name="phone" value={formData.phone} onChange={handleFormChange} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1' }} />
							</div>
						</div>

						{isStudent && (
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
								<div>
									<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Registration Number</label>
									<input name="registrationNumber" value={formData.registrationNumber} onChange={handleFormChange} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1' }} />
								</div>
								<div>
									<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Batch</label>
									<select
										name="batch"
										value={formData.batch}
										onChange={handleFormChange}
										style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', background: 'white' }}
									>
										<option value="">Select batch</option>
										{BATCH_OPTIONS.map((batch) => (
											<option key={batch} value={batch}>{batch}</option>
										))}
									</select>
								</div>
								<div>
									<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Academic Year</label>
									<select
										value={selectedAcademicPeriod}
										onChange={handleAcademicPeriodChange}
										style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', background: 'white' }}
									>
										<option value="">Select academic year and semester</option>
										{ACADEMIC_PERIODS.map((period) => (
											<option key={period.label} value={period.label}>{period.label}</option>
										))}
									</select>
								</div>
								<div>
									<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Semester</label>
									<input name="semester" value={formData.semester} readOnly style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
								</div>
							</div>
						)}

						{isLecturer && (
							<>
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
									<div>
										<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Expertise</label>
										<input name="expertise" value={formData.expertise} onChange={handleFormChange} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1' }} />
									</div>
									<div>
										<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Employee Code</label>
										<input name="employeeCode" value={formData.employeeCode} onChange={handleFormChange} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1' }} />
									</div>
									<div>
										<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Designation</label>
										<select name="designation" value={formData.designation} onChange={handleFormChange} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', background: 'white' }}>
											<option value="">Select designation</option>
											<option value="Lecturer">Lecturer</option>
											<option value="Lecturer In Charge">Lecturer In Charge</option>
											<option value="Senior Lecturer">Senior Lecturer</option>
											<option value="Professor">Professor</option>
										</select>
									</div>
									<div>
										<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Office Location</label>
										<input name="officeLocation" value={formData.officeLocation} onChange={handleFormChange} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1' }} />
									</div>
									<div>
										<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Office Hours</label>
										<input name="officeHours" value={formData.officeHours} onChange={handleFormChange} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1' }} />
									</div>
								</div>
								<div>
									<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Bio</label>
									<textarea name="bio" value={formData.bio} onChange={handleFormChange} style={{ width: '100%', minHeight: 90, padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', resize: 'vertical' }} />
								</div>
							</>
						)}

						<div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
							<div>
								<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Current Password</label>
								<input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleFormChange} placeholder="Required if changing password" style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1' }} />
							</div>
							<div>
								<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>New Password</label>
								<input type="password" name="newPassword" value={formData.newPassword} onChange={handleFormChange} placeholder="Leave empty to keep current password" style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1' }} />
							</div>
							<div>
								<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Confirm New Password</label>
								<input type="password" name="confirmNewPassword" value={formData.confirmNewPassword} onChange={handleFormChange} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1' }} />
							</div>
						</div>

						<div style={{ display: 'flex', gap: 10 }}>
							<button
								type="submit"
								disabled={isSaving}
								style={{
									padding: '10px 16px',
									borderRadius: 10,
									border: 'none',
									background: '#0f766e',
									color: 'white',
									fontWeight: 700,
									cursor: isSaving ? 'not-allowed' : 'pointer',
									opacity: isSaving ? 0.6 : 1,
								}}
							>
								{isSaving ? 'Saving...' : 'Save Profile'}
							</button>
						</div>
					</form>
				</section>

				<section style={{ marginTop: 20, background: 'white', border: '1px solid #fecaca', borderRadius: 16, padding: 20 }}>
					<h2 style={{ margin: 0, color: '#b91c1c' }}>Delete Account</h2>
					<p style={{ margin: '10px 0', color: '#7f1d1d' }}>
						This permanently removes your account and associated data from the database.
					</p>
					<label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#7f1d1d' }}>
						Type DELETE to confirm
					</label>
					<input
						value={deleteConfirmText}
						onChange={(e) => setDeleteConfirmText(e.target.value)}
						placeholder="DELETE"
						style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #fca5a5', marginBottom: 12 }}
					/>
					<button
						type="button"
						onClick={handleDeleteAccount}
						disabled={isDeleting}
						style={{
							padding: '10px 16px',
							borderRadius: 10,
							border: 'none',
							background: '#dc2626',
							color: 'white',
							fontWeight: 700,
							cursor: isDeleting ? 'not-allowed' : 'pointer',
							opacity: isDeleting ? 0.6 : 1,
						}}
					>
						{isDeleting ? 'Deleting...' : 'Delete My Account'}
					</button>
				</section>

				{isLecturer && (
					<section style={{ marginTop: 20, background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
						<h2 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 10, color: '#1e293b' }}>
							{dndEnabled ? <BellOff size={20} style={{ color: '#ea580c' }} /> : <Bell size={20} style={{ color: '#64748b' }} />}
							Do Not Disturb Settings
						</h2>

						{saveStatus && (
							<div style={{
								marginBottom: 16,
								padding: 12,
								borderRadius: 10,
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								background: saveStatus.type === 'success' ? '#f0fdf4' : '#fef9c3',
								border: `1px solid ${saveStatus.type === 'success' ? '#bbf7d0' : '#fed7aa'}`,
								color: saveStatus.type === 'success' ? '#166534' : '#a16207',
							}}>
								{saveStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
								<span>{saveStatus.message}</span>
							</div>
						)}

						<div style={{ marginBottom: 20 }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
								<label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, cursor: 'pointer' }}>
									<div style={{
										position: 'relative',
										width: 48,
										height: 28,
										borderRadius: 14,
										background: dndEnabled ? '#ea580c' : '#cbd5e1',
										transition: 'background 0.3s ease',
										cursor: 'pointer',
									}}>
										<div style={{
											position: 'absolute',
											top: 2,
											left: dndEnabled ? 24 : 2,
											width: 24,
											height: 24,
											borderRadius: 12,
											background: 'white',
											transition: 'left 0.3s ease',
										}} />
									</div>
									<span onClick={handleDndToggle} style={{ cursor: 'pointer', userSelect: 'none' }}>
										{dndEnabled ? 'Do Not Disturb: ON' : 'Do Not Disturb: OFF'}
									</span>
								</label>
							</div>
						</div>

						<div>
							<label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#1e293b' }}>
								Auto-Reply Message
							</label>
							<textarea
								value={autoReplyMessage}
								onChange={(e) => setAutoReplyMessage(e.target.value)}
								placeholder="e.g., I'm busy right now. I'll get back to you after 3 PM. Thanks for your message!"
								style={{
									width: '100%',
									padding: 12,
									borderRadius: 10,
									border: '1px solid #cbd5e1',
									fontFamily: 'inherit',
									fontSize: 13,
									minHeight: 100,
									resize: 'vertical',
									boxSizing: 'border-box',
								}}
							/>
						</div>

						<div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
							<button
								onClick={handleDndToggle}
								disabled={isSaving}
								style={{
									padding: '10px 16px',
									borderRadius: 10,
									border: 'none',
									background: dndEnabled ? 'white' : '#ea580c',
									color: dndEnabled ? '#ea580c' : 'white',
									fontWeight: 600,
									cursor: isSaving ? 'not-allowed' : 'pointer',
									opacity: isSaving ? 0.6 : 1,
									borderLeft: dndEnabled ? '2px solid #ea580c' : 'none',
								}}
							>
								{isSaving ? 'Saving...' : (dndEnabled ? 'Turn OFF' : 'Turn ON')}
							</button>
							<button
								onClick={handleSaveAutoReply}
								disabled={isSaving || !autoReplyMessage.trim()}
								style={{
									padding: '10px 16px',
									borderRadius: 10,
									border: '1px solid #cbd5e1',
									background: 'white',
									color: '#1e293b',
									fontWeight: 600,
									cursor: isSaving || !autoReplyMessage.trim() ? 'not-allowed' : 'pointer',
									opacity: isSaving || !autoReplyMessage.trim() ? 0.6 : 1,
								}}
							>
								{isSaving ? 'Saving...' : 'Save Auto-Reply'}
							</button>
						</div>
					</section>
				)}
			</main>
			<Footer />
		</div>
	);
}

export function ComingSoonPage({ currentUser, onLogout }) {
	const navigate = useNavigate();
	const isLecturer = currentUser?.role === 'LECTURER';

	return (
		<div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
			<Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
			<main style={{ flex: 1, maxWidth: 860, margin: '0 auto', width: '100%', padding: '28px 16px' }}>
				<button
					type="button"
					onClick={() => navigate(isLecturer ? '/lecturer/home' : '/student/home')}
					style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #cbd5e1', background: 'white', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}
				>
					<ArrowLeft size={16} /> Back
				</button>

				<section style={{ marginTop: 14, background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, textAlign: 'center' }}>
					<div style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', background: '#eef2ff', color: '#4f46e5' }}>
						<Wrench size={24} />
					</div>
					<h1 style={{ marginTop: 14, marginBottom: 6 }}>Feature In Progress</h1>
					<p style={{ margin: 0, color: '#64748b' }}>
						This page is ready. Final business functionality can be added here next.
					</p>
				</section>
			</main>
			<Footer />
		</div>
	);
}




