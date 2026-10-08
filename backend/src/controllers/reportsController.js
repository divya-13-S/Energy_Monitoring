/**
 * controllers/reportsController.js — Administrator & Role-Scoped Reports REST API Handlers
 * AI-Based Smart Energy Consumption Monitoring & Optimization System
 */

import { sendSuccess, sendError } from '../utils/apiResponse.js';
import {
  getReportSummary,
  getReportTrend,
  getReportBuildings,
  getReportCostAnalysis,
  getReportSavingsSummary,
  getReportAlertsSummary,
  getReportDetails,
  generateCsvReport,
  generatePdfReport,
} from '../services/reportsService.js';

const getScopedIds = (req) => {
  const { building, department } = req.query;
  const isHod = req.user?.role === 'Department Staff (HOD)' || req.user?.role === 'HOD';
  const userBldg = req.user?.building_id;
  const userDept = req.user?.department_id;

  if (isHod && userBldg) {
    if (building && String(building) !== 'all' && String(building) !== String(userBldg)) {
      const err = new Error('Access denied. HOD users can only access energy reports for their assigned building.');
      err.statusCode = 403;
      throw err;
    }
  }

  const buildingId = isHod && userBldg ? userBldg : building;
  const departmentId = isHod && userDept ? userDept : department;
  return { buildingId, departmentId };
};

/**
 * GET /api/reports/summary
 */
export const getSummary = async (req, res) => {
  try {
    const { period, startDate, endDate, reportType } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    const summary = await getReportSummary({
      period,
      startDate,
      endDate,
      buildingId,
      departmentId,
      reportType,
    });
    return sendSuccess(res, summary, 'Report summary retrieved successfully');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * GET /api/reports/trend
 */
export const getTrend = async (req, res) => {
  try {
    const { period, startDate, endDate, reportType } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    const trend = await getReportTrend({
      period,
      startDate,
      endDate,
      buildingId,
      departmentId,
      reportType,
    });
    return sendSuccess(res, trend, `${trend.length} report trend data points generated`);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * GET /api/reports/buildings
 */
export const getBuildings = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    const buildingsData = await getReportBuildings({
      period,
      startDate,
      endDate,
      buildingId,
      departmentId,
    });
    return sendSuccess(res, buildingsData, `${buildingsData.length} building report records generated`);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * GET /api/reports/cost
 */
export const getCost = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    const costData = await getReportCostAnalysis({
      period,
      startDate,
      endDate,
      buildingId,
      departmentId,
    });
    return sendSuccess(res, costData, 'Cost analysis report generated');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * GET /api/reports/savings
 */
export const getSavings = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    const savingsData = await getReportSavingsSummary({
      period,
      startDate,
      endDate,
      buildingId,
      departmentId,
    });
    return sendSuccess(res, savingsData, 'Energy savings report summary generated');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * GET /api/reports/alerts
 */
export const getAlerts = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    const alertsData = await getReportAlertsSummary({
      period,
      startDate,
      endDate,
      buildingId,
      departmentId,
    });
    return sendSuccess(res, alertsData, 'Alerts report summary generated');
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * GET /api/reports/details
 */
export const getDetails = async (req, res) => {
  try {
    const { period, startDate, endDate, reportType, page = 1, limit = 10 } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    const details = await getReportDetails({
      period,
      startDate,
      endDate,
      buildingId,
      departmentId,
      reportType,
      page,
      limit,
    });
    return sendSuccess(res, details, `Retrieved ${details.records.length} report detail records (Page ${details.page} of ${details.totalPages})`);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * GET /api/reports/export/csv
 */
export const exportCsv = async (req, res) => {
  try {
    const { period = 'today', startDate, endDate, reportType } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    const csvContent = await generateCsvReport({
      period,
      startDate,
      endDate,
      buildingId,
      departmentId,
      reportType,
    });

    const filename = `energy_report_${period}_${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

/**
 * GET /api/reports/export/pdf
 */
export const exportPdf = async (req, res) => {
  try {
    const { period = 'today', startDate, endDate, reportType } = req.query;
    const { buildingId, departmentId } = getScopedIds(req);
    await generatePdfReport({
      period,
      startDate,
      endDate,
      buildingId,
      departmentId,
      reportType,
    }, res);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
};

export default {
  getSummary,
  getTrend,
  getBuildings,
  getCost,
  getSavings,
  getAlerts,
  getDetails,
  exportCsv,
  exportPdf,
};
