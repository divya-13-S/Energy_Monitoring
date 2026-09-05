/**
 * models/Building.js — Building Data Model (MySQL prepared)
 * Schema maps to `buildings` table in database/schema.sql
 */

export class Building {
  constructor({ id, name, code, total_sensors = 0, active_sensors = 0, status = 'Connected' }) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.totalSensors = total_sensors;
    this.activeSensors = active_sensors;
    this.status = status;
  }

  // TODO: Implement SQL query methods once MySQL pool is connected
  // static async findAll() { ... }
  // static async findById(id) { ... }
}

export default Building;
