/**
 * controllers/buildingController.js — MySQL Building Handlers
 * Queries the `buildings` and `departments` tables in smart_energy_management.
 */

import { query, getDbStatus } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// Fallback seed data in case MySQL is still starting up
const fallbackBuildings = [
  { id: 1, building_code: 'IB-BLOCK', building_name: 'IB Block', today_energy_kwh: 340.40, monthly_energy_kwh: 10348.00, estimated_cost: 2893.00, current_power_kw: 18.50, active_alerts_count: 0, overall_status: 'Moderate', units_text: 'EEE • EIE' },
  { id: 2, building_code: 'AS-BLOCK', building_name: 'AS Block', today_energy_kwh: 404.80, monthly_energy_kwh: 12306.00, estimated_cost: 3441.00, current_power_kw: 22.00, active_alerts_count: 0, overall_status: 'High Load', units_text: 'Textile • ECE • Civil' },
  { id: 3, building_code: 'MECH-BLOCK', building_name: 'Mechanical Block', today_energy_kwh: 257.60, monthly_energy_kwh: 7831.00, estimated_cost: 2190.00, current_power_kw: 14.00, active_alerts_count: 0, overall_status: 'Moderate', units_text: 'Mech • CT' },
  { id: 4, building_code: 'SUNFLOWER-BLOCK', building_name: 'Sunflower Block', today_energy_kwh: 469.20, monthly_energy_kwh: 14264.00, estimated_cost: 3988.00, current_power_kw: 25.50, active_alerts_count: 0, overall_status: 'High Load', units_text: 'CSE • IT' },
  { id: 5, building_code: 'RESEARCH-PARK', building_name: 'Research Park', today_energy_kwh: 202.40, monthly_energy_kwh: 6153.00, estimated_cost: 1720.00, current_power_kw: 11.00, active_alerts_count: 0, overall_status: 'Normal', units_text: 'Aeronautical • Central Admin' },
  { id: 6, building_code: 'LIBRARY-BLOCK', building_name: 'Library', today_energy_kwh: 156.40, monthly_energy_kwh: 4755.00, estimated_cost: 1329.00, current_power_kw: 8.50, active_alerts_count: 0, overall_status: 'Normal', units_text: 'Central Library' },
  { id: 7, building_code: 'GH-BLOCK', building_name: 'Girls Hostel', today_energy_kwh: 294.40, monthly_energy_kwh: 8950.00, estimated_cost: 2502.00, current_power_kw: 16.00, active_alerts_count: 0, overall_status: 'Moderate', units_text: 'Yamuna • Ganga • Narmadha • Cauvery' },
  { id: 8, building_code: 'BH-BLOCK', building_name: 'Boys Hostel', today_energy_kwh: 322.00, monthly_energy_kwh: 9789.00, estimated_cost: 2737.00, current_power_kw: 17.50, active_alerts_count: 0, overall_status: 'Moderate', units_text: 'Emerald • Sapphire • Pearl • Ruby' },
];

/**
 * Format a raw database building row for the frontend
 */
const formatBuilding = (b) => {
  const status = b.overall_status || 'Normal';
  const consumptionLevel = status === 'High Load' ? 'high' : status === 'Moderate' ? 'moderate' : 'okay';
  const unitsText = b.units_text || '';
  const units = unitsText ? unitsText.split(' • ') : [];

  return {
    id: `bldg_${b.id}`,
    numericId: b.id,
    code: b.building_code,
    name: b.building_name,
    description: b.description || '',
    todayKwh: parseFloat(Number(b.today_energy_kwh || 0).toFixed(1)),
    monthlyKwh: Math.round(Number(b.monthly_energy_kwh || 0)),
    estCost: Math.round(Number(b.estimated_cost || 0)),
    currentPowerKw: parseFloat(Number(b.current_power_kw || 0).toFixed(1)),
    activeAlertsCount: parseInt(b.active_alerts_count || 0, 10),
    levelLabel: status,
    consumptionLevel,
    unitsText,
    units,
  };
};

/**
 * GET /api/buildings
 * Returns all 8 campus buildings populated from MySQL
 */
export const getAllBuildings = async (req, res) => {
  try {
    let rows = [];
    const isHod = req.user?.role === 'Department Staff (HOD)' || req.user?.role === 'HOD';
    const userBldgId = req.user?.building_id;

    try {
      let sql = `
        SELECT 
          b.id,
          b.building_code,
          b.building_name,
          b.description,
          b.today_energy_kwh,
          b.monthly_energy_kwh,
          b.estimated_cost,
          b.current_power_kw,
          b.active_alerts_count,
          b.overall_status,
          GROUP_CONCAT(d.code SEPARATOR ' • ') AS units_text
        FROM buildings b
        LEFT JOIN departments d ON b.id = d.building_id
      `;
      const params = [];
      if (isHod && userBldgId) {
        sql += ` WHERE b.id = ?`;
        params.push(userBldgId);
      }
      sql += ` GROUP BY b.id ORDER BY b.id ASC;`;
      rows = await query(sql, params);
    } catch (dbErr) {
      console.warn('⚠️  MySQL Query error on /api/buildings, using fallback data:', dbErr.message);
      rows = fallbackBuildings;
    }

    if (!rows || rows.length === 0) {
      rows = fallbackBuildings;
    }

    const buildings = rows.map(formatBuilding);

    const totalCampusKwh = parseFloat(
      buildings.reduce((sum, b) => sum + b.todayKwh, 0).toFixed(1)
    );
    const highCount = buildings.filter((b) => b.consumptionLevel === 'high').length;
    const moderateCount = buildings.filter((b) => b.consumptionLevel === 'moderate').length;
    const okayCount = buildings.filter((b) => b.consumptionLevel === 'okay').length;

    return sendSuccess(
      res,
      {
        buildings,
        totalBuildings: buildings.length,
        totalCampusKwh,
        highCount,
        moderateCount,
        okayCount,
        dataSource: getDbStatus() ? 'MySQL (smart_energy_management)' : 'Development Mode',
      },
      `${buildings.length} buildings retrieved successfully`
    );
  } catch (err) {
    return sendError(res, err.message);
  }
};

/**
 * GET /api/buildings/:id
 */
export const getBuildingById = async (req, res) => {
  try {
    const id = req.params.id.replace('bldg_', '');
    const isHod = req.user?.role === 'Department Staff (HOD)' || req.user?.role === 'HOD';
    const userBldgId = req.user?.building_id;

    if (isHod && userBldgId && parseInt(id) !== parseInt(userBldgId)) {
      return sendError(res, 'Access denied. You do not have permission to view other building details.', 403);
    }

    const rows = await query(
      `
      SELECT 
        b.*,
        GROUP_CONCAT(d.code SEPARATOR ' • ') AS units_text
      FROM buildings b
      LEFT JOIN departments d ON b.id = d.building_id
      WHERE b.id = ? OR b.building_code = ?
      GROUP BY b.id;
    `,
      [id, req.params.id]
    );

    if (!rows || rows.length === 0) {
      return sendError(res, 'Building not found', 404);
    }

    return sendSuccess(res, formatBuilding(rows[0]), 'Building details retrieved');
  } catch (err) {
    return sendError(res, err.message);
  }
};

export default {
  getAllBuildings,
  getBuildingById,
};
