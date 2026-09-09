/**
 * services/reportsService.js — Axios API Client for Administrator Reports Module
 * AI-Based Smart Energy Consumption Monitoring & Optimization System
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/reports`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
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
 * Fetch Report Summary KPIs
 */
export const fetchReportSummary = async (params = {}) => {
  try {
    const response = await api.get('/summary', { params });
    return response.data?.data;
  } catch (error) {
    console.error('API Error [fetchReportSummary]:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch report summary KPIs');
  }
};

/**
 * Fetch Energy Consumption Trend Chart Data
 */
export const fetchReportTrend = async (params = {}) => {
  try {
    const response = await api.get('/trend', { params });
    return response.data?.data || [];
  } catch (error) {
    console.error('API Error [fetchReportTrend]:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch report trend data');
  }
};

/**
 * Fetch Building-Wise Consumption Data
 */
export const fetchReportBuildings = async (params = {}) => {
  try {
    const response = await api.get('/buildings', { params });
    return response.data?.data || [];
  } catch (error) {
    console.error('API Error [fetchReportBuildings]:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch building report data');
  }
};

/**
 * Fetch Cost Analysis Data
 */
export const fetchReportCostAnalysis = async (params = {}) => {
  try {
    const response = await api.get('/cost', { params });
    return response.data?.data;
  } catch (error) {
    console.error('API Error [fetchReportCostAnalysis]:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch cost analysis report');
  }
};

/**
 * Fetch Energy Savings Summary Data
 */
export const fetchReportSavingsSummary = async (params = {}) => {
  try {
    const response = await api.get('/savings', { params });
    return response.data?.data;
  } catch (error) {
    console.error('API Error [fetchReportSavingsSummary]:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch savings summary report');
  }
};

/**
 * Fetch Alerts Summary Report Data
 */
export const fetchReportAlertsSummary = async (params = {}) => {
  try {
    const response = await api.get('/alerts', { params });
    return response.data?.data;
  } catch (error) {
    console.error('API Error [fetchReportAlertsSummary]:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch alerts summary report');
  }
};

/**
 * Fetch Paginated Detailed Telemetry Logs
 */
export const fetchReportDetails = async (params = {}) => {
  try {
    const response = await api.get('/details', { params });
    return response.data?.data;
  } catch (error) {
    console.error('API Error [fetchReportDetails]:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch detailed report logs');
  }
};

/**
 * Download CSV Report File Attachment
 */
export const downloadCsvReport = (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      queryParams.append(key, params[key]);
    }
  });
  const token = localStorage.getItem('energy_auth_token') || 'dev_mock_jwt_token_123';
  queryParams.append('token', token);
  const url = `${API_BASE_URL}/reports/export/csv?${queryParams.toString()}`;
  window.open(url, '_blank');
};

/**
 * Download PDF Report Document
 */
export const downloadPdfReport = (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      queryParams.append(key, params[key]);
    }
  });
  const token = localStorage.getItem('energy_auth_token') || 'dev_mock_jwt_token_123';
  queryParams.append('token', token);
  const url = `${API_BASE_URL}/reports/export/pdf?${queryParams.toString()}`;
  window.open(url, '_blank');
};

export default {
  fetchReportSummary,
  fetchReportTrend,
  fetchReportBuildings,
  fetchReportCostAnalysis,
  fetchReportSavingsSummary,
  fetchReportAlertsSummary,
  fetchReportDetails,
  downloadCsvReport,
  downloadPdfReport,
};
