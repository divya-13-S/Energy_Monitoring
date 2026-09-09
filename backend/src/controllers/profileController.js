/**
 * controllers/profileController.js — Authenticated User Profile Controller
 * Provides self-service endpoint handlers for the current user.
 * Anti-IDOR: Derives user identity strictly from req.user.id.
 */

import { sendSuccess, sendError } from '../utils/apiResponse.js';
import {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
} from '../services/profileService.js';

/**
 * GET /api/profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const profile = await getUserProfile(userId);
    return sendSuccess(res, profile, 'User profile retrieved successfully');
  } catch (err) {
    console.error('Error fetching profile:', err);
    return sendError(res, err.message || 'Failed to retrieve profile', err.statusCode || 500);
  }
};

/**
 * PUT /api/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const updatedProfile = await updateUserProfile(userId, req.body);
    return sendSuccess(res, updatedProfile, 'Profile updated successfully');
  } catch (err) {
    console.error('Error updating profile:', err);
    return sendError(res, err.message || 'Failed to update profile', err.statusCode || 400);
  }
};

/**
 * PUT /api/profile/password
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return sendError(res, 'New password and confirm password do not match.', 400);
    }

    const result = await changeUserPassword(userId, { currentPassword, newPassword });
    return sendSuccess(res, result, 'Password changed successfully');
  } catch (err) {
    console.error('Error changing password:', err);
    return sendError(res, err.message || 'Failed to change password', err.statusCode || 400);
  }
};

export default {
  getProfile,
  updateProfile,
  changePassword,
};
