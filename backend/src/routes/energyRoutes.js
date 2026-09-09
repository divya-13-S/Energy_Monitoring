import express from 'express';
import { getEnergyConsumption } from '../controllers/energyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getEnergyConsumption);

export default router;
