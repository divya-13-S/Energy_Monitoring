-- =============================================================================
-- AI-Based Smart Energy Consumption Monitoring and Optimization System
-- Target Database: smart_energy_management
-- Designed for MySQL Workbench / MySQL 8.0+
-- =============================================================================

DROP DATABASE IF EXISTS smart_energy_management;
CREATE DATABASE smart_energy_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_energy_management;

-- -----------------------------------------------------------------------------
-- 1. Table: buildings
-- Stores physical campus buildings, aggregated telemetry, and operational status
-- -----------------------------------------------------------------------------
CREATE TABLE buildings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_code VARCHAR(50) NOT NULL UNIQUE,
  building_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  today_energy_kwh DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  monthly_energy_kwh DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  estimated_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  current_power_kw DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  active_alerts_count INT NOT NULL DEFAULT 0,
  overall_status ENUM('Normal', 'Moderate', 'High Load') NOT NULL DEFAULT 'Normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_building_code (building_code),
  INDEX idx_building_status (overall_status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 2. Table: departments
-- Stores academic departments, administrative divisions, and hostel blocks
-- Foreign key linked to parent physical building
-- -----------------------------------------------------------------------------
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  today_energy_kwh DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  monthly_energy_kwh DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  estimated_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  current_power_kw DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  potential_saving_kwh DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  active_alerts_count INT NOT NULL DEFAULT 0,
  overall_status ENUM('Normal', 'Moderate', 'High Load') NOT NULL DEFAULT 'Normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_departments_building
    FOREIGN KEY (building_id) REFERENCES buildings(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  INDEX idx_dept_building (building_id),
  INDEX idx_dept_code (code),
  INDEX idx_dept_status (overall_status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. Table: energy_consumption
-- Stores historical and time-series telemetry readings for analysis & forecasting
-- -----------------------------------------------------------------------------
CREATE TABLE energy_consumption (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT NOT NULL,
  department_id INT NULL,
  reading_date DATETIME NOT NULL,
  energy_consumed_kwh DECIMAL(10, 2) NOT NULL,
  power_kw DECIMAL(10, 2) NOT NULL,
  voltage DECIMAL(6, 2) NOT NULL DEFAULT 230.00,
  current_a DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  power_factor DECIMAL(4, 2) NOT NULL DEFAULT 0.95,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_energy_building
    FOREIGN KEY (building_id) REFERENCES buildings(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_energy_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  INDEX idx_energy_date (reading_date),
  INDEX idx_energy_bldg_date (building_id, reading_date),
  INDEX idx_energy_dept_date (department_id, reading_date)
) ENGINE=InnoDB;

-- =============================================================================
-- SAMPLE DATA INSERTION (Realistic institutional values)
-- =============================================================================

-- 1. Insert 8 Official Campus Buildings
INSERT INTO buildings 
  (id, building_code, building_name, description, today_energy_kwh, monthly_energy_kwh, estimated_cost, current_power_kw, active_alerts_count, overall_status)
VALUES
  (1, 'IB-BLOCK', 'IB Block', 'Engineering Labs & Classrooms', 340.40, 10348.00, 2893.00, 18.50, 0, 'Moderate'),
  (2, 'AS-BLOCK', 'AS Block', 'Applied Science & Textile Center', 404.80, 12306.00, 3441.00, 22.00, 0, 'High Load'),
  (3, 'MECH-BLOCK', 'Mechanical Block', 'Heavy Machinery & Workshops', 257.60, 7831.00, 2190.00, 14.00, 0, 'Moderate'),
  (4, 'SUNFLOWER-BLOCK', 'Sunflower Block', 'IT Hub, AI & Computing Labs', 469.20, 14264.00, 3988.00, 25.50, 0, 'High Load'),
  (5, 'RESEARCH-PARK', 'Research Park', 'Aero Wind Tunnel & Admin Offices', 202.40, 6153.00, 1720.00, 11.00, 0, 'Normal'),
  (6, 'LIBRARY-BLOCK', 'Library', 'Central Digital Library & Media Center', 156.40, 4755.00, 1329.00, 8.50, 0, 'Normal'),
  (7, 'GH-BLOCK', 'Girls Hostel', 'Residential Campus Blocks (4 Wings)', 294.40, 8950.00, 2502.00, 16.00, 0, 'Moderate'),
  (8, 'BH-BLOCK', 'Boys Hostel', 'Residential Campus Blocks (4 Wings)', 322.00, 9789.00, 2737.00, 17.50, 0, 'Moderate');

-- 2. Insert Departments / Units mapped to parent buildings
INSERT INTO departments
  (id, building_id, department_name, code, today_energy_kwh, monthly_energy_kwh, estimated_cost, current_power_kw, potential_saving_kwh, active_alerts_count, overall_status)
VALUES
  -- IB Block (Building ID 1)
  (1, 1, 'EEE Department', 'EEE', 193.20, 5873.00, 1642.00, 14.20, 32.50, 0, 'Moderate'),
  (2, 1, 'EIE Department', 'EIE', 147.20, 4475.00, 1251.00, 10.80, 18.00, 0, 'Normal'),

  -- AS Block (Building ID 2)
  (3, 2, 'Textile Technology', 'Textile', 128.80, 3916.00, 1095.00, 9.50, 15.00, 0, 'Moderate'),
  (4, 2, 'ECE Department', 'ECE', 211.60, 6433.00, 1799.00, 15.50, 45.00, 0, 'High Load'),
  (5, 2, 'Civil Engineering', 'Civil', 119.60, 3536.00, 1017.00, 8.80, 12.00, 0, 'Normal'),

  -- Mechanical Block (Building ID 3)
  (6, 3, 'Mechanical Engineering', 'Mech', 165.60, 5034.00, 1408.00, 12.20, 28.00, 0, 'Moderate'),
  (7, 3, 'CT Department', 'CT', 92.00, 2797.00, 782.00, 6.80, 10.00, 0, 'Normal'),

  -- Sunflower Block (Building ID 4)
  (8, 4, 'CSE Department', 'CSE', 276.00, 8390.00, 2346.00, 20.30, 65.00, 0, 'High Load'),
  (9, 4, 'IT Department', 'IT', 193.20, 5873.00, 1642.00, 14.20, 38.00, 0, 'Moderate'),

  -- Research Park (Building ID 5)
  (10, 5, 'Aeronautical Engg', 'Aeronautical', 119.60, 3636.00, 1017.00, 8.80, 14.00, 0, 'Normal'),
  (11, 5, 'Central Administration', 'Central Admin', 82.80, 2517.00, 704.00, 6.10, 10.00, 0, 'Normal'),

  -- Library (Building ID 6)
  (12, 6, 'Library Facility', 'Central Library', 156.40, 4755.00, 1329.00, 11.50, 22.00, 0, 'Normal'),

  -- Girls Hostel (Building ID 7)
  (13, 7, 'Yamuna Block', 'Yamuna', 77.30, 2350.00, 657.00, 5.70, 8.00, 0, 'Normal'),
  (14, 7, 'Ganga Block', 'Ganga', 73.60, 2237.00, 626.00, 5.40, 7.50, 0, 'Normal'),
  (15, 7, 'Narmadha Block', 'Narmadha', 69.90, 2125.00, 594.00, 5.10, 6.00, 0, 'Normal'),
  (16, 7, 'Cauvery Block', 'Cauvery', 73.60, 2237.00, 626.00, 5.40, 7.00, 0, 'Normal'),

  -- Boys Hostel (Building ID 8)
  (17, 8, 'Emerald Block', 'Emerald', 88.30, 2684.00, 751.00, 6.50, 9.00, 0, 'Normal'),
  (18, 8, 'Sapphire Block', 'Sapphire', 82.80, 2517.00, 704.00, 6.10, 8.50, 0, 'Normal'),
  (19, 8, 'Pearl Block', 'Pearl', 73.60, 2237.00, 626.00, 5.40, 7.00, 0, 'Normal'),
  (20, 8, 'Ruby Block', 'Ruby', 77.30, 2350.00, 657.00, 5.70, 7.50, 0, 'Normal');

-- 3. Insert Hourly Energy Telemetry Readings (Sample Historical Records)
INSERT INTO energy_consumption 
  (building_id, department_id, reading_date, energy_consumed_kwh, power_kw, voltage, current_a, power_factor)
VALUES
  -- IB Block (Today's Hourly samples)
  (1, 1, '2026-08-29 08:00:00', 12.50, 12.50, 231.20, 56.40, 0.96),
  (1, 1, '2026-08-29 09:00:00', 16.80, 16.80, 229.80, 75.80, 0.95),
  (1, 1, '2026-08-29 10:00:00', 21.40, 21.40, 228.40, 97.20, 0.94),
  (1, 1, '2026-08-29 11:00:00', 24.20, 24.20, 227.60, 110.50, 0.95),
  (1, 2, '2026-08-29 08:00:00', 9.20, 9.20, 230.50, 41.50, 0.96),
  (1, 2, '2026-08-29 09:00:00', 13.10, 13.10, 229.40, 59.30, 0.95),
  (1, 2, '2026-08-29 10:00:00', 17.50, 17.50, 228.10, 79.40, 0.94),

  -- Sunflower Block (Today's Hourly samples)
  (4, 8, '2026-08-29 08:00:00', 18.20, 18.20, 230.10, 82.20, 0.96),
  (4, 8, '2026-08-29 09:00:00', 26.50, 26.50, 228.60, 120.30, 0.95),
  (4, 8, '2026-08-29 10:00:00', 32.80, 32.80, 227.20, 149.80, 0.94),
  (4, 8, '2026-08-29 11:00:00', 35.40, 35.40, 226.80, 162.10, 0.94),
  (4, 9, '2026-08-29 08:00:00', 14.00, 14.00, 231.00, 63.20, 0.96),
  (4, 9, '2026-08-29 09:00:00', 20.80, 20.80, 229.10, 94.40, 0.95),
  (4, 9, '2026-08-29 10:00:00', 25.60, 25.60, 227.90, 116.80, 0.95),

  -- AS Block
  (2, 4, '2026-08-29 08:00:00', 15.60, 15.60, 230.40, 70.40, 0.96),
  (2, 4, '2026-08-29 09:00:00', 22.40, 22.40, 228.80, 101.50, 0.95),
  (2, 4, '2026-08-29 10:00:00', 28.00, 28.00, 227.50, 127.60, 0.94),

  -- Mechanical Block
  (3, 6, '2026-08-29 08:00:00', 11.20, 11.20, 231.50, 50.30, 0.96),
  (3, 6, '2026-08-29 09:00:00', 18.50, 18.50, 229.20, 83.80, 0.95),
  (3, 6, '2026-08-29 10:00:00', 23.10, 23.10, 228.00, 105.10, 0.94),

  -- Research Park
  (5, 10, '2026-08-29 08:00:00', 8.50, 8.50, 231.80, 38.10, 0.96),
  (5, 10, '2026-08-29 09:00:00', 13.20, 13.20, 230.00, 59.60, 0.96),
  (5, 10, '2026-08-29 10:00:00', 16.80, 16.80, 228.50, 76.40, 0.95),

  -- Library
  (6, 12, '2026-08-29 08:00:00', 9.00, 9.00, 232.00, 40.20, 0.97),
  (6, 12, '2026-08-29 09:00:00', 14.50, 14.50, 230.40, 65.30, 0.96),
  (6, 12, '2026-08-29 10:00:00', 18.20, 18.20, 229.00, 82.50, 0.95),

  -- Girls Hostel
  (7, 13, '2026-08-29 06:00:00', 8.40, 8.40, 232.50, 37.50, 0.97),
  (7, 13, '2026-08-29 07:00:00', 12.80, 12.80, 231.10, 57.50, 0.96),
  (7, 13, '2026-08-29 08:00:00', 10.50, 10.50, 231.80, 47.10, 0.96),

  -- Boys Hostel
  (8, 17, '2026-08-29 06:00:00', 9.20, 9.20, 232.10, 41.10, 0.97),
  (8, 17, '2026-08-29 07:00:00', 14.60, 14.60, 230.80, 65.70, 0.96),
  (8, 17, '2026-08-29 08:00:00', 11.80, 11.80, 231.40, 52.90, 0.96);

-- =============================================================================
-- Verification Query
-- =============================================================================
SELECT 'Buildings Count' AS metric, COUNT(*) AS count FROM buildings
UNION ALL
SELECT 'Departments Count', COUNT(*) FROM departments
UNION ALL
SELECT 'Energy Telemetry Records', COUNT(*) FROM energy_consumption;
