/**
 * services/reportsService.js — Administrator Reports Aggregation & Export Service
 * AI-Based Smart Energy Consumption Monitoring & Optimization System
 */

import { query } from '../config/db.js';
import PDFDocument from 'pdfkit';

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
 * Format Date object into local ISO string (YYYY-MM-DDTHH:mm:ss)
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
 * Build SQL time filter clause based on period/dates
 */
const buildTimeWhereClause = (period = 'today', startDate, endDate, tablePrefix = 'e') => {
  const p = tablePrefix ? `${tablePrefix}.` : '';
  let clause = `WHERE ${p}reading_date <= NOW()`;
  const params = [];

  if (period === 'today') {
    clause += ` AND DATE(${p}reading_date) = ${getTodayTargetDateSql()}`;
  } else if (period === 'week' || period === '7d') {
    clause += ` AND ${p}reading_date >= (${getTodayTargetDateSql()} - INTERVAL 7 DAY)`;
  } else if (period === 'month' || period === '30d') {
    clause += ` AND ${p}reading_date >= (${getTodayTargetDateSql()} - INTERVAL 30 DAY)`;
  } else if (period === 'custom' && startDate && endDate) {
    clause += ` AND DATE(${p}reading_date) BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  } else if (period === 'custom' && startDate) {
    clause += ` AND DATE(${p}reading_date) >= ?`;
    params.push(startDate);
  }

  return { clause, params };
};

/**
 * GET Report Summary KPIs
 */
export const getReportSummary = async ({ period = 'today', startDate, endDate, buildingId, departmentId }) => {
  const { clause, params } = buildTimeWhereClause(period, startDate, endDate, '');

  if (buildingId && buildingId !== 'all') {
    clause.includes('WHERE') ? (clause += ' AND building_id = ?') : (clause += ' WHERE building_id = ?');
    params.push(buildingId);
  }
  if (departmentId && departmentId !== 'all') {
    clause += ' AND department_id = ?';
    params.push(departmentId);
  }

  // 1. Total kWh & Average Power Factor
  const energySql = `
    SELECT 
      COALESCE(SUM(energy_consumed_kwh), 0) AS total_kwh,
      COALESCE(AVG(power_factor), 0.95) AS avg_pf,
      COALESCE(AVG(power_kw), 0) AS avg_kw
    FROM energy_consumption
    ${clause};
  `;
  const energyRows = await query(energySql, params);
  const totalKwh = parseFloat(Number(energyRows[0]?.total_kwh || 0).toFixed(1));
  const avgPf = parseFloat(Number(energyRows[0]?.avg_pf || 0.95).toFixed(2));

  const tariff = await getElectricityTariff();
  const totalCost = Math.round(totalKwh * tariff);

  // 2. Rule-based Savings estimation for period
  const savingKwh = parseFloat((totalKwh * (avgPf < 0.92 ? 0.14 : 0.11)).toFixed(1));
  const savingCost = Math.round(savingKwh * tariff);

  return {
    period,
    tariff: tariff,
    totalEnergyKwh: totalKwh,
    totalCost: totalCost,
    energySavingKwh: savingKwh,
    costSaving: savingCost,
    averagePowerFactor: avgPf,
  };
};

/**
 * GET Energy Consumption Trend Chart Data
 */
export const getReportTrend = async ({ period = 'today', startDate, endDate, buildingId, departmentId, reportType }) => {
  const { clause, params } = buildTimeWhereClause(period, startDate, endDate, 'e');

  if (buildingId && buildingId !== 'all') {
    clause += ' AND e.building_id = ?';
    params.push(buildingId);
  }
  if (departmentId && departmentId !== 'all') {
    clause += ' AND e.department_id = ?';
    params.push(departmentId);
  }

  let timeFormatSql = "%Y-%m-%d %H:00:00";
  if (period === 'today') {
    timeFormatSql = "%Y-%m-%d %H:%i:00";
  } else if (period === 'week' || period === 'month' || period === 'custom') {
    timeFormatSql = "%Y-%m-%d";
  }

  const sql = `
    SELECT 
      DATE_FORMAT(e.reading_date, '${timeFormatSql}') AS time_slot,
      SUM(e.energy_consumed_kwh) AS actual_kwh,
      SUM(e.power_kw) AS actual_power_kw,
      AVG(e.power_factor) AS avg_pf
    FROM energy_consumption e
    ${clause}
    GROUP BY time_slot
    ORDER BY time_slot ASC
    LIMIT 120;
  `;

  const tariff = await getElectricityTariff();
  const rows = await query(sql, params);

  return rows.map((row) => {
    const kwh = parseFloat(Number(row.actual_kwh || 0).toFixed(2));
    const cost = Math.round(kwh * tariff);
    const savingsKwh = parseFloat((kwh * 0.12).toFixed(2));
    const savingsCost = Math.round(savingsKwh * tariff);

    let displayTime = row.time_slot;
    const d = new Date(row.time_slot);
    if (!isNaN(d.getTime())) {
      displayTime = (period === 'week' || period === 'month' || period === 'custom')
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    return {
      time: displayTime,
      timestamp: row.time_slot,
      energyKwh: kwh,
      cost: cost,
      powerKw: parseFloat(Number(row.actual_power_kw || 0).toFixed(1)),
      savingsKwh: savingsKwh,
      savingsCost: savingsCost,
      powerFactor: parseFloat(Number(row.avg_pf || 0.95).toFixed(2)),
    };
  });
};

/**
 * GET Building-Wise Consumption Report
 */
export const getReportBuildings = async ({ period = 'today', startDate, endDate, buildingId, departmentId }) => {
  const { clause, params } = buildTimeWhereClause(period, startDate, endDate, 'e');

  if (buildingId && buildingId !== 'all') {
    clause += ' AND e.building_id = ?';
    params.push(buildingId);
  }
  if (departmentId && departmentId !== 'all') {
    clause += ' AND e.department_id = ?';
    params.push(departmentId);
  }

  const sql = `
    SELECT 
      b.id,
      b.building_code,
      b.building_name,
      b.description,
      COALESCE(SUM(e.energy_consumed_kwh), 0) AS total_kwh,
      COALESCE(AVG(e.energy_consumed_kwh) * 0.85, 0) AS avg_kwh,
      COALESCE(AVG(e.power_kw), 0) AS avg_power_kw,
      b.overall_status
    FROM buildings b
    LEFT JOIN energy_consumption e ON b.id = e.building_id
    ${clause}
    GROUP BY b.id, b.building_code, b.building_name, b.description, b.overall_status
    ORDER BY total_kwh DESC;
  `;

  const tariff = await getElectricityTariff();
  const rows = await query(sql, params);

  return rows.map((r) => {
    const kwh = parseFloat(Number(r.total_kwh).toFixed(1));
    const avgKwh = parseFloat(Number(r.avg_kwh).toFixed(1));
    const cost = Math.round(kwh * tariff);

    return {
      id: r.id,
      code: r.building_code,
      name: r.building_name,
      description: r.description,
      totalKwh: kwh,
      avgKwh: avgKwh,
      avgPowerKw: parseFloat(Number(r.avg_power_kw).toFixed(1)),
      estimatedCost: cost,
      status: r.overall_status || 'Normal',
    };
  });
};

/**
 * GET Cost Analysis Report
 */
export const getReportCostAnalysis = async ({ period = 'today', startDate, endDate, buildingId, departmentId }) => {
  const summary = await getReportSummary({ period, startDate, endDate, buildingId, departmentId });
  const buildings = await getReportBuildings({ period, startDate, endDate, buildingId, departmentId });
  const tariff = await getElectricityTariff();

  const highestBuilding = buildings.length > 0 ? buildings[0] : null;

  return {
    period,
    tariff: tariff,
    totalEnergyKwh: summary.totalEnergyKwh,
    totalCost: summary.totalCost,
    highestCostBuilding: highestBuilding
      ? {
          name: highestBuilding.name,
          code: highestBuilding.code,
          cost: highestBuilding.estimatedCost,
          kwh: highestBuilding.totalKwh,
        }
      : null,
    buildingCosts: buildings.map((b) => ({
      name: b.name,
      code: b.code,
      kwh: b.totalKwh,
      cost: b.estimatedCost,
    })),
  };
};

/**
 * GET Energy Savings Summary Report
 */
export const getReportSavingsSummary = async ({ period = 'today', startDate, endDate, buildingId, departmentId }) => {
  const summary = await getReportSummary({ period, startDate, endDate, buildingId, departmentId });
  const buildings = await getReportBuildings({ period, startDate, endDate, buildingId, departmentId });
  const tariff = await getElectricityTariff();

  const topOpportunities = buildings
    .map((b) => ({
      name: b.name,
      code: b.code,
      currentKwh: b.totalKwh,
      potentialSavingKwh: parseFloat((b.totalKwh * 0.12).toFixed(1)),
      potentialCostSaving: Math.round(b.totalKwh * 0.12 * tariff),
    }))
    .sort((a, b) => b.potentialSavingKwh - a.potentialSavingKwh)
    .slice(0, 5);

  return {
    period,
    tariff: tariff,
    totalEnergyKwh: summary.totalEnergyKwh,
    potentialSavingKwh: summary.energySavingKwh,
    potentialCostSaving: summary.costSaving,
    topOpportunities,
  };
};

/**
 * GET Alerts Summary Report
 */
export const getReportAlertsSummary = async ({ period = 'today', startDate, endDate, buildingId, departmentId }) => {
  let sql = `
    SELECT 
      a.id,
      a.title,
      a.message,
      a.severity,
      a.status,
      a.created_at,
      b.building_name,
      COALESCE(d.department_name, 'Main Panel') AS department_name
    FROM alerts a
    LEFT JOIN buildings b ON a.building_id = b.id
    LEFT JOIN departments d ON a.department_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (buildingId && buildingId !== 'all') {
    sql += ' AND a.building_id = ?';
    params.push(buildingId);
  }
  if (departmentId && departmentId !== 'all') {
    sql += ' AND a.department_id = ?';
    params.push(departmentId);
  }

  sql += ' ORDER BY a.created_at DESC;';

  const rows = await query(sql, params);

  const severityCounts = { danger: 0, warning: 0, info: 0, success: 0 };
  const statusCounts = { Active: 0, Acknowledged: 0, Resolved: 0 };

  rows.forEach((r) => {
    const sev = (r.severity || 'warning').toLowerCase();
    if (severityCounts[sev] !== undefined) severityCounts[sev]++;
    const st = r.status || 'Active';
    if (statusCounts[st] !== undefined) statusCounts[st]++;
  });

  return {
    totalAlerts: rows.length,
    severity: severityCounts,
    status: statusCounts,
    alerts: rows.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      severity: a.severity,
      status: a.status,
      buildingName: a.building_name || 'Campus',
      departmentName: a.department_name,
      createdAt: formatLocalIsoString(a.created_at),
    })),
  };
};

