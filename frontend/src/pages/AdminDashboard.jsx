import React, { useState, useEffect } from 'react';
import {
  FiZap,
  FiCreditCard,
  FiCpu,
  FiTrendingDown,
  FiAlertTriangle,
  FiServer,
} from 'react-icons/fi';
import KpiCard from '../components/common/KpiCard/KpiCard';
import { getAdminDashboardKpis } from '../services/dashboardService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKpiData = async () => {
      try {
        const data = await getAdminDashboardKpis();
        setKpiData(data);
      } catch (error) {
        console.error('Failed to calculate dashboard KPI data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKpiData();
  }, []);

  return (
    <div className="admin-dashboard-container">
      {/* Welcome Section */}
      <section className="dashboard-welcome-section">
        <div className="welcome-text-wrapper">
          <h1 className="welcome-title">Welcome back, Admin</h1>
          <p className="welcome-subtitle">
            Monitor your institution's energy consumption, system performance, and efficiency from one place.
          </p>
        </div>
        <div className="last-updated-badge">
          <span className="updated-dot" />
          <span className="updated-text">Last updated: Just now</span>
        </div>
      </section>

      {/* KPI Overview Grid */}
      <section className="kpi-grid-section">
        {!loading && kpiData ? (
          <div className="kpi-grid">
            {/* KPI Card 1: Today's Energy Consumption */}
            <KpiCard
              title={kpiData.todayEnergy.title}
              value={kpiData.todayEnergy.value}
              unit={kpiData.todayEnergy.unit}
              icon={FiZap}
              trend={kpiData.todayEnergy.trend}
              trendDirection={kpiData.todayEnergy.trendDirection}
              supportingText={kpiData.todayEnergy.supportingText}
              variant={kpiData.todayEnergy.variant}
            />

            {/* KPI Card 2: Estimated Cost Today */}
            <KpiCard
              title={kpiData.todayCost.title}
              value={kpiData.todayCost.value}
              unit={kpiData.todayCost.unit}
              icon={FiCreditCard}
              trend={kpiData.todayCost.trend}
              trendDirection={kpiData.todayCost.trendDirection}
              supportingText={kpiData.todayCost.supportingText}
              variant={kpiData.todayCost.variant}
            />

            {/* KPI Card 3: Tomorrow's Prediction */}
            <KpiCard
              title={kpiData.tomorrowPrediction.title}
              value={kpiData.tomorrowPrediction.value}
              unit={kpiData.tomorrowPrediction.unit}
              icon={FiCpu}
              badge={kpiData.tomorrowPrediction.badge}
              supportingText={kpiData.tomorrowPrediction.supportingText}
              variant={kpiData.tomorrowPrediction.variant}
            />

            {/* KPI Card 4: Potential Energy Saving */}
            <KpiCard
              title={kpiData.potentialSaving.title}
              value={kpiData.potentialSaving.value}
              unit={kpiData.potentialSaving.unit}
              icon={FiTrendingDown}
              supportingText={kpiData.potentialSaving.supportingText}
              variant={kpiData.potentialSaving.variant}
            />

            {/* KPI Card 5: Active Alerts */}
            <KpiCard
              title={kpiData.activeAlerts.title}
              value={kpiData.activeAlerts.value}
              unit={kpiData.activeAlerts.unit}
              icon={FiAlertTriangle}
              supportingText={kpiData.activeAlerts.supportingText}
              variant={kpiData.activeAlerts.variant}
            />

            {/* KPI Card 6: Connected Buildings */}
            <KpiCard
              title={kpiData.connectedBuildings.title}
              value={kpiData.connectedBuildings.value}
              unit={kpiData.connectedBuildings.unit}
              icon={FiServer}
              supportingText={kpiData.connectedBuildings.supportingText}
              variant={kpiData.connectedBuildings.variant}
            />
          </div>
        ) : (
          <div className="kpi-loading-placeholder">Calculating energy metrics...</div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
