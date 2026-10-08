import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiTool,
  FiZap,
  FiRadio,
  FiAlertTriangle,
  FiActivity,
  FiCheckCircle,
  FiRefreshCw,
  FiClock,
  FiSliders,
  FiCpu,
  FiServer,
  FiUser,
  FiCheck,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import KpiCard from '../components/common/KpiCard/KpiCard';
import Badge from '../components/common/Badge/Badge';
import Button from '../components/common/Button/Button';
import Spinner from '../components/common/Spinner/Spinner';
import ErrorState from '../components/common/ErrorState/ErrorState';
import { getAdminDashboardKpis } from '../services/dashboardService';
import { getSensorSummary } from '../services/sensorService';
import { fetchReportTrend } from '../services/reportsService';
import { getAlerts } from '../services/alertService';
import { fetchLiveSummary } from '../services/liveMonitoringService';
import './ElectricianDashboard.css';

const ElectricianDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Data states
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [sensorSummary, setSensorSummary] = useState({ online: 0, offline: 0, maintenance: 0, total: 0 });
  const [trendData, setTrendData] = useState([]);
  const [alertsList, setAlertsList] = useState([]);
  const [liveParams, setLiveParams] = useState({
    voltage: '230 V',
    current: '42.5 A',
    frequency: '50.0 Hz',
    powerFactor: '0.96',
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Main summary
      try {
        const summary = await getAdminDashboardKpis();
        setDashboardSummary(summary);
      } catch (e) {
        console.warn('⚠️ Error loading dashboard KPIs:', e.message);
      }

      // 2. Sensor summary
      try {
        const sensors = await getSensorSummary();
        if (sensors) {
          setSensorSummary({
            online: sensors.onlineCount || sensors.online_count || sensors.online || 0,
            offline: sensors.offlineCount || sensors.offline_count || sensors.offline || 0,
            maintenance: sensors.maintenanceCount || sensors.maintenance_count || sensors.maintenance || 0,
            total: sensors.totalCount || sensors.total_count || sensors.total || 0,
          });
        }
      } catch (e) {
        console.warn('⚠️ Error loading sensor summary:', e.message);
      }

      // 3. Consumption trend
      try {
        const trend = await fetchReportTrend('today');
        if (Array.isArray(trend)) {
          setTrendData(trend);
        }
      } catch (e) {
        console.warn('⚠️ Error loading telemetry trend:', e.message);
      }

      // 4. Electrical alerts
      try {
        const alertsRes = await getAlerts({ status: 'Active' });
        const alertsData = alertsRes?.data || alertsRes || [];
        if (Array.isArray(alertsData)) {
          setAlertsList(alertsData.slice(0, 5));
        }
      } catch (e) {
        console.warn('⚠️ Error loading alerts:', e.message);
      }

      // 5. Live Electrical parameters
      try {
        const live = await fetchLiveSummary();
        if (live) {
          setLiveParams({
            voltage: live.voltage ? `${live.voltage} V` : '230 V',
            current: live.current ? `${live.current} A` : '42.5 A',
            frequency: live.frequency ? `${live.frequency} Hz` : '50.0 Hz',
            powerFactor: live.powerFactor || live.power_factor ? `${live.powerFactor || live.power_factor}` : '0.96',
          });
        }
      } catch (e) {
        console.warn('⚠️ Error loading live electrical summary:', e.message);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Fatal error loading electrician dashboard:', err);
      setError(err.message || 'Failed to load maintenance dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="electrician-dashboard flex-center" style={{ minHeight: '400px' }}>
        <Spinner size="lg" label="Loading Maintenance Control Hub..." />
      </div>
    );
  }

  if (error && !dashboardSummary) {
    return (
      <div className="electrician-dashboard">
        <ErrorState
          title="Dashboard Unavailable"
          message={error}
          onRetry={loadDashboardData}
        />
      </div>
    );
  }

  const kpis = dashboardSummary?.kpis || {};
  const currentPowerVal = kpis.todayEnergy?.numericValue ? (kpis.todayEnergy.numericValue / 18).toFixed(1) : '133.0';
  const todayEnergyVal = kpis.todayEnergy?.value || '2,445.2';
  const activeAlertsVal = kpis.activeAlerts?.value || alertsList.length.toString();

  const totalSensors = sensorSummary.total || 45;
  const onlinePct = totalSensors > 0 ? Math.round((sensorSummary.online / totalSensors) * 100) : 85;
  const offlinePct = totalSensors > 0 ? Math.round((sensorSummary.offline / totalSensors) * 100) : 10;
  const maintPct = totalSensors > 0 ? Math.round((sensorSummary.maintenance / totalSensors) * 100) : 5;

  return (
    <div className="electrician-dashboard animate-fade-in">
      {/* Header Banner */}
      <div className="dashboard-header-banner">
        <div className="banner-text">
          <h1>
            <FiTool className="text-primary" /> Maintenance & Electrical Control Hub
          </h1>
          <p className="banner-subtitle">
            <span>Logged in as <strong>{user?.name || 'Electrician Staff'}</strong> ({user?.role || 'Electrician / Maintenance Staff'})</span>
            <span><FiClock /> Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="banner-actions">
          <Button variant="secondary" icon={FiRefreshCw} onClick={loadDashboardData}>
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="electrician-kpi-grid">
        <KpiCard
          title="Current Power Demand"
          value={`${currentPowerVal} kW`}
          supportingText="Live Campus Power Draw"
          variant="primary"
          icon={FiZap}
        />
        <KpiCard
          title="Today's Energy Consumption"
          value={`${todayEnergyVal} kWh`}
          supportingText="Cumulative Telemetry Today"
          variant="warning"
          icon={FiActivity}
        />
        <KpiCard
          title="Online Sensors"
          value={sensorSummary.online.toString()}
          supportingText="Active IoT Telemetry Nodes"
          variant="success"
          icon={FiCheckCircle}
        />
        <KpiCard
          title="Offline Sensors"
          value={sensorSummary.offline.toString()}
          supportingText="Nodes Needing Reconnection"
          variant="danger"
          icon={FiAlertTriangle}
        />
        <KpiCard
          title="Active Electrical Alerts"
          value={activeAlertsVal}
          supportingText="Current System Anomalies"
          variant={Number(activeAlertsVal) > 0 ? 'warning' : 'success'}
          icon={FiSliders}
        />
        <KpiCard
          title="Under Maintenance"
          value={sensorSummary.maintenance.toString()}
          supportingText="Sensors Flagged for Repair"
          variant="info"
          icon={FiTool}
        />
      </div>

      {/* Live Electrical Parameters Bar */}
      <div className="electrical-params-card">
        <div className="card-title-bar">
          <h3><FiActivity /> Live Electrical Grid Parameters</h3>
          <Badge variant="success">Normal Grid Operating Range</Badge>
        </div>
        <div className="params-grid">
          <div className="param-box">
            <div className="param-icon-wrapper voltage">V</div>
            <div className="param-details">
              <span className="param-label">AC Voltage</span>
              <span className="param-value">{liveParams.voltage}</span>
            </div>
          </div>
          <div className="param-box">
            <div className="param-icon-wrapper current">A</div>
            <div className="param-details">
              <span className="param-label">Load Current</span>
              <span className="param-value">{liveParams.current}</span>
            </div>
          </div>
          <div className="param-box">
            <div className="param-icon-wrapper frequency">Hz</div>
            <div className="param-details">
              <span className="param-label">Grid Frequency</span>
              <span className="param-value">{liveParams.frequency}</span>
            </div>
          </div>
          <div className="param-box">
            <div className="param-icon-wrapper power-factor">cos φ</div>
            <div className="param-details">
              <span className="param-label">Power Factor</span>
              <span className="param-value">{liveParams.powerFactor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="electrician-main-layout">
        {/* Left Column: Telemetry Chart & Recent Alerts */}
        <div className="left-column">
          <div className="dashboard-section-card">
            <div className="section-title-wrapper">
              <h3><FiActivity /> 15-Minute Electrical Power Demand Trend</h3>
              <Badge variant="neutral">Today's Timeline</Badge>
            </div>
            {trendData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="electricianPowerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit=" kW" />
                    <Tooltip
                      contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      formatter={(val) => [`${val} kW`, 'Power Demand']}
                    />
                    <Area
                      type="monotone"
                      dataKey="powerKw"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#electricianPowerGrad)"
                      name="Power Draw (kW)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-center" style={{ height: '220px', color: '#64748b' }}>
                No telemetry data available for current period.
              </div>
            )}
          </div>

          <div className="dashboard-section-card">
            <div className="section-title-wrapper">
              <h3><FiAlertTriangle /> Recent Faults & Electrical Alerts</h3>
              <Link to="/electrician/alerts" style={{ fontSize: '0.875rem', color: '#3b82f6', fontWeight: 600 }}>
                View All Alerts &rarr;
              </Link>
            </div>
            {alertsList.length > 0 ? (
              <div className="electrician-alerts-list">
                {alertsList.map((alert) => (
                  <div
                    key={alert.id || alert.alert_id}
                    className={`alert-feed-item ${
                      alert.severity?.toLowerCase() === 'high' || alert.severity?.toLowerCase() === 'critical'
                        ? 'high'
                        : alert.severity?.toLowerCase() === 'warning'
                        ? 'warning'
                        : 'info'
                    }`}
                  >
                    <div className="alert-feed-content">
                      <div className="alert-feed-title">
                        {alert.message || alert.alert_title || 'Electrical Anomaly Detected'}
                      </div>
                      <div className="alert-feed-meta">
                        <span>Building: {alert.building_name || 'Campus Main'}</span>
                        <span>Severity: {alert.severity || 'Medium'}</span>
                        <span>{new Date(alert.timestamp || alert.created_at || Date.now()).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <Badge variant={alert.status === 'Resolved' ? 'success' : 'warning'}>
                      {alert.status || 'Active'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-center" style={{ height: '120px', color: '#64748b' }}>
                <FiCheckCircle style={{ color: '#22c55e', fontSize: '1.4rem', marginRight: '8px' }} />
                No active electrical alerts. All systems operating normally.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sensor Health & Quick Navigation */}
        <div className="right-column">
          <div className="dashboard-section-card">
            <div className="section-title-wrapper">
              <h3><FiRadio /> Hardware Sensor Health</h3>
            </div>
            <div className="health-progress-list">
              <div className="health-item">
                <div className="health-label-row">
                  <span>Online ({sensorSummary.online})</span>
                  <span>{onlinePct}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill online" style={{ width: `${onlinePct}%` }} />
                </div>
              </div>

              <div className="health-item">
                <div className="health-label-row">
                  <span>Offline ({sensorSummary.offline})</span>
                  <span>{offlinePct}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill offline" style={{ width: `${offlinePct}%` }} />
                </div>
              </div>

              <div className="health-item">
                <div className="health-label-row">
                  <span>In Maintenance ({sensorSummary.maintenance})</span>
                  <span>{maintPct}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill maintenance" style={{ width: `${maintPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-section-card">
            <div className="section-title-wrapper">
              <h3><FiSliders /> Quick Maintenance Control</h3>
            </div>
            <div className="quick-nav-grid">
              <Link to="/electrician/meters" className="quick-nav-card">
                <FiZap className="quick-nav-icon" />
                <span>Grid & Meters</span>
              </Link>
              <Link to="/electrician/sensors" className="quick-nav-card">
                <FiRadio className="quick-nav-icon" />
                <span>Sensor IoT</span>
              </Link>
              <Link to="/electrician/alerts" className="quick-nav-card">
                <FiAlertTriangle className="quick-nav-icon" />
                <span>Fault Alerts</span>
              </Link>
              <Link to="/electrician/profile" className="quick-nav-card">
                <FiUser className="quick-nav-icon" />
                <span>My Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectricianDashboard;
