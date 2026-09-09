/**
 * services/sensorService.js — Database service layer for Sensor Management
 * Target Database: smart_energy_management
 */

import { query } from '../config/db.js';

/**
 * Get paginated list of sensors with optional filters
 */
export const getPaginatedSensors = async ({
  search = '',
  buildingId = '',
  departmentId = '',
  parameter = '',
  status = '',
  page = 1,
  limit = 10,
}) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const offset = (pageNum - 1) * limitNum;

  let whereClauses = [];
  let queryParams = [];

  if (search) {
    whereClauses.push(
      '(s.sensor_code LIKE ? OR s.sensor_name LIKE ? OR s.room_location LIKE ?)'
    );
    const searchPattern = `%${search.trim()}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }

  if (buildingId) {
    whereClauses.push('s.building_id = ?');
    queryParams.push(parseInt(buildingId, 10));
  }

  if (departmentId) {
    whereClauses.push('s.department_id = ?');
    queryParams.push(parseInt(departmentId, 10));
  }

  if (parameter) {
    whereClauses.push('s.parameter = ?');
    queryParams.push(parameter.trim());
  }

  if (status) {
    whereClauses.push('s.status = ?');
    queryParams.push(status.trim());
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total count matching filters
  const countSql = `
    SELECT COUNT(*) as total
    FROM sensors s
    ${whereSql};
  `;
  const countResult = await query(countSql, queryParams);
  const totalItems = countResult[0]?.total || 0;
  const totalPages = Math.ceil(totalItems / limitNum) || 1;

  // Get paginated sensor records
  const dataSql = `
    SELECT 
      s.id,
      s.sensor_code,
      s.sensor_name,
      s.building_id,
      b.building_name,
      s.department_id,
      d.department_name,
      s.parameter,
      s.room_location,
      s.status,
      s.last_ping,
      s.created_at,
      s.updated_at
    FROM sensors s
    JOIN buildings b ON s.building_id = b.id
    JOIN departments d ON s.department_id = d.id
    ${whereSql}
    ORDER BY s.id DESC
    LIMIT ${limitNum} OFFSET ${offset};
  `;

  const sensors = await query(dataSql, queryParams);

  return {
    sensors,
    pagination: {
      totalItems,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
    },
  };
};

/**
 * Get summary KPI metrics for sensor management
 */
export const getSensorSummaryKPIs = async () => {
  const sql = `
    SELECT 
      COUNT(*) as totalSensors,
      SUM(CASE WHEN status = 'Online' THEN 1 ELSE 0 END) as onlineSensors,
      SUM(CASE WHEN status = 'Offline' THEN 1 ELSE 0 END) as offlineSensors,
      SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenanceSensors
    FROM sensors;
  `;

  const result = await query(sql);
  const row = result[0] || {};

  return {
    totalSensors: Number(row.totalSensors || 0),
    onlineSensors: Number(row.onlineSensors || 0),
    offlineSensors: Number(row.offlineSensors || 0),
    maintenanceSensors: Number(row.maintenanceSensors || 0),
  };
};

/**
 * Get single sensor by ID
 */
export const getSensorById = async (id) => {
  const sql = `
    SELECT 
      s.id,
      s.sensor_code,
      s.sensor_name,
      s.building_id,
      b.building_name,
      s.department_id,
      d.department_name,
      s.parameter,
      s.room_location,
      s.status,
      s.last_ping,
      s.created_at,
      s.updated_at
    FROM sensors s
    JOIN buildings b ON s.building_id = b.id
    JOIN departments d ON s.department_id = d.id
    WHERE s.id = ?
    LIMIT 1;
  `;

  const rows = await query(sql, [id]);
  return rows[0] || null;
};

/**
 * Create new sensor entry
 */
export const createSensor = async (sensorData) => {
  const {
    sensor_code,
    sensor_name,
    building_id,
    department_id,
    parameter,
    room_location,
    status = 'Online',
  } = sensorData;

  // Check unique sensor code
  const existing = await query('SELECT id FROM sensors WHERE sensor_code = ? LIMIT 1;', [
    sensor_code.trim(),
  ]);
  if (existing && existing.length > 0) {
    const error = new Error(`Sensor code "${sensor_code}" is already in use.`);
    error.statusCode = 400;
    throw error;
  }

  const insertSql = `
    INSERT INTO sensors 
      (sensor_code, sensor_name, building_id, department_id, parameter, room_location, status, last_ping)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW());
  `;

  const result = await query(insertSql, [
    sensor_code.trim(),
    sensor_name.trim(),
    building_id,
    department_id,
    parameter.trim(),
    room_location.trim(),
    status,
  ]);

  return getSensorById(result.insertId);
};

/**
 * Update existing sensor
 */
export const updateSensor = async (id, sensorData) => {
  const sensor = await getSensorById(id);
  if (!sensor) {
    const error = new Error(`Sensor with ID ${id} not found.`);
    error.statusCode = 404;
    throw error;
  }

  const {
    sensor_name,
    building_id,
    department_id,
    parameter,
    room_location,
    status,
  } = sensorData;

  const updateSql = `
    UPDATE sensors
    SET 
      sensor_name = ?,
      building_id = ?,
      department_id = ?,
      parameter = ?,
      room_location = ?,
      status = ?,
      updated_at = NOW()
    WHERE id = ?;
  `;

  await query(updateSql, [
    sensor_name ? sensor_name.trim() : sensor.sensor_name,
    building_id || sensor.building_id,
    department_id || sensor.department_id,
    parameter ? parameter.trim() : sensor.parameter,
    room_location ? room_location.trim() : sensor.room_location,
    status || sensor.status,
    id,
  ]);

  return getSensorById(id);
};

/**
 * Toggle/update sensor operational status
 */
export const toggleSensorStatus = async (id, newStatus) => {
  const sensor = await getSensorById(id);
  if (!sensor) {
    const error = new Error(`Sensor with ID ${id} not found.`);
    error.statusCode = 404;
    throw error;
  }

  const allowedStatuses = ['Online', 'Offline', 'Maintenance'];
  if (!allowedStatuses.includes(newStatus)) {
    const error = new Error(`Invalid status "${newStatus}". Must be Online, Offline, or Maintenance.`);
    error.statusCode = 400;
    throw error;
  }

  const updateSql = `
    UPDATE sensors
    SET status = ?, last_ping = NOW(), updated_at = NOW()
    WHERE id = ?;
  `;

  await query(updateSql, [newStatus, id]);
  return getSensorById(id);
};

/**
 * Get recent telemetry reading history for a sensor's building & department
 */
export const getSensorTelemetryHistory = async (sensorId, limit = 20) => {
  const sensor = await getSensorById(sensorId);
  if (!sensor) {
    const error = new Error(`Sensor with ID ${sensorId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  const limitNum = parseInt(limit, 10) || 20;

  const sql = `
    SELECT 
      id,
      reading_date,
      energy_consumed_kwh,
      power_kw,
      voltage,
      current_a,
      power_factor
    FROM energy_consumption
    WHERE building_id = ? AND department_id = ?
    ORDER BY reading_date DESC
    LIMIT ${limitNum};
  `;

  const readings = await query(sql, [sensor.building_id, sensor.department_id]);

  return {
    sensor,
    readings,
  };
};
