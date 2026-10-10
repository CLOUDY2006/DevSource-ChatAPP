import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: `${API_URL}/api` });

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chat_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getErrorMessage = (err) =>
  err.response?.data?.message || 'Something went wrong. Please try again.';

export default api;
