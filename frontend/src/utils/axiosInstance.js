import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT auth token & headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('energy_auth_token') || 'jwt_token_1_1725892800';
    const savedUser = localStorage.getItem('energy_app_user');
    let role = 'Administrator';
    let userDeptId = '';
    let userId = 1;

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        role = parsed.role || 'Administrator';
        userDeptId = parsed.department_id || '';
        userId = parsed.id || 1;
      } catch (e) {}
    }

    config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-User-Role'] = role;
    config.headers['X-User-Dept-Id'] = userDeptId;
    config.headers['X-User-Id'] = userId;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for central error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access detected (401), request rejected.');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
