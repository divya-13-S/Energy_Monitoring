/**
 * services/optimizationService.js — Axios API Client for Energy Optimization Module
 * AI-Based Smart Energy Consumption Monitoring & Optimization System
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/optimization`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to attach auth header & role for backend guard
api.interceptors.request.use((config) => {
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
 * Fetch Optimization Summary KPIs
 */
export const fetchOptimizationSummary = async (params = {}) => {
  try {
    const response = await api.get('/summary', { params });
    return response.data?.data;
  } catch (error) {
    console.error('API Error [fetchOptimizationSummary]:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch optimization summary KPIs');
  }
};

/**
 * Fetch High Consumption Areas Ranking
 */
export const fetchHighConsumptionAreas = async (params = {}) => {
  try {
    const response = await api.get('/high-consumption', { params });
    return response.data?.data || [];
  } catch (error) {
    console.error('API Error [fetchHighConsumptionAreas]:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch high consumption areas');
  }
};

/**
 * Fetch Optimization Analysis Chart Data
 */
export const fetchOptimizationAnalysisChart = async (params = {}) => {
  try {
    const response = await api.get('/analysis', { params });
    return response.data?.data || [];
  } catch (error) {
    console.error('API Error [fetchOptimizationAnalysisChart]:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch optimization analysis chart');
  }
};

/**
 * Fetch Optimization Recommendations List
 */
export const fetchOptimizationRecommendations = async (params = {}) => {
  try {
    const response = await api.get('/recommendations', { params });
    return response.data?.data || [];
  } catch (error) {
    console.error('API Error [fetchOptimizationRecommendations]:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch optimization recommendations');
  }
};

/**
 * Update Recommendation Status (Pending, Reviewed, Implemented)
 */
export const updateRecommendationStatusApi = async (id, status) => {
  try {
    const response = await api.patch(`/recommendations/${id}/status`, { status });
    return response.data?.data;
  } catch (error) {
    console.error('API Error [updateRecommendationStatusApi]:', error);
    throw new Error(error.response?.data?.message || 'Failed to update recommendation status');
  }
};

/**
 * Fetch Optimization Opportunities Comparison
 */
export const fetchOptimizationComparison = async (params = {}) => {
  try {
    const response = await api.get('/comparison', { params });
    return response.data?.data || [];
  } catch (error) {
    console.error('API Error [fetchOptimizationComparison]:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch optimization comparison');
  }
};

export default {
  fetchOptimizationSummary,
  fetchHighConsumptionAreas,
  fetchOptimizationAnalysisChart,
  fetchOptimizationRecommendations,
  updateRecommendationStatusApi,
  fetchOptimizationComparison,
};
