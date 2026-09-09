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

async function auditDatabase() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('====================================================');
  console.log('          COMPREHENSIVE MYSQL DATABASE AUDIT        ');
  console.log('====================================================\n');

  // 1. Table List & Counts
  const [tables] = await conn.query("SHOW TABLES;");
  const tableKey = Object.keys(tables[0])[0];
  console.log('--- 1. TABLE SUMMARY AND RECORD COUNTS ---');
  for (const t of tables) {
    const tableName = t[tableKey];
    const [countRes] = await conn.query(`SELECT COUNT(*) AS cnt FROM \`${tableName}\``);
    console.log(`Table: ${tableName.padEnd(30)} | Records: ${countRes[0].cnt}`);
  }
  console.log('');

  // 2. Foreign Key Constraints
  console.log('--- 2. FOREIGN KEY CONSTRAINTS ---');
  const [fks] = await conn.query(`
    SELECT 
      TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM
      INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      REFERENCED_TABLE_SCHEMA = '${DB_CONFIG.database}'
      AND REFERENCED_TABLE_NAME IS NOT NULL;
  `);
  if (fks.length === 0) {
    console.log('No Foreign Keys found in INFORMATION_SCHEMA for schema!');
  } else {
    for (const fk of fks) {
      console.log(`[FK] ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME} (${fk.CONSTRAINT_NAME})`);
    }
  }
  console.log('');

  // 3. Schema Structure details for each table
  console.log('--- 3. TABLE COLUMNS & DATA TYPES ---');
  for (const t of tables) {
    const tableName = t[tableKey];
    const [cols] = await conn.query(`DESCRIBE \`${tableName}\``);
    console.log(`\n>>> ${tableName.toUpperCase()} (${cols.length} columns)`);
    cols.forEach(c => {
      console.log(`  ${c.Field.padEnd(25)} ${c.Type.padEnd(20)} Null:${c.Null.padEnd(4)} Key:${c.Key.padEnd(4)} Default:${c.Default}`);
    });
  }
  console.log('');

  // 4. Orphan Check
  console.log('--- 4. DATA INTEGRITY & ORPHAN CHECKS ---');
  
  // Sensors -> Buildings & Departments
  const [sensOrphansB] = await conn.query(`SELECT COUNT(*) AS c FROM sensors WHERE building_id NOT IN (SELECT id FROM buildings);`);
  const [sensOrphansD] = await conn.query(`SELECT COUNT(*) AS c FROM sensors WHERE department_id IS NOT NULL AND department_id NOT IN (SELECT id FROM departments);`);
  console.log(`Sensors with invalid building_id: ${sensOrphansB[0].c}`);
  console.log(`Sensors with invalid department_id: ${sensOrphansD[0].c}`);

  // Telemetry -> Buildings, Depts
  const [telemOrphansB] = await conn.query(`SELECT COUNT(*) AS c FROM energy_consumption WHERE building_id NOT IN (SELECT id FROM buildings);`);
  const [telemOrphansD] = await conn.query(`SELECT COUNT(*) AS c FROM energy_consumption WHERE department_id IS NOT NULL AND department_id NOT IN (SELECT id FROM departments);`);
  console.log(`Telemetry with invalid building_id: ${telemOrphansB[0].c}`);
  console.log(`Telemetry with invalid department_id: ${telemOrphansD[0].c}`);

  // Alerts -> Buildings, Depts, Sensors
  const [alertOrphansB] = await conn.query(`SELECT COUNT(*) AS c FROM alerts WHERE building_id IS NOT NULL AND building_id NOT IN (SELECT id FROM buildings);`);
  const [alertOrphansD] = await conn.query(`SELECT COUNT(*) AS c FROM alerts WHERE department_id IS NOT NULL AND department_id NOT IN (SELECT id FROM departments);`);
  const [alertOrphansS] = await conn.query(`SELECT COUNT(*) AS c FROM alerts WHERE sensor_id IS NOT NULL AND sensor_id NOT IN (SELECT id FROM sensors);`);
  console.log(`Alerts with invalid building_id: ${alertOrphansB[0].c}`);
  console.log(`Alerts with invalid department_id: ${alertOrphansD[0].c}`);
  console.log(`Alerts with invalid sensor_id: ${alertOrphansS[0].c}`);

  // Optimization Recommendations -> Buildings, Depts
  const [optOrphansB] = await conn.query(`SELECT COUNT(*) AS c FROM optimization_recommendations WHERE building_id IS NOT NULL AND building_id NOT IN (SELECT id FROM buildings);`);
  const [optOrphansD] = await conn.query(`SELECT COUNT(*) AS c FROM optimization_recommendations WHERE department_id IS NOT NULL AND department_id NOT IN (SELECT id FROM departments);`);
  console.log(`Optimization recommendations with invalid building_id: ${optOrphansB[0].c}`);
  console.log(`Optimization recommendations with invalid department_id: ${optOrphansD[0].c}`);

  // Users -> Departments
  const [userOrphansD] = await conn.query(`SELECT COUNT(*) AS c FROM users WHERE department_id IS NOT NULL AND department_id NOT IN (SELECT id FROM departments);`);
  console.log(`Users with invalid department_id: ${userOrphansD[0].c}`);

  console.log('\n====================================================\n');
  await conn.end();
}

auditDatabase().catch(err => {
  console.error("Audit error:", err);
});
