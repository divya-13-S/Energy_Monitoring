/**
 * routes/sensorRoutes.js — Express Router for Sensor Management endpoints
 * Endpoints protected for Administrator & Electrician / Maintenance Staff.
 */

import express from 'express';
import {
  getAllSensors,
  getSummary,
  getById,
  create,
  update,
  changeStatus,
  getHistory,
} from '../controllers/sensorController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication & role authorization
router.use(protect);
router.use(authorizeRoles('Administrator', 'Electrician / Maintenance Staff'));

// Summary route
router.get('/summary', getSummary);

// Base endpoints
router.get('/', getAllSensors);
router.post('/', authorizeRoles('Administrator'), create);

// Parameterized routes
router.get('/:id', getById);
router.put('/:id', authorizeRoles('Administrator'), update);
router.patch('/:id/status', changeStatus);
router.get('/:id/history', getHistory);

export default router;
