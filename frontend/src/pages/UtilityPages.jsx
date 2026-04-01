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
					<button
						type="button"
						onClick={() => navigate('/book')}
						style={{ marginTop: 12, padding: '8px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer' }}
					>
						+ Book New Appointment
					</button>

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
