/**
 * controllers/userController.js — User Resource Handlers
 * Express controller handlers interacting with MySQL database via userService.
 */

import { sendSuccess, sendError } from '../utils/apiResponse.js';
import {
  getPaginatedUsers,
  getUserSummaryKPIs,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword
} from '../services/userService.js';

/**
 * GET /api/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      role: req.query.role,
      buildingId: req.query.buildingId || req.query.building,
      departmentId: req.query.departmentId || req.query.department,
      status: req.query.status,
    };

    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const result = await getPaginatedUsers(filters, pagination);
    return sendSuccess(res, result.users, `${result.users.length} users retrieved successfully`, 200, {
      pagination: result.pagination
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return sendError(res, err.message || 'Failed to retrieve users', 500);
  }
};

/**
 * GET /api/users/summary
 */
export const getSummary = async (_req, res) => {
  try {
    const summary = await getUserSummaryKPIs();
    return sendSuccess(res, summary, 'User summary metrics retrieved successfully');
  } catch (err) {
    console.error('Error fetching user summary:', err);
    return sendError(res, err.message || 'Failed to retrieve user summary', 500);
  }
};

/**
 * GET /api/users/:id
 */
export const getById = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, user, 'User details retrieved successfully');
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    return sendError(res, err.message || 'Failed to retrieve user details', 500);
  }
};

/**
 * POST /api/users
 */
export const create = async (req, res) => {
  try {
    const user = await createUser(req.body);
    return sendSuccess(res, user, 'User account created successfully', 201);
  } catch (err) {
    console.error('Error creating user:', err);
    return sendError(res, err.message || 'Failed to create user account', 400);
  }
};

/**
 * PUT /api/users/:id
 */
export const update = async (req, res) => {
  try {
    const user = await updateUser(req.params.id, req.body);
    return sendSuccess(res, user, 'User account updated successfully');
  } catch (err) {
    console.error('Error updating user:', err);
    return sendError(res, err.message || 'Failed to update user account', 400);
  }
};

/**
 * PATCH /api/users/:id/status
 */
export const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Active', 'Inactive'].includes(status)) {
      return sendError(res, 'Status must be either "Active" or "Inactive"', 400);
    }
    const user = await toggleUserStatus(req.params.id, status);
    return sendSuccess(res, user, `User account ${status === 'Active' ? 'activated' : 'deactivated'} successfully`);
  } catch (err) {
    console.error('Error changing user status:', err);
    return sendError(res, err.message || 'Failed to update account status', 400);
  }
};

/**
 * POST /api/users/:id/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await resetUserPassword(req.params.id, newPassword);
    return sendSuccess(res, user, 'User password reset successfully');
  } catch (err) {
    console.error('Error resetting password:', err);
    return sendError(res, err.message || 'Failed to reset user password', 400);
  }
};

export default {
  getAllUsers,
  getSummary,
  getById,
  create,
  update,
  changeStatus,
  resetPassword
};
