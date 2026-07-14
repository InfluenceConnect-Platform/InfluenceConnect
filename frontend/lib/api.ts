import axios from 'axios';

// In the browser, derive the backend URL from the current hostname so that
// accessing the app from a phone (e.g. http://10.15.144.238:3000) automatically
// hits the laptop's backend at http://10.15.144.238:8000 instead of the phone's
// own localhost:8000 (which has no server).
const isLanHost = (hostname: string): boolean =>
  /^(localhost|127\.0\.0\.1)$/.test(hostname) ||
  /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(hostname);

const getBaseURL = (): string => {
  if (typeof window !== 'undefined' && isLanHost(window.location.hostname)) {
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

// When an admin suspends an account, the backend starts rejecting that user's
// requests with code 'ACCOUNT_SUSPENDED'. Because every page polls in the
// background (useLiveData / nav badges), this interceptor catches that response
// and ends the session immediately — no need to wait for a manual logout.
let handlingSuspension = false;
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== 'undefined' &&
      error?.response?.data?.code === 'ACCOUNT_SUSPENDED' &&
      !handlingSuspension &&
      !window.location.pathname.includes('/login')
    ) {
      handlingSuspension = true;
      let loginPath = '/auth/login';
      try {
        const role = JSON.parse(localStorage.getItem('user') || '{}')?.role;
        if (role === 'admin') loginPath = '/admin/login';
      } catch {}
      localStorage.clear();
      window.location.href = `${loginPath}?error=suspended`;
    }
    return Promise.reject(error);
  }
);

export default api;
