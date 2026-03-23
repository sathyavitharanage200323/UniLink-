import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Wrench, ArrowLeft, Clock, BellOff, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { userApi } from '../api/chatApi';

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

	const [dndEnabled, setDndEnabled] = useState(currentUser?.doNotDisturb ?? false);
	const [autoReplyMessage, setAutoReplyMessage] = useState(currentUser?.autoReplyMessage ?? '');
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState(null);

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
					<div style={{ marginTop: 16, display: 'grid', gap: 8, color: '#334155' }}>
						<div><strong>Name:</strong> {currentUser?.name}</div>
						<div><strong>Role:</strong> {currentUser?.role}</div>
						<div><strong>Department:</strong> {currentUser?.department || 'N/A'}</div>
						<div><strong>Email:</strong> {currentUser?.email || 'Not available'}</div>
						{currentUser?.expertise && <div><strong>Expertise:</strong> {currentUser.expertise}</div>}
					</div>
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
