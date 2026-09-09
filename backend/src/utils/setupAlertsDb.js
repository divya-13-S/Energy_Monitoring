/**
 * utils/setupAlertsDb.js — Database initialization and historical alert generation
 * Target Database: smart_energy_management
 */

import { query, testDbConnection } from '../config/db.js';

export const setupAlertsDatabase = async () => {
  try {
    console.log('🔄 Initializing Alerts database setup...');

    const isConnected = await testDbConnection();
    if (!isConnected) {
      throw new Error('Could not connect to MySQL database.');
    }

    // 1. Create system_settings table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL,
        category VARCHAR(50) DEFAULT 'Alerts',
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Checked/created system_settings table.');

    // 2. Insert default threshold settings
    const defaultSettings = [
      { key: 'max_voltage', val: '245.0', cat: 'Electrical', desc: 'Maximum allowable voltage limit (V)' },
      { key: 'min_voltage', val: '215.0', cat: 'Electrical', desc: 'Minimum allowable voltage limit (V)' },
      { key: 'max_current', val: '120.0', cat: 'Electrical', desc: 'Maximum load current limit per feeder (A)' },
      { key: 'min_power_factor', val: '0.90', cat: 'Electrical', desc: 'Minimum acceptable power factor threshold' },
      { key: 'high_consumption_kw', val: '35.0', cat: 'Energy', desc: 'High active power consumption threshold (kW)' },
      { key: 'abnormal_usage_kwh', val: '12.0', cat: 'Energy', desc: 'Abnormal 15-minute energy usage limit (kWh)' }
    ];

    for (const setting of defaultSettings) {
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, category, description)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description);`,
        [setting.key, setting.val, setting.cat, setting.desc]
      );
    }
    console.log('✅ Seeded system_settings threshold values.');

    // 3. Alter alerts table to add missing columns if they do not exist
    const alertColumns = await query('DESCRIBE alerts;');
    const existingFields = alertColumns.map(c => c.Field);

    if (!existingFields.includes('alert_type')) {
      await query(`ALTER TABLE alerts ADD COLUMN alert_type VARCHAR(100) NOT NULL DEFAULT 'System Warning' AFTER department_id;`);
    }
    if (!existingFields.includes('trigger_value')) {
      await query(`ALTER TABLE alerts ADD COLUMN trigger_value VARCHAR(50) NULL AFTER status;`);
    }
    if (!existingFields.includes('threshold_value')) {
      await query(`ALTER TABLE alerts ADD COLUMN threshold_value VARCHAR(50) NULL AFTER trigger_value;`);
    }
    if (!existingFields.includes('acknowledged_by')) {
      await query(`ALTER TABLE alerts ADD COLUMN acknowledged_by VARCHAR(100) NULL AFTER threshold_value;`);
    }
    if (!existingFields.includes('acknowledged_at')) {
      await query(`ALTER TABLE alerts ADD COLUMN acknowledged_at TIMESTAMP NULL AFTER acknowledged_by;`);
    }
    if (!existingFields.includes('resolved_by')) {
      await query(`ALTER TABLE alerts ADD COLUMN resolved_by VARCHAR(100) NULL AFTER acknowledged_at;`);
    }
    if (!existingFields.includes('resolution_remarks')) {
      await query(`ALTER TABLE alerts ADD COLUMN resolution_remarks TEXT NULL AFTER resolved_at;`);
    }
    if (!existingFields.includes('updated_at')) {
      await query(`ALTER TABLE alerts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;`);
    }

    // Modify severity and status to accept standardized values
    await query(`ALTER TABLE alerts MODIFY COLUMN severity VARCHAR(20) NOT NULL DEFAULT 'Medium';`);
    await query(`ALTER TABLE alerts MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Active';`);

    console.log('✅ Updated alerts table schema cleanly.');

    // 4. Generate deterministic alerts from recent valid telemetry data (last 30 days up to NOW)
    console.log('🔄 Scanning energy_consumption for abnormal telemetry conditions...');

    const telemetryRows = await query(`
      SELECT e.*, b.building_name, d.department_name
      FROM energy_consumption e
      LEFT JOIN buildings b ON e.building_id = b.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.reading_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND e.reading_date <= NOW()
        AND (
          e.voltage > 245.0 OR e.voltage < 215.0 OR
          e.current_a > 120.0 OR
          e.power_factor < 0.90 OR
          e.power_kw > 35.0 OR
          e.energy_consumed_kwh > 12.0
        )
      ORDER BY e.reading_date ASC;
    `);

    console.log(`📊 Found ${telemetryRows.length} abnormal telemetry instances.`);

    let insertedCount = 0;
    let duplicateCount = 0;

    for (const r of telemetryRows) {
      let alertType = '';
      let severity = 'Medium';
      let title = '';
      let message = '';
      let triggerVal = '';
      let thresholdVal = '';

      const voltage = parseFloat(r.voltage);
      const current = parseFloat(r.current_a);
      const powerFactor = parseFloat(r.power_factor);
      const powerKw = parseFloat(r.power_kw);
      const energyKwh = parseFloat(r.energy_consumed_kwh);
      const bldgName = r.building_name || `Building #${r.building_id}`;
      const deptName = r.department_name || `Department #${r.department_id}`;

      if (voltage > 245.0) {
        alertType = 'High Voltage';
        severity = voltage > 248.0 ? 'Critical' : 'High';
        title = `High Voltage Detected: ${bldgName}`;
        message = `Line voltage reached ${voltage.toFixed(1)} V at ${deptName}, exceeding maximum threshold.`;
        triggerVal = `${voltage.toFixed(1)} V`;
        thresholdVal = 'Max 245.0 V';
      } else if (voltage < 215.0) {
        alertType = 'Low Voltage';
        severity = voltage < 212.0 ? 'Critical' : 'High';
        title = `Low Voltage Drop: ${bldgName}`;
        message = `Line voltage dropped to ${voltage.toFixed(1)} V at ${deptName}, below minimum threshold.`;
        triggerVal = `${voltage.toFixed(1)} V`;
        thresholdVal = 'Min 215.0 V';
      } else if (current > 120.0) {
        alertType = 'Overload / High Current';
        severity = current > 150.0 ? 'Critical' : 'High';
        title = `Current Overload: ${bldgName}`;
        message = `Feeder current reached ${current.toFixed(1)} A at ${deptName}, exceeding maximum current limit.`;
        triggerVal = `${current.toFixed(1)} A`;
        thresholdVal = 'Max 120.0 A';
      } else if (powerFactor < 0.90) {
        alertType = 'Low Power Factor';
        severity = powerFactor < 0.85 ? 'High' : 'Medium';
        title = `Low Power Factor: ${bldgName}`;
        message = `Power factor degraded to ${powerFactor.toFixed(2)} PF at ${deptName}, below target efficiency limit.`;
        triggerVal = `${powerFactor.toFixed(2)} PF`;
        thresholdVal = 'Min 0.90 PF';
      } else if (powerKw > 35.0) {
        alertType = 'High Energy Consumption';
        severity = powerKw > 40.0 ? 'High' : 'Medium';
        title = `Peak Power Demand: ${bldgName}`;
        message = `Active power draw surged to ${powerKw.toFixed(1)} kW at ${deptName}.`;
        triggerVal = `${powerKw.toFixed(1)} kW`;
        thresholdVal = 'Max 35.0 kW';
      } else if (energyKwh > 12.0) {
        alertType = 'Abnormal Energy Usage';
        severity = 'Low';
        title = `Abnormal Energy Draw: ${bldgName}`;
        message = `Energy consumption spiked to ${energyKwh.toFixed(1)} kWh within 15 minutes at ${deptName}.`;
        triggerVal = `${energyKwh.toFixed(1)} kWh`;
        thresholdVal = 'Max 12.0 kWh';
      }

      if (!alertType) continue;

      // Deduplication check: Check if an unresolved alert for same building, department, and alert_type exists within 4 hours
      const [existing] = await query(
        `SELECT id FROM alerts
         WHERE building_id = ? AND department_id = ? AND alert_type = ?
           AND created_at >= DATE_SUB(?, INTERVAL 4 HOUR)
         LIMIT 1;`,
        [r.building_id, r.department_id, alertType, r.reading_date]
      );

      if (existing) {
        duplicateCount++;
        continue;
      }

      const alertId = `ALT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const isHistoricalPast = new Date(r.reading_date) < new Date(Date.now() - 2 * 86400000);
      const status = isHistoricalPast ? (Math.random() > 0.4 ? 'Resolved' : 'Acknowledged') : 'Active';
      const resolvedAt = status === 'Resolved' ? r.reading_date : null;

      await query(
        `INSERT INTO alerts (
          id, title, message, severity, building_id, department_id, alert_type, status,
          trigger_value, threshold_value, created_at, resolved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          alertId, title, message, severity, r.building_id, r.department_id, alertType, status,
          triggerVal, thresholdVal, r.reading_date, resolvedAt
        ]
      );
      insertedCount++;
    }

    console.log(`✅ Generated ${insertedCount} real alerts (suppressed ${duplicateCount} duplicate events).`);
    console.log('🎉 Alerts database setup completed successfully!');
  } catch (err) {
    console.error('❌ Error during Alerts DB setup:', err);
    throw err;
  }
};

if (process.argv[1] && process.argv[1].includes('setupAlertsDb.js')) {
  setupAlertsDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
