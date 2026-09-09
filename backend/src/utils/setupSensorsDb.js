/**
 * utils/setupSensorsDb.js — Database initialization and IoT Sensor seeding
 * Target Database: smart_energy_management
 */

import { query, testDbConnection } from '../config/db.js';

export const setupSensorsDatabase = async () => {
  try {
    console.log('🔄 Initializing Sensors database setup...');

    const isConnected = await testDbConnection();
    if (!isConnected) {
      throw new Error('Could not connect to MySQL database.');
    }

    // 1. Create sensors table if it does not exist
    await query(`
      CREATE TABLE IF NOT EXISTS sensors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sensor_code VARCHAR(50) NOT NULL UNIQUE,
        sensor_name VARCHAR(100) NOT NULL,
        building_id INT NOT NULL,
        department_id INT NOT NULL,
        parameter ENUM('Energy & Power Demand', 'Voltage Transducer', 'Current Transformer', 'Power Factor Monitor') NOT NULL,
        room_location VARCHAR(100) NOT NULL,
        status ENUM('Online', 'Offline', 'Maintenance') NOT NULL DEFAULT 'Online',
        last_ping TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Checked/created sensors table schema.');

    // Fetch existing departments and buildings
    const departments = await query(`
      SELECT d.id AS department_id, d.building_id, d.department_name AS dept_name, b.building_name
      FROM departments d
      JOIN buildings b ON d.building_id = b.id
      ORDER BY d.id;
    `);

    if (!departments || departments.length === 0) {
      console.warn('⚠️ No departments found in database. Cannot seed sensors.');
      return;
    }

    // Parameters to distribute per department
    const parameterConfigs = [
      {
        param: 'Energy & Power Demand',
        codePrefix: 'EM',
        nameSuffix: 'Smart Energy Meter',
        room: 'Main Distribution Panel'
      },
      {
        param: 'Voltage Transducer',
        codePrefix: 'VT',
        nameSuffix: 'Voltage Monitoring Transducer',
        room: 'Sub-panel Room 101'
      },
      {
        param: 'Current Transformer',
        codePrefix: 'CT',
        nameSuffix: 'CT Current Sensor Array',
        room: 'Feeder Panel Room'
      },
      {
        param: 'Power Factor Monitor',
        codePrefix: 'PFM',
        nameSuffix: 'Power Factor Analyzer',
        room: 'Capacitor Bank Panel'
      }
    ];

    let insertedCount = 0;
    const now = new Date();

    for (const dept of departments) {
      // Determine how many sensors for this department (2 to 4 sensors per department)
      const countForDept = (dept.department_id % 3) + 2; 

      for (let i = 0; i < countForDept; i++) {
        const config = parameterConfigs[i % parameterConfigs.length];
        const sensorCode = `SNS-${config.codePrefix}-${dept.building_id.toString().padStart(2, '0')}${dept.department_id.toString().padStart(2, '0')}-${(i + 1).toString().padStart(2, '0')}`;
        const sensorName = `${dept.dept_name} ${config.nameSuffix}`;
        const roomLocation = `${dept.dept_name} - ${config.room}`;

        // Deterministic status selection for initial seed
        let status = 'Online';
        let lastPing = new Date(now.getTime() - (i * 15 * 60 * 1000));

        if ((dept.department_id + i) % 7 === 0) {
          status = 'Offline';
          lastPing = new Date(now.getTime() - (36 * 3600 * 1000)); // 36 hours ago
        } else if ((dept.department_id + i) % 11 === 0) {
          status = 'Maintenance';
          lastPing = new Date(now.getTime() - (4 * 3600 * 1000));
        }

        const [existing] = await query('SELECT id FROM sensors WHERE sensor_code = ? LIMIT 1;', [sensorCode]);
        if (!existing) {
          await query(
            `INSERT INTO sensors (sensor_code, sensor_name, building_id, department_id, parameter, room_location, status, last_ping)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [sensorCode, sensorName, dept.building_id, dept.department_id, config.param, roomLocation, status, lastPing]
          );
          insertedCount++;
        }
      }
    }

    console.log(`✅ Seeded ${insertedCount} campus IoT sensors into MySQL.`);
    console.log('🎉 Sensors database setup completed successfully!');
  } catch (err) {
    console.error('❌ Error during Sensors DB setup:', err);
    throw err;
  }
};

if (process.argv[1] && process.argv[1].includes('setupSensorsDb.js')) {
  setupSensorsDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
