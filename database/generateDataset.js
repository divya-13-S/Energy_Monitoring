/**
 * generateDataset.js — Energy Telemetry Generator & Database Updater
 * Target Database: smart_energy_management
 * Generates 90 days of realistic institutional energy telemetry (~4,000+ rows)
 * covering all 8 buildings and 20 departments.
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'smart_energy_management',
};

const BUILDINGS = [
  { id: 1, code: 'IB-BLOCK', name: 'IB Block', type: 'Academic', basePower: 18.5 },
  { id: 2, code: 'AS-BLOCK', name: 'AS Block', type: 'Academic', basePower: 22.0 },
  { id: 3, code: 'MECH-BLOCK', name: 'Mechanical Block', type: 'Workshop', basePower: 26.0 },
  { id: 4, code: 'SUNFLOWER-BLOCK', name: 'Sunflower Block', type: 'Computing', basePower: 25.5 },
  { id: 5, code: 'RESEARCH-PARK', name: 'Research Park', type: 'Research', basePower: 11.0 },
  { id: 6, code: 'LIBRARY-BLOCK', name: 'Library', type: 'Library', basePower: 12.5 },
  { id: 7, code: 'GH-BLOCK', name: 'Girls Hostel', type: 'Residential', basePower: 16.0 },
  { id: 8, code: 'BH-BLOCK', name: 'Boys Hostel', type: 'Residential', basePower: 17.5 },
];

const DEPARTMENTS = [
  // IB Block (1)
  { id: 1, buildingId: 1, name: 'EEE Department', code: 'EEE', type: 'Lab', peakPower: 15.5 },
  { id: 2, buildingId: 1, name: 'EIE Department', code: 'EIE', type: 'Lab', peakPower: 12.0 },

  // AS Block (2)
  { id: 3, buildingId: 2, name: 'Textile Technology', code: 'Textile', type: 'Industrial', peakPower: 14.0 },
  { id: 4, buildingId: 2, name: 'ECE Department', code: 'ECE', type: 'Lab', peakPower: 18.0 },
  { id: 5, buildingId: 2, name: 'Civil Engineering', code: 'Civil', type: 'Lab', peakPower: 10.5 },

  // Mechanical Block (3)
  { id: 6, buildingId: 3, name: 'Mechanical Engineering', code: 'Mech', type: 'HeavyMachinery', peakPower: 24.0 },
  { id: 7, buildingId: 3, name: 'CT Department', code: 'CT', type: 'HeavyMachinery', peakPower: 16.0 },

  // Sunflower Block (4)
  { id: 8, buildingId: 4, name: 'CSE Department', code: 'CSE', type: 'ServerComputing', peakPower: 22.0 },
  { id: 9, buildingId: 4, name: 'IT Department', code: 'IT', type: 'ServerComputing', peakPower: 16.5 },

  // Research Park (5)
  { id: 10, buildingId: 5, name: 'Aeronautical Engg', code: 'Aeronautical', type: 'Research', peakPower: 12.0 },
  { id: 11, buildingId: 5, name: 'Central Administration', code: 'Central Admin', type: 'Office', peakPower: 8.5 },

  // Library (6)
  { id: 12, buildingId: 6, name: 'Library Facility', code: 'Central Library', type: 'Library', peakPower: 14.5 },

  // Girls Hostel (7)
  { id: 13, buildingId: 7, name: 'Yamuna Block', code: 'Yamuna', type: 'Hostel', peakPower: 7.5 },
  { id: 14, buildingId: 7, name: 'Ganga Block', code: 'Ganga', type: 'Hostel', peakPower: 7.0 },
  { id: 15, buildingId: 7, name: 'Narmadha Block', code: 'Narmadha', type: 'Hostel', peakPower: 6.8 },
  { id: 16, buildingId: 7, name: 'Cauvery Block', code: 'Cauvery', type: 'Hostel', peakPower: 7.2 },

  // Boys Hostel (8)
  { id: 17, buildingId: 8, name: 'Emerald Block', code: 'Emerald', type: 'Hostel', peakPower: 8.2 },
  { id: 18, buildingId: 8, name: 'Sapphire Block', code: 'Sapphire', type: 'Hostel', peakPower: 7.8 },
  { id: 19, buildingId: 8, name: 'Pearl Block', code: 'Pearl', type: 'Hostel', peakPower: 7.0 },
  { id: 20, buildingId: 8, name: 'Ruby Block', code: 'Ruby', type: 'Hostel', peakPower: 7.5 },
];

function generatePowerFactor() {
  const rand = Math.random();
  if (rand < 0.02) return parseFloat((0.84 + Math.random() * 0.06).toFixed(2)); // Abnormal drop
  return parseFloat((0.93 + Math.random() * 0.06).toFixed(2)); // Normal 0.93 - 0.99
}

function generateVoltage() {
  const rand = Math.random();
  if (rand < 0.015) return parseFloat((241.0 + Math.random() * 8.0).toFixed(1)); // Surge
  if (rand < 0.030) return parseFloat((212.0 + Math.random() * 7.0).toFixed(1)); // Drop
  return parseFloat((226.0 + Math.random() * 10.0).toFixed(1)); // Normal 226 - 236V
}

function calculatePowerKw(dept, dateObj) {
  const hour = dateObj.getHours();
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  let multiplier = 0.25;

  if (dept.type === 'Hostel') {
    if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 23)) {
      multiplier = 0.85 + Math.random() * 0.3;
    } else {
      multiplier = 0.35 + Math.random() * 0.2;
    }
    if (isWeekend) multiplier *= 1.15;
  } else if (dept.type === 'Library') {
    if (hour >= 8 && hour <= 21) {
      multiplier = 0.75 + Math.random() * 0.35;
    } else {
      multiplier = 0.2;
    }
  } else if (dept.type === 'Office') {
    if (hour >= 8 && hour <= 17 && !isWeekend) {
      multiplier = 0.8 + Math.random() * 0.3;
    } else {
      multiplier = 0.15;
    }
  } else if (dept.type === 'HeavyMachinery') {
    if (hour >= 9 && hour <= 16 && !isWeekend) {
      multiplier = 0.9 + Math.random() * 0.45; // High demand
    } else {
      multiplier = 0.2;
    }
  } else {
    // Academic & Server Computing
    if (hour >= 8 && hour <= 17 && !isWeekend) {
      multiplier = 0.75 + Math.random() * 0.35;
    } else {
      multiplier = 0.25;
    }
    if (isWeekend) multiplier *= 0.3;
  }

  let power = dept.peakPower * multiplier;
  if (Math.random() < 0.01) power *= 1.4; // Occasional load spike
  return parseFloat(Math.max(1.5, power).toFixed(2));
}

async function run() {
  console.log('⚡ Starting Energy Telemetry Dataset Generation...');
  let conn;
  try {
    conn = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to MySQL database:', DB_CONFIG.database);

    // Clear previous energy_consumption table records to re-seed cleanly
    await conn.query('DELETE FROM energy_consumption;');
    await conn.query('ALTER TABLE energy_consumption AUTO_INCREMENT = 1;');

    const now = new Date(); // Current date: 2026-09-08
    const readings = [];

    // Generate telemetry for 90 days backwards
    for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
      const currentDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      
      // Determine sample hours for this day
      let sampleHours = [];
      if (dayOffset <= 7) {
        // High frequency for recent 7 days: every 2 hours
        sampleHours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
      } else {
        // Daily key snapshots for historical days (3 readings per day per dept)
        sampleHours = [8, 13, 19];
      }

      for (const hour of sampleHours) {
        const readingTime = new Date(currentDate);
        readingTime.setHours(hour, 0, 0, 0);

        const mysqlTimestamp = readingTime.toISOString().slice(0, 19).replace('T', ' ');

        for (const dept of DEPARTMENTS) {
          const powerKw = calculatePowerKw(dept, readingTime);
          const intervalHours = dayOffset <= 7 ? 2 : 5;
          const kwhConsumed = parseFloat((powerKw * intervalHours * (0.9 + Math.random() * 0.2)).toFixed(2));
          const voltage = generateVoltage();
          const powerFactor = generatePowerFactor();
          const currentA = parseFloat(((powerKw * 1000) / (voltage * powerFactor)).toFixed(1));

          readings.push([
            dept.buildingId,
            dept.id,
            mysqlTimestamp,
            kwhConsumed,
            powerKw,
            voltage,
            currentA,
            powerFactor,
          ]);
        }
      }
    }

    console.log(`📊 Generated ${readings.length} energy telemetry records for 90 days! Inserting into MySQL...`);

    // Bulk insert readings in chunks of 500
    const chunkSize = 500;
    for (let i = 0; i < readings.length; i += chunkSize) {
      const chunk = readings.slice(i, i + chunkSize);
      await conn.query(
        `INSERT INTO energy_consumption (building_id, department_id, reading_date, energy_consumed_kwh, power_kw, voltage, current_a, power_factor) VALUES ?`,
        [chunk]
      );
    }

    console.log('✅ Bulk telemetry insert completed successfully!');

    // Update departments aggregated telemetry totals for today
    for (const dept of DEPARTMENTS) {
      const [latest] = await conn.query(
        `SELECT power_kw, energy_consumed_kwh FROM energy_consumption WHERE department_id = ? ORDER BY reading_date DESC LIMIT 1;`,
        [dept.id]
      );
      const [today] = await conn.query(
        `SELECT COALESCE(SUM(energy_consumed_kwh), 0) AS today_kwh FROM energy_consumption WHERE department_id = ? AND DATE(reading_date) = CURDATE();`,
        [dept.id]
      );
      const [monthly] = await conn.query(
        `SELECT COALESCE(SUM(energy_consumed_kwh), 0) AS monthly_kwh FROM energy_consumption WHERE department_id = ? AND reading_date >= CURDATE() - INTERVAL 30 DAY;`,
        [dept.id]
      );

      const curPower = (latest && latest[0] && parseFloat(latest[0].power_kw)) || dept.peakPower * 0.6;
      const todayKwh = (today && today[0] && parseFloat(today[0].today_kwh)) || parseFloat((curPower * 12).toFixed(1));
      const monthlyKwh = (monthly && monthly[0] && parseFloat(monthly[0].monthly_kwh)) || parseFloat((todayKwh * 28).toFixed(1));
      const estCost = Math.round(monthlyKwh * 0.28);
      const status = curPower > dept.peakPower * 0.95 ? 'High Load' : curPower > dept.peakPower * 0.7 ? 'Moderate' : 'Normal';

      await conn.query(
        `UPDATE departments SET today_energy_kwh = ?, monthly_energy_kwh = ?, estimated_cost = ?, current_power_kw = ?, overall_status = ? WHERE id = ?;`,
        [todayKwh, monthlyKwh, estCost, curPower, status, dept.id]
      );
    }

    // Update buildings aggregated telemetry totals
    for (const bldg of BUILDINGS) {
      const [sumDepts] = await conn.query(
        `SELECT SUM(today_energy_kwh) AS t_kwh, SUM(monthly_energy_kwh) AS m_kwh, SUM(estimated_cost) AS cost, SUM(current_power_kw) AS p_kw FROM departments WHERE building_id = ?;`,
        [bldg.id]
      );
      const row = sumDepts[0] || {};
      const tKwh = parseFloat(Number(row.t_kwh || 250.0).toFixed(1));
      const mKwh = Math.round(Number(row.m_kwh || 7500.0));
      const cost = Math.round(Number(row.cost || 2100.0));
      const pKw = parseFloat(Number(row.p_kw || bldg.basePower).toFixed(1));
      const bStatus = pKw > bldg.basePower * 1.1 ? 'High Load' : pKw > bldg.basePower * 0.85 ? 'Moderate' : 'Normal';

      await conn.query(
        `UPDATE buildings SET today_energy_kwh = ?, monthly_energy_kwh = ?, estimated_cost = ?, current_power_kw = ?, overall_status = ? WHERE id = ?;`,
        [tKwh, mKwh, cost, pKw, bStatus, bldg.id]
      );
    }

    console.log('✅ Buildings & Departments telemetry aggregations updated!');

    // Verification check
    const [bldgsCount] = await conn.query('SELECT COUNT(*) AS c FROM buildings;');
    const [deptsCount] = await conn.query('SELECT COUNT(*) AS c FROM departments;');
    const [teleCount] = await conn.query('SELECT COUNT(*) AS c FROM energy_consumption;');

    console.log(`\n====================================================`);
    console.log(`🎉 DATABASE VERIFICATION REPORT:`);
    console.log(`🏢 Buildings Count: ${bldgsCount[0].c}`);
    console.log(`🏫 Departments Count: ${deptsCount[0].c}`);
    console.log(`⚡ Telemetry Readings Count: ${teleCount[0].c}`);
    console.log(`====================================================\n`);

  } catch (err) {
    console.error('❌ Error generating energy dataset:', err);
  } finally {
    if (conn) await conn.end();
  }
}

run();
