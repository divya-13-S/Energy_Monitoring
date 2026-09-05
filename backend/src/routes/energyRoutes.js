import express from 'express';
import { getEnergyConsumption } from '../controllers/energyController.js';

const router = express.Router();

router.get('/', getEnergyConsumption);

export default router;
