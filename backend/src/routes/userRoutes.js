import express from 'express';
import { getAllUsers, getUserById } from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorizeRoles('Administrator'), getAllUsers);
router.get('/:id', protect, getUserById);

export default router;
