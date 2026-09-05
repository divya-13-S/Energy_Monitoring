/**
 * models/Department.js — Department Data Model (MySQL prepared)
 * Schema maps to `departments` table in database/schema.sql
 */

export class Department {
  constructor({ id, name, code, building_id, hod_name, monthly_budget = 0 }) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.buildingId = building_id;
    this.hodName = hod_name;
    this.monthlyBudget = monthly_budget;
  }
}

export default Department;
