import express from 'express';
import { getAllBuildings, getBuildingById } from '../controllers/buildingController.js';

const router = express.Router();

router.get('/', getAllBuildings);
router.get('/:id', getBuildingById);

export default router;
