import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'smart_energy_management',
  port: parseInt(process.env.DB_PORT) || 3306,
};

function formatLocalMysqlDatetime(dateObj) {
  if (!dateObj) return '2026-09-08 00:00:00';
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

async function dumpSql() {
  console.log('📦 Exporting database SQL scripts...');
  const conn = await mysql.createConnection(DB_CONFIG);

  const [bldgs] = await conn.query('SELECT * FROM buildings ORDER BY id ASC;');
  const [depts] = await conn.query('SELECT * FROM departments ORDER BY id ASC;');
  const [tele] = await conn.query('SELECT * FROM energy_consumption ORDER BY id ASC;');

  let header = `-- =============================================================================\n`;
  header += `-- AI-Based Smart Energy Consumption Monitoring and Optimization System\n`;
  header += `-- Target Database: smart_energy_management\n`;
  header += `-- Generated for MySQL Workbench / MySQL 8.0+\n`;
  header += `-- =============================================================================\n\n`;
  header += `CREATE DATABASE IF NOT EXISTS smart_energy_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
  header += `USE smart_energy_management;\n\n`;

  // Buildings table definition
  header += `-- 1. Table: buildings\n`;
  header += `CREATE TABLE IF NOT EXISTS buildings (\n`;
  header += `  id INT AUTO_INCREMENT PRIMARY KEY,\n`;
  header += `  building_code VARCHAR(50) NOT NULL UNIQUE,\n`;
  header += `  building_name VARCHAR(100) NOT NULL,\n`;
  header += `  description VARCHAR(255) NULL,\n`;
  header += `  today_energy_kwh DECIMAL(10, 2) NOT NULL DEFAULT 0.00,\n`;
  header += `  monthly_energy_kwh DECIMAL(10, 2) NOT NULL DEFAULT 0.00,\n`;
  header += `  estimated_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,\n`;
  header += `  current_power_kw DECIMAL(10, 2) NOT NULL DEFAULT 0.00,\n`;
  header += `  active_alerts_count INT NOT NULL DEFAULT 0,\n`;
  header += `  overall_status ENUM('Normal', 'Moderate', 'High Load') NOT NULL DEFAULT 'Normal',\n`;
  header += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
  header += `  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n`;
  header += `) ENGINE=InnoDB;\n\n`;

  // Departments table definition
  header += `-- 2. Table: departments\n`;
  header += `CREATE TABLE IF NOT EXISTS departments (\n`;
  header += `  id INT AUTO_INCREMENT PRIMARY KEY,\n`;
  header += `  building_id INT NOT NULL,\n`;
  header += `  department_name VARCHAR(100) NOT NULL,\n`;
  header += `  code VARCHAR(50) NOT NULL,\n`;
  header += `  today_energy_kwh DECIMAL(10, 2) NOT NULL DEFAULT 0.00,\n`;
  header += `  monthly_energy_kwh DECIMAL(10, 2) NOT NULL DEFAULT 0.00,\n`;
  header += `  estimated_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,\n`;
  header += `  current_power_kw DECIMAL(10, 2) NOT NULL DEFAULT 0.00,\n`;
  header += `  potential_saving_kwh DECIMAL(10, 2) NOT NULL DEFAULT 0.00,\n`;
  header += `  active_alerts_count INT NOT NULL DEFAULT 0,\n`;
  header += `  overall_status ENUM('Normal', 'Moderate', 'High Load') NOT NULL DEFAULT 'Normal',\n`;
  header += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
  header += `  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;
  header += `  CONSTRAINT fk_departments_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE\n`;
  header += `) ENGINE=InnoDB;\n\n`;

  // Energy consumption table definition
  header += `-- 3. Table: energy_consumption\n`;
  header += `CREATE TABLE IF NOT EXISTS energy_consumption (\n`;
  header += `  id INT AUTO_INCREMENT PRIMARY KEY,\n`;
  header += `  building_id INT NOT NULL,\n`;
  header += `  department_id INT NULL,\n`;
  header += `  reading_date DATETIME NOT NULL,\n`;
  header += `  energy_consumed_kwh DECIMAL(10, 2) NOT NULL,\n`;
  header += `  power_kw DECIMAL(10, 2) NOT NULL,\n`;
  header += `  voltage DECIMAL(6, 2) NOT NULL DEFAULT 230.00,\n`;
  header += `  current_a DECIMAL(6, 2) NOT NULL DEFAULT 0.00,\n`;
  header += `  power_factor DECIMAL(4, 2) NOT NULL DEFAULT 0.95,\n`;
  header += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
  header += `  CONSTRAINT fk_energy_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,\n`;
  header += `  CONSTRAINT fk_energy_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL\n`;
  header += `) ENGINE=InnoDB;\n\n`;

  // Seed Data Statements
  let dataSql = `-- Seed Buildings (8 Campus Blocks)\n`;
  dataSql += `INSERT INTO buildings (id, building_code, building_name, description, today_energy_kwh, monthly_energy_kwh, estimated_cost, current_power_kw, active_alerts_count, overall_status) VALUES\n`;
  dataSql += bldgs
    .map(
      (b) =>
        `(${b.id}, '${b.building_code}', '${b.building_name}', '${b.description}', ${b.today_energy_kwh}, ${b.monthly_energy_kwh}, ${b.estimated_cost}, ${b.current_power_kw}, ${b.active_alerts_count}, '${b.overall_status}')`
    )
    .join(',\n') + ` ON DUPLICATE KEY UPDATE today_energy_kwh=VALUES(today_energy_kwh);\n\n`;

  dataSql += `-- Seed Departments (20 Academic & Residential Units)\n`;
  dataSql += `INSERT INTO departments (id, building_id, department_name, code, today_energy_kwh, monthly_energy_kwh, estimated_cost, current_power_kw, potential_saving_kwh, active_alerts_count, overall_status) VALUES\n`;
  dataSql += depts
    .map(
      (d) =>
        `(${d.id}, ${d.building_id}, '${d.department_name}', '${d.code}', ${d.today_energy_kwh}, ${d.monthly_energy_kwh}, ${d.estimated_cost}, ${d.current_power_kw}, ${d.potential_saving_kwh}, ${d.active_alerts_count}, '${d.overall_status}')`
    )
    .join(',\n') + ` ON DUPLICATE KEY UPDATE today_energy_kwh=VALUES(today_energy_kwh);\n\n`;

  const fullMasterContent = header + dataSql;
  const targetPathMaster = path.resolve('../database/smart_energy_management.sql');
  fs.writeFileSync(targetPathMaster, fullMasterContent);
  console.log(`✅ Master SQL file saved to: ${targetPathMaster}`);

  // Telemetry dataset standalone file
  let datasetSql = `-- Standalone 15-Minute Energy Telemetry Dataset (172,800 Rows)\n`;
  datasetSql += `-- Generated for database: smart_energy_management\n\n`;
  datasetSql += `USE smart_energy_management;\n\n`;
  datasetSql += `INSERT INTO energy_consumption (building_id, department_id, reading_date, energy_consumed_kwh, power_kw, voltage, current_a, power_factor) VALUES\n`;
  datasetSql += tele
    .map((t) => {
      const dStr = formatLocalMysqlDatetime(t.reading_date);
      return `(${t.building_id}, ${t.department_id}, '${dStr}', ${t.energy_consumed_kwh}, ${t.power_kw}, ${t.voltage}, ${t.current_a}, ${t.power_factor})`;
    })
    .join(',\n') + `;\n`;

  const targetPathDataset = path.resolve('../database/energy_consumption_dataset.sql');
  fs.writeFileSync(targetPathDataset, datasetSql);
  console.log(`✅ Standalone dataset saved to: ${targetPathDataset} (${tele.length} rows)`);

  await conn.end();
}

dumpSql();
