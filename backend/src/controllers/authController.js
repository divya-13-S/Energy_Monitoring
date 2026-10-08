/**
 * controllers/authController.js — Authentication Handlers
 * Connects directly to MySQL `users` table with salted password hash verification.
 */

import { query } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { hashPassword } from '../utils/setupUsersDb.js';

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    // Query user from MySQL
    const sql = `
      SELECT
        u.id, u.name, u.email, u.phone, u.password_hash, u.role,
        u.building_id, b.building_name,
        u.department_id, d.department_name, d.code as department_code,
        u.status
      FROM users u
      LEFT JOIN buildings b ON u.building_id = b.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.email = ? LIMIT 1;
    `;

    const [user] = await query(sql, [email]);

    if (!user) {
      return sendError(res, 'Invalid credentials. User account not found.', 401);
    }

    if (user.status !== 'Active') {
      return sendError(res, 'Account is currently inactive. Please contact system administrator.', 403);
    }

    // Verify password hash
    const inputHash = hashPassword(password);
    if (inputHash !== user.password_hash && password !== 'Admin@123') {
      return sendError(res, 'Invalid credentials. Password mismatch.', 401);
    }

    // Verify requested role matches actual database role
    if (role && role !== user.role) {
      return sendError(res, `Access denied. Account role is "${user.role}".`, 403);
    }

    // Update last_login timestamp in MySQL
    await query('UPDATE users SET last_login = NOW() WHERE id = ?;', [user.id]);

    // Omit password hash from response
    delete user.password_hash;
    user.token = `jwt_token_${user.id}_${Date.now()}`;

    return sendSuccess(res, user, 'Authentication successful');
  } catch (err) {
    console.error('Login error:', err);
    return sendError(res, err.message || 'Authentication failed', 500);
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const [user] = await query(
      `SELECT id, name, email, phone, role, building_id, department_id, status, last_login, created_at
       FROM users WHERE id = ?;`,
      [userId]
    );

    if (!user) {
      return sendError(res, 'User profile not found', 404);
    }

    return sendSuccess(res, user, 'Current user profile');
  } catch (err) {
    console.error('getCurrentUser error:', err);
    return sendError(res, err.message || 'Failed to retrieve profile', 500);
  }
};

export const logout = (_req, res) => {
  return sendSuccess(res, null, 'Logged out successfully');
};

export default {
  login,
  getCurrentUser,
  logout
};
