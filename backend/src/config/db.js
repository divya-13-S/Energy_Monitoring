/**
 * config/db.js — MySQL Database Connection Pool
 * Target Database: smart_energy_management
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_energy_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool = null;
let isDbConnected = false;

try {
  pool = mysql.createPool(dbConfig);
} catch (err) {
  console.error('⚠️  Failed to initialize MySQL connection pool:', err.message);
}

/**
 * Execute a SQL query with parameter binding.
 */
export const query = async (sql, params = []) => {
  if (!pool) {
    throw new Error('Database connection pool is not initialized');
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * Test connectivity to MySQL database.
 */
export const testDbConnection = async () => {
  try {
    if (!pool) return false;
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    isDbConnected = true;
    console.log(`✅ MySQL Connected: Database "${dbConfig.database}" @ ${dbConfig.host}:${dbConfig.port}`);
    return true;
  } catch (err) {
    isDbConnected = false;
    console.warn(`⚠️  MySQL Connection Note: ${err.message}`);
    console.warn(`   → (Ensure MySQL Workbench / Server is running and "database/smart_energy_management.sql" is executed)`);
    return false;
  }
};

export const getDbStatus = () => isDbConnected;

export default {
  pool,
  query,
  testDbConnection,
  getDbStatus,
  dbConfig,
};
