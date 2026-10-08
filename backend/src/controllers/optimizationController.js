/**
 * controllers/optimizationController.js — Energy Optimization Module REST API Handlers
 * AI-Based Smart Energy Consumption Monitoring & Optimization System
 */

import { sendSuccess, sendError } from '../utils/apiResponse.js';
import {
  getOptimizationSummary,
  getHighConsumptionAreas,
  getOptimizationAnalysisChart,
  getOptimizationRecommendations,
  updateRecommendationStatus,
  getOptimizationComparison,
} from '../services/optimizationService.js';

const getScopedIds = (req) => {
  const { building, department } = req.query;
  const isHod = req.user?.role === 'Department Staff (HOD)' || req.user?.role === 'HOD';
  const userBldg = req.user?.building_id;
  const userDept = req.user?.department_id;

  // Strict HOD Security Guard
  if (isHod && userBldg) {
    if (building && String(building) !== 'all' && String(building) !== String(userBldg)) {
      const err = new Error('Access denied. HOD users can only access energy optimization data for their assigned building.');
      err.statusCode = 403;
      throw err;
    }
  }

  const buildingId = isHod && userBldg ? userBldg : building;
  const departmentId = isHod && userDept ? userDept : department;
  return { buildingId, departmentId };
};

/**
 * GET /api/optimization/summary
 */
export const getSummary = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    const summary = await getOptimizationSummary({
      buildingId,
      departmentId,
      period,
    });
    return sendSuccess(res, summary, 'Optimization summary retrieved successfully');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * GET /api/optimization/high-consumption
 */
export const getHighConsumption = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    const areas = await getHighConsumptionAreas({
      buildingId,
      departmentId,
      period,
    });
    return sendSuccess(res, areas, `${areas.length} high consumption areas analyzed`);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * GET /api/optimization/analysis
 */
export const getAnalysis = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    const chartData = await getOptimizationAnalysisChart({
      buildingId,
      departmentId,
      period,
    });
    return sendSuccess(res, chartData, `${chartData.length} optimization chart data points generated`);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * GET /api/optimization/recommendations
 */
export const getRecommendations = async (req, res) => {
  try {
    const { status } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    const recs = await getOptimizationRecommendations({
      buildingId,
      departmentId,
      status,
    });
    return sendSuccess(res, recs, `${recs.length} optimization recommendations retrieved`);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * PATCH /api/optimization/recommendations/:id/status
 */
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return sendError(res, 'New status value is required', 400);
    }
    const updated = await updateRecommendationStatus(id, status);
    return sendSuccess(res, updated, `Recommendation status updated to "${status}"`);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * GET /api/optimization/comparison
 */
export const getComparison = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    const comparison = await getOptimizationComparison({
      buildingId,
      departmentId,
      period,
    });
    return sendSuccess(res, comparison, `${comparison.length} optimization comparison records generated`);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

export default {
  getSummary,
  getHighConsumption,
  getAnalysis,
  getRecommendations,
  updateStatus,
  getComparison,
};
