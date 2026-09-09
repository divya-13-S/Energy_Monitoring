/**
 * services/profileService.js — User Profile Service
 * Operates on the authenticated user's record in MySQL `smart_energy_management.users`.
 */

import { query } from '../config/db.js';
import { hashPassword } from '../utils/setupUsersDb.js';

/**
 * Fetch full profile details for the given user ID
 */
export const getUserProfile = async (userId) => {
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
  const [user] = await query(sql, [userId]);
  if (!user) {
    const error = new Error('User profile not found.');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Update permitted personal profile information (name, phone)
 */
export const updateUserProfile = async (userId, data) => {
  const { name, phone } = data;

  const currentUser = await getUserProfile(userId);

  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      const error = new Error('Full name is required and cannot be empty.');
      error.statusCode = 400;
      throw error;
    }
  }

  const updatedName = name ? name.trim() : currentUser.name;
  const updatedPhone = phone !== undefined ? (phone ? phone.trim() : null) : currentUser.phone;

  await query(
    `UPDATE users
     SET name = ?, phone = ?, updated_at = NOW()
     WHERE id = ?;`,
    [updatedName, updatedPhone, userId]
  );

  return await getUserProfile(userId);
};

/**
 * Change current user password securely
 */
export const changeUserPassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword) {
    const error = new Error('Current password is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    const error = new Error('New password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }

  // Retrieve current user with password hash
  const [user] = await query('SELECT id, password_hash FROM users WHERE id = ?;', [userId]);
  if (!user) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    throw error;
  }

  // Verify current password against stored hash (or default master password)
  const currentHash = hashPassword(currentPassword);
  if (currentHash !== user.password_hash && currentPassword !== 'Admin@123') {
    const error = new Error('Current password does not match stored account credentials.');
    error.statusCode = 400;
    throw error;
  }

  if (currentPassword === newPassword) {
    const error = new Error('New password must be different from current password.');
    error.statusCode = 400;
    throw error;
  }

  const newHash = hashPassword(newPassword);
  await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?;', [newHash, userId]);

  return { message: 'Password updated successfully' };
};

export default {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
};
