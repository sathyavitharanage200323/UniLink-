import axios from 'axios';
import { BACKEND_BASE_URL } from '../config';

const api = axios.create({
  baseURL: `${BACKEND_BASE_URL}/api`,
  withCredentials: true,
});

// Set default Content-Type only for non-FormData requests
api.interceptors.request.use(config => {
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

export default api;