/**
 * GET Paginated Detailed Report Logs
 */
export const getReportDetails = async ({
  period = 'today',
  startDate,
  endDate,
  buildingId,
  departmentId,
  reportType = 'energy',
  page = 1,
  limit = 10,
}) => {
  const { clause, params } = buildTimeWhereClause(period, startDate, endDate, 'e');

  if (buildingId && buildingId !== 'all') {
    clause += ' AND e.building_id = ?';
    params.push(buildingId);
  }
  if (departmentId && departmentId !== 'all') {
    clause += ' AND e.department_id = ?';
    params.push(departmentId);
  }

  const p = Math.max(1, parseInt(page, 10));
  const l = Math.max(1, parseInt(limit, 10));
  const offset = (p - 1) * l;

  // 1. Total records count
  const countSql = `SELECT COUNT(*) AS total FROM energy_consumption e ${clause};`;
  const countRows = await query(countSql, params);
  const totalRecords = parseInt(countRows[0]?.total || 0, 10);
  const totalPages = Math.ceil(totalRecords / l) || 1;

  // 2. Paginated rows
  const dataSql = `
    SELECT 
      e.id,
      e.reading_date,
      e.energy_consumed_kwh,
      e.power_kw,
      e.voltage,
      e.current_a,
      e.power_factor,
      50.00 AS frequency_hz,
      b.building_name,
      b.building_code,
      COALESCE(d.department_name, 'General Facility') AS department_name,
      CASE 
        WHEN e.power_kw > 25.0 OR e.voltage > 240.0 OR e.voltage < 220.0 OR e.power_factor < 0.91 THEN 'Critical'
        WHEN e.power_kw > 18.0 OR e.power_factor < 0.94 THEN 'Warning'
        ELSE 'Normal'
      END AS status
    FROM energy_consumption e
    JOIN buildings b ON e.building_id = b.id
    LEFT JOIN departments d ON e.department_id = d.id
    ${clause}
    ORDER BY e.reading_date DESC
    LIMIT ? OFFSET ?;
  `;

  const queryParams = [...params, l, offset];
  const tariff = await getElectricityTariff();
  const rows = await query(dataSql, queryParams);

  const records = rows.map((r) => ({
    id: r.id,
    readingDate: formatLocalIsoString(r.reading_date),
    buildingName: r.building_name,
    buildingCode: r.building_code,
    departmentName: r.department_name,
    energyKwh: parseFloat(Number(r.energy_consumed_kwh).toFixed(2)),
    estimatedCost: Math.round(Number(r.energy_consumed_kwh) * tariff),
    powerKw: parseFloat(Number(r.power_kw).toFixed(2)),
    voltage: parseFloat(Number(r.voltage).toFixed(1)),
    currentA: parseFloat(Number(r.current_a).toFixed(1)),
    frequencyHz: 50.0,
    powerFactor: parseFloat(Number(r.power_factor).toFixed(2)),
    status: r.status,
  }));

  return {
    records,
    totalRecords,
    page: p,
    limit: l,
    totalPages,
  };
};

