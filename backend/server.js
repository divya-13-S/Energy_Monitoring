/**
 * server.js — Express Application Entry Point
 * AI-Based Smart Energy Consumption Monitoring and Optimization System
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { testDbConnection } from './src/config/db.js';

import dashboardRoutes from './src/routes/dashboardRoutes.js';
import buildingRoutes from './src/routes/buildingRoutes.js';
import departmentRoutes from './src/routes/departmentRoutes.js';
import energyRoutes from './src/routes/energyRoutes.js';
import alertRoutes from './src/routes/alertRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

import { errorMiddleware } from './src/middleware/errorMiddleware.js';
import { loggerMiddleware } from './src/middleware/loggerMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// ─── Health & Diagnostic Check ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Smart Energy Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DB_NAME || 'smart_energy_management',
  });
});

// ─── REST API Routes ──────────────────────────────────────────────────────────
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/energy-consumption', energyRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorMiddleware);

// ─── Start Server & Test MySQL Connection ──────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n================================================================`);
  console.log(`⚡ Smart Energy API Server running at http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Target Database: ${process.env.DB_NAME || 'smart_energy_management'}`);
  console.log(`================================================================\n`);

  await testDbConnection();
});

export default app;
