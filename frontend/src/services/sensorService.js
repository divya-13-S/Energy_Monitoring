/**
 * services/sensorService.js — Axios API Client for Sensor Management
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const sensorApiClient = axios.create({
  baseURL: `${API_URL}/sensors`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach auth header & role for backend guard
sensorApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('energy_auth_token');
  const savedUser = localStorage.getItem('energy_app_user');
  let role = '';
  let userDeptId = '';
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      role = parsed.role || '';
      userDeptId = parsed.department_id || '';
    } catch (e) {}
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (role) config.headers['X-User-Role'] = role;
  if (userDeptId) config.headers['X-User-Dept-Id'] = userDeptId;
  return config;
});

/**
 * Fetch paginated list of sensors with search and filtering
 */
export const getSensors = async (filters = {}, pagination = {}) => {
  try {
    const params = {
      ...filters,
      page: pagination.page || 1,
      limit: pagination.limit || 10,
    };
    const response = await sensorApiClient.get('/', { params });
    return response.data;
  } catch (error) {
    console.error('API Error in getSensors:', error);
    throw error?.response?.data || error;
  }
};

/**
 * Fetch sensor summary KPI counts
 */
export const getSensorSummary = async () => {
  try {
    const response = await sensorApiClient.get('/summary');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('API Error in getSensorSummary:', error);
    throw error?.response?.data || error;
  }
};

/**
 * Fetch single sensor details by ID
 */
export const getSensorById = async (id) => {
  try {
    const response = await sensorApiClient.get(`/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`API Error in getSensorById(${id}):`, error);
    throw error?.response?.data || error;
  }
};

/**
 * Create a new sensor
 */
export const createSensor = async (sensorData) => {
  try {
    const response = await sensorApiClient.post('/', sensorData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('API Error in createSensor:', error);
    throw error?.response?.data || error;
  }
};

/**
 * Update sensor details
 */
export const updateSensor = async (id, sensorData) => {
  try {
    const response = await sensorApiClient.put(`/${id}`, sensorData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`API Error in updateSensor(${id}):`, error);
    throw error?.response?.data || error;
  }
};

/**
 * Toggle sensor operational status
 */
export const toggleSensorStatus = async (id, status) => {
  try {
    const response = await sensorApiClient.patch(`/${id}/status`, { status });
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`API Error in toggleSensorStatus(${id}):`, error);
    throw error?.response?.data || error;
  }
};

/**
 * Fetch telemetry history for a sensor's building & department
 */
export const getSensorHistory = async (id, limit = 20) => {
  try {
    const response = await sensorApiClient.get(`/${id}/history`, { params: { limit } });
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`API Error in getSensorHistory(${id}):`, error);
    throw error?.response?.data || error;
  }
};

export default {
  getSensors,
  getSensorSummary,
  getSensorById,
  createSensor,
  updateSensor,
  toggleSensorStatus,
  getSensorHistory,
};
