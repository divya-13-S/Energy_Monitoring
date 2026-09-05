/**
 * models/User.js — User Account Data Model (MySQL prepared)
 * Schema maps to `users` table in database/schema.sql
 */

export class User {
  constructor({ id, name, email, password_hash, role = 'Administrator', department_id = null, status = 'Active' }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.passwordHash = password_hash;
    this.role = role;
    this.departmentId = department_id;
    this.status = status;
  }
}

export default User;
