/**
 * services/settingsService.js — Axios API Client for System Settings
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const settingsApiClient = axios.create({
  baseURL: `${API_URL}/settings`,
  headers: {
    'Content-Type': 'application/json',
  },
});

settingsApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('energy_auth_token');
  const savedUser = localStorage.getItem('energy_app_user');
  let role = '';
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      role = parsed.role || '';
    } catch (e) {}
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (role) config.headers['X-User-Role'] = role;
  return config;
});

/**
 * Fetch all system settings
 */
export const getSettings = async () => {
  try {
    const response = await settingsApiClient.get('/');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('API Error in getSettings:', error);
    throw error?.response?.data || error;
  }
};

/**
 * Update system settings
 */
export const updateSettings = async (settingsPayload) => {
  try {
    const response = await settingsApiClient.put('/', settingsPayload);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('API Error in updateSettings:', error);
    throw error?.response?.data || error;
  }
};

export default {
  getSettings,
  updateSettings,
};
