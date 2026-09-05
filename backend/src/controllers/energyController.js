/**
 * controllers/energyController.js — MySQL Energy Consumption Reading Handlers
 * Queries the `energy_consumption` table in smart_energy_management.
 */

import { query, getDbStatus } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getEnergyConsumption = async (req, res) => {
  try {
    const { buildingId, limit = 50 } = req.query;
    let sql = `
      SELECT 
        e.id,
        e.building_id,
        e.department_id,
        e.reading_date,
        e.energy_consumed_kwh,
        e.power_kw,
        e.voltage,
        e.current_a,
        e.power_factor,
        b.building_name,
        b.building_code,
        COALESCE(d.department_name, 'General Facility') AS department_name
      FROM energy_consumption e
      JOIN buildings b ON e.building_id = b.id
      LEFT JOIN departments d ON e.department_id = d.id
    `;
    const params = [];

    if (buildingId) {
      const cleanBldgId = String(buildingId).replace('bldg_', '');
      sql += ` WHERE e.building_id = ?`;
      params.push(cleanBldgId);
    }

    sql += ` ORDER BY e.reading_date DESC LIMIT ?;`;
    params.push(parseInt(limit, 10));

    let rows = [];
    try {
      rows = await query(sql, params);
    } catch (dbErr) {
      console.warn('⚠️  MySQL Query error on /api/energy-consumption:', dbErr.message);
    }

    return sendSuccess(
      res,
      rows,
      `${rows.length} energy consumption records retrieved`
    );
  } catch (err) {
    return sendError(res, err.message);
  }
};

export default {
  getEnergyConsumption,
};
