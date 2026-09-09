/**
 * services/optimizationService.js — Deterministic Rule-Based Energy Optimization Engine
 * AI-Based Smart Energy Consumption Monitoring & Optimization System
 */

import { query } from '../config/db.js';

export const getElectricityTariff = async () => {
  try {
    const rows = await query("SELECT setting_value FROM system_settings WHERE setting_key = 'electricity_tariff_kwh' LIMIT 1;");
    if (rows && rows.length > 0 && rows[0].setting_value) {
      return parseFloat(rows[0].setting_value) || 8.5;
    }
  } catch (e) {}
  return 8.5;
};

export const ELECTRICITY_TARIFF = 8.5;

/**
 * Format Date object into local ISO string without UTC offset shift
 */

const formatLocalIsoString = (dateVal) => {
  if (!dateVal) return new Date().toISOString().slice(0, 19);
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
};

const getTodayTargetDateSql = () => `COALESCE(
    (SELECT MAX(DATE(reading_date)) FROM energy_consumption WHERE DATE(reading_date) = CURDATE() AND reading_date <= NOW()),
    (SELECT MAX(DATE(reading_date)) FROM energy_consumption WHERE reading_date <= NOW())
  )`;

/**
 * Build SQL time filter clause based on period
 */
const buildTimeWhereClause = (period = 'today', tablePrefix = '') => {
  const p = tablePrefix ? `${tablePrefix}.` : '';
  let clause = `WHERE ${p}reading_date <= NOW()`;
  if (period === 'today') {
    clause += ` AND DATE(${p}reading_date) = ${getTodayTargetDateSql()}`;
  } else if (period === '7d' || period === 'week') {
    clause += ` AND ${p}reading_date >= (${getTodayTargetDateSql()} - INTERVAL 7 DAY)`;
  } else if (period === '30d' || period === 'month') {
    clause += ` AND ${p}reading_date >= (${getTodayTargetDateSql()} - INTERVAL 30 DAY)`;
  }
  return clause;
};

/**
 * GET Summary KPIs
 */
export const getOptimizationSummary = async ({ buildingId, departmentId, period = 'today' }) => {
  let timeWhere = buildTimeWhereClause(period);
  const params = [];

  if (buildingId && buildingId !== 'all') {
    timeWhere += ' AND building_id = ?';
    params.push(buildingId);
  }
  if (departmentId && departmentId !== 'all') {
    timeWhere += ' AND department_id = ?';
    params.push(departmentId);
  }

  // 1. Current Energy Consumed
  const energySql = `
    SELECT COALESCE(SUM(energy_consumed_kwh), 0) AS total_kwh
    FROM energy_consumption
    ${timeWhere};
  `;
  const energyRows = await query(energySql, params);
  const totalKwh = parseFloat(Number(energyRows[0]?.total_kwh || 0).toFixed(1));

  // 2. High Consumption & Potential Savings Calculation (Rule-based)
  const highAreas = await getHighConsumptionAreas({ buildingId, departmentId, period });
  const potentialSavingKwh = parseFloat(
    highAreas.reduce((sum, item) => sum + Number(item.potentialSavingKwh || 0), 0).toFixed(1)
  );

  const tariff = await getElectricityTariff();
  const potentialCostSaving = Math.round(potentialSavingKwh * tariff);
  const currentCost = Math.round(totalKwh * tariff);

  // 3. Count total active recommendations
  let recWhere = 'WHERE 1=1';
  const recParams = [];
  if (buildingId && buildingId !== 'all') {
    recWhere += ' AND building_id = ?';
    recParams.push(buildingId);
  }
  if (departmentId && departmentId !== 'all') {
    recWhere += ' AND department_id = ?';
    recParams.push(departmentId);
  }

  const recCountSql = `SELECT COUNT(*) AS total_recs FROM optimization_recommendations ${recWhere};`;
  const recRows = await query(recCountSql, recParams);
  const totalRecommendations = parseInt(recRows[0]?.total_recs || 0, 10);

  return {
    period,
    tariff: tariff,
    currentEnergyKwh: totalKwh,
    currentCost: currentCost,
    potentialSavingKwh: potentialSavingKwh,
    potentialCostSaving: potentialCostSaving,
    totalRecommendations: totalRecommendations,
    efficiencyGainPercent: totalKwh > 0 ? parseFloat(((potentialSavingKwh / totalKwh) * 100).toFixed(1)) : 12.5,
  };
};

/**
 * GET High Consumption Areas Ranking
 */
