/**
 * services/userService.js — Axios API Client for User Management
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const userApiClient = axios.create({
  baseURL: `${API_URL}/users`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach auth header & role for backend guard
userApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('energy_auth_token') || 'dev_mock_jwt_token_123';
  const savedUser = localStorage.getItem('energy_app_user');
  let role = 'Administrator';
  let userDeptId = '';
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      role = parsed.role || 'Administrator';
      userDeptId = parsed.department_id || '';
    } catch (e) {}
  }
  config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-User-Role'] = role;
  config.headers['X-User-Dept-Id'] = userDeptId;
  return config;
});

/**
 * Fetch paginated list of users with search and filtering
 */
export const getUsers = async (filters = {}, pagination = {}) => {
  try {
    const params = {
      ...filters,
      page: pagination.page || 1,
      limit: pagination.limit || 10,
    };
    const response = await userApiClient.get('/', { params });
    return response.data;
  } catch (error) {
    console.error('API Error in getUsers:', error);
    throw error?.response?.data || error;
  }
};

/**
 * Fetch user summary KPI counts
 */
export const getUserSummary = async () => {
  try {
    const response = await userApiClient.get('/summary');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('API Error in getUserSummary:', error);
    throw error?.response?.data || error;
  }
};

/**
 * Fetch single user details by ID
 */
export const getUserById = async (id) => {
  try {
    const response = await userApiClient.get(`/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`API Error in getUserById(${id}):`, error);
    throw error?.response?.data || error;
  }
};

/**
 * Create a new user account
 */
export const createUser = async (userData) => {
  try {
    const response = await userApiClient.post('/', userData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('API Error in createUser:', error);
    throw error?.response?.data || error;
  }
};

/**
 * Update user account details
 */
export const updateUser = async (id, userData) => {
  try {
    const response = await userApiClient.put(`/${id}`, userData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`API Error in updateUser(${id}):`, error);
    throw error?.response?.data || error;
  }
};

/**
 * Activate or Deactivate user account status
 */
export const toggleUserStatus = async (id, status) => {
  try {
    const response = await userApiClient.patch(`/${id}/status`, { status });
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`API Error in toggleUserStatus(${id}):`, error);
    throw error?.response?.data || error;
  }
};

/**
 * Reset user password securely
 */
export const resetPassword = async (id, newPassword) => {
  try {
    const response = await userApiClient.post(`/${id}/reset-password`, { newPassword });
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`API Error in resetPassword(${id}):`, error);
    throw error?.response?.data || error;
  }
};

export default {
  getUsers,
  getUserSummary,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetPassword,
};
