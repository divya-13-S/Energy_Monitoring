/**
 * controllers/settingsController.js — Controller for System Settings endpoints
 */

import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { getAllSettings, updateSettings } from '../services/settingsService.js';

/**
 * GET /api/settings
 */
export const getSettings = async (_req, res) => {
  try {
    const data = await getAllSettings();
    return sendSuccess(res, data, 'System settings retrieved successfully');
  } catch (err) {
    console.error('Error fetching settings:', err);
    return sendError(res, err.message || 'Failed to retrieve system settings', 500);
  }
};

/**
 * PUT /api/settings
 */
export const update = async (req, res) => {
  try {
    const updatedBy = req.user?.name || req.user?.email || 'Administrator';
    const data = await updateSettings(req.body, updatedBy);
    return sendSuccess(res, data, 'System settings updated successfully');
  } catch (err) {
    console.error('Error updating settings:', err);
    return sendError(res, err.message || 'Failed to update system settings', err.statusCode || 400);
  }
};

export default {
  getSettings,
  update,
};
