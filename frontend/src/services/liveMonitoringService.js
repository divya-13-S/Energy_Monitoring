/**
 * liveMonitoringService.js — Frontend API Service Layer for Live Telemetry
 * AI-Based Smart Energy Consumption Monitoring & Optimization System
 * Connects React components to /api/live-monitoring endpoints via Axios instance.
 */

import axiosInstance from '../utils/axiosInstance';

/**
 * GET /api/live-monitoring/summary
 * Retrieves institutional real-time summary KPIs and current electrical state.
 */
export const fetchLiveSummary = async () => {
  try {
    const response = await axiosInstance.get('/live-monitoring/summary');
    if (response.data && response.data.success && response.data.data) {
      return response.data.data.summary;
    }
    return null;
  } catch (error) {
    console.warn('⚠️  Live monitoring summary API error:', error.message);
    throw error;
  }
};

/**
 * GET /api/live-monitoring/readings
 * Retrieves time-series live telemetry readings filtered by building, department, or status.
 */
export const fetchLiveReadings = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/live-monitoring/readings', {
      params: filters,
    });
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.warn('⚠️  Live monitoring readings API error:', error.message);
    throw error;
  }
};

/**
 * GET /api/live-monitoring/buildings
 * Retrieves live power, usage, and load status for all 8 campus buildings.
 */
export const fetchBuildingLiveMetrics = async () => {
  try {
    const response = await axiosInstance.get('/live-monitoring/buildings');
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.warn('⚠️  Building live metrics API error:', error.message);
    throw error;
  }
};

/**
 * GET /api/live-monitoring/departments
 * Retrieves department/unit live metrics mapped to parent buildings.
 */
export const fetchDepartmentLiveMetrics = async (buildingId = 'all') => {
  try {
    const response = await axiosInstance.get('/live-monitoring/departments', {
      params: { buildingId },
    });
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.warn('⚠️  Department live metrics API error:', error.message);
    throw error;
  }
};

/**
 * GET /api/live-monitoring/abnormal
 * Retrieves active abnormal electrical conditions and threshold triggers.
 */
export const fetchAbnormalConditions = async () => {
  try {
    const response = await axiosInstance.get('/live-monitoring/abnormal');
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.warn('⚠️  Abnormal conditions API error:', error.message);
    throw error;
  }
};

export default {
  fetchLiveSummary,
  fetchLiveReadings,
  fetchBuildingLiveMetrics,
  fetchDepartmentLiveMetrics,
  fetchAbnormalConditions,
};
