/**
 * Centralised API client for the UniLink backend.
 * Every function returns parsed JSON or throws an Error.
 */

const BASE_URL = 'http://localhost:9090';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // delete / no-content responses
  if (res.status === 204) {
    return null;
  }

  const text = await res.text().catch(() => '');

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    if (typeof data === 'object' && data !== null) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    throw new Error(data || `Request failed with status ${res.status}`);
  }

  return data;
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

// ── Slots ───────────────────────────────────────────────

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