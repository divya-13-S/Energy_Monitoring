import dotenv from 'dotenv';
dotenv.config();
import { query, testDbConnection } from '../config/db.js';

export const setupOptimizationDatabase = async () => {
  try {
    await testDbConnection();

    // 1. Create optimization_recommendations table
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS optimization_recommendations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        building_id INT NULL,
        department_id INT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'Energy Saving',
        reason TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        est_kwh_savings DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        est_cost_savings DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        priority ENUM('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
        status ENUM('Pending', 'Reviewed', 'Implemented') NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await query(createTableSql);
    console.log('✅ Table "optimization_recommendations" is ready.');

    // 2. Check existing count
    const [countRow] = await query('SELECT COUNT(*) as cnt FROM optimization_recommendations;');
    if (countRow.cnt === 0) {
      console.log('🌱 Seeding initial rule-based optimization recommendations...');
      const seedSql = `
        INSERT INTO optimization_recommendations 
          (building_id, department_id, title, category, reason, recommendation, est_kwh_savings, est_cost_savings, priority, status)
        VALUES
          (3, 6, 'Optimize Mechanical Workshop Machinery Schedule', 'Machinery', 'Heavy mechanical machinery operating continuously during peak tariff hours.', 'Stagger heavy equipment startup cycles and shift non-essential lathe operations to morning off-peak hours.', 45.50, 386.75, 'High', 'Pending'),
          (7, 13, 'Hostel Water Heater & Hallway Timer Optimization', 'Hostel Load', 'High evening & early morning standby load detected in Yamuna Hostel wing.', 'Install automated timer relays for water heaters and dim corridor lighting past 11:00 PM.', 32.00, 272.00, 'High', 'Pending'),
          (2, 4, 'Science & ECE Lab Off-Hours Power Shutdown', 'HVAC & Labs', 'Unused diagnostic equipment and bench supplies left powered on overnight in ECE department.', 'Implement automated end-of-day lab power shutoff checklist and smart power strips.', 28.40, 241.40, 'Medium', 'Reviewed'),
          (6, 12, 'Central Library HVAC Zone Airflow Dampers', 'HVAC', 'Full HVAC cooling operating in low-occupancy reading zones during non-peak study hours.', 'Adjust VAV damper controls based on zone occupancy sensor feedback.', 22.10, 187.85, 'Medium', 'Pending'),
          (4, 8, 'CSE & IT Lab Server Room Power Factor Correction', 'Power Factor', 'Power factor in Sunflower Block CSE server room dropped below 0.92 target threshold.', 'Inspect automatic capacitor bank switching units in Sunflower Block sub-distribution panel.', 18.60, 158.10, 'High', 'Implemented'),
          (1, 1, 'EEE Department Classroom Lighting Automation', 'Lighting', 'Classroom luminaires remaining active during daylight hours in IB Block.', 'Install daylight harvesting ambient light sensors in south-facing lecture halls.', 14.80, 125.80, 'Low', 'Pending'),
          (8, 17, 'Boys Hostel Emerald Block Standby Load Reduction', 'Hostel Load', 'Standby charger & common area load spikes recorded between 01:00 AM and 05:00 AM.', 'Optimize outdoor security LED schedules and audit common room appliance standby power.', 19.30, 164.05, 'Medium', 'Pending'),
          (5, 10, 'Aeronautical Wind Tunnel Peak Demand Shaving', 'Peak Shaving', 'Wind tunnel testing creating coincidental demand peaks during campus peak demand hours.', 'Schedule wind tunnel aerodynamic testing during morning off-peak tariff slots (08:00 AM - 11:00 AM).', 38.00, 323.00, 'High', 'Reviewed');
      `;
      await query(seedSql);
      console.log('✅ Seed recommendations inserted successfully!');
    }
  } catch (err) {
    console.error('❌ Failed to setup optimization database:', err.message);
  }
};

// Execute if run directly
if (process.argv[1].includes('setupOptimizationDb.js')) {
  setupOptimizationDatabase().then(() => process.exit(0));
}
