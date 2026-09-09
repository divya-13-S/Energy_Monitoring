/**
 * services/alertService.js — Alert Management & Threshold Service
 * Connects directly to MySQL database `smart_energy_management`.
 */

import { query } from '../config/db.js';

/**
 * Fetch active alert thresholds from `system_settings`
 */
export const getAlertThresholds = async () => {
  const rows = await query(`SELECT setting_key, setting_value, category, description FROM system_settings;`);
  const thresholds = {};
  for (const r of rows) {
    thresholds[r.setting_key] = parseFloat(r.setting_value) || r.setting_value;
  }
  return thresholds;
};

/**
 * Update alert thresholds in `system_settings`
 */
export const updateAlertThresholds = async (settingsObj) => {
  for (const [key, val] of Object.entries(settingsObj)) {
    await query(
      `UPDATE system_settings SET setting_value = ? WHERE setting_key = ?;`,
      [String(val), key]
    );
  }
  return await getAlertThresholds();
};

/**
 * Build SQL WHERE conditions based on user filters and role permissions
 */
const buildAlertWhereClause = (filters, roleContext = {}) => {
  const conditions = ['1=1'];
  const params = [];

  const { buildingId, departmentId, alertType, severity, status, startDate, endDate } = filters;
  const { role, userDeptId } = roleContext;

  // 1. Role-based restrictions
  if (role === 'Department Staff (HOD)' || role === 'HOD') {
    if (userDeptId) {
      conditions.push('a.department_id = ?');
      params.push(userDeptId);
    }
  } else if (role === 'Electrician / Maintenance Staff' || role === 'Electrician') {
    conditions.push("a.alert_type IN ('High Voltage', 'Low Voltage', 'Overload / High Current', 'Low Power Factor', 'Power Failure', 'Frequency Abnormality', 'Overload Warning', 'High Voltage Spike')");
  }

  // 2. Explicit User Filters
  if (buildingId && buildingId !== 'all') {
    conditions.push('a.building_id = ?');
    params.push(buildingId);
  }

  if (departmentId && departmentId !== 'all') {
    conditions.push('a.department_id = ?');
    params.push(departmentId);
  }

  if (alertType && alertType !== 'all') {
    conditions.push('a.alert_type = ?');
    params.push(alertType);
  }

  if (severity && severity !== 'all') {
    conditions.push('LOWER(a.severity) = LOWER(?)');
    params.push(severity);
  }

  if (status && status !== 'all') {
    conditions.push('LOWER(a.status) = LOWER(?)');
    params.push(status);
  }

  if (startDate) {
    conditions.push('a.created_at >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('a.created_at <= ?');
    params.push(`${endDate} 23:59:59`);
  }

  // Ensure no future alerts
  conditions.push('a.created_at <= NOW()');

  return {
    whereSql: conditions.join(' AND '),
    params
  };
};

/**
 * Retrieve paginated alerts with building and department metadata
 */
export const getPaginatedAlerts = async (filters = {}, pagination = {}, roleContext = {}) => {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 15;
  const offset = (page - 1) * limit;

  const { whereSql, params } = buildAlertWhereClause(filters, roleContext);

  // Count total records
  const countSql = `
    SELECT COUNT(*) as total
    FROM alerts a
    WHERE ${whereSql};
  `;
  const countRes = await query(countSql, params);
  const total = countRes[0]?.total || 0;

  // Fetch paginated rows
  const dataSql = `
    SELECT
      a.id,
      a.id as alert_id,
      a.created_at as timestamp,
      a.created_at,
      a.title,
      a.message as description,
      a.message,
      a.alert_type,
      a.severity,
      a.status,
      a.trigger_value,
      a.threshold_value,
      a.acknowledged_by,
      a.acknowledged_at,
      a.resolved_by,
      a.resolved_at,
      a.resolution_remarks,
      a.building_id,
      b.building_name,
      b.building_code,
      a.department_id,
      d.department_name,
      d.code as department_code
    FROM alerts a
    LEFT JOIN buildings b ON a.building_id = b.id
    LEFT JOIN departments d ON a.department_id = d.id
    WHERE ${whereSql}
    ORDER BY a.created_at DESC
    LIMIT ${limit} OFFSET ${offset};
  `;

  const rows = await query(dataSql, params);

  return {
    alerts: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Compute summary KPI metrics (Total, Critical, High, Medium, Low, Unresolved)
 */
export const getAlertSummaryKPIs = async (filters = {}, roleContext = {}) => {
  const { whereSql, params } = buildAlertWhereClause(filters, roleContext);

  const summarySql = `
    SELECT
      COUNT(*) as total_alerts,
      SUM(CASE WHEN LOWER(a.severity) = 'critical' THEN 1 ELSE 0 END) as critical_count,
      SUM(CASE WHEN LOWER(a.severity) = 'high' THEN 1 ELSE 0 END) as high_count,
      SUM(CASE WHEN LOWER(a.severity) = 'medium' THEN 1 ELSE 0 END) as medium_count,
      SUM(CASE WHEN LOWER(a.severity) = 'low' THEN 1 ELSE 0 END) as low_count,
      SUM(CASE WHEN LOWER(a.status) IN ('active', 'acknowledged') THEN 1 ELSE 0 END) as unresolved_count
    FROM alerts a
    WHERE ${whereSql};
  `;

  const [res] = await query(summarySql, params);

  return {
    totalAlerts: parseInt(res.total_alerts) || 0,
    critical: parseInt(res.critical_count) || 0,
    high: parseInt(res.high_count) || 0,
    medium: parseInt(res.medium_count) || 0,
    low: parseInt(res.low_count) || 0,
    unresolved: parseInt(res.unresolved_count) || 0,
  };
};

/**
 * Fetch a single alert by ID
 */
export const getAlertById = async (id) => {
  const sql = `
    SELECT
      a.*,
      b.building_name,
      b.building_code,
      d.department_name,
      d.code as department_code
    FROM alerts a
    LEFT JOIN buildings b ON a.building_id = b.id
    LEFT JOIN departments d ON a.department_id = d.id
    WHERE a.id = ?;
  `;
  const [row] = await query(sql, [id]);
  return row || null;
};

/**
 * Acknowledge an active alert
 */
export const acknowledgeAlert = async (id, userName = 'Administrator') => {
  await query(
    `UPDATE alerts
     SET status = 'Acknowledged', acknowledged_by = ?, acknowledged_at = NOW()
     WHERE id = ?;`,
    [userName, id]
  );
  return await getAlertById(id);
};

/**
 * Resolve an active or acknowledged alert with resolution remarks
 */
export const resolveAlert = async (id, userName = 'Administrator', remarks = '') => {
  await query(
    `UPDATE alerts
     SET status = 'Resolved', resolved_by = ?, resolved_at = NOW(), resolution_remarks = ?
     WHERE id = ?;`,
    [userName, remarks || 'Resolved by technician', id]
  );
  return await getAlertById(id);
};

/**
 * Evaluate recent telemetry and auto-generate non-duplicate alerts
 */
export const evaluateAndGenerateAlerts = async () => {
  const thresholds = await getAlertThresholds();
  
  if (String(thresholds.alert_generation_enabled) === 'false') {
    return { newAlertsCount: 0 };
  }

  const maxVoltage = parseFloat(thresholds.max_voltage) || 245.0;
  const minVoltage = parseFloat(thresholds.min_voltage) || 215.0;
  const maxCurrent = parseFloat(thresholds.max_current) || 120.0;
  const minPowerFactor = parseFloat(thresholds.min_power_factor) || 0.90;
  const highKw = parseFloat(thresholds.high_consumption_kw) || 35.0;
  const abnormalKwh = parseFloat(thresholds.abnormal_usage_kwh) || 12.0;

  // Get the latest reading per building/dept
  const latestReadings = await query(`
    SELECT e.*, b.building_name, d.department_name
    FROM energy_consumption e
    JOIN (
      SELECT building_id, department_id, MAX(reading_date) as max_date
      FROM energy_consumption
      WHERE reading_date <= NOW()
      GROUP BY building_id, department_id
    ) latest ON e.building_id = latest.building_id AND e.department_id = latest.department_id AND e.reading_date = latest.max_date
    LEFT JOIN buildings b ON e.building_id = b.id
    LEFT JOIN departments d ON e.department_id = d.id;
  `);

  let newAlertsCount = 0;

  for (const r of latestReadings) {
    let alertType = '';
    let severity = 'Medium';
    let title = '';
    let message = '';
    let triggerVal = '';
    let thresholdVal = '';

    const voltage = parseFloat(r.voltage);
    const current = parseFloat(r.current_a);
    const powerFactor = parseFloat(r.power_factor);
    const powerKw = parseFloat(r.power_kw);
    const energyKwh = parseFloat(r.energy_consumed_kwh);
    const bldgName = r.building_name || `Building #${r.building_id}`;
    const deptName = r.department_name || `Department #${r.department_id}`;

    if (voltage > maxVoltage) {
      alertType = 'High Voltage';
      severity = voltage > maxVoltage + 3 ? 'Critical' : 'High';
      title = `High Voltage Detected: ${bldgName}`;
      message = `Line voltage reached ${voltage.toFixed(1)} V at ${deptName}, exceeding threshold.`;
      triggerVal = `${voltage.toFixed(1)} V`;
      thresholdVal = `Max ${maxVoltage} V`;
    } else if (voltage < minVoltage) {
      alertType = 'Low Voltage';
      severity = voltage < minVoltage - 3 ? 'Critical' : 'High';
      title = `Low Voltage Drop: ${bldgName}`;
      message = `Line voltage dropped to ${voltage.toFixed(1)} V at ${deptName}, below threshold.`;
      triggerVal = `${voltage.toFixed(1)} V`;
      thresholdVal = `Min ${minVoltage} V`;
    } else if (current > maxCurrent) {
      alertType = 'Overload / High Current';
      severity = current > maxCurrent + 30 ? 'Critical' : 'High';
      title = `Current Overload: ${bldgName}`;
      message = `Feeder current reached ${current.toFixed(1)} A at ${deptName}, exceeding maximum limit.`;
      triggerVal = `${current.toFixed(1)} A`;
      thresholdVal = `Max ${maxCurrent} A`;
    } else if (powerFactor < minPowerFactor) {
      alertType = 'Low Power Factor';
      severity = powerFactor < minPowerFactor - 0.05 ? 'High' : 'Medium';
      title = `Low Power Factor: ${bldgName}`;
      message = `Power factor degraded to ${powerFactor.toFixed(2)} PF at ${deptName}.`;
      triggerVal = `${powerFactor.toFixed(2)} PF`;
      thresholdVal = `Min ${minPowerFactor} PF`;
    } else if (powerKw > highKw) {
      alertType = 'High Energy Consumption';
      severity = powerKw > highKw + 5 ? 'High' : 'Medium';
      title = `Peak Power Demand: ${bldgName}`;
      message = `Active power draw surged to ${powerKw.toFixed(1)} kW at ${deptName}.`;
      triggerVal = `${powerKw.toFixed(1)} kW`;
      thresholdVal = `Max ${highKw} kW`;
    } else if (energyKwh > abnormalKwh) {
      alertType = 'Abnormal Energy Usage';
      severity = 'Low';
      title = `Abnormal Energy Draw: ${bldgName}`;
      message = `Energy consumption spiked to ${energyKwh.toFixed(1)} kWh within 15 minutes at ${deptName}.`;
      triggerVal = `${energyKwh.toFixed(1)} kWh`;
      thresholdVal = `Max ${abnormalKwh} kWh`;
    }

    if (!alertType) continue;

    // Deduplication: Check if active/acknowledged alert exists within last 4 hours
    const [existing] = await query(
      `SELECT id FROM alerts
       WHERE building_id = ? AND department_id = ? AND alert_type = ?
         AND status IN ('Active', 'Acknowledged')
       LIMIT 1;`,
      [r.building_id, r.department_id, alertType]
    );

    if (existing) continue;

    const cleanType = alertType.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const alertId = `ALT_${r.id}_${cleanType}`.slice(0, 50);
    await query(
      `INSERT INTO alerts (
        id, title, message, severity, building_id, department_id, alert_type, status,
        trigger_value, threshold_value, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, NOW());`,
      [alertId, title, message, severity, r.building_id, r.department_id, alertType, triggerVal, thresholdVal]
    );
    newAlertsCount++;
  }

  return { newAlertsCount };
};

export default {
  getAlertThresholds,
  updateAlertThresholds,
  getPaginatedAlerts,
  getAlertSummaryKPIs,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  evaluateAndGenerateAlerts
};
