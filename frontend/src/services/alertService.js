/**
 * services/alertService.js — Axios API Client for System Alerts
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const alertApiClient = axios.create({
  baseURL: `${API_URL}/alerts`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach auth header & role for backend guard
alertApiClient.interceptors.request.use((config) => {
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
 * Fetch list of alerts with filtering and pagination
 */
export const getAlerts = async (filters = {}, pagination = {}, roleContext = {}) => {
  try {
    const params = {
      ...filters,
      page: pagination.page || 1,
      limit: pagination.limit || 15,
      role: roleContext.role,
      userDeptId: roleContext.userDeptId,
    };
    const response = await alertApiClient.get('/', { params });
    return response.data;
  } catch (error) {
    console.error('API Error in getAlerts:', error);
    throw error?.response?.data || error;
  }
};

/**
 * Fetch alert summary KPI metrics
 */
export const getAlertSummary = async (filters = {}, roleContext = {}) => {
  try {
    const params = {
      ...filters,
      role: roleContext.role,
      userDeptId: roleContext.userDeptId,
    };
    const response = await alertApiClient.get('/summary', { params });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('API Error in getAlertSummary:', error);
    throw error?.response?.data || error;
  }
};

/**
 * Fetch active alert thresholds
 */
export const getAlertThresholds = async () => {
  try {
    const response = await alertApiClient.get('/thresholds');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('API Error in getAlertThresholds:', error);
    throw error?.response?.data || error;
  }
};

/**
 * Update alert threshold settings
 */
export const updateAlertThresholds = async (thresholdData) => {
  try {
    const response = await alertApiClient.put('/thresholds', thresholdData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('API Error in updateAlertThresholds:', error);
    throw error?.response?.data || error;
  }
};

/**
 * Fetch single alert details by ID
 */
export const getAlertById = async (id) => {
  try {
    const response = await alertApiClient.get(`/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`API Error in getAlertById(${id}):`, error);
    throw error?.response?.data || error;
  }
};

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = async (id, userName = 'Administrator') => {
  try {
    const response = await alertApiClient.patch(`/${id}/acknowledge`, { userName });
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`API Error in acknowledgeAlert(${id}):`, error);
    throw error?.response?.data || error;
  }
};

/**
 * Resolve an alert with resolution remarks
 */
export const resolveAlert = async (id, userName = 'Administrator', remarks = '') => {
  try {
    const response = await alertApiClient.patch(`/${id}/resolve`, { userName, remarks });
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`API Error in resolveAlert(${id}):`, error);
    throw error?.response?.data || error;
  }
};

export default {
  getAlerts,
  getAlertSummary,
  getAlertThresholds,
  updateAlertThresholds,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
};
