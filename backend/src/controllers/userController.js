/**
 * controllers/userController.js — User Management Handlers
 * Handles GET /api/users, GET /api/users/:id, POST /api/users
 */

import { sendSuccess, sendError } from '../utils/apiResponse.js';

const devUsers = [
  { id: 1, name: 'Campus Admin', email: 'admin@institution.edu', role: 'Administrator', status: 'Active' },
  { id: 2, name: 'Dr. R. K. Vance', email: 'hod.cse@institution.edu', role: 'HOD', department: 'CSE Department', status: 'Active' },
  { id: 3, name: 'Chief Electrician', email: 'maintenance@institution.edu', role: 'Electrician', status: 'Active' },
];

export const getAllUsers = (_req, res) => {
  try {
    return sendSuccess(res, devUsers, `${devUsers.length} users retrieved`);
  } catch (err) {
    return sendError(res, err.message);
  }
};

export const getUserById = (req, res) => {
  try {
    const user = devUsers.find(u => u.id === parseInt(req.params.id));
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user);
  } catch (err) {
    return sendError(res, err.message);
  }
};
