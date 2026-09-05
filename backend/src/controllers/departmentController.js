/**
 * controllers/departmentController.js — MySQL Department Handlers
 * Queries the `departments` table joined with `buildings`.
 */

import { query, getDbStatus } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// Fallback seed data
const fallbackDepartments = [
  { id: 1, building_id: 1, department_name: 'EEE Department', code: 'EEE', today_energy_kwh: 193.20, monthly_energy_kwh: 5873.00, estimated_cost: 1642.00, current_power_kw: 14.20, potential_saving_kwh: 32.50, active_alerts_count: 0, overall_status: 'Moderate', building_name: 'IB Block', building_code: 'IB-BLOCK' },
  { id: 2, building_id: 1, department_name: 'EIE Department', code: 'EIE', today_energy_kwh: 147.20, monthly_energy_kwh: 4475.00, estimated_cost: 1251.00, current_power_kw: 10.80, potential_saving_kwh: 18.00, active_alerts_count: 0, overall_status: 'Normal', building_name: 'IB Block', building_code: 'IB-BLOCK' },
  { id: 3, building_id: 2, department_name: 'Textile Technology', code: 'Textile', today_energy_kwh: 128.80, monthly_energy_kwh: 3916.00, estimated_cost: 1095.00, current_power_kw: 9.50, potential_saving_kwh: 15.00, active_alerts_count: 0, overall_status: 'Moderate', building_name: 'AS Block', building_code: 'AS-BLOCK' },
  { id: 4, building_id: 2, department_name: 'ECE Department', code: 'ECE', today_energy_kwh: 211.60, monthly_energy_kwh: 6433.00, estimated_cost: 1799.00, current_power_kw: 15.50, potential_saving_kwh: 45.00, active_alerts_count: 0, overall_status: 'High Load', building_name: 'AS Block', building_code: 'AS-BLOCK' },
  { id: 5, building_id: 2, department_name: 'Civil Engineering', code: 'Civil', today_energy_kwh: 119.60, monthly_energy_kwh: 3536.00, estimated_cost: 1017.00, current_power_kw: 8.80, potential_saving_kwh: 12.00, active_alerts_count: 0, overall_status: 'Normal', building_name: 'AS Block', building_code: 'AS-BLOCK' },
  { id: 6, building_id: 3, department_name: 'Mechanical Engineering', code: 'Mech', today_energy_kwh: 165.60, monthly_energy_kwh: 5034.00, estimated_cost: 1408.00, current_power_kw: 12.20, potential_saving_kwh: 28.00, active_alerts_count: 0, overall_status: 'Moderate', building_name: 'Mechanical Block', building_code: 'MECH-BLOCK' },
  { id: 7, building_id: 3, department_name: 'CT Department', code: 'CT', today_energy_kwh: 92.00, monthly_energy_kwh: 2797.00, estimated_cost: 782.00, current_power_kw: 6.80, potential_saving_kwh: 10.00, active_alerts_count: 0, overall_status: 'Normal', building_name: 'Mechanical Block', building_code: 'MECH-BLOCK' },
  { id: 8, building_id: 4, department_name: 'CSE Department', code: 'CSE', today_energy_kwh: 276.00, monthly_energy_kwh: 8390.00, estimated_cost: 2346.00, current_power_kw: 20.30, potential_saving_kwh: 65.00, active_alerts_count: 0, overall_status: 'High Load', building_name: 'Sunflower Block', building_code: 'SUNFLOWER-BLOCK' },
  { id: 9, building_id: 4, department_name: 'IT Department', code: 'IT', today_energy_kwh: 193.20, monthly_energy_kwh: 5873.00, estimated_cost: 1642.00, current_power_kw: 14.20, potential_saving_kwh: 38.00, active_alerts_count: 0, overall_status: 'Moderate', building_name: 'Sunflower Block', building_code: 'SUNFLOWER-BLOCK' },
  { id: 10, building_id: 5, department_name: 'Aeronautical Engg', code: 'Aeronautical', today_energy_kwh: 119.60, monthly_energy_kwh: 3636.00, estimated_cost: 1017.00, current_power_kw: 8.80, potential_saving_kwh: 14.00, active_alerts_count: 0, overall_status: 'Normal', building_name: 'Research Park', building_code: 'RESEARCH-PARK' },
  { id: 11, building_id: 5, department_name: 'Central Administration', code: 'Central Admin', today_energy_kwh: 82.80, monthly_energy_kwh: 2517.00, estimated_cost: 704.00, current_power_kw: 6.10, potential_saving_kwh: 10.00, active_alerts_count: 0, overall_status: 'Normal', building_name: 'Research Park', building_code: 'RESEARCH-PARK' },
  { id: 12, building_id: 6, department_name: 'Library Facility', code: 'Central Library', today_energy_kwh: 156.40, monthly_energy_kwh: 4755.00, estimated_cost: 1329.00, current_power_kw: 11.50, potential_saving_kwh: 22.00, active_alerts_count: 0, overall_status: 'Normal', building_name: 'Library', building_code: 'LIBRARY-BLOCK' },
  { id: 13, building_id: 7, department_name: 'Yamuna Block', code: 'Yamuna', today_energy_kwh: 77.30, monthly_energy_kwh: 2350.00, estimated_cost: 657.00, current_power_kw: 5.70, potential_saving_kwh: 8.00, active_alerts_count: 0, overall_status: 'Normal', building_name: 'Girls Hostel', building_code: 'GH-BLOCK' },
  { id: 14, building_id: 7, department_name: 'Ganga Block', code: 'Ganga', today_energy_kwh: 73.60, monthly_energy_kwh: 2237.00, estimated_cost: 626.00, current_power_kw: 5.40, potential_saving_kwh: 7.50, active_alerts_count: 0, overall_status: 'Normal', building_name: 'Girls Hostel', building_code: 'GH-BLOCK' },
  { id: 15, building_id: 7, department_name: 'Narmadha Block', code: 'Narmadha', today_energy_kwh: 69.90, monthly_energy_kwh: 2125.00, estimated_cost: 594.00, current_power_kw: 5.10, potential_saving_kwh: 6.00, active_alerts_count: 0, overall_status: 'Normal', building_name: 'Girls Hostel', building_code: 'GH-BLOCK' },
  { id: 16, building_id: 7, department_name: 'Cauvery Block', code: 'Cauvery', today_energy_kwh: 73.60, monthly_energy_kwh: 2237.00, estimated_cost: 626.00, current_power_kw: 5.40, potential_saving_kwh: 7.00, active_alerts_count: 0, overall_status: 'Normal', building_name: 'Girls Hostel', building_code: 'GH-BLOCK' },
  { id: 17, building_id: 8, department_name: 'Emerald Block', code: 'Emerald', today_energy_kwh: 88.30, monthly_energy_kwh: 2684.00, estimated_cost: 751.00, current_power_kw: 6.50, potential_saving_kwh: 9.00, active_alerts_count: 0, overall_status: 'Normal', building_name: 'Boys Hostel', building_code: 'BH-BLOCK' },
  { id: 18, building_id: 8, department_name: 'Sapphire Block', code: 'Sapphire', today_energy_kwh: 82.80, monthly_energy_kwh: 2517.00, estimated_cost: 704.00, current_power_kw: 6.10, potential_saving_kwh: 8.50, active_alerts_count: 0, overall_status: 'Normal', building_name: 'Boys Hostel', building_code: 'BH-BLOCK' },
  { id: 19, building_id: 8, department_name: 'Pearl Block', code: 'Pearl', today_energy_kwh: 73.60, monthly_energy_kwh: 2237.00, estimated_cost: 626.00, current_power_kw: 5.40, potential_saving_kwh: 7.00, active_alerts_count: 0, overall_status: 'Normal', building_name: 'Boys Hostel', building_code: 'BH-BLOCK' },
  { id: 20, building_id: 8, department_name: 'Ruby Block', code: 'Ruby', today_energy_kwh: 77.30, monthly_energy_kwh: 2350.00, estimated_cost: 657.00, current_power_kw: 5.70, potential_saving_kwh: 7.50, active_alerts_count: 0, overall_status: 'Normal', building_name: 'Boys Hostel', building_code: 'BH-BLOCK' },
];

