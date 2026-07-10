import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

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
    }
    return Promise.reject(error);
  }
);

export const getAppointments = () => api.get('/appointments');
export const getClinicInfo = () => api.get('/clinic/me');
export const updateClinicInfo = (data) => api.put('/clinic/update', data);
export const getPatients = () => api.get('/patients');

// Dashboard API
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getDashboardAppointments = () => api.get('/dashboard/appointments');

// Chat API
export const getChatPatients = () => api.get('/chat/patients');
export const getChatMessages = (patientId, before = null) => {
  const url = before ? `/chat/messages/${patientId}?before=${before}` : `/chat/messages/${patientId}`;
  return api.get(url);
};
export const sendChatMessage = (patientId, text) => api.post('/chat/send', { patientId, text });
export const toggleBot = (patientId, isPaused) => api.patch('/chat/toggle-bot', { patientId, isPaused });

// Analytics API
export const getAnalyticsSummary = () => api.get('/analytics/summary');
export const getAnalyticsCharts = () => api.get('/analytics/charts');

export default api;
