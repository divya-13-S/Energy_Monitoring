/**
 * models/EnergyReading.js — Energy Reading Telemetry Data Model (MySQL prepared)
 * Schema maps to `energy_readings` table in database/schema.sql
 */

export class EnergyReading {
  constructor({ id, timestamp, building_id, department_id, power_kw, energy_kwh, voltage = 230, current_a = 0, power_factor = 0.95 }) {
    this.id = id;
    this.timestamp = timestamp;
    this.buildingId = building_id;
    this.departmentId = department_id;
    this.powerKw = power_kw;
    this.energyKwh = energy_kwh;
    this.voltage = voltage;
    this.currentA = current_a;
    this.powerFactor = power_factor;
  }
}

export default EnergyReading;
