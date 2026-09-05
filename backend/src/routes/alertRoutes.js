import express from 'express';
import { getAllAlerts, getAlertById, updateAlertStatus } from '../controllers/alertController.js';

const router = express.Router();

router.get('/', getAllAlerts);
router.get('/:id', getAlertById);
router.patch('/:id/status', updateAlertStatus);

export default router;
