/**
 * services/userService.js — User Management & Database Service
 * Connects directly to MySQL database `smart_energy_management`.
 */

import { query } from '../config/db.js';
import { hashPassword } from '../utils/setupUsersDb.js';

/**
 * Retrieve paginated user list with building and department metadata
 */
export const getPaginatedUsers = async (filters = {}, pagination = {}) => {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 10;
  const offset = (page - 1) * limit;

  const conditions = ['1=1'];
  const params = [];

  const { search, role, buildingId, departmentId, status } = filters;

  if (search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (role && role !== 'all') {
    conditions.push('u.role = ?');
    params.push(role);
  }

  if (buildingId && buildingId !== 'all') {
    conditions.push('u.building_id = ?');
    params.push(buildingId);
  }

  if (departmentId && departmentId !== 'all') {
    conditions.push('u.department_id = ?');
    params.push(departmentId);
  }

  if (status && status !== 'all') {
    conditions.push('u.status = ?');
    params.push(status);
  }

  const whereSql = conditions.join(' AND ');

  // 1. Total Count Query
  const countSql = `
    SELECT COUNT(*) as total
    FROM users u
    WHERE ${whereSql};
  `;
  const countRes = await query(countSql, params);
  const total = countRes[0]?.total || 0;

  // 2. Data Query
  const dataSql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.role,
      u.building_id,
      b.building_name,
      b.building_code,
      u.department_id,
      d.department_name,
      d.code as department_code,
      u.status,
      u.last_login,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN buildings b ON u.building_id = b.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE ${whereSql}
    ORDER BY u.created_at DESC
    LIMIT ${limit} OFFSET ${offset};
  `;

  const users = await query(dataSql, params);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Compute summary KPI metrics for users
 */
export const getUserSummaryKPIs = async () => {
  const summarySql = `
    SELECT
      COUNT(*) as total_users,
      SUM(CASE WHEN role = 'Administrator' THEN 1 ELSE 0 END) as admin_count,
      SUM(CASE WHEN role = 'Department Staff (HOD)' THEN 1 ELSE 0 END) as hod_count,
      SUM(CASE WHEN role = 'Electrician / Maintenance Staff' THEN 1 ELSE 0 END) as electrician_count,
      SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_count
    FROM users;
  `;

  const [res] = await query(summarySql);

  return {
    totalUsers: parseInt(res.total_users) || 0,
    admins: parseInt(res.admin_count) || 0,
    hods: parseInt(res.hod_count) || 0,
    electricians: parseInt(res.electrician_count) || 0,
    activeUsers: parseInt(res.active_count) || 0,
  };
};

/**
 * Retrieve single user by ID
 */
export const getUserById = async (id) => {
  const sql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.role,
      u.building_id,
      b.building_name,
      b.building_code,
      u.department_id,
      d.department_name,
      d.code as department_code,
      u.status,
      u.last_login,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN buildings b ON u.building_id = b.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?;
  `;
  const [user] = await query(sql, [id]);
  return user || null;
};

/**
 * Create a new user account
 */
export const createUser = async (userData) => {
  const { name, email, phone, role, building_id, department_id, password, status = 'Active' } = userData;

  if (!name || !email || !role || !password) {
    throw new Error('Name, email, role, and password are required.');
  }

  // Check email uniqueness
  const [existing] = await query('SELECT id FROM users WHERE email = ? LIMIT 1;', [email]);
  if (existing) {
    throw new Error(`A user account with email "${email}" already exists.`);
  }

  // Validate role/scope constraints
  let bId = building_id ? parseInt(building_id) : null;
  let dId = department_id ? parseInt(department_id) : null;

  if (role === 'Administrator') {
    bId = null;
    dId = null;
  } else if (role === 'Department Staff (HOD)') {
    if (!bId || !dId) {
      throw new Error('Building and Department assignments are required for HOD / Department Staff role.');
    }
  }

  const pwdHash = hashPassword(password);

  const res = await query(
    `INSERT INTO users (name, email, phone, password_hash, role, building_id, department_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [name, email, phone || null, pwdHash, role, bId, dId, status]
  );

  const newId = res.insertId;
  return await getUserById(newId);
};

/**
 * Update an existing user account
 */
export const updateUser = async (id, userData) => {
  const { name, email, phone, role, building_id, department_id, status } = userData;

  const user = await getUserById(id);
  if (!user) {
    throw new Error('User not found.');
  }

  // Check email uniqueness if email changed
  if (email && email !== user.email) {
    const [existing] = await query('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1;', [email, id]);
    if (existing) {
      throw new Error(`Email "${email}" is already in use by another user account.`);
    }
  }

  // Validate role/scope constraints
  let bId = building_id !== undefined ? (building_id ? parseInt(building_id) : null) : user.building_id;
  let dId = department_id !== undefined ? (department_id ? parseInt(department_id) : null) : user.department_id;

  const targetRole = role || user.role;

  if (targetRole === 'Administrator') {
    bId = null;
    dId = null;
  } else if (targetRole === 'Department Staff (HOD)') {
    if (!bId || !dId) {
      throw new Error('Building and Department assignments are required for HOD / Department Staff role.');
    }
  }

  await query(
    `UPDATE users
     SET name = ?, email = ?, phone = ?, role = ?, building_id = ?, department_id = ?, status = ?
     WHERE id = ?;`,
    [name || user.name, email || user.email, phone !== undefined ? phone : user.phone, targetRole, bId, dId, status || user.status, id]
  );

  return await getUserById(id);
};

/**
 * Toggle user account status (Active / Inactive) with Last Admin Protection
 */
export const toggleUserStatus = async (id, newStatus) => {
  const user = await getUserById(id);
  if (!user) {
    throw new Error('User not found.');
  }

  // Last Active Admin Protection
  if (user.role === 'Administrator' && newStatus === 'Inactive') {
    const [res] = await query("SELECT COUNT(*) as count FROM users WHERE role = 'Administrator' AND status = 'Active';");
    const activeAdminCount = res?.count || 0;
    if (activeAdminCount <= 1) {
      throw new Error('Operation rejected: Cannot deactivate the last active Administrator account.');
    }
  }

  await query('UPDATE users SET status = ? WHERE id = ?;', [newStatus, id]);
  return await getUserById(id);
};

/**
 * Reset user password securely
 */
export const resetUserPassword = async (id, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  const user = await getUserById(id);
  if (!user) {
    throw new Error('User not found.');
  }

  const newHash = hashPassword(newPassword);
  await query('UPDATE users SET password_hash = ? WHERE id = ?;', [newHash, id]);

  return await getUserById(id);
};

export default {
  getPaginatedUsers,
  getUserSummaryKPIs,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword
};
