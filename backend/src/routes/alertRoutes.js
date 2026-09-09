/**
 * routes/alertRoutes.js — Express Router for Alert endpoints
 */

import express from 'express';
import {
  getAllAlerts,
  getSummary,
  getThresholds,
  updateThresholds,
  getById,
  acknowledge,
  resolve,
  triggerDetection
} from '../controllers/alertController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require authentication for all alert endpoints
router.use(protect);

// Specific routes first to avoid route parameter collision
router.get('/summary', getSummary);
router.get('/thresholds', getThresholds);
router.put('/thresholds', authorizeRoles('Administrator'), updateThresholds);
router.post('/detect', authorizeRoles('Administrator'), triggerDetection);

// General list route
router.get('/', getAllAlerts);

// ID-specific routes
router.get('/:id', getById);
router.patch('/:id/acknowledge', acknowledge);
router.patch('/:id/resolve', resolve);
router.patch('/:id/status', (req, res) => {
  if (req.body.status === 'Acknowledged') return acknowledge(req, res);
  return resolve(req, res);
});

export default router;
