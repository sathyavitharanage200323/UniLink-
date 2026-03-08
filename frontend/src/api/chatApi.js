import api from './axiosInstance';

export const chatApi = {
  // Rooms
  createRoom: (appointmentId) =>
    api.post(`/chat/rooms/appointment/${appointmentId}`),
  getRoom: (roomId) =>
    api.get(`/chat/rooms/${roomId}`),
  getRoomByAppointment: (appointmentId) =>
    api.get(`/chat/rooms/by-appointment/${appointmentId}`),
  resolveRoom: (roomId, userId) =>
    api.patch(`/chat/rooms/${roomId}/resolve?userId=${userId}`),

  // Messages
  getMessages: (roomId) =>
    api.get(`/chat/rooms/${roomId}/messages`),
  searchMessages: (roomId, keyword) =>
    api.get(`/chat/rooms/${roomId}/messages/search?keyword=${encodeURIComponent(keyword)}`),
  filterByType: (roomId, type) =>
    api.get(`/chat/rooms/${roomId}/messages/filter?type=${type}`),
  getPinnedMessages: (roomId) =>
    api.get(`/chat/rooms/${roomId}/messages/pinned`),
  togglePin: (messageId) =>
    api.patch(`/chat/messages/${messageId}/pin`),
  markAsAnswer: (messageId) =>
    api.patch(`/chat/messages/${messageId}/mark-answer`),
  markRead: (messageId) =>
    api.patch(`/chat/messages/${messageId}/read`),
  deleteMessage: (messageId, userId) =>
    api.delete(`/chat/messages/${messageId}?userId=${userId}`),

  // Export
  exportPdf: (roomId) =>
    api.get(`/chat/rooms/${roomId}/export/pdf`, { responseType: 'blob' }),
  exportTxt: (roomId) =>
    api.get(`/chat/rooms/${roomId}/export/txt`, { responseType: 'blob' }),

  // File upload
  uploadFile: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/chat/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const cannedApi = {
  getByLecturer: (lecturerId) =>
    api.get(`/canned-responses/lecturer/${lecturerId}`),
  create: (lecturerId, title, content) =>
    api.post('/canned-responses', { lecturerId, title, content }),
  update: (id, title, content) =>
    api.put(`/canned-responses/${id}`, { title, content }),
  delete: (id) =>
    api.delete(`/canned-responses/${id}`),
};

export const disciplineApi = {
  getByStudent: (studentId) =>
    api.get(`/discipline/student/${studentId}`),
  checkBlocked: (studentId, lecturerId) =>
    api.get(`/discipline/check?studentId=${studentId}&lecturerId=${lecturerId}`),
  apply: (payload) =>
    api.post('/discipline', payload),
  revoke: (id) =>
    api.patch(`/discipline/${id}/revoke`),
};

export const userApi = {
  get: (id) => api.get(`/users/${id}`),
  create: (user) => api.post('/users', user),
  toggleDnd: (id, dnd, autoReplyMessage) =>
    api.patch(`/users/${id}/dnd`, { dnd, autoReplyMessage }),
};
