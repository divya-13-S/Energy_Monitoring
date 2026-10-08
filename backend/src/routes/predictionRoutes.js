/**
 * routes/predictionRoutes.js — Express Router for AI Prediction API
 * Secured with authentication & role-based authorization guards.
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { handlePredictEnergy } from '../controllers/predictionController.js';

const router = express.Router();

/**
 * POST /api/ai-prediction/predict
 * Generates energy consumption prediction for educational buildings.
 */
router.post('/predict', protect, handlePredictEnergy);

export default router;
