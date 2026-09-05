/**
 * controllers/alertController.js — Alert Resource Handlers
 * Handles GET /api/alerts, GET /api/alerts/:id, PATCH /api/alerts/:id/status
 */

import { sendSuccess, sendError } from '../utils/apiResponse.js';

const devAlerts = [
  {
    id: 'alt_101',
    timestamp: '2026-08-27T14:15:00',
    buildingId: 'bldg_sunflower',
    building: 'Sunflower Block',
    type: 'Overload Warning',
    severity: 'Critical',
    status: 'Active',
    message: 'CSE Computer Lab 2 draw exceeded safety threshold.',
  },
  {
    id: 'alt_102',
    timestamp: '2026-08-27T13:40:00',
    buildingId: 'bldg_bh',
    building: 'Boys Hostel',
    type: 'High Voltage Spike',
    severity: 'High',
    status: 'Active',
    message: 'Phase B voltage spike detected at Emerald block sub-panel.',
  },
  {
    id: 'alt_103',
    timestamp: '2026-08-27T12:10:00',
    buildingId: 'bldg_as',
    building: 'AS Block',
    type: 'Low Power Factor',
    severity: 'Medium',
    status: 'Active',
    message: 'Power factor drop logged in Textile Lab feeder line.',
  },
  {
    id: 'alt_104',
    timestamp: '2026-08-27T11:05:00',
    buildingId: 'bldg_sunflower',
    building: 'Sunflower Block',
    type: 'High Thermal Demand',
    severity: 'Medium',
    status: 'Active',
    message: 'IT Server Room HVAC unit working at maximum continuous load.',
  },
];

export const getAllAlerts = (req, res) => {
  try {
    const { status, severity, buildingId } = req.query;
    let filtered = [...devAlerts];
    if (status) filtered = filtered.filter(a => a.status.toLowerCase() === status.toLowerCase());
    if (severity) filtered = filtered.filter(a => a.severity.toLowerCase() === severity.toLowerCase());
    if (buildingId) filtered = filtered.filter(a => a.buildingId === buildingId);
    return sendSuccess(res, filtered, `${filtered.length} alerts retrieved`);
  } catch (err) {
    return sendError(res, err.message);
  }
};

export const getAlertById = (req, res) => {
  try {
    const alert = devAlerts.find(a => a.id === req.params.id);
    if (!alert) return sendError(res, 'Alert not found', 404);
    return sendSuccess(res, alert);
  } catch (err) {
    return sendError(res, err.message);
  }
};

export const updateAlertStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    return sendSuccess(res, { id, status: status || 'Resolved' }, 'Alert status updated successfully');
  } catch (err) {
    return sendError(res, err.message);
  }
};
