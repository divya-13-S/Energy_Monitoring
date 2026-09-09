/**
 * routes/profileRoutes.js — Express Router for Profile Management
 * Protected endpoints operating on the authenticated user's profile.
 */

import express from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guarded by authentication token middleware
router.use(protect);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', changePassword);

export default router;
