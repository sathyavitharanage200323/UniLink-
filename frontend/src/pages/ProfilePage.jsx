import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft, BellOff, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { userApi } from '../api/chatApi';
import './ProfilePage.css';

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


export default function ProfilePage({ currentUser, onLogout, onUserUpdate }) {
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
		designation: currentUser?.designation || '',
		officeLocation: currentUser?.officeLocation || '',
		officeHours: currentUser?.officeHours || '',
		bio: currentUser?.bio || '',
		currentPassword: '',
		newPassword: '',
		confirmNewPassword: '',
	});

	const [dndEnabled, setDndEnabled] = useState(currentUser?.doNotDisturb ?? false);
	const [notificationEnabled, setNotificationEnabled] = useState(currentUser?.notificationEnabled !== false);
	const [autoReplyMessage, setAutoReplyMessage] = useState(currentUser?.autoReplyMessage ?? '');
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState(null);
	const [notificationStatus, setNotificationStatus] = useState(null);
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
		setNotificationEnabled(currentUser?.notificationEnabled !== false);
		setAutoReplyMessage(currentUser?.autoReplyMessage ?? '');
	}, [currentUser]);

	const handleNotificationToggle = async () => {
		if (!currentUser?.id) return;

		const next = !notificationEnabled;
		setIsSaving(true);
		setNotificationStatus(null);

		try {
			await userApi.toggleNotifications(currentUser.id, next);
			setNotificationEnabled(next);
			setNotificationStatus({ type: 'success', message: `Notifications ${next ? 'enabled' : 'disabled'}` });
			if (onUserUpdate) {
			onUserUpdate({ ...currentUser, notificationEnabled: next });
			}
			setTimeout(() => setNotificationStatus(null), 3000);
		} catch {
			setNotificationStatus({ type: 'error', message: 'Failed to update notification preference.' });
		} finally {
			setIsSaving(false);
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
								<select
									name="department"
									value={formData.department}
									onChange={handleFormChange}
									className="profile-select"
								>
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
									<select
										name="batch"
										value={formData.batch}
										onChange={handleFormChange}
										className="profile-select"
									>
										<option value="">Select batch</option>
										{BATCH_OPTIONS.map((batch) => (
											<option key={batch} value={batch}>{batch}</option>
										))}
									</select>
								</div>
								<div>
									<label className="profile-label">Academic Year</label>
									<select
										value={selectedAcademicPeriod}
										onChange={handleAcademicPeriodChange}
										className="profile-select"
									>
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
							<button
								type="submit"
								disabled={isSaving}
								className="profile-btn--save"
							>
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
					<button
						type="button"
						onClick={handleDeleteAccount}
						disabled={isDeleting}
						className="profile-btn--delete"
					>
						{isDeleting ? 'Deleting...' : 'Delete My Account'}
					</button>
				</section>

				<section className="profile-section--standard">
					<h2 className="profile-section__title--standard">
						{notificationEnabled
							? <Bell size={20} className="icon--success" />
							: <BellOff size={20} className="icon--muted" />}
						Notification Preferences
					</h2>

					{notificationStatus && (
						<div className={`profile-status profile-status--mb ${notificationStatus.type === 'success' ? 'profile-status--success' : 'profile-status--error'}`}>
							{notificationStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
							<span>{notificationStatus.message}</span>
						</div>
					)}

					<p className="profile-notif-desc">
						Controls in-app notifications for booking, cancellations, upcoming appointments, and daily schedule summaries.
					</p>

					<button
						type="button"
						onClick={handleNotificationToggle}
						disabled={isSaving}
						className={notificationEnabled ? 'profile-btn--notif-on' : 'profile-btn--notif-off'}
					>
						{isSaving ? 'Saving...' : (notificationEnabled ? 'Disable Notifications' : 'Enable Notifications')}
					</button>
				</section>

				{isLecturer && (
					<section className="profile-section--standard">
						<h2 className="profile-section__title--standard">
							{dndEnabled
								? <BellOff size={20} className="icon--warning" />
								: <Bell size={20} className="icon--muted" />}
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

						<div className="profile-form__actions" style={{ marginTop: 16 }}>
							<button
								onClick={handleDndToggle}
								disabled={isSaving}
								className={dndEnabled ? 'profile-btn--dnd-on' : 'profile-btn--dnd-off'}
							>
								{isSaving ? 'Saving...' : (dndEnabled ? 'Turn OFF' : 'Turn ON')}
							</button>
							<button
								onClick={handleSaveAutoReply}
								disabled={isSaving || !autoReplyMessage.trim()}
								className="profile-btn--secondary"
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
