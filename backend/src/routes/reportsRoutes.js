/**
 * routes/reportsRoutes.js — Administrator Reports Module Express Router
 * AI-Based Smart Energy Consumption Monitoring & Optimization System
 */

import express from 'express';
import {
  getSummary,
  getTrend,
  getBuildings,
  getCost,
  getSavings,
  getAlerts,
  getDetails,
  exportCsv,
  exportPdf,
} from '../controllers/reportsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require authentication for all reports endpoints
router.use(protect);

// GET /api/reports/summary
router.get('/summary', getSummary);

// GET /api/reports/trend
router.get('/trend', getTrend);

// GET /api/reports/buildings
router.get('/buildings', getBuildings);

// GET /api/reports/cost
router.get('/cost', getCost);

// GET /api/reports/savings
router.get('/savings', getSavings);

// GET /api/reports/alerts
router.get('/alerts', getAlerts);

// GET /api/reports/details
router.get('/details', getDetails);

// GET /api/reports/export/csv
router.get('/export/csv', exportCsv);

// GET /api/reports/export/pdf
router.get('/export/pdf', exportPdf);

export default router;
