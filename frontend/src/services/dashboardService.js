/**
 * Dashboard Data Service Layer
 * Connects React UI components to the Express REST API and MySQL database.
 * Endpoint base URL configured via axiosInstance (http://localhost:5000/api).
 */

import axiosInstance from '../utils/axiosInstance';
import {
  getTodayEnergyKpi,
  getTodayCostKpi,
  getPredictionKpi,
  getPotentialSavingKpi,
  getActiveAlertsKpi,
  getConnectedBuildingsKpi,
  getBuildingsEnergySummary,
  getDepartmentsEnergySummary,
} from '../utils/energyCalculations';

/**
 * Fallback KPI generator if API is unavailable
 */
const getFallbackKpis = () => ({
  todayEnergy: getTodayEnergyKpi(),
  todayCost: getTodayCostKpi(),
  tomorrowPrediction: getPredictionKpi(),
  potentialSaving: getPotentialSavingKpi(),
  activeAlerts: getActiveAlertsKpi(),
  connectedBuildings: getConnectedBuildingsKpi(),
});

/**
 * GET /api/dashboard/summary
 * Fetches institutional summary KPIs directly from MySQL database.
 */
export const getAdminDashboardKpis = async () => {
  try {
    const response = await axiosInstance.get('/dashboard/summary');
    if (response.data && response.data.success && response.data.data && response.data.data.kpis) {
      return response.data.data.kpis;
    }
    return getFallbackKpis();
  } catch (error) {
    console.warn('⚠️  Could not fetch live dashboard KPIs from backend API. Using local fallback metrics:', error.message);
    return getFallbackKpis();
  }
};

/**
 * GET /api/buildings
 * Fetches all 8 campus buildings and their energy metrics directly from MySQL database.
 */
export const getBuildingsEnergyData = async () => {
  try {
    const response = await axiosInstance.get('/buildings');
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return getBuildingsEnergySummary();
  } catch (error) {
    console.warn('⚠️  Could not fetch live buildings data from backend API. Using local fallback data:', error.message);
    return getBuildingsEnergySummary();
  }
};

/**
 * GET /api/departments
 * Fetches all 20 campus departments/units and parent building data directly from MySQL database.
 */
export const getDepartmentsEnergyData = async () => {
  try {
    const response = await axiosInstance.get('/departments');
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return getDepartmentsEnergySummary();
  } catch (error) {
    console.warn('⚠️  Could not fetch live departments data from backend API. Using local fallback data:', error.message);
    return getDepartmentsEnergySummary();
  }
};

/**
 * GET /api/energy-consumption
 * Fetches historical energy consumption telemetry records from MySQL.
 */
export const getEnergyConsumptionRecords = async (buildingId = null) => {
  try {
    const url = buildingId ? `/energy-consumption?buildingId=${buildingId}` : '/energy-consumption';
    const response = await axiosInstance.get(url);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.warn('⚠️  Could not fetch live energy consumption records:', error.message);
    return [];
  }
};

export default {
  getAdminDashboardKpis,
  getBuildingsEnergyData,
  getDepartmentsEnergyData,
  getEnergyConsumptionRecords,
};
