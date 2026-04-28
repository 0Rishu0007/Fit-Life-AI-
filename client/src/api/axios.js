import axios from 'axios';

/**
 * Pre-configured Axios instance with base URL and auth interceptor.
 * Automatically attaches JWT token from localStorage on every request.
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — adds auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fitlife_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fitlife_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
