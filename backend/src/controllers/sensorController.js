/**
 * controllers/sensorController.js — Controller handlers for Sensor Management
 */

import { sendSuccess, sendError } from '../utils/apiResponse.js';
import {
  getPaginatedSensors,
  getSensorSummaryKPIs,
  getSensorById,
  createSensor,
  updateSensor,
  toggleSensorStatus,
  getSensorTelemetryHistory,
} from '../services/sensorService.js';

/**
 * GET /api/sensors
 */
export const getAllSensors = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      buildingId: req.query.buildingId || req.query.building,
      departmentId: req.query.departmentId || req.query.department,
      parameter: req.query.parameter,
      status: req.query.status,
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const result = await getPaginatedSensors(filters);
    return sendSuccess(res, result.sensors, `${result.sensors.length} sensors retrieved successfully`, 200, {
      pagination: result.pagination,
    });
  } catch (err) {
    console.error('Error fetching sensors:', err);
    return sendError(res, err.message || 'Failed to retrieve sensors', 500);
  }
};

/**
 * GET /api/sensors/summary
 */
export const getSummary = async (_req, res) => {
  try {
    const summary = await getSensorSummaryKPIs();
    return sendSuccess(res, summary, 'Sensor summary metrics retrieved successfully');
  } catch (err) {
    console.error('Error fetching sensor summary:', err);
    return sendError(res, err.message || 'Failed to retrieve sensor summary', 500);
  }
};

/**
 * GET /api/sensors/:id
 */
export const getById = async (req, res) => {
  try {
    const sensor = await getSensorById(req.params.id);
    if (!sensor) {
      return sendError(res, 'Sensor not found', 404);
    }
    return sendSuccess(res, sensor, 'Sensor details retrieved successfully');
  } catch (err) {
    console.error('Error fetching sensor by ID:', err);
    return sendError(res, err.message || 'Failed to retrieve sensor details', 500);
  }
};

/**
 * POST /api/sensors
 */
export const create = async (req, res) => {
  try {
    const { sensor_code, sensor_name, building_id, department_id, parameter, room_location } = req.body;

    if (!sensor_code || !sensor_name || !building_id || !department_id || !parameter || !room_location) {
      return sendError(res, 'Missing required fields: sensor_code, sensor_name, building_id, department_id, parameter, room_location', 400);
    }

    const sensor = await createSensor(req.body);
    return sendSuccess(res, sensor, 'Sensor created successfully', 201);
  } catch (err) {
    console.error('Error creating sensor:', err);
    return sendError(res, err.message || 'Failed to create sensor', err.statusCode || 400);
  }
};

/**
 * PUT /api/sensors/:id
 */
export const update = async (req, res) => {
  try {
    const sensor = await updateSensor(req.params.id, req.body);
    return sendSuccess(res, sensor, 'Sensor updated successfully');
  } catch (err) {
    console.error('Error updating sensor:', err);
    return sendError(res, err.message || 'Failed to update sensor', err.statusCode || 400);
  }
};

/**
 * PATCH /api/sensors/:id/status
 */
export const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Online', 'Offline', 'Maintenance'].includes(status)) {
      return sendError(res, 'Status must be "Online", "Offline", or "Maintenance"', 400);
    }

    const sensor = await toggleSensorStatus(req.params.id, status);
    return sendSuccess(res, sensor, `Sensor status changed to ${status} successfully`);
  } catch (err) {
    console.error('Error changing sensor status:', err);
    return sendError(res, err.message || 'Failed to change sensor status', err.statusCode || 400);
  }
};

/**
 * GET /api/sensors/:id/history
 */
export const getHistory = async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const data = await getSensorTelemetryHistory(req.params.id, limit);
    return sendSuccess(res, data, 'Sensor telemetry history retrieved successfully');
  } catch (err) {
    console.error('Error fetching sensor history:', err);
    return sendError(res, err.message || 'Failed to retrieve sensor history', err.statusCode || 500);
  }
};

export default {
  getAllSensors,
  getSummary,
  getById,
  create,
  update,
  changeStatus,
  getHistory,
};
