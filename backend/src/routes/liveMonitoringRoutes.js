/**
 * routes/liveMonitoringRoutes.js — Express Router for Live Telemetry Monitoring APIs
 * AI-Based Smart Energy Consumption Monitoring & Optimization System
 */

import express from 'express';
import {
  getLiveSummary,
  getLiveReadings,
  getBuildingLiveMetrics,
  getDepartmentLiveMetrics,
  getAbnormalConditions,
} from '../controllers/liveMonitoringController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// GET /api/live-monitoring/summary
router.get('/summary', getLiveSummary);

// GET /api/live-monitoring/readings
router.get('/readings', getLiveReadings);

// GET /api/live-monitoring/buildings
router.get('/buildings', getBuildingLiveMetrics);

// GET /api/live-monitoring/departments
router.get('/departments', getDepartmentLiveMetrics);

// GET /api/live-monitoring/abnormal
router.get('/abnormal', getAbnormalConditions);

export default router;
