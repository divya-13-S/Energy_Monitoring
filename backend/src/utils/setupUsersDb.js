/**
 * utils/setupUsersDb.js — Database initialization and user account seeding
 * Target Database: smart_energy_management
 */

import crypto from 'crypto';
import { query, testDbConnection } from '../config/db.js';

/**
 * Generate a salted SHA-512 password hash
 */
export const hashPassword = (password) => {
  const salt = 'smart_energy_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

export const setupUsersDatabase = async () => {
  try {
    console.log('🔄 Initializing Users database setup...');

    const isConnected = await testDbConnection();
    if (!isConnected) {
      throw new Error('Could not connect to MySQL database.');
    }

    // 1. Create users table if it does not exist
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(30) NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('Administrator', 'Department Staff (HOD)', 'Electrician / Maintenance Staff') NOT NULL,
        building_id INT NULL,
        department_id INT NULL,
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Checked/created users table schema.');

    // 2. Initial Seed Campus Users
    const defaultPasswordHash = hashPassword('Admin@123');

    const seedUsers = [
      {
        name: 'Alexander Pierce',
        email: 'admin@institution.edu',
        phone: '+91 98765 43210',
        password_hash: defaultPasswordHash,
        role: 'Administrator',
        building_id: null,
        department_id: null,
        status: 'Active',
        last_login: new Date()
      },
      {
        name: 'Dr. R. K. Vance',
        email: 'hod.cse@institution.edu',
        phone: '+91 98765 43211',
        password_hash: defaultPasswordHash,
        role: 'Department Staff (HOD)',
        building_id: 4, // Sunflower Block
        department_id: 8, // CSE
        status: 'Active',
        last_login: new Date(Date.now() - 3600000 * 2)
      },
      {
        name: 'Chief Electrician',
        email: 'maintenance@institution.edu',
        phone: '+91 98765 43212',
        password_hash: defaultPasswordHash,
        role: 'Electrician / Maintenance Staff',
        building_id: 1, // IB Block
        department_id: 1, // EEE
        status: 'Active',
        last_login: new Date(Date.now() - 3600000 * 5)
      },
      {
        name: 'Dr. M. S. Kumar',
        email: 'hod.mech@institution.edu',
        phone: '+91 98765 43213',
        password_hash: defaultPasswordHash,
        role: 'Department Staff (HOD)',
        building_id: 3, // Mechanical Block
        department_id: 6, // Mech Workshop
        status: 'Active',
        last_login: new Date(Date.now() - 86400000 * 1)
      },
      {
        name: 'Sarah Jenkins',
        email: 'electrician.hostel@institution.edu',
        phone: '+91 98765 43214',
        password_hash: defaultPasswordHash,
        role: 'Electrician / Maintenance Staff',
        building_id: 8, // Boys Hostel
        department_id: 20, // Ruby Block
        status: 'Active',
        last_login: null
      },
      {
        name: 'Dr. S. Radhakrishnan',
        email: 'hod.textile@institution.edu',
        phone: '+91 98765 43215',
        password_hash: defaultPasswordHash,
        role: 'Department Staff (HOD)',
        building_id: 2, // AS Block
        department_id: 3, // Textile
        status: 'Inactive',
        last_login: new Date(Date.now() - 86400000 * 15)
      }
    ];

    let insertedCount = 0;
    for (const u of seedUsers) {
      const [existing] = await query('SELECT id FROM users WHERE email = ? LIMIT 1;', [u.email]);
      if (!existing) {
        await query(
          `INSERT INTO users (name, email, phone, password_hash, role, building_id, department_id, status, last_login)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [u.name, u.email, u.phone, u.password_hash, u.role, u.building_id, u.department_id, u.status, u.last_login]
        );
        insertedCount++;
      }
    }

    console.log(`✅ Seeded ${insertedCount} campus user accounts into MySQL.`);
    console.log('🎉 Users database setup completed successfully!');
  } catch (err) {
    console.error('❌ Error during Users DB setup:', err);
    throw err;
  }
};

if (process.argv[1] && process.argv[1].includes('setupUsersDb.js')) {
  setupUsersDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
