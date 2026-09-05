-- ====================================================================
-- Sample Seed Data for Smart Energy Consumption Monitoring
-- ====================================================================

USE `smart_energy_db`;

-- Buildings
INSERT INTO `buildings` (`id`, `name`, `code`, `type`, `floors`, `total_area_sqft`, `status`, `daily_avg_kwh`) VALUES
('bldg_01', 'Engineering Block A', 'ENG-A', 'Academic', 4, 45000.00, 'Optimal', 420.50),
('bldg_02', 'Science & Innovation Lab', 'SCI-B', 'Laboratory', 5, 52000.00, 'High Consumption', 680.00),
('bldg_03', 'Central Administrative Library', 'LIB-C', 'Library', 3, 38000.00, 'Optimal', 210.30),
('bldg_04', 'Student Auditorium & Complex', 'AUD-D', 'Auditorium', 2, 28000.00, 'Warning', 310.80),
('bldg_05', 'Hostel Block 1 & Dining', 'HST-E', 'Residential', 6, 60000.00, 'Optimal', 540.20)
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Departments
INSERT INTO `departments` (`id`, `name`, `code`, `building_id`, `hod_name`, `allocated_budget_kwh`, `current_consumption_kwh`) VALUES
('dept_01', 'Computer Science & Engineering', 'CSE', 'bldg_01', 'Dr. Sarah Jenkins', 5000.00, 3840.50),
('dept_02', 'Electrical & IoT Engineering', 'EEE', 'bldg_01', 'Prof. Robert Vance', 6000.00, 4920.80),
('dept_03', 'Mechanical & Energy Systems', 'MECH', 'bldg_02', 'Dr. Alan Grant', 7000.00, 6210.00),
('dept_04', 'Physics & Advanced Materials', 'PHYS', 'bldg_02', 'Dr. Elena Rostova', 4500.00, 3100.20),
('dept_05', 'Campus Facility Management', 'CFM', 'bldg_03', 'Eng. Mark Thompson', 3000.00, 1890.40)
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Sensors
INSERT INTO `sensors` (`id`, `sensor_code`, `name`, `type`, `building_id`, `department_id`, `room_location`, `status`) VALUES
('sns_01', 'SM-ENG-101', 'Main Feeder Meter Block A', 'Smart Meter', 'bldg_01', 'dept_01', 'Main Panel Room', 'online'),
('sns_02', 'SM-SCI-202', 'High Current Transformer Lab B', 'Current Transformer', 'bldg_02', 'dept_03', 'Heavy Machine Shop', 'online'),
('sns_03', 'SM-LIB-301', 'HVAC Chiller Meter Library', 'Smart Meter', 'bldg_03', 'dept_05', 'Basement Utility', 'online'),
('sns_04', 'SM-AUD-401', 'Auditorium Lighting Transducer', 'Voltage Transducer', 'bldg_04', 'dept_05', 'Stage Control Room', 'faulty'),
('sns_05', 'SM-HST-501', 'Hostel Solar PV Grid Sync Meter', 'Smart Meter', 'bldg_05', 'dept_05', 'Rooftop Inverter Bay', 'online'),
('sns_06', 'SM-ENG-102', 'Computer Lab 3 Meter', 'Smart Meter', 'bldg_01', 'dept_01', 'Room 304', 'offline')
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Energy Readings
INSERT INTO `energy_readings` (`sensor_id`, `voltage`, `current_amp`, `power_kw`, `frequency_hz`, `power_factor`, `kwh_consumed`) VALUES
('sns_01', 230.50, 45.20, 10.40, 50.01, 0.965, 482.40),
('sns_02', 415.20, 120.40, 50.10, 49.98, 0.940, 680.00),
('sns_03', 231.00, 22.80, 5.25, 50.00, 0.980, 210.30),
('sns_05', 230.10, 38.50, 8.85, 50.02, 0.975, 340.50);

-- Alerts
INSERT INTO `alerts` (`id`, `title`, `message`, `severity`, `building_id`, `department_id`, `sensor_id`, `status`) VALUES
('alt_01', 'Substation #2 Voltage Surge', 'Harmonic distortion voltage spiked above 248V in Science Block.', 'danger', 'bldg_02', 'dept_03', 'sns_02', 'Active'),
('alt_02', 'HVAC Consumption Threshold', 'Library HVAC running 35% above AI baseline model.', 'warning', 'bldg_03', 'dept_05', 'sns_03', 'Active'),
('alt_03', 'Sensor Offline: Auditorium', 'Auditorium Lighting Transducer lost telemetry ping.', 'danger', 'bldg_04', 'dept_05', 'sns_04', 'Active'),
('alt_04', 'Solar Inverter Efficiency Normal', 'Rooftop PV generated 420 kWh peak solar energy.', 'success', 'bldg_05', 'dept_05', 'sns_05', 'Resolved');

-- Predictions
INSERT INTO `predictions` (`id`, `target_date`, `predicted_kwh`, `predicted_cost`, `peak_hour_start`, `peak_hour_end`, `confidence_score`) VALUES
('pred_01', CURDATE() + INTERVAL 1 DAY, 2450.00, 367.50, '13:00', '16:00', 96.80),
('pred_02', CURDATE() + INTERVAL 30 DAY, 72500.00, 10875.00, '12:30', '16:30', 94.50);

-- Optimization Suggestions
INSERT INTO `optimization_suggestions` (`id`, `title`, `category`, `description`, `est_kwh_savings`, `est_cost_savings`, `priority`, `status`) VALUES
('opt_01', 'Optimize Science Lab HVAC Schedule', 'HVAC', 'Pre-cool Science Block B labs between 07:00-08:00 AM using solar tariff rate instead of grid peak hours.', 180.50, 27.00, 'High', 'Pending'),
('opt_02', 'Dim Library Corridor Lighting', 'Lighting', 'Activate motion-sensing dimming in Library stack corridors during non-peak study hours.', 65.00, 9.75, 'Medium', 'Pending'),
('opt_03', 'Solar Battery Energy Offloading', 'Peak Shaving', 'Offload 80 kWh from Hostel Solar Storage during 02:00-04:00 PM peak demand window.', 240.00, 36.00, 'High', 'Pending');

-- Activities
INSERT INTO `activities` (`id`, `user_id`, `action`, `description`, `type`) VALUES
('act_01', 'usr_001', 'AI Optimization Triggered', 'Executed peak shaving algorithm for Engineering Block A.', 'AI System'),
('act_02', 'usr_001', 'Sensor Reconfigured', 'Updated ping interval for Smart Meter SM-ENG-101 to 5 seconds.', 'Configuration'),
('act_03', 'usr_001', 'Alert Acknowledged', 'Maintenance staff dispatched to inspect Substation #2.', 'Alert Action');
