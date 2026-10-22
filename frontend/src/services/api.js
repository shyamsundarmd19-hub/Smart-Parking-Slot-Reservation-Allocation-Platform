import axios from 'axios';

// Base API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('parkcloud_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Authentication Expirations
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, wipe stale token and redirect if needed
      const isAuthRoute = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthRoute) {
        localStorage.removeItem('parkcloud_token');
        localStorage.removeItem('parkcloud_user');
        window.dispatchEvent(new Event('parkcloud:auth_expired'));
      }
    }
    return Promise.reject(error);
  }
);

// API Service Functions
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const parkingService = {
  getLots: () => api.get('/parking-lots'),
  getLot: (lotId) => api.get(`/parking-lots/${lotId}`),
  createLot: (lotData) => api.post('/parking-lots', lotData),
  getSlotGrid: (lotId) => api.get(`/slots/lot/${lotId}`),
  addSlot: (slotData) => api.post('/slots', slotData),
};

export const reservationService = {
  create: (reservationData) => api.post('/reservations', reservationData),
  getMyReservations: () => api.get('/reservations'),
  getById: (id) => api.get(`/reservations/${id}`),
  cancel: (id) => api.put(`/reservations/${id}/cancel`),
};

export const verifyService = {
  scanPass: (passHash) => api.get(`/verify/scan-pass/${passHash}`),
};

export const adminService = {
  getAnalytics: () => api.get('/admin/analytics'),
  seedSampleData: () => api.post('/admin/seed'),
};

export default api;
