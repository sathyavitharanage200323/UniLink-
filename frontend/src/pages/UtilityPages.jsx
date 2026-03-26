import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Wrench, ArrowLeft, Clock, BellOff, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { userApi } from '../api/chatApi';

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

export function AppointmentsPage({ currentUser, appointments = [], onLogout }) {
	const navigate = useNavigate();
	const isLecturer = currentUser?.role === 'LECTURER';
	const list = appointments.length > 0 ? appointments : [];

	return (
		<div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
			<Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
			<main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '28px 16px' }}>
				<button
					type="button"
					onClick={() => navigate(isLecturer ? '/lecturer/home' : '/student/home')}
					style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #cbd5e1', background: 'white', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}
				>
					<ArrowLeft size={16} /> Back
				</button>

				<section style={{ marginTop: 14, background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
					<h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
						<Calendar size={20} /> Appointments
					</h1>
					<p style={{ margin: '8px 0 0', color: '#475569' }}>
						{list.length} appointment(s) loaded from backend.
					</p>

					<div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
						{list.map((a) => (
							<div key={a.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fcfdff' }}>
								<strong>{isLecturer ? (a.student?.name ?? 'Student') : (a.lecturer?.name ?? 'Lecturer')}</strong>
								<div style={{ marginTop: 6, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
									<Clock size={14} /> {new Date(a.startTime).toLocaleString()}
								</div>
								<div style={{ marginTop: 6, color: '#0f766e', fontWeight: 700 }}>{a.status}</div>
								{a.notes && <div style={{ marginTop: 4, color: '#334155' }}>{a.notes}</div>}
							</div>
						))}
						{list.length === 0 && (
							<div style={{ border: '1px dashed #cbd5e1', borderRadius: 12, padding: 16, color: '#64748b' }}>
								No appointments yet.
							</div>
						)}
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
}

export function ProfilePage({ currentUser, onLogout, onUserUpdate }) {
	const navigate = useNavigate();
	const isLecturer = currentUser?.role === 'LECTURER';
	const isStudent = currentUser?.role === 'STUDENT';

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
