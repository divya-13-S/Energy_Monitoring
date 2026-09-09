import express from 'express';
import { getAllBuildings, getBuildingById } from '../controllers/buildingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllBuildings);
router.get('/:id', getBuildingById);

export default router;
