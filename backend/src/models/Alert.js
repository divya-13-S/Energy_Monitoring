/**
 * models/Alert.js — System Alert Data Model (MySQL prepared)
 * Schema maps to `alerts` table in database/schema.sql
 */

export class Alert {
  constructor({ id, timestamp, building_id, department_id, type, severity, status = 'Active', message }) {
    this.id = id;
    this.timestamp = timestamp;
    this.buildingId = building_id;
    this.departmentId = department_id;
    this.type = type;
    this.severity = severity;
    this.status = status;
    this.message = message;
  }
}

export default Alert;