const formatDepartment = (d) => {
  const status = d.overall_status || 'Normal';
  const consumptionLevel = status === 'High Load' ? 'high' : status === 'Moderate' ? 'moderate' : 'okay';

  return {
    id: `unit_${d.id}`,
    numericId: d.id,
    name: d.department_name,
    code: d.code,
    buildingId: `bldg_${d.building_id}`,
    buildingNumericId: d.building_id,
    buildingName: d.building_name,
    buildingCode: d.building_code,
    todayKwh: parseFloat(Number(d.today_energy_kwh || 0).toFixed(1)),
    monthlyKwh: Math.round(Number(d.monthly_energy_kwh || 0)),
    estCost: Math.round(Number(d.estimated_cost || 0)),
    currentPowerKw: parseFloat(Number(d.current_power_kw || 0).toFixed(1)),
    potentialSavingKwh: parseFloat(Number(d.potential_saving_kwh || 0).toFixed(1)),
    activeAlertsCount: parseInt(d.active_alerts_count || 0, 10),
    levelLabel: status,
    consumptionLevel,
  };
};

/**
 * GET /api/departments
 * Returns all departments populated from MySQL
 */
export const getAllDepartments = async (req, res) => {
  try {
    let rows = [];
    try {
      rows = await query(`
        SELECT 
          d.id,
          d.building_id,
          d.department_name,
          d.code,
          d.today_energy_kwh,
          d.monthly_energy_kwh,
          d.estimated_cost,
          d.current_power_kw,
          d.potential_saving_kwh,
          d.active_alerts_count,
          d.overall_status,
          b.building_name,
          b.building_code
        FROM departments d
        JOIN buildings b ON d.building_id = b.id
        ORDER BY d.id ASC;
      `);
    } catch (dbErr) {
      console.warn('⚠️  MySQL Query error on /api/departments, using fallback data:', dbErr.message);
      rows = fallbackDepartments;
    }

    if (!rows || rows.length === 0) {
      rows = fallbackDepartments;
    }

    const departments = rows.map(formatDepartment);

    // Group departments by parent building for filter dropdown & building sections
    const buildingsMap = new Map();
    departments.forEach((dept) => {
      if (!buildingsMap.has(dept.buildingId)) {
        buildingsMap.set(dept.buildingId, {
          buildingId: dept.buildingId,
          buildingName: dept.buildingName,
          buildingCode: dept.buildingCode,
          departments: [],
          totalTodayKwh: 0,
        });
      }
      const bldgGroup = buildingsMap.get(dept.buildingId);
      bldgGroup.departments.push(dept);
      bldgGroup.totalTodayKwh = parseFloat((bldgGroup.totalTodayKwh + dept.todayKwh).toFixed(1));
    });

    const groupedByBuilding = Array.from(buildingsMap.values()).map((g) => ({
      ...g,
      unitsText: g.departments.map((d) => d.code).join(' • '),
    }));

    const totalCampusKwh = parseFloat(
      departments.reduce((sum, d) => sum + d.todayKwh, 0).toFixed(1)
    );
    const highCount = departments.filter((d) => d.consumptionLevel === 'high').length;
    const moderateCount = departments.filter((d) => d.consumptionLevel === 'moderate').length;
    const okayCount = departments.filter((d) => d.consumptionLevel === 'okay').length;

    return sendSuccess(
      res,
      {
        departments,
        groupedByBuilding,
        totalDepartments: departments.length,
        totalCampusKwh,
        highCount,
        moderateCount,
        okayCount,
        dataSource: getDbStatus() ? 'MySQL (smart_energy_management)' : 'Development Mode',
      },
      `${departments.length} departments retrieved successfully`
    );
  } catch (err) {
    return sendError(res, err.message);
  }
};

/**
 * GET /api/departments/:id
 */
export const getDepartmentById = async (req, res) => {
  try {
    const id = req.params.id.replace('unit_', '');
    const rows = await query(
      `
      SELECT 
        d.*,
        b.building_name,
        b.building_code
      FROM departments d
      JOIN buildings b ON d.building_id = b.id
      WHERE d.id = ? OR d.code = ?;
    `,
      [id, req.params.id]
    );

    if (!rows || rows.length === 0) {
      return sendError(res, 'Department not found', 404);
    }

    return sendSuccess(res, formatDepartment(rows[0]), 'Department details retrieved');
  } catch (err) {
    return sendError(res, err.message);
  }
};

export default {
  getAllDepartments,
  getDepartmentById,
};
