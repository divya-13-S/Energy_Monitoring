import express from 'express';
import { getAllDepartments, getDepartmentById } from '../controllers/departmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);

export default router;
