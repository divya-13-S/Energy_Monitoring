/**
 * controllers/authController.js — Authentication Handlers
 * Handles POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
 */

import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const login = (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // In development stub, provide authenticated response
    const mockUser = {
      id: 1,
      name: email ? email.split('@')[0] : 'Administrator',
      email: email || 'admin@institution.edu',
      role: role || 'Administrator', // 'Administrator', 'HOD', 'Electrician'
      department: role === 'HOD' ? 'CSE Department' : null,
      token: 'dev_mock_jwt_token_' + Date.now(),
    };

    return sendSuccess(res, mockUser, 'Authentication successful');
  } catch (err) {
    return sendError(res, err.message, 400);
  }
};

export const getCurrentUser = (req, res) => {
  try {
    const user = req.user || {
      id: 1,
      name: 'System Administrator',
      email: 'admin@institution.edu',
      role: 'Administrator',
    };
    return sendSuccess(res, user, 'Current user profile');
  } catch (err) {
    return sendError(res, err.message);
  }
};

export const logout = (_req, res) => {
  return sendSuccess(res, null, 'Logged out successfully');
};
