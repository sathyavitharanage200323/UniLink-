import api from './axiosInstance';

export const resourcesApi = {
  list: (lecturerId) =>
    api.get('/resources', {
      params: lecturerId ? { lecturerId } : {},
    }),

  createNotice: ({ lecturerId, title, description }) =>
    api.post('/resources/notice', { lecturerId, title, description }),

  uploadPdf: ({ lecturerId, title, description, file }) => {
    const form = new FormData();
    form.append('lecturerId', lecturerId);
    form.append('title', title);
    form.append('description', description || '');
    form.append('file', file);
    return api.post('/resources/pdf', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  remove: ({ id, userId, role }) =>
    api.delete(`/resources/${id}`, {
      params: { userId, role },
    }),
};
