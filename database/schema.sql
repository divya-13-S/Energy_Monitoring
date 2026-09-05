-- ====================================================================
-- AI-Based Smart Energy Consumption Monitoring & Optimization System
-- Database Schema (MySQL 8.0+)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `smart_energy_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smart_energy_db`;

-- 1. Buildings Table
CREATE TABLE IF NOT EXISTS `buildings` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `type` VARCHAR(50) DEFAULT 'Academic',
  `floors` INT DEFAULT 1,
  `total_area_sqft` DECIMAL(10, 2) DEFAULT 0.00,
  `status` ENUM('Optimal', 'High Consumption', 'Warning', 'Maintenance') DEFAULT 'Optimal',
  `daily_avg_kwh` DECIMAL(10, 2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS `departments` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `building_id` VARCHAR(50),
  `hod_name` VARCHAR(100),
  `allocated_budget_kwh` DECIMAL(10, 2) DEFAULT 0.00,
  `current_consumption_kwh` DECIMAL(10, 2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('Administrator', 'Department Staff (HOD)', 'Electrician / Maintenance Staff') NOT NULL,
  `department_id` VARCHAR(50),
  `status` ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Sensors Table
CREATE TABLE IF NOT EXISTS `sensors` (
  `id` VARCHAR(50) PRIMARY KEY,
  `sensor_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `type` VARCHAR(50) NOT NULL, -- Smart Meter, Temperature, Current Transformer, Voltage Transducer
  `building_id` VARCHAR(50),
  `department_id` VARCHAR(50),
  `room_location` VARCHAR(100),
  `status` ENUM('online', 'offline', 'faulty', 'maintenance') DEFAULT 'online',
  `last_ping` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Energy Readings Table
CREATE TABLE IF NOT EXISTS `energy_readings` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `sensor_id` VARCHAR(50) NOT NULL,
  `voltage` DECIMAL(6, 2) NOT NULL,
  `current_amp` DECIMAL(6, 2) NOT NULL,
  `power_kw` DECIMAL(8, 2) NOT NULL,
  `frequency_hz` DECIMAL(4, 2) DEFAULT 50.00,
  `power_factor` DECIMAL(4, 3) DEFAULT 0.950,
  `kwh_consumed` DECIMAL(10, 2) NOT NULL,
  `recorded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_recorded_at` (`recorded_at`),
  FOREIGN KEY (`sensor_id`) REFERENCES `sensors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Alerts Table
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `severity` ENUM('danger', 'warning', 'info', 'success') DEFAULT 'warning',
  `building_id` VARCHAR(50),
  `department_id` VARCHAR(50),
  `sensor_id` VARCHAR(50),
  `status` ENUM('Active', 'Acknowledged', 'Resolved') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL,
  FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`sensor_id`) REFERENCES `sensors`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. AI Predictions Table
CREATE TABLE IF NOT EXISTS `predictions` (
  `id` VARCHAR(50) PRIMARY KEY,
  `target_date` DATE NOT NULL,
  `predicted_kwh` DECIMAL(10, 2) NOT NULL,
  `predicted_cost` DECIMAL(10, 2) NOT NULL,
  `peak_hour_start` VARCHAR(10),
  `peak_hour_end` VARCHAR(10),
  `confidence_score` DECIMAL(5, 2) DEFAULT 95.00,
  `generated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. AI Optimization Suggestions Table
CREATE TABLE IF NOT EXISTS `optimization_suggestions` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL, -- HVAC, Lighting, Peak Shaving, Solar Offload
  `description` TEXT NOT NULL,
  `est_kwh_savings` DECIMAL(10, 2) NOT NULL,
  `est_cost_savings` DECIMAL(10, 2) NOT NULL,
  `priority` ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
  `status` ENUM('Pending', 'Applied', 'Dismissed') DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Activities Table
CREATE TABLE IF NOT EXISTS `activities` (
  `id` VARCHAR(50) PRIMARY KEY,
  `user_id` VARCHAR(50),
  `action` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `type` VARCHAR(50) DEFAULT 'system',
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
