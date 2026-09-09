/**
 * controllers/alertController.js — Alert Resource API Controller
 * Express controller handlers interacting with MySQL database via alertService.
 */

import { sendSuccess, sendError } from '../utils/apiResponse.js';
import {
  getPaginatedAlerts,
  getAlertSummaryKPIs,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  getAlertThresholds,
  updateAlertThresholds,
  evaluateAndGenerateAlerts
} from '../services/alertService.js';

/**
 * GET /api/alerts
 * Query parameters: buildingId, departmentId, alertType, severity, status, startDate, endDate, page, limit, role, userDeptId
 */
export const getAllAlerts = async (req, res) => {
  try {
    const filters = {
      buildingId: req.query.buildingId || req.query.building,
      departmentId: req.query.departmentId || req.query.department,
      alertType: req.query.alertType || req.query.type,
      severity: req.query.severity,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 15,
    };

    const roleContext = {
      role: req.query.role || req.headers['x-user-role'],
      userDeptId: req.query.userDeptId || req.headers['x-user-dept-id'],
    };

    const result = await getPaginatedAlerts(filters, pagination, roleContext);
    return sendSuccess(res, result.alerts, `${result.alerts.length} alerts retrieved successfully`, 200, {
      pagination: result.pagination
    });
  } catch (err) {
    console.error('Error fetching alerts:', err);
    return sendError(res, err.message || 'Failed to retrieve alerts', 500);
  }
};

/**
 * GET /api/alerts/summary
 * KPI totals summary (Total, Critical, High, Medium, Low, Unresolved)
 */
export const getSummary = async (req, res) => {
  try {
    const filters = {
      buildingId: req.query.buildingId || req.query.building,
      departmentId: req.query.departmentId || req.query.department,
      alertType: req.query.alertType || req.query.type,
      severity: req.query.severity,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const roleContext = {
      role: req.query.role || req.headers['x-user-role'],
      userDeptId: req.query.userDeptId || req.headers['x-user-dept-id'],
    };

    const summary = await getAlertSummaryKPIs(filters, roleContext);
    return sendSuccess(res, summary, 'Alert summary metrics retrieved successfully');
  } catch (err) {
    console.error('Error fetching alert summary:', err);
    return sendError(res, err.message || 'Failed to retrieve alert summary', 500);
  }
};

/**
 * GET /api/alerts/thresholds
 * Retrieve active alert thresholds from system_settings
 */
export const getThresholds = async (req, res) => {
  try {
    const thresholds = await getAlertThresholds();
    return sendSuccess(res, thresholds, 'Alert thresholds retrieved successfully');
  } catch (err) {
    console.error('Error fetching thresholds:', err);
    return sendError(res, err.message || 'Failed to retrieve alert thresholds', 500);
  }
};

/**
 * PUT /api/alerts/thresholds
 * Update alert threshold settings
 */
export const updateThresholds = async (req, res) => {
  try {
    const updated = await updateAlertThresholds(req.body);
    return sendSuccess(res, updated, 'Alert threshold settings updated successfully');
  } catch (err) {
    console.error('Error updating thresholds:', err);
    return sendError(res, err.message || 'Failed to update alert thresholds', 500);
  }
};

/**
 * GET /api/alerts/:id
 * Retrieve single alert details
 */
export const getById = async (req, res) => {
  try {
    const alert = await getAlertById(req.params.id);
    if (!alert) {
      return sendError(res, 'Alert not found', 404);
    }
    return sendSuccess(res, alert, 'Alert details retrieved successfully');
  } catch (err) {
    console.error('Error fetching alert by ID:', err);
    return sendError(res, err.message || 'Failed to retrieve alert details', 500);
  }
};

/**
 * PATCH /api/alerts/:id/acknowledge
 * Mark alert as Acknowledged
 */
export const acknowledge = async (req, res) => {
  try {
    const userName = req.body.userName || req.body.user || 'Administrator';
    const alert = await acknowledgeAlert(req.params.id, userName);
    return sendSuccess(res, alert, 'Alert acknowledged successfully');
  } catch (err) {
    console.error('Error acknowledging alert:', err);
    return sendError(res, err.message || 'Failed to acknowledge alert', 500);
  }
};

/**
 * PATCH /api/alerts/:id/resolve
 * Mark alert as Resolved with resolution remarks
 */
export const resolve = async (req, res) => {
  try {
    const userName = req.body.userName || req.body.user || 'Administrator';
    const remarks = req.body.remarks || req.body.resolutionRemarks || '';
    const alert = await resolveAlert(req.params.id, userName, remarks);
    return sendSuccess(res, alert, 'Alert resolved successfully');
  } catch (err) {
    console.error('Error resolving alert:', err);
    return sendError(res, err.message || 'Failed to resolve alert', 500);
  }
};

/**
 * POST /api/alerts/detect
 * Manually or automatically trigger telemetry alert detection evaluation pass
 */
export const triggerDetection = async (req, res) => {
  try {
    const result = await evaluateAndGenerateAlerts();
    return sendSuccess(res, result, `Alert detection completed. Created ${result.newAlertsCount} new alerts.`);
  } catch (err) {
    console.error('Error triggering alert detection:', err);
    return sendError(res, err.message || 'Failed to execute alert detection pass', 500);
  }
};

export default {
  getAllAlerts,
  getSummary,
  getThresholds,
  updateThresholds,
  getById,
  acknowledge,
  resolve,
  triggerDetection
};