export const getHighConsumptionAreas = async ({ buildingId, departmentId, period = 'today' }) => {
  let timeWhere = buildTimeWhereClause(period, 'e');
  const params = [];

  if (buildingId && buildingId !== 'all') {
    timeWhere += ' AND e.building_id = ?';
    params.push(buildingId);
  }
  if (departmentId && departmentId !== 'all') {
    timeWhere += ' AND e.department_id = ?';
    params.push(departmentId);
  }

  // If specific building selected, analyze by department; otherwise analyze by building
  const groupByBuilding = !buildingId || buildingId === 'all';

  let sql = '';
  if (groupByBuilding) {
    sql = `
      SELECT 
        b.id AS entity_id,
        b.building_name AS name,
        b.building_code AS code,
        'Building' AS type,
        b.description,
        COALESCE(SUM(e.energy_consumed_kwh), 0) AS total_kwh,
        COALESCE(AVG(e.energy_consumed_kwh) * COUNT(DISTINCT e.reading_date) * 0.85, 0) AS avg_kwh,
        COALESCE(AVG(e.power_kw), 0) AS avg_power_kw,
        COALESCE(AVG(e.power_factor), 0.95) AS avg_pf
      FROM buildings b
      LEFT JOIN energy_consumption e ON b.id = e.building_id
      ${timeWhere}
      GROUP BY b.id, b.building_name, b.building_code, b.description
      ORDER BY total_kwh DESC;
    `;
  } else {
    sql = `
      SELECT 
        d.id AS entity_id,
        d.department_name AS name,
        d.code AS code,
        'Department' AS type,
        b.building_name AS parent_building,
        COALESCE(SUM(e.energy_consumed_kwh), 0) AS total_kwh,
        COALESCE(AVG(e.energy_consumed_kwh) * COUNT(DISTINCT e.reading_date) * 0.85, 0) AS avg_kwh,
        COALESCE(AVG(e.power_kw), 0) AS avg_power_kw,
        COALESCE(AVG(e.power_factor), 0.95) AS avg_pf
      FROM departments d
      JOIN buildings b ON d.building_id = b.id
      LEFT JOIN energy_consumption e ON d.id = e.department_id
      ${timeWhere}
      GROUP BY d.id, d.department_name, d.code, b.building_name
      ORDER BY total_kwh DESC;
    `;
  }

  const tariff = await getElectricityTariff();
  const rows = await query(sql, params);

  return rows.map((r, idx) => {
    const totalKwh = parseFloat(Number(r.total_kwh || 0).toFixed(1));
    const avgKwh = parseFloat(Number(r.avg_kwh || totalKwh * 0.85).toFixed(1));
    
    // Deterministic Rule: Calculate Status & Potential Savings
    let status = 'Normal';
    let potentialSavingKwh = 0;

    if (totalKwh > avgKwh * 1.2) {
      status = 'High Consumption';
      potentialSavingKwh = parseFloat(((totalKwh - avgKwh) + totalKwh * 0.08).toFixed(1));
    } else if (totalKwh > avgKwh * 1.05) {
      status = 'Moderate Usage';
      potentialSavingKwh = parseFloat((totalKwh - avgKwh).toFixed(1));
    } else {
      status = 'Optimal';
      potentialSavingKwh = parseFloat((totalKwh * 0.05).toFixed(1));
    }

    const estimatedCost = Math.round(totalKwh * tariff);
    const potentialCostSaving = Math.round(potentialSavingKwh * tariff);

    return {
      rank: idx + 1,
      id: r.entity_id,
      name: r.name,
      code: r.code,
      type: r.type,
      parentBuilding: r.parent_building || 'Campus Block',
      totalKwh,
      avgKwh,
      avgPowerKw: parseFloat(Number(r.avg_power_kw).toFixed(1)),
      avgPowerFactor: parseFloat(Number(r.avg_pf).toFixed(2)),
      estimatedCost,
      status,
      potentialSavingKwh,
      potentialCostSaving,
      optimizationOpportunity: potentialSavingKwh > 30 ? 'High Opportunity' : potentialSavingKwh > 15 ? 'Medium Opportunity' : 'Low Opportunity',
    };
  });
};

/**
 * GET Energy Saving Analysis Chart Data (Current vs Potential Optimized)
 */
