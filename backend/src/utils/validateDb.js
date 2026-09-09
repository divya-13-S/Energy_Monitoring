import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'smart_energy_management',
  port: parseInt(process.env.DB_PORT) || 3306,
};

async function validate() {
  console.log('=== DATABASE VALIDATION VERIFICATION ===');
  const conn = await mysql.createConnection(DB_CONFIG);

  const [db] = await conn.query('SELECT DATABASE() AS db_name;');
  console.log('1. Database Name:', db[0].db_name);

  const [bldgs] = await conn.query('SELECT COUNT(*) AS c FROM buildings;');
  console.log('2. Buildings Count:', bldgs[0].c);

  const [depts] = await conn.query('SELECT COUNT(*) AS c FROM departments;');
  console.log('3. Departments Count:', depts[0].c);

  const [tele] = await conn.query('SELECT COUNT(*) AS c FROM energy_consumption;');
  console.log('4. Total Telemetry Records:', tele[0].c);

  const [today] = await conn.query('SELECT COUNT(*) AS c FROM energy_consumption WHERE DATE(reading_date) = "2026-09-08";');
  console.log('5. Today Telemetry Records (08 Sep 2026):', today[0].c);

  const [range] = await conn.query('SELECT MIN(reading_date) AS min_d, MAX(reading_date) AS max_d FROM energy_consumption;');
  console.log('6. Historical Date Range:', range[0].min_d, 'to', range[0].max_d);

  const [mins] = await conn.query('SELECT DISTINCT MINUTE(reading_date) AS m FROM energy_consumption ORDER BY m;');
  console.log('7. Minute Intervals:', mins.map((r) => r.m).join(', '));

  const [bldgCoverage] = await conn.query('SELECT COUNT(DISTINCT building_id) AS c FROM energy_consumption;');
  console.log('8. Buildings with Telemetry:', bldgCoverage[0].c, 'of 8');

  const [deptCoverage] = await conn.query('SELECT COUNT(DISTINCT department_id) AS c FROM energy_consumption;');
  console.log('9. Departments with Telemetry:', deptCoverage[0].c, 'of 20');

  const [orphans] = await conn.query(
    'SELECT COUNT(*) AS c FROM energy_consumption WHERE building_id NOT IN (SELECT id FROM buildings) OR (department_id IS NOT NULL AND department_id NOT IN (SELECT id FROM departments));'
  );
  console.log('10. Orphan Telemetry Records:', orphans[0].c);

  console.log('========================================');
  await conn.end();
}

validate();
