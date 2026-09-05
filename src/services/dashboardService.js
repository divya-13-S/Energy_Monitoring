/**
 * Dashboard Data Service
 * Decouples data retrieval from React UI presentation components.
 * Currently aggregates metrics from development datasets; future REST API endpoints (Node.js/Express/MySQL)
 * will replace the internal calculation source seamlessly.
 */

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

export const getAdminDashboardKpis = async () => {
  // Simulating async retrieval for future Axios API compatibility
  return {
    todayEnergy: getTodayEnergyKpi(),
    todayCost: getTodayCostKpi(),
    tomorrowPrediction: getPredictionKpi(),
    potentialSaving: getPotentialSavingKpi(),
    activeAlerts: getActiveAlertsKpi(),
    connectedBuildings: getConnectedBuildingsKpi(),
  };
};

export const getBuildingsEnergyData = async () => {
  return getBuildingsEnergySummary();
};

export const getDepartmentsEnergyData = async () => {
  return getDepartmentsEnergySummary();
};

export default {
  getAdminDashboardKpis,
  getBuildingsEnergyData,
  getDepartmentsEnergyData,
};


