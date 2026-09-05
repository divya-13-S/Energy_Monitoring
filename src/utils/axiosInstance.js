import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('energy_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for central error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: Dispatch auth logout event or clear storage
      console.warn('Unauthorized access detected, redirecting to login...');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
