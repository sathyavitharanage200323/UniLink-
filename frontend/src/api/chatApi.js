import api from './axiosInstance';

export const chatApi = {
  // Rooms
  createRoom: (appointmentId) =>
    api.post(`/chat/rooms/appointment/${appointmentId}`),
  getRoom: (roomId) =>
    api.get(`/chat/rooms/${roomId}`),
  getRoomByAppointment: (appointmentId) =>
    api.get(`/chat/rooms/by-appointment/${appointmentId}`),
  createDirectRoom: (studentId, lecturerId) =>
    api.post('/chat/rooms/direct', { studentId, lecturerId }),
  createDirectRoomNew: (studentId, lecturerId) =>
    api.post('/chat/rooms/direct/new', { studentId, lecturerId }),
  getRoomsForUser: (userId) =>
    api.get(`/chat/rooms/user/${userId}`),
  resolveRoom: (roomId, userId) =>
    api.patch(`/chat/rooms/${roomId}/resolve?userId=${userId}`),

  // Messages
  getMessages: (roomId) =>
    api.get(`/chat/rooms/${roomId}/messages`),
  sendMessage: (roomId, payload) =>
    api.post(`/chat/rooms/${roomId}/messages`, payload),
  searchMessages: (roomId, keyword) =>
    api.get(`/chat/rooms/${roomId}/messages/search?keyword=${encodeURIComponent(keyword)}`),
  filterByType: (roomId, type) =>
    api.get(`/chat/rooms/${roomId}/messages/filter?type=${type}`),
  getPinnedMessages: (roomId) =>
    api.get(`/chat/rooms/${roomId}/messages/pinned`),
  getUnreadCount: (roomId, userId) =>
    api.get(`/chat/rooms/${roomId}/messages/unread-count?userId=${userId}`),
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

  // Gemini summary
  generateSummary: (roomId, includeSystemMessages = false) =>
    api.post(`/chat/rooms/${roomId}/summary/generate?includeSystemMessages=${includeSystemMessages}`),
  exportSummaryPdf: (roomId, includeSystemMessages = false) =>
    api.get(`/chat/rooms/${roomId}/summary/export/pdf?includeSystemMessages=${includeSystemMessages}`, { responseType: 'blob' }),
  exportSummaryTxt: (roomId, includeSystemMessages = false) =>
    api.get(`/chat/rooms/${roomId}/summary/export/txt?includeSystemMessages=${includeSystemMessages}`, { responseType: 'blob' }),

  // File upload
  uploadFile: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/chat/upload', form);
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
  getFull: (id) => api.get(`/users/${id}/full`),
  create: (user) => api.post('/users', user),
  searchLecturers: ({ query = '', department = '', designation = '' } = {}) => 
    api.get(`/users/lecturers/search?query=${encodeURIComponent(query)}&department=${encodeURIComponent(department)}&designation=${encodeURIComponent(designation)}`),
  toggleDnd: (id, dnd, autoReplyMessage) =>
    api.patch(`/users/${id}/dnd`, { dnd, autoReplyMessage }),
  toggleNotifications: (id, enabled) =>
    api.patch(`/users/${id}/notifications`, { enabled }),
  updateProfile: (id, payload) => api.put(`/users/${id}/profile`, payload),
  deleteAccount: (id) => api.delete(`/users/${id}`),
};
