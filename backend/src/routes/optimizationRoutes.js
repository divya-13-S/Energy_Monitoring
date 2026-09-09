/**
 * routes/optimizationRoutes.js — Energy Optimization Module Express Router
 * AI-Based Smart Energy Consumption Monitoring & Optimization System
 */

import express from 'express';
import {
  getSummary,
  getHighConsumption,
  getAnalysis,
  getRecommendations,
  updateStatus,
  getComparison,
} from '../controllers/optimizationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require authentication for all optimization endpoints
router.use(protect);

// GET /api/optimization/summary
router.get('/summary', getSummary);

// GET /api/optimization/high-consumption
router.get('/high-consumption', getHighConsumption);

// GET /api/optimization/analysis
router.get('/analysis', getAnalysis);

// GET /api/optimization/recommendations
router.get('/recommendations', getRecommendations);

// PATCH /api/optimization/recommendations/:id/status
router.patch('/recommendations/:id/status', updateStatus);

// GET /api/optimization/comparison
router.get('/comparison', getComparison);

export default router;
