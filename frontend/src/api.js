/**
 * Centralised API client for the UniLink backend.
 * Every function returns parsed JSON or throws an Error.
 */

// 🔥 DIRECT BASE URL (no config.js needed)
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

  if (res.status === 204) return null;
  return res.json();
}

// ── Users ─────────────────────────────────────────────────

export function getUsers() {
  return apiFetch('/api/users');
}

export function getUsersByRole(role) {
  return apiFetch(`/api/users/role/${role}`);
}

export function getUser(id) {
  return apiFetch(`/api/users/${id}`);
}

export function createUser(userData) {
  return apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export function toggleDnd(userId, dnd, autoReplyMessage) {
  return apiFetch(`/api/users/${userId}/dnd`, {
    method: 'PATCH',
    body: JSON.stringify({ dnd, autoReplyMessage }),
  });
}

// ── Appointments ──────────────────────────────────────────

export function getStudentAppointments(studentId) {
  return apiFetch(`/api/appointments/student/${studentId}`);
}

export function getLecturerAppointments(lecturerId) {
  return apiFetch(`/api/appointments/lecturer/${lecturerId}`);
}

export function getAppointment(id) {
  return apiFetch(`/api/appointments/${id}`);
}

export function createAppointment(data) {
  return apiFetch('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateAppointmentStatus(id, status) {
  return apiFetch(`/api/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteAppointment(id) {
  return apiFetch(`/api/appointments/${id}`, {
    method: 'DELETE',
  });
}

// ── Chat ─────────────────────────────────────────────────

export function createChatRoom(appointmentId) {
  return apiFetch(`/api/chat/rooms/appointment/${appointmentId}`, {
    method: 'POST',
  });
}

export function getChatRoomByAppointment(appointmentId) {
  return apiFetch(`/api/chat/rooms/by-appointment/${appointmentId}`);
}

export function getMessages(roomId) {
  return apiFetch(`/api/chat/rooms/${roomId}/messages`);
}

// ── Slots (🔥 YOUR FEATURE) ───────────────────────────────

export function getSlots(lecturerId) {
  return apiFetch(`/api/slots/lecturer/${lecturerId}`);
}

export function createSlot(data) {
  return apiFetch('/api/slots', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateSlot(id, data) {
  return apiFetch(`/api/slots/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteSlot(id) {
  return apiFetch(`/api/slots/${id}`, {
    method: 'DELETE',
  });
}