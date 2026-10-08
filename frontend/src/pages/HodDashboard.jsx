import React, { useState, useEffect, useCallback } from 'react';
import {
  FiZap,
  FiCreditCard,
  FiCpu,
  FiTrendingDown,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiCalendar,
  FiLayers,
  FiServer,
  FiActivity,
  FiClock,
  FiShield,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import KpiCard from '../components/common/KpiCard/KpiCard';
import Badge from '../components/common/Badge/Badge';
import Button from '../components/common/Button/Button';
import EmptyState from '../components/common/EmptyState/EmptyState';
import ErrorState from '../components/common/ErrorState/ErrorState';
import Spinner from '../components/common/Spinner/Spinner';
import { getAdminDashboardKpis } from '../services/dashboardService';
import { fetchReportTrend } from '../services/reportsService';
import { fetchOptimizationRecommendations } from '../services/optimizationService';
import { getAlerts } from '../services/alertService';
import './HodDashboard.css';

const HodDashboard = () => {
  const { user, role } = useAuth();

  // State Management
  const [kpiData, setKpiData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  // HOD Assigned Scope Info
  const deptName = user?.department_name || user?.department || 'Computer Science & Engineering';
  const bldgName = user?.building_name || user?.building || 'Sunflower Block (Building 4)';
  const userDeptId = user?.department_id || 8;

  // Load Dashboard Data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. KPI Summary
      const kpis = await getAdminDashboardKpis();
      setKpiData(kpis);

      // 2. Trend Data
      const trend = await fetchReportTrend({ period: selectedPeriod, department_id: userDeptId });
      setTrendData(trend || []);

      // 3. AI Recommendations
      const recs = await fetchOptimizationRecommendations({ department_id: userDeptId });
      setRecommendations(recs?.slice(0, 4) || []);

      // 4. Scope Alerts
      const alertRes = await getAlerts({}, {}, { role: 'Department Staff (HOD)', userDeptId });
      const alertList = Array.isArray(alertRes) ? alertRes : (alertRes?.data || []);
      setAlerts(alertList.slice(0, 4));

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error loading HOD Dashboard data:', err);
      setError('Unable to load department telemetry data. Please verify network connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, userDeptId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Chart Period Change
  const handlePeriodChange = async (period) => {
    setSelectedPeriod(period);
    setChartLoading(true);
    try {
      const trend = await fetchReportTrend({ period, department_id: userDeptId });
      setTrendData(trend || []);
    } catch (err) {
      console.error('Error switching trend period:', err);
    } finally {
      setChartLoading(false);
    }
  };

  // Sub-zone Department Breakdown Data
  const roomBreakdown = [
    { name: 'Computer Science Labs 1 & 2', kwh: 112.4, share: 39.5, status: 'High Load', variant: 'warning' },
    { name: 'Department Server Room', kwh: 78.2, share: 27.5, status: 'Optimal', variant: 'success' },
    { name: 'Faculty & Research Cabins', kwh: 54.1, share: 19.0, status: 'Normal', variant: 'info' },
    { name: 'Smart Seminar Hall & Classrooms', kwh: 39.8, share: 14.0, status: 'Low Load', variant: 'success' },
  ];

  if (loading) {
    return (
      <div className="hod-dashboard-loading">
        <Spinner size="lg" label="Synchronizing Department Telemetry & AI Analytics..." />
      </div>
    );
  }

  if (error && !kpiData) {
    return (
      <div className="hod-dashboard-error">
        <ErrorState
          title="Telemetry Connection Issue"
          message={error}
          onRetry={loadDashboardData}
          retryLabel="Reload Telemetry"
        />
      </div>
    );
  }

  return (
    <div className="hod-dashboard-root animate-fade-in">
      {/* 1. Header / Welcome Banner */}
      <section className="hod-welcome-card">
        <div className="welcome-main-info">
          <div className="welcome-title-row">
            <h1 className="welcome-heading">Welcome back, {user?.name || 'Department HOD'}</h1>
            <div className="scope-badge-container">
              <Badge variant="cyan" size="md">
                <FiShield style={{ marginRight: '6px' }} /> Assigned Scope: {deptName}
              </Badge>
              <Badge variant="blue" size="md">
                <FiServer style={{ marginRight: '6px' }} /> {bldgName}
              </Badge>
            </div>
          </div>
          <p className="welcome-description">
            Real-time energy consumption telemetry, peak load analytics, and AI recommendations for your authorized department scope.
          </p>
        </div>

        <div className="welcome-actions-wrapper">
          <div className="live-status-pill">
            <span className="live-status-dot" />
            <span>Scope Telemetry Active</span>
            <span className="updated-timestamp">({lastUpdated})</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={FiRefreshCw}
            onClick={loadDashboardData}
            title="Refresh Live Telemetry Data"
          >
            Refresh Data
          </Button>
        </div>
      </section>

      {/* 2. 6 KPI Cards Grid */}
      <section className="hod-kpi-grid">
        {kpiData && (
          <>
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

            {/* KPI Card 6: Assigned Scope */}
            <KpiCard
              title={kpiData.connectedBuildings.title || 'Assigned Scope'}
              value={kpiData.connectedBuildings.value || '1 / 1'}
              unit={kpiData.connectedBuildings.unit || 'Active'}
              icon={FiCheckCircle}
              supportingText={`Scope: ${deptName}`}
              variant="success"
            />
          </>
        )}
      </section>

      {/* 3. Main Content Analytics Grid (Chart + Sub-zone Breakdown) */}
      <section className="hod-analytics-grid">
        {/* Energy Consumption Trend Chart Card */}
        <div className="hod-card chart-card-container">
          <div className="card-header-bar">
            <div className="card-header-titles">
              <h2 className="card-heading">
                <FiActivity className="heading-icon" /> Department Energy Consumption Trend
              </h2>
              <span className="card-subheading">Live telemetry profile for {deptName}</span>
            </div>

            <div className="period-toggle-group">
              <button
                className={`period-btn ${selectedPeriod === 'today' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('today')}
              >
                Today
              </button>
              <button
                className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('week')}
              >
                7 Days
              </button>
              <button
                className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('month')}
              >
                30 Days
              </button>
            </div>
          </div>

          <div className="chart-wrapper">
            {chartLoading ? (
              <div className="chart-loading-overlay">
                <Spinner size="md" label="Updating trend resolution..." />
              </div>
            ) : trendData && trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="kwhGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    }}
                    formatter={(val) => [`${val} kWh`, 'Energy Consumption']}
                  />
                  <Legend verticalAlign="top" height={36} align="right" />
                  <Area
                    type="monotone"
                    dataKey="energyKwh"
                    name="Energy Consumption (kWh)"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#kwhGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No Telemetry Trend Data"
                description="Live energy telemetry records for this time period are currently unavailable."
              />
            )}
          </div>
        </div>

        {/* Room / Sub-zone Consumption Breakdown Card */}
        <div className="hod-card breakdown-card-container">
          <div className="card-header-bar">
            <div className="card-header-titles">
              <h2 className="card-heading">
                <FiLayers className="heading-icon" /> Sub-Zone Energy Distribution
              </h2>
              <span className="card-subheading">Department load breakdown</span>
            </div>
          </div>

          <div className="zone-list-wrapper">
            {roomBreakdown.map((zone, idx) => (
              <div key={idx} className="zone-item-row">
                <div className="zone-info-top">
                  <span className="zone-name">{zone.name}</span>
                  <div className="zone-metrics">
                    <span className="zone-kwh">{zone.kwh} kWh</span>
                    <Badge variant={zone.variant} size="sm">
                      {zone.status}
                    </Badge>
                  </div>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill fill-${zone.variant}`}
                    style={{ width: `${zone.share}%` }}
                  />
                </div>
                <div className="zone-info-bottom">
                  <span className="zone-share-text">{zone.share}% of department total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Lower Operations Grid (AI Recommendations + Scope Alerts) */}
      <section className="hod-operations-grid">
        {/* AI Recommendations Card */}
        <div className="hod-card recommendations-card">
          <div className="card-header-bar">
            <div className="card-header-titles">
              <h2 className="card-heading">
                <FiCpu className="heading-icon" /> AI Energy Optimization Actions
              </h2>
              <span className="card-subheading">Prescriptive opportunities for {deptName}</span>
            </div>
          </div>

          <div className="recommendations-list">
            {recommendations && recommendations.length > 0 ? (
              recommendations.map((rec) => (
                <div key={rec.id || rec.recommendation_id} className="recommendation-item">
                  <div className="rec-header">
                    <span className="rec-title">{rec.title || rec.action_title}</span>
                    <Badge
                      variant={rec.priority === 'High' ? 'warning' : 'blue'}
                      size="sm"
                    >
                      {rec.priority || 'Medium'} Priority
                    </Badge>
                  </div>
                  <p className="rec-desc">{rec.description || rec.action_description}</p>
                  <div className="rec-footer">
                    <div className="rec-savings-pill">
                      <FiTrendingDown className="savings-icon" />
                      <span>Potential Saving: <strong>{rec.estimated_saving_kwh || rec.potential_kwh || 12.5} kWh</strong> / day</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Department Optimal"
                description="No urgent AI energy optimization actions required for your scope."
              />
            )}
          </div>
        </div>

        {/* Scope Alerts Card */}
        <div className="hod-card alerts-card">
          <div className="card-header-bar">
            <div className="card-header-titles">
              <h2 className="card-heading">
                <FiAlertTriangle className="heading-icon" /> Recent Department Alerts
              </h2>
              <span className="card-subheading">Active anomalies & electrical health</span>
            </div>
          </div>

          <div className="alerts-list">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id || alert.alert_id} className="alert-item">
                  <div className="alert-icon-wrapper">
                    <FiAlertTriangle className={`alert-status-icon severity-${alert.severity?.toLowerCase() || 'warning'}`} />
                  </div>
                  <div className="alert-details">
                    <div className="alert-top-line">
                      <span className="alert-title">{alert.title || alert.alert_type || 'Energy Anomaly'}</span>
                      <span className="alert-time">
                        <FiClock style={{ marginRight: '4px' }} />
                        {alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </span>
                    </div>
                    <p className="alert-msg">{alert.message || alert.description || 'Power telemetry exceeded expected baseline.'}</p>
                    <div className="alert-bottom-line">
                      <span className="alert-location">{alert.building_name || bldgName} • Meter #{alert.sensor_id || 4}</span>
                      <Badge variant={alert.status === 'Active' ? 'warning' : 'cyan'} size="sm">
                        {alert.status || 'Active'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-alerts-placeholder">
                <FiCheckCircle className="no-alerts-icon" />
                <span className="no-alerts-text">No active energy anomalies in your assigned department.</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HodDashboard;
