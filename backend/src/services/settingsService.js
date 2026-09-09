/**
 * services/settingsService.js — Centralized Database System Settings Layer
 * Target Database: smart_energy_management
 */

import { query } from '../config/db.js';

/**
 * Get all system settings as key-value pairs and detailed list
 */
export const getAllSettings = async () => {
  const rows = await query('SELECT * FROM system_settings ORDER BY category, setting_key;');

  const settingsMap = {};
  rows.forEach((r) => {
    settingsMap[r.setting_key] = r.setting_value;
  });

  return {
    settings: rows,
    map: settingsMap,
  };
};

/**
 * Get single setting value by key with optional fallback default
 */
export const getSettingValue = async (key, defaultValue = null) => {
  const rows = await query('SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1;', [key]);
  if (rows && rows.length > 0) {
    return rows[0].setting_value;
  }
  return defaultValue;
};

/**
 * Validate incoming settings payload
 */
export const validateSettingsPayload = (payload) => {
  const errors = [];

  if (payload.electricity_tariff_kwh !== undefined) {
    const val = parseFloat(payload.electricity_tariff_kwh);
    if (isNaN(val) || val < 0) {
      errors.push('Electricity tariff must be a non-negative number.');
    }
  }

  if (payload.min_voltage !== undefined && payload.max_voltage !== undefined) {
    const minV = parseFloat(payload.min_voltage);
    const maxV = parseFloat(payload.max_voltage);
    if (isNaN(minV) || isNaN(maxV)) {
      errors.push('Voltage thresholds must be valid numbers.');
    } else if (minV >= maxV) {
      errors.push('Minimum voltage threshold must be strictly less than maximum voltage threshold.');
    }
  }

  if (payload.max_current !== undefined) {
    const val = parseFloat(payload.max_current);
    if (isNaN(val) || val <= 0) {
      errors.push('Maximum feeder current must be a positive number.');
    }
  }

  if (payload.high_consumption_kw !== undefined) {
    const val = parseFloat(payload.high_consumption_kw);
    if (isNaN(val) || val <= 0) {
      errors.push('High power consumption threshold must be a positive number.');
    }
  }

  if (payload.min_frequency !== undefined && payload.max_frequency !== undefined) {
    const minF = parseFloat(payload.min_frequency);
    const maxF = parseFloat(payload.max_frequency);
    if (isNaN(minF) || isNaN(maxF)) {
      errors.push('Frequency limits must be valid numbers.');
    } else if (minF >= maxF) {
      errors.push('Minimum frequency must be strictly less than maximum frequency.');
    }
  }

  if (payload.min_power_factor !== undefined) {
    const val = parseFloat(payload.min_power_factor);
    if (isNaN(val) || val < 0.5 || val > 1.0) {
      errors.push('Minimum power factor must be a numeric value between 0.50 and 1.00.');
    }
  }

  if (errors.length > 0) {
    const err = new Error(errors.join(' '));
    err.statusCode = 400;
    throw err;
  }
};

/**
 * Bulk update system settings
 */
export const updateSettings = async (settingsPayload, updatedBy = 'Administrator') => {
  if (!settingsPayload || typeof settingsPayload !== 'object') {
    const error = new Error('Invalid settings data payload.');
    error.statusCode = 400;
    throw error;
  }

  validateSettingsPayload(settingsPayload);

  const entries = Object.entries(settingsPayload);
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null) {
      const valStr = String(value);
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE setting_value = ?, updated_by = ?, updated_at = NOW();`,
        [key, valStr, updatedBy, valStr, updatedBy]
      );
    }
  }

  return getAllSettings();
};
