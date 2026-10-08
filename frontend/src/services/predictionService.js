/**
 * services/predictionService.js — Axios API Client for AI Energy Prediction
 * AI-Based Smart Energy Consumption Monitoring & Optimization System
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/ai-prediction`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor to attach auth header & role for backend guard
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('energy_auth_token') || '';
  const savedUser = localStorage.getItem('energy_app_user');
  let role = 'Administrator';
  let userDeptId = '';

  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      role = parsed.role || 'Administrator';
      userDeptId = parsed.department_id || '';
    } catch (e) {
      console.warn('Could not parse energy_app_user from localStorage:', e);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-User-Role'] = role;
  config.headers['X-User-Dept-Id'] = userDeptId;
  return config;
});

/**
 * Predict next-hour energy consumption using trained Linear Regression model.
 * @param {Object} payload - { building_id, timestamp, square_feet, air_temperature, dew_temperature, wind_speed, lag_1h, lag_24h, rolling_mean_24h }
 */
export const predictEnergyConsumption = async (payload) => {
  try {
    const response = await api.post('/predict', payload);
    return response.data;
  } catch (error) {
    console.error('API Error [predictEnergyConsumption]:', error);
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Failed to generate prediction';
    
    const customError = new Error(message);
    customError.status = status;
    throw customError;
  }
};

/**
 * Fetch available buildings for the prediction selector (respects role filtering).
 */
export const fetchPredictionBuildings = async () => {
  try {
    const token = localStorage.getItem('energy_auth_token') || '';
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

    const response = await axios.get(`${API_BASE_URL}/buildings`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'X-User-Role': role,
        'X-User-Dept-Id': userDeptId,
      },
      timeout: 10000,
    });

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.warn('API Warning [fetchPredictionBuildings]: Could not fetch buildings, using default list:', error.message);
    return [];
  }
};

export default {
  predictEnergyConsumption,
  fetchPredictionBuildings,
};