/**
 * Generate CSV Report
 */
export const generateCsvReport = async (filterParams) => {
  const details = await getReportDetails({ ...filterParams, limit: 2000 });
  const records = details.records || [];

  let csv = 'ID,Date & Time,Building,Department,Energy Consumed (kWh),Estimated Cost (INR),Power Demand (kW),Voltage (V),Current (A),Power Factor,Status\n';

  records.forEach((r) => {
    csv += `"${r.id}","${r.readingDate}","${r.buildingName}","${r.departmentName}",${r.energyKwh},${r.estimatedCost},${r.powerKw},${r.voltage},${r.currentA},${r.powerFactor},"${r.status}"\n`;
  });

  return csv;
};

/**
 * Generate PDF Report Document Buffer
 */
export const generatePdfReport = async (filterParams, res) => {
  const summary = await getReportSummary(filterParams);
  const buildings = await getReportBuildings(filterParams);
  const details = await getReportDetails({ ...filterParams, limit: 30 });
  const tariff = await getElectricityTariff();

  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Smart_Energy_Report_${Date.now()}.pdf"`);

  doc.pipe(res);

  // Title & Header
  doc.fillColor('#0f172a').fontSize(20).text('AI-Based Smart Energy Management System', { align: 'center' });
  doc.fontSize(14).fillColor('#2563eb').text('INSTITUTIONAL HISTORICAL ENERGY PERFORMANCE REPORT', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor('#64748b').text(`Generated: ${new Date().toLocaleString()} | Tariff: INR ${tariff}/kWh | Period: ${filterParams.period || 'Today'}`, { align: 'center' });
  doc.moveDown(1);

  // Summary Metrics Section
  doc.fillColor('#0f172a').fontSize(14).text('1. EXECUTIVE SUMMARY', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#334155');
  doc.text(`Total Energy Consumed: ${summary.totalEnergyKwh.toLocaleString('en-IN')} kWh`);
  doc.text(`Estimated Electricity Cost: INR ${summary.totalCost.toLocaleString('en-IN')}`);
  doc.text(`Potential Energy Savings: ${summary.energySavingKwh.toLocaleString('en-IN')} kWh`);
  doc.text(`Potential Cost Savings: INR ${summary.costSaving.toLocaleString('en-IN')}`);
  doc.moveDown(1.5);

  // Building Performance Table
  doc.fillColor('#0f172a').fontSize(14).text('2. BUILDING CONSUMPTION BREAKDOWN', { underline: true });
  doc.moveDown(0.5);

  buildings.slice(0, 8).forEach((b, idx) => {
    doc.fontSize(10).fillColor('#1e293b').text(`${idx + 1}. ${b.name} (${b.code}): ${b.totalKwh.toLocaleString('en-IN')} kWh | INR ${b.estimatedCost.toLocaleString('en-IN')} | Status: ${b.status}`);
  });

  doc.moveDown(1.5);

  // Recent Detailed Logs Table
  doc.fillColor('#0f172a').fontSize(14).text('3. RECENT TELEMETRY LOGS (SAMPLE)', { underline: true });
  doc.moveDown(0.5);

  details.records.slice(0, 10).forEach((r, idx) => {
    doc.fontSize(9).fillColor('#475569').text(`[${r.readingDate}] ${r.buildingName} - ${r.departmentName} | ${r.energyKwh} kWh | ${r.powerKw} kW | ${r.voltage} V | PF: ${r.powerFactor}`);
  });

  doc.end();
};

export default {
  ELECTRICITY_TARIFF,
  getReportSummary,
  getReportTrend,
  getReportBuildings,
  getReportCostAnalysis,
  getReportSavingsSummary,
  getReportAlertsSummary,
  getReportDetails,
  generateCsvReport,
  generatePdfReport,
};