export const getOptimizationAnalysisChart = async ({ buildingId, departmentId, period = 'today' }) => {
  let timeWhere = buildTimeWhereClause(period, 'e');
  const params = [];

  if (buildingId && buildingId !== 'all') {
    timeWhere += ' AND e.building_id = ?';
    params.push(buildingId);
  }
  if (departmentId && departmentId !== 'all') {
    timeWhere += ' AND e.department_id = ?';
    params.push(departmentId);
  }

  // Time-series breakdown grouped by 15-minute slot / hour / date
  let timeFormatSql = "%Y-%m-%d %H:00:00";
  if (period === 'today') {
    timeFormatSql = "%Y-%m-%d %H:%i:00";
  } else if (period === '30d') {
    timeFormatSql = "%Y-%m-%d";
  }

  const sql = `
    SELECT 
      DATE_FORMAT(e.reading_date, '${timeFormatSql}') AS time_slot,
      SUM(e.energy_consumed_kwh) AS actual_kwh,
      SUM(e.power_kw) AS actual_power_kw,
      AVG(e.power_factor) AS avg_pf
    FROM energy_consumption e
    ${timeWhere}
    GROUP BY time_slot
    ORDER BY time_slot ASC
    LIMIT 100;
  `;

  const tariff = await getElectricityTariff();
  const rows = await query(sql, params);

  return rows.map((row) => {
    const actualKwh = parseFloat(Number(row.actual_kwh || 0).toFixed(2));
    const powerKw = parseFloat(Number(row.actual_power_kw || 0).toFixed(1));
    const pf = parseFloat(Number(row.avg_pf || 0.95).toFixed(2));

    // Rule-Based Optimized Calculation:
    // Apply 12% recoverable savings during peak/off-peak waste hours
    const reductionFactor = pf < 0.92 ? 0.85 : 0.88;
    const optimizedKwh = parseFloat((actualKwh * reductionFactor).toFixed(2));
    const savingsKwh = parseFloat((actualKwh - optimizedKwh).toFixed(2));
    const costSavings = Math.round(savingsKwh * tariff);

    let displayTime = row.time_slot;
    const d = new Date(row.time_slot);
    if (!isNaN(d.getTime())) {
      displayTime = period === '30d' 
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    return {
      time: displayTime,
      timestamp: row.time_slot,
      actualKwh,
      optimizedKwh,
      savingsKwh,
      costSavings,
      powerKw,
      powerFactor: pf,
    };
  });
};

/**
 * GET Recommendations List
 */
export const getOptimizationRecommendations = async ({ buildingId, departmentId, status }) => {
  let sql = `
    SELECT 
      r.id,
      r.building_id,
      r.department_id,
      r.title,
      r.category,
      r.reason,
      r.recommendation,
      r.est_kwh_savings,
      r.est_cost_savings,
      r.priority,
      r.status,
      r.created_at,
      r.updated_at,
      b.building_name,
      b.building_code,
      COALESCE(d.department_name, 'Facility Wide') AS department_name,
      d.code AS department_code
    FROM optimization_recommendations r
    LEFT JOIN buildings b ON r.building_id = b.id
    LEFT JOIN departments d ON r.department_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (buildingId && buildingId !== 'all') {
    sql += ' AND r.building_id = ?';
    params.push(buildingId);
  }

  if (departmentId && departmentId !== 'all') {
    sql += ' AND r.department_id = ?';
    params.push(departmentId);
  }

  if (status && status !== 'all') {
    sql += ' AND r.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY FIELD(r.priority, "High", "Medium", "Low"), r.id ASC;';

  const rows = await query(sql, params);

  return rows.map((row) => ({
    id: row.id,
    buildingId: row.building_id,
    departmentId: row.department_id,
    buildingName: row.building_name || 'Campus Block',
    buildingCode: row.building_code || 'CAMPUS',
    departmentName: row.department_name,
    departmentCode: row.department_code || 'FAC',
    title: row.title,
    category: row.category,
    reason: row.reason,
    recommendation: row.recommendation,
    estKwhSavings: parseFloat(Number(row.est_kwh_savings).toFixed(1)),
    estCostSavings: Math.round(Number(row.est_cost_savings)),
    priority: row.priority,
    status: row.status,
    createdAt: formatLocalIsoString(row.created_at),
    updatedAt: formatLocalIsoString(row.updated_at),
  }));
};

/**
 * UPDATE Recommendation Status
 */
export const updateRecommendationStatus = async (id, newStatus) => {
  const allowedStatuses = ['Pending', 'Reviewed', 'Implemented'];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Invalid status "${newStatus}". Allowed values: ${allowedStatuses.join(', ')}`);
  }

  const sql = `
    UPDATE optimization_recommendations 
    SET status = ?, updated_at = NOW() 
    WHERE id = ?;
  `;
  await query(sql, [newStatus, id]);

  const [updated] = await query(
    'SELECT * FROM optimization_recommendations WHERE id = ?;',
    [id]
  );
  return updated;
};

/**
 * GET Building / Department Optimization Opportunities Comparison
 */
export const getOptimizationComparison = async ({ buildingId, departmentId, period = 'today' }) => {
  const highAreas = await getHighConsumptionAreas({ buildingId, departmentId, period });

  return highAreas.map((area) => ({
    id: area.id,
    name: area.name,
    code: area.code,
    type: area.type,
    parentBuilding: area.parentBuilding,
    currentConsumptionKwh: area.totalKwh,
    baselineAverageKwh: area.avgKwh,
    potentialSavingKwh: area.potentialSavingKwh,
    potentialCostSaving: area.potentialCostSaving,
    estimatedCost: area.estimatedCost,
    priority: area.potentialSavingKwh > 30 ? 'High' : area.potentialSavingKwh > 15 ? 'Medium' : 'Low',
    status: area.status,
  }));
};

export default {
  ELECTRICITY_TARIFF,
  getOptimizationSummary,
  getHighConsumptionAreas,
  getOptimizationAnalysisChart,
  getOptimizationRecommendations,
  updateRecommendationStatus,
  getOptimizationComparison,
};
