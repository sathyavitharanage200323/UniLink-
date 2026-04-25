import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Calendar, User, Wrench, ArrowLeft, Clock, BellOff, Bell, AlertCircle, CheckCircle, RefreshCw, Camera, Video, MapPin, MessageSquare, XCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { userApi } from '../api/chatApi';
import api from '../api/axiosInstance';
import { BACKEND_BASE_URL } from '../config';
import './UtilityPages.css';

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
		<div className="util-reschedule-btns">
			<button onClick={() => handle('accept')} disabled={!!loading} className="util-btn--accept">
				<CheckCircle size={14} /> {loading === 'accept' ? 'Confirming…' : 'Accept New Time'}
			</button>
			<button onClick={() => handle('decline')} disabled={!!loading} className="util-btn--decline">
				<XCircle size={14} /> {loading === 'decline' ? 'Declining…' : 'Decline'}
			</button>
		</div>
	);
}

export function AppointmentsPage({ currentUser, appointments = [], onLogout }) {
	const navigate = useNavigate();
	const isLecturer = currentUser?.role === 'LECTURER';
	const isAdmin = currentUser?.role === 'ADMIN';
	const [list, setList] = useState(appointments);
	const [refreshing, setRefreshing] = useState(false);
	const [filter, setFilter] = useState('ALL');

	const fetchAppts = async () => {
		if (!currentUser?.id) return;
		try {
			let ep;
			if (isAdmin) {
				ep = '/appointments';
			} else {
				ep = isLecturer ? `/appointments/lecturer/${currentUser.id}` : `/appointments/student/${currentUser.id}`;
			}
			const res = await api.get(ep);
			setList(res.data || []);
		} catch { /* keep cached */ }
	};

	useEffect(() => {
		fetchAppts();
		const t = setInterval(fetchAppts, 10000);
		return () => clearInterval(t);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUser?.id, isLecturer, isAdmin]);

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
		PENDING:   { color:'#B5722A', bg:'#FFF5F0', border:'#FDDCC8', dot:'#E8650A' },
		CONFIRMED: { color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', dot:'#22c55e' },
		CANCELLED: { color:'#dc2626', bg:'#fef2f2', border:'#fecaca', dot:'#ef4444' },
		COMPLETED: { color:'#6b7280', bg:'#f8fafc', border:'#e2e8f0', dot:'#9ca3af' },
	};

	return (
		<div className="util-page appt-page-bg">
			<Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
			<main className="util-main">

				{/* Back */}
				<button onClick={() => navigate(isAdmin ? '/admin/home' : (isLecturer ? '/lecturer/home' : '/student/home'))}
					className="util-back-btn">
					<ArrowLeft size={15} /> Back
				</button>

				{/* Header card */}
				<div className="util-header-card">
					<div className="util-header-card__row">
						<div>
							<h1 className="util-header-card__title">
								<Calendar size={22} className="icon--primary" /> {isAdmin ? 'All Appointments' : 'My Appointments'}
							</h1>
							<p className="util-header-card__subtitle">{list.length} total · auto-refreshes every 10s</p>
						</div>
						<div className="util-header-card__actions">
							{!isLecturer && !isAdmin && (
								<button onClick={() => navigate('/book')} className="util-btn--primary">
									+ Book New
								</button>
							)}
							<button onClick={handleRefresh} disabled={refreshing} className="util-btn--ghost">
								<RefreshCw size={14} style={{ animation: refreshing ? 'apf-rotate 0.8s linear infinite' : 'none' }} /> Refresh
							</button>
						</div>
					</div>

					{/* Filter pills */}
					<div className="util-filter-pills">
						{['ALL','PENDING','CONFIRMED','COMPLETED','CANCELLED'].map(f => {
							const active = filter === f;
							const cfg = STATUS_CFG[f];
							return (
								<button key={f} onClick={() => setFilter(f)} className="util-pill" style={{
									border: active ? 'none' : '1px solid rgba(0,0,0,0.1)',
									background: active ? (cfg ? cfg.color : 'var(--color-primary)') : 'rgba(0,0,0,0.04)',
									color: active ? 'white' : 'var(--color-text-muted)',
									boxShadow: active ? `0 2px 8px ${cfg ? cfg.color+'55' : 'rgba(232,101,10,0.3)'}` : 'none',
								}}>
									{cfg && <span className="util-pill__dot" style={{ background: active ? 'rgba(255,255,255,0.7)' : cfg.dot }} />}
									{f} {f !== 'ALL' && <span style={{ opacity:0.75 }}>({counts[f]})</span>}
								</button>
							);
						})}
					</div>
				</div>

				{/* Appointment cards */}
				<div className="util-appt-list">
					{/* Rescheduled appointments — pinned at top with alert styling */}
					{filtered.filter(a => a.rescheduledAt && a.status === 'PENDING').map(a => {
						const mode = extract(a.notes, 'MODE');
						return (
							<div key={`rs-${a.id}`} className="util-appt-card--rescheduled">
								<div className="util-card-header">
									<div className="util-avatar util-avatar--danger">
										{(a.lecturer?.name||'L').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
									</div>
									<div style={{ flex:1 }}>
										<div className="util-card-name">{a.lecturer?.name ?? 'Lecturer'}</div>
										<div className="util-card-dept">{a.lecturer?.department}</div>
									</div>
									<span className="util-badge--rescheduled-label">
										↺ RESCHEDULED
									</span>
								</div>
								<div className="util-reschedule-time">
									<Clock size={14} className="icon--danger" />
									New time: {new Date(a.startTime).toLocaleString('en-GB', { weekday:'long', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
									{mode && <span className={mode==='Online'?'util-mode-chip util-mode-chip--online':'util-mode-chip util-mode-chip--inperson'}>{mode==='Online'?<Video size={11} />:<MapPin size={11} />} {mode}</span>}
								</div>
								{a.rescheduleReason && (
									<div className="util-reschedule-reason">
										<strong>Reason:</strong> {a.rescheduleReason}
									</div>
								)}
								{a.confirmationMessage && (
									<div className="util-reschedule-confirm-msg">💬 {a.confirmationMessage}</div>
								)}
								{(a.meetingLink || a.meetingLocation) && (
									<div className="util-reschedule-links">
										{a.meetingLink && <a href={a.meetingLink} target="_blank" rel="noopener noreferrer" className="util-reschedule-link"><Video size={13} /> Join Meeting</a>}
										{a.meetingLocation && <span className="util-reschedule-location"><MapPin size={13} /> {a.meetingLocation}</span>}
									</div>
								)}
								{/* Student accept/decline buttons — only if still PENDING after reschedule */}
								{a.status === 'PENDING' && <RescheduleButtons appointmentId={a.id} onDone={handleRefresh} />}
							</div>
						);
					})}

					{filtered.length === 0 && (
						<div className="util-empty-state">
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
						const personName = isAdmin ? `${a.student?.name ?? 'Student'} & ${a.lecturer?.name ?? 'Lecturer'}` : (isLecturer ? (a.student?.name ?? 'Student') : (a.lecturer?.name ?? 'Lecturer'));
						const personDept = isAdmin ? `${a.student?.department ?? ''} | ${a.lecturer?.department ?? ''}` : (isLecturer ? a.student?.department : a.lecturer?.department);

						return (
							<div key={a.id} className="util-appt-card" style={{
								border:`1px solid ${sc.border}`,
								borderLeft: `4px solid ${sc.color}`,
							}}>
								{/* Header */}
								<div className="util-card-header">
									<div className="util-avatar util-avatar--primary">
										{personName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
									</div>
									<div style={{ flex:1, minWidth:0 }}>
										<div className="util-card-name">{personName}</div>
										<div className="util-card-dept">{personDept}</div>
									</div>
									<div className="util-card-badges">
										{isHP && <span className="util-badge util-badge--danger">HIGH PRIORITY</span>}
										{a.rescheduledAt && <span className="util-badge util-badge--danger">RESCHEDULED</span>}
										<span style={{ background:sc.bg, color:sc.color, border:`1.5px solid ${sc.border}`, borderRadius:20, padding:'4px 12px', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.03em' }}>
											{a.rescheduledAt ? 'Rescheduled' : a.status}
										</span>
									</div>
								</div>

								{/* Time + mode */}
								<div className="util-time-row">
									<span className="util-time-text">
										<Clock size={13} className="icon--primary" />
										{new Date(a.startTime).toLocaleString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
									</span>
									{mode && (
										<span className={mode==='Online'?'util-mode-chip util-mode-chip--online':'util-mode-chip util-mode-chip--inperson'}>
											{mode==='Online'?<Video size={11} />:<MapPin size={11} />} {mode}
										</span>
									)}
								</div>

								{/* Academic */}
								{meta && <div className="util-meta-row">{meta}</div>}

								{/* Reason — PENDING only */}
								{a.status === 'PENDING' && reason && (
									<div className="util-reason-block">
										"{reason}"
									</div>
								)}

								{/* Confirmed details */}
								{a.status === 'CONFIRMED' && (a.meetingLink || a.meetingLocation || a.confirmationMessage) && (
									<div className="util-confirmed-box">
										{a.confirmationMessage && (
											<div className="util-confirmed-msg">
												<MessageSquare size={14} className="icon--success" />
												<span>{a.confirmationMessage}</span>
											</div>
										)}
										<div className="util-confirmed-links">
											{a.meetingLink && (
												<a href={a.meetingLink} target="_blank" rel="noopener noreferrer" className="util-meeting-link">
													Join Meeting
												</a>
											)}
											{a.meetingLocation && (
												<span className="util-meeting-location">
													{a.meetingLocation}
												</span>
											)}
										</div>
									</div>
								)}

								{/* Cancelled reason */}
								{a.status === 'CANCELLED' && a.rescheduleReason && (
									<div className="util-cancelled-reason">
										{a.rescheduleReason}
									</div>
								)}

								{/* Reschedule reason */}
								{a.rescheduledAt && a.rescheduleReason && (
									<div className="util-cancelled-reason">
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
		setProfileImagePreview(URL.createObjectURL(file));
		setUploadingImage(true);
		try {
			const fd = new FormData();
			fd.append('image', file);
			const res = await api.post(`/users/${currentUser.id}/profile-image`, fd);
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
		<div className="profile-page">
			<Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
			<main className="profile-main">
				<button
					type="button"
					onClick={() => navigate(isLecturer ? '/lecturer/home' : '/student/home')}
					className="profile-back-btn"
				>
					<ArrowLeft size={16} /> Back
				</button>

				<section className="profile-section">
					<h1 className="profile-section__title">
						<User size={20} /> My Profile
					</h1>

					{profileStatus && (
						<div className={`profile-status ${profileStatus.type === 'success' ? 'profile-status--success' : 'profile-status--error'}`}>
							{profileStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
							<span>{profileStatus.message}</span>
						</div>
					)}

					<form onSubmit={handleProfileSave} className="profile-form">
						{/* Profile Photo */}
						<div style={{ display:'flex', alignItems:'center', gap:20, padding:'12px 0', borderBottom:'1px solid var(--color-bg-secondary)' }}>
							<div style={{ position:'relative', flexShrink:0 }}>
								{profileImagePreview ? (
									<img
										src={profileImagePreview}
										alt="Profile"
										style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'3px solid var(--color-border)' }}
									/>
								) : (
									<div style={{
										width:80, height:80, borderRadius:'50%',
										background:'linear-gradient(135deg, var(--color-success), var(--color-primary))',
										display:'flex', alignItems:'center', justifyContent:'center',
										fontSize:'1.6rem', fontWeight:800, color:'white', border:'3px solid var(--color-border)'
									}}>
										{(currentUser?.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
									</div>
								)}
								<label htmlFor="profile-image-upload" style={{
									position:'absolute', bottom:0, right:0,
									width:26, height:26, borderRadius:'50%',
									background:'var(--color-success)', color:'white',
									display:'flex', alignItems:'center', justifyContent:'center',
									cursor:'pointer', border:'2px solid white',
									boxShadow:'0 1px 4px rgba(0,0,0,0.2)'
								}}>
									<Camera size={13} />
								</label>
								<input
									id="profile-image-upload"
									type="file"
									accept="image/*"
									style={{ display:'none' }}
									onChange={handleProfileImageChange}
								/>
							</div>
							<div>
								<div style={{ fontWeight:700, color:'var(--color-text-primary)' }}>{currentUser?.name}</div>
								<div style={{ fontSize:13, color:'var(--color-text-muted)', marginTop:2 }}>{currentUser?.email}</div>
								<div style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:4 }}>
									{uploadingImage ? 'Uploading...' : 'Click the camera icon to change photo'}
								</div>
							</div>
						</div>

						<div className="profile-form__grid">
							<div>
								<label className="profile-label">Full Name</label>
								<input name="name" value={formData.name} onChange={handleFormChange} required className="profile-input" />
							</div>
							<div>
								<label className="profile-label">Email</label>
								<input value={currentUser?.email || ''} readOnly className="profile-input--readonly" />
							</div>
							<div>
								<label className="profile-label">Department</label>
								<select name="department" value={formData.department} onChange={handleFormChange} className="profile-select">
									<option value="">Select department</option>
									{DEPARTMENT_OPTIONS.map((dept) => (
										<option key={dept} value={dept}>{dept}</option>
									))}
								</select>
							</div>
							<div>
								<label className="profile-label">Phone</label>
								<input name="phone" value={formData.phone} onChange={handleFormChange} className="profile-input" />
							</div>
						</div>

						{isStudent && (
							<div className="profile-form__grid">
								<div>
									<label className="profile-label">Registration Number</label>
									<input name="registrationNumber" value={formData.registrationNumber} onChange={handleFormChange} className="profile-input" />
								</div>
								<div>
									<label className="profile-label">Batch</label>
									<select name="batch" value={formData.batch} onChange={handleFormChange} className="profile-select">
										<option value="">Select batch</option>
										{BATCH_OPTIONS.map((batch) => (
											<option key={batch} value={batch}>{batch}</option>
										))}
									</select>
								</div>
								<div>
									<label className="profile-label">Academic Year</label>
									<select value={selectedAcademicPeriod} onChange={handleAcademicPeriodChange} className="profile-select">
										<option value="">Select academic year and semester</option>
										{ACADEMIC_PERIODS.map((period) => (
											<option key={period.label} value={period.label}>{period.label}</option>
										))}
									</select>
								</div>
								<div>
									<label className="profile-label">Semester</label>
									<input name="semester" value={formData.semester} readOnly className="profile-input--readonly" />
								</div>
							</div>
						)}

						{isLecturer && (
							<>
								<div className="profile-form__grid">
									<div>
										<label className="profile-label">Expertise</label>
										<input name="expertise" value={formData.expertise} onChange={handleFormChange} className="profile-input" />
									</div>
									<div>
										<label className="profile-label">Employee Code</label>
										<input name="employeeCode" value={formData.employeeCode} onChange={handleFormChange} className="profile-input" />
									</div>
									<div>
										<label className="profile-label">Designation</label>
										<select name="designation" value={formData.designation} onChange={handleFormChange} className="profile-select">
											<option value="">Select designation</option>
											<option value="Lecturer">Lecturer</option>
											<option value="Lecturer In Charge">Lecturer In Charge</option>
											<option value="Senior Lecturer">Senior Lecturer</option>
											<option value="Professor">Professor</option>
										</select>
									</div>
									<div>
										<label className="profile-label">Office Location</label>
										<input name="officeLocation" value={formData.officeLocation} onChange={handleFormChange} className="profile-input" />
									</div>
									<div>
										<label className="profile-label">Office Hours</label>
										<input name="officeHours" value={formData.officeHours} onChange={handleFormChange} className="profile-input" />
									</div>
								</div>
								<div>
									<label className="profile-label">Bio</label>
									<textarea name="bio" value={formData.bio} onChange={handleFormChange} className="profile-textarea" />
								</div>
							</>
						)}

						<div className="profile-form__divider">
							<div>
								<label className="profile-label">Current Password</label>
								<input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleFormChange} placeholder="Required if changing password" className="profile-input" />
							</div>
							<div>
								<label className="profile-label">New Password</label>
								<input type="password" name="newPassword" value={formData.newPassword} onChange={handleFormChange} placeholder="Leave empty to keep current password" className="profile-input" />
							</div>
							<div>
								<label className="profile-label">Confirm New Password</label>
								<input type="password" name="confirmNewPassword" value={formData.confirmNewPassword} onChange={handleFormChange} className="profile-input" />
							</div>
						</div>

						<div className="profile-form__actions">
							<button type="submit" disabled={isSaving} className="profile-btn--save">
								{isSaving ? 'Saving...' : 'Save Profile'}
							</button>
						</div>
					</form>
				</section>

				<section className="profile-section--danger">
					<h2 className="profile-section__title--danger">Delete Account</h2>
					<p className="profile-delete-desc">
						This permanently removes your account and associated data from the database.
					</p>
					<label className="profile-label--danger">
						Type DELETE to confirm
					</label>
					<input
						value={deleteConfirmText}
						onChange={(e) => setDeleteConfirmText(e.target.value)}
						placeholder="DELETE"
						className="profile-input--danger"
					/>
					<button type="button" onClick={handleDeleteAccount} disabled={isDeleting} className="profile-btn--delete">
						{isDeleting ? 'Deleting...' : 'Delete My Account'}
					</button>
				</section>

				{isLecturer && (
					<section className="profile-section--standard">
						<h2 className="profile-section__title--standard">
							{dndEnabled ? <BellOff size={20} className="icon--warning" /> : <Bell size={20} className="icon--muted" />}
							Do Not Disturb Settings
						</h2>

						{saveStatus && (
							<div className={`profile-status profile-status--mb ${saveStatus.type === 'success' ? 'profile-status--success' : 'profile-status--warning'}`}>
								{saveStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
								<span>{saveStatus.message}</span>
							</div>
						)}

						<div className="profile-dnd-wrap">
							<div className="profile-dnd-row">
								<label className="profile-dnd-label">
									<div className={`profile-dnd-switch ${dndEnabled ? 'profile-dnd-switch--on' : 'profile-dnd-switch--off'}`}>
										<div className={`profile-dnd-knob ${dndEnabled ? 'profile-dnd-knob--on' : 'profile-dnd-knob--off'}`} />
									</div>
									<span onClick={handleDndToggle} className="profile-dnd-text">
										{dndEnabled ? 'Do Not Disturb: ON' : 'Do Not Disturb: OFF'}
									</span>
								</label>
							</div>
						</div>

						<div>
							<label className="profile-autoreply-label">
								Auto-Reply Message
							</label>
							<textarea
								value={autoReplyMessage}
								onChange={(e) => setAutoReplyMessage(e.target.value)}
								placeholder="e.g., I'm busy right now. I'll get back to you after 3 PM. Thanks for your message!"
								className="profile-textarea--autoreply"
							/>
						</div>

						<div className="profile-form__actions" style={{ marginTop:16 }}>
							<button onClick={handleDndToggle} disabled={isSaving} className={dndEnabled ? 'profile-btn--dnd-on' : 'profile-btn--dnd-off'}>
								{isSaving ? 'Saving...' : (dndEnabled ? 'Turn OFF' : 'Turn ON')}
							</button>
							<button onClick={handleSaveAutoReply} disabled={isSaving || !autoReplyMessage.trim()} className="profile-btn--secondary">
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
		<div className="util-page">
			<Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
			<main className="coming-soon-main">
				<button
					type="button"
					onClick={() => navigate(isLecturer ? '/lecturer/home' : '/student/home')}
					className="util-back-btn"
				>
					<ArrowLeft size={16} /> Back
				</button>

				<section className="coming-soon-section">
					<div className="coming-soon-icon">
						<Wrench size={24} />
					</div>
					<h1 style={{ marginTop:14, marginBottom:6 }}>Feature In Progress</h1>
					<p className="coming-soon-desc">
						This page is ready. Final business functionality can be added here next.
					</p>
				</section>
			</main>
			<Footer />
		</div>
	);
}
