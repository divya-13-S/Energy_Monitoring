/**
 * routes/settingsRoutes.js — Express Router for System Settings
 * Admin-only endpoints.
 */

import express from 'express';
import { getSettings, update } from '../controllers/settingsController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guarded by authentication and Administrator authorization
router.use(protect);
router.use(authorizeRoles('Administrator'));

router.get('/', getSettings);
router.put('/', update);

export default router;
