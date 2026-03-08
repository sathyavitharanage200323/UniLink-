/**
 * Centralised API client for the UniLink backend (http://localhost:8080).
 * Every function returns a Promise that resolves to parsed JSON or throws an Error.
 */

const BASE_URL = 'http://localhost:9090';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  // 204 No Content has no body
  if (res.status === 204) return null;
  return res.json();
}

// ── Users ────────────────────────────────────────────────────────────────────

/** Fetch every user in the system (used to populate the login page). */
export function getUsers() {
  return apiFetch('/api/users');
}

/** Fetch users filtered by role: 'STUDENT' or 'LECTURER'. */
export function getUsersByRole(role) {
  return apiFetch(`/api/users/role/${role}`);
}

/** Fetch a single user by ID. */
export function getUser(id) {
  return apiFetch(`/api/users/${id}`);
}

/** Create a new user. */
export function createUser(userData) {
  return apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/** Toggle Do Not Disturb for a lecturer. */
export function toggleDnd(userId, dnd, autoReplyMessage) {
  return apiFetch(`/api/users/${userId}/dnd`, {
    method: 'PATCH',
    body: JSON.stringify({ dnd, autoReplyMessage }),
  });
}

// ── Appointments ─────────────────────────────────────────────────────────────

/** Get all appointments for a student. */
export function getStudentAppointments(studentId) {
  return apiFetch(`/api/appointments/student/${studentId}`);
}

/** Get all appointments for a lecturer. */
export function getLecturerAppointments(lecturerId) {
  return apiFetch(`/api/appointments/lecturer/${lecturerId}`);
}

/** Get a single appointment by ID. */
export function getAppointment(id) {
  return apiFetch(`/api/appointments/${id}`);
}

/**
 * Book a new appointment.
 * @param {{ studentId, lecturerId, startTime, endTime, notes }} data
 */
export function createAppointment(data) {
  return apiFetch('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update appointment status.
 * @param {number} id
 * @param {'PENDING'|'CONFIRMED'|'CANCELLED'|'COMPLETED'} status
 */
export function updateAppointmentStatus(id, status) {
  return apiFetch(`/api/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/** Delete an appointment. */
export function deleteAppointment(id) {
  return apiFetch(`/api/appointments/${id}`, { method: 'DELETE' });
}

// ── Chat ─────────────────────────────────────────────────────────────────────

/** Create a chat room for a confirmed appointment. */
export function createChatRoom(appointmentId) {
  return apiFetch(`/api/chat/rooms/appointment/${appointmentId}`, { method: 'POST' });
}

/** Get chat room by appointment ID. */
export function getChatRoomByAppointment(appointmentId) {
  return apiFetch(`/api/chat/rooms/by-appointment/${appointmentId}`);
}

/** Get all messages in a room. */
export function getMessages(roomId) {
  return apiFetch(`/api/chat/rooms/${roomId}/messages`);
}
