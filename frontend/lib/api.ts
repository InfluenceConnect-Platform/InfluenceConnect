import axios from 'axios';

// In the browser, derive the backend URL from the current hostname so that
// accessing the app from a phone (e.g. http://10.15.144.238:3000) automatically
// hits the laptop's backend at http://10.15.144.238:8000 instead of the phone's
// own localhost:8000 (which has no server).
const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
