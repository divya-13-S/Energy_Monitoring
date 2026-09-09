/**
 * utils/setupSettingsDb.js — Centralized System Settings Database Setup & Seeding
 * Target Database: smart_energy_management
 */

import 'dotenv/config';
import { query, testDbConnection } from '../config/db.js';

export const setupSettingsDatabase = async () => {
  try {
    console.log('🔄 Initializing System Settings database setup...');

    const isConnected = await testDbConnection();
    if (!isConnected) {
      throw new Error('Could not connect to MySQL database.');
    }

    // 1. Create system_settings table if it does not exist
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL,
        setting_type VARCHAR(20) NOT NULL DEFAULT 'string',
        category VARCHAR(50) NOT NULL DEFAULT 'General',
        description VARCHAR(255) NULL,
        updated_by VARCHAR(100) NULL DEFAULT 'System Default',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure setting_type and updated_by columns exist for existing tables
    try {
      await query(`ALTER TABLE system_settings ADD COLUMN setting_type VARCHAR(20) NOT NULL DEFAULT 'string';`);
    } catch (e) {}
    try {
      await query(`ALTER TABLE system_settings ADD COLUMN updated_by VARCHAR(100) NULL DEFAULT 'System Default';`);
    } catch (e) {}

    console.log('✅ Checked/created system_settings table schema.');

    // 2. Default System Settings Seeding
    const defaultSettings = [
      {
        key: 'electricity_tariff_kwh',
        value: '8.50',
        type: 'number',
        category: 'Financial',
        description: 'Electricity tariff cost in ₹ per kWh',
      },
      {
        key: 'currency_symbol',
        value: '₹',
        type: 'string',
        category: 'Financial',
        description: 'Currency symbol for cost display',
      },
      {
        key: 'energy_unit',
        value: 'kWh',
        type: 'string',
        category: 'General',
        description: 'Standard unit for energy consumption',
      },
      {
        key: 'min_voltage',
        value: '215.0',
        type: 'number',
        category: 'Electrical',
        description: 'Minimum allowable line voltage limit (V)',
      },
      {
        key: 'max_voltage',
        value: '245.0',
        type: 'number',
        category: 'Electrical',
        description: 'Maximum allowable line voltage limit (V)',
      },
      {
        key: 'max_current',
        value: '120.0',
        type: 'number',
        category: 'Electrical',
        description: 'Maximum load current limit per feeder (A)',
      },
      {
        key: 'high_consumption_kw',
        value: '35.0',
        type: 'number',
        category: 'Electrical',
        description: 'High active power consumption threshold (kW)',
      },
      {
        key: 'min_frequency',
        value: '49.5',
        type: 'number',
        category: 'Electrical',
        description: 'Minimum allowable frequency limit (Hz)',
      },
      {
        key: 'max_frequency',
        value: '50.5',
        type: 'number',
        category: 'Electrical',
        description: 'Maximum allowable frequency limit (Hz)',
      },
      {
        key: 'min_power_factor',
        value: '0.90',
        type: 'number',
        category: 'Electrical',
        description: 'Minimum acceptable power factor threshold',
      },
      {
        key: 'alert_generation_enabled',
        value: 'true',
        type: 'boolean',
        category: 'Alerts',
        description: 'Enable or disable automatic telemetry alert generation',
      },
      {
        key: 'abnormal_usage_kwh',
        value: '12.0',
        type: 'number',
        category: 'Alerts',
        description: 'Abnormal 15-minute energy usage limit (kWh)',
      },
      {
        key: 'alert_auto_escalation',
        value: 'true',
        type: 'boolean',
        category: 'Alerts',
        description: 'Automatically escalate severity when telemetry exceeds critical bounds',
      },
      {
        key: 'alert_dedup_window_mins',
        value: '240',
        type: 'number',
        category: 'Alerts',
        description: 'Duplicate alert prevention window in minutes',
      },
      {
        key: 'data_refresh_interval_sec',
        value: '15',
        type: 'number',
        category: 'System',
        description: 'Telemetry dashboard auto-refresh interval in seconds',
      },
      {
        key: 'default_dashboard_period',
        value: 'today',
        type: 'string',
        category: 'System',
        description: 'Default time range period for dashboard views',
      },
      {
        key: 'system_date_format',
        value: 'YYYY-MM-DD',
        type: 'string',
        category: 'System',
        description: 'System-wide date display format',
      },
    ];

    let insertedCount = 0;
    for (const s of defaultSettings) {
      const existing = await query('SELECT setting_key FROM system_settings WHERE setting_key = ? LIMIT 1;', [s.key]);
      if (existing.length === 0) {
        await query(
          `INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, updated_by)
           VALUES (?, ?, ?, ?, ?, 'System Default');`,
          [s.key, s.value, s.type, s.category, s.description]
        );
        insertedCount++;
      }
    }

    console.log(`✅ Seeded ${insertedCount} new system settings into MySQL.`);
    console.log('🎉 System Settings database setup completed successfully!');
  } catch (err) {
    console.error('❌ Error during System Settings DB setup:', err);
    throw err;
  }
};

if (process.argv[1] && process.argv[1].includes('setupSettingsDb.js')) {
  setupSettingsDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
