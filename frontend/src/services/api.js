import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add Authorization header to all requests
api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out.');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (data) => api.post('/auth/register', data);

// Admin API
export const getAdminClinics = () => api.get('/admin/clinics');
export const updateAdminClinic = (id, data) => api.patch(`/admin/clinics/${id}`, data);

// Appointments
export const getAppointments = () => api.get('/appointments');
export const getClinicInfo = () => api.get('/clinic/me');
export const updateClinicInfo = (data) => api.put('/clinic/update', data);
export const getPatients = () => api.get('/patients');

// Chat API
export const getChatPatients = () => api.get('/chat/patients');
export const getChatMessages = (patientId) => api.get(`/chat/messages/${patientId}`);
export const sendChatMessage = (patientId, text) => api.post('/chat/send', { patientId, text });
export const toggleBot = (patientId, isPaused) => api.patch('/chat/toggle-bot', { patientId, isPaused });

// Analytics API
export const getAnalyticsSummary = () => api.get('/analytics/summary');
export const getAnalyticsCharts = () => api.get('/analytics/charts');
export const getClinicAnalytics = () => api.get('/analytics/clinic');

// Portfolio API
export const getPortfolio = () => api.get('/portfolio/me');
export const updatePortfolio = (data) => api.put('/portfolio/update', data);
export const uploadPortfolioImage = (formData) => api.post('/portfolio/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getPublicPortfolio = (slug) => api.get(`/portfolio/public/${slug}`);

export default api;
