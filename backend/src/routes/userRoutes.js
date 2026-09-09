/**
 * routes/userRoutes.js — Express Router for User Management endpoints
 * All endpoints require Administrator authorization.
 */

import express from 'express';
import {
  getAllUsers,
  getSummary,
  getById,
  create,
  update,
  changeStatus,
  resetPassword
} from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce Administrator Authorization middleware guard across all User routes
router.use(protect);
router.use(authorizeRoles('Administrator'));

// Specific summary route first
router.get('/summary', getSummary);

// Base CRUD endpoints
router.get('/', getAllUsers);
router.post('/', create);

// ID-specific routes
router.get('/:id', getById);
router.put('/:id', update);
router.patch('/:id/status', changeStatus);
router.post('/:id/reset-password', resetPassword);

export default router;
