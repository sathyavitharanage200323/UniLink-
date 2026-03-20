import axios from 'axios';
import { BACKEND_BASE_URL } from '../config';

const api = axios.create({
  baseURL: `${BACKEND_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export default api;
