-- =============================================================================
-- AI-Based Smart Energy Consumption Monitoring and Optimization System
-- Target Database: smart_energy_management
-- Generated for MySQL Workbench / MySQL 8.0+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS smart_energy_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_energy_management;

-- 1. Table: buildings
CREATE TABLE IF NOT EXISTS buildings (
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Table: departments
CREATE TABLE IF NOT EXISTS departments (
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
  CONSTRAINT fk_departments_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Table: energy_consumption
CREATE TABLE IF NOT EXISTS energy_consumption (
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
  CONSTRAINT fk_energy_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
  CONSTRAINT fk_energy_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Seed Buildings (8 Campus Blocks)
INSERT INTO buildings (id, building_code, building_name, description, today_energy_kwh, monthly_energy_kwh, estimated_cost, current_power_kw, active_alerts_count, overall_status) VALUES
(1, 'IB-BLOCK', 'IB Block', 'Engineering Labs & Classrooms', 354.20, 8385.00, 2347.00, 6.90, 0, 'Normal'),
(2, 'AS-BLOCK', 'AS Block', 'Applied Science & Textile Center', 540.80, 12928.00, 3619.00, 10.60, 0, 'Normal'),
(3, 'MECH-BLOCK', 'Mechanical Block', 'Heavy Machinery & Workshops', 487.40, 12507.00, 3502.00, 8.00, 0, 'Normal'),
(4, 'SUNFLOWER-BLOCK', 'Sunflower Block', 'IT Hub, AI & Computing Labs', 493.70, 11507.00, 3222.00, 9.60, 0, 'Normal'),
(5, 'RESEARCH-PARK', 'Research Park', 'Aero Wind Tunnel & Admin Offices', 258.40, 6289.00, 1761.00, 4.50, 0, 'Normal'),
(6, 'LIBRARY-BLOCK', 'Library', 'Central Digital Library & Media Center', 223.10, 6734.00, 1886.00, 2.90, 0, 'Normal'),
(7, 'GH-BLOCK', 'Girls Hostel', 'Residential Campus Blocks (4 Wings)', 466.30, 15064.00, 4217.00, 28.40, 0, 'High Load'),
(8, 'BH-BLOCK', 'Boys Hostel', 'Residential Campus Blocks (4 Wings)', 499.80, 16154.00, 4523.00, 31.70, 0, 'High Load') ON DUPLICATE KEY UPDATE today_energy_kwh=VALUES(today_energy_kwh);

-- Seed Departments (20 Academic & Residential Units)
INSERT INTO departments (id, building_id, department_name, code, today_energy_kwh, monthly_energy_kwh, estimated_cost, current_power_kw, potential_saving_kwh, active_alerts_count, overall_status) VALUES
(1, 1, 'EEE Department', 'EEE', 200.30, 4686.68, 1312.00, 3.88, 32.50, 0, 'Normal'),
(2, 1, 'EIE Department', 'EIE', 153.93, 3697.92, 1035.00, 3.00, 18.00, 0, 'Normal'),
(3, 2, 'Textile Technology', 'Textile', 177.29, 4254.74, 1191.00, 3.50, 15.00, 0, 'Normal'),
(4, 2, 'ECE Department', 'ECE', 230.62, 5386.22, 1508.00, 4.50, 45.00, 0, 'Normal'),
(5, 2, 'Civil Engineering', 'Civil', 132.86, 3287.35, 920.00, 2.63, 12.00, 0, 'Normal'),
(6, 3, 'Mechanical Engineering', 'Mech', 292.59, 7492.64, 2098.00, 4.80, 28.00, 0, 'Normal'),
(7, 3, 'CT Department', 'CT', 194.78, 5014.54, 1404.00, 3.20, 10.00, 0, 'Normal'),
(8, 4, 'CSE Department', 'CSE', 284.49, 6545.30, 1833.00, 5.50, 65.00, 0, 'Normal'),
(9, 4, 'IT Department', 'IT', 209.18, 4961.31, 1389.00, 4.13, 38.00, 0, 'Normal'),
(10, 5, 'Aeronautical Engg', 'Aeronautical', 154.07, 3720.71, 1042.00, 3.00, 14.00, 0, 'Normal'),
(11, 5, 'Central Administration', 'Central Admin', 104.37, 2568.36, 719.00, 1.50, 10.00, 0, 'Normal'),
(12, 6, 'Library Facility', 'Central Library', 223.10, 6734.32, 1886.00, 2.90, 22.00, 0, 'Normal'),
(13, 7, 'Yamuna Block', 'Yamuna', 121.16, 3960.00, 1109.00, 7.13, 8.00, 0, 'High Load'),
(14, 7, 'Ganga Block', 'Ganga', 115.43, 3704.18, 1037.00, 8.42, 7.50, 0, 'High Load'),
(15, 7, 'Narmadha Block', 'Narmadha', 110.26, 3594.37, 1006.00, 6.36, 6.00, 0, 'Moderate'),
(16, 7, 'Cauvery Block', 'Cauvery', 119.41, 3805.20, 1065.00, 6.53, 7.00, 0, 'Moderate'),
(17, 8, 'Emerald Block', 'Emerald', 133.22, 4327.90, 1212.00, 8.81, 9.00, 0, 'High Load'),
(18, 8, 'Sapphire Block', 'Sapphire', 129.05, 4133.18, 1157.00, 7.89, 8.50, 0, 'High Load'),
(19, 8, 'Pearl Block', 'Pearl', 113.47, 3705.46, 1038.00, 6.50, 7.00, 0, 'Moderate'),
(20, 8, 'Ruby Block', 'Ruby', 124.02, 3987.13, 1116.00, 8.47, 7.50, 0, 'High Load') ON DUPLICATE KEY UPDATE today_energy_kwh=VALUES(today_energy_kwh);

