import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiActivity,
  FiZap,
  FiCpu,
  FiRadio,
  FiRefreshCw,
  FiSliders,
  FiTrendingUp,
  FiAlertTriangle,
  FiCheckCircle,
  FiFilter,
  FiX,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
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

import {
  fetchLiveSummary,
  fetchLiveReadings,
  fetchBuildingLiveMetrics,
  fetchDepartmentLiveMetrics,
  fetchAbnormalConditions,
} from '../services/liveMonitoringService';

import EmptyState from '../components/common/EmptyState/EmptyState';
import ErrorState from '../components/common/ErrorState/ErrorState';
import './AdminLiveMonitoring.css';

// Institution Building and Department mappings matching database structure
const BUILDINGS_LIST = [
  { id: '1', name: 'IB Block', code: 'IB-BLOCK' },
  { id: '2', name: 'AS Block', code: 'AS-BLOCK' },
  { id: '3', name: 'Mechanical Block', code: 'MECH-BLOCK' },
  { id: '4', name: 'Sunflower Block', code: 'SUNFLOWER-BLOCK' },
  { id: '5', name: 'Research Park', code: 'RESEARCH-PARK' },
  { id: '6', name: 'Library', code: 'LIBRARY-BLOCK' },
  { id: '7', name: 'Girls Hostel', code: 'GH-BLOCK' },
  { id: '8', name: 'Boys Hostel', code: 'BH-BLOCK' },
];

const DEPARTMENTS_BY_BUILDING = {
  '1': [
    { id: '1', name: 'EEE Department', code: 'EEE' },
    { id: '2', name: 'EIE Department', code: 'EIE' },
  ],
  '2': [
    { id: '3', name: 'Textile Technology', code: 'Textile' },
    { id: '4', name: 'ECE Department', code: 'ECE' },
    { id: '5', name: 'Civil Engineering', code: 'Civil' },
  ],
  '3': [
    { id: '6', name: 'Mechanical Engineering', code: 'Mech' },
    { id: '7', name: 'CT Department', code: 'CT' },
  ],
  '4': [
    { id: '8', name: 'CSE Department', code: 'CSE' },
    { id: '9', name: 'IT Department', code: 'IT' },
  ],
  '5': [
    { id: '10', name: 'Aeronautical Engg', code: 'Aeronautical' },
    { id: '11', name: 'Central Administration', code: 'Central Admin' },
  ],
  '6': [
    { id: '12', name: 'Library Facility', code: 'Central Library' },
  ],
  '7': [
    { id: '13', name: 'Yamuna Block', code: 'Yamuna' },
    { id: '14', name: 'Ganga Block', code: 'Ganga' },
    { id: '15', name: 'Narmadha Block', code: 'Narmadha' },
    { id: '16', name: 'Cauvery Block', code: 'Cauvery' },
  ],
  '8': [
    { id: '17', name: 'Emerald Block', code: 'Emerald' },
    { id: '18', name: 'Sapphire Block', code: 'Sapphire' },
    { id: '19', name: 'Pearl Block', code: 'Pearl' },
    { id: '20', name: 'Ruby Block', code: 'Ruby' },
  ],
};

const AdminLiveMonitoring = () => {
  const navigate = useNavigate();

  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [autoPolling, setAutoPolling] = useState(true);
  const [pollingIntervalSec, setPollingIntervalSec] = useState(5);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);

  // Telemetry Data States
  const [summaryData, setSummaryData] = useState(null);
  const [liveReadings, setLiveReadings] = useState([]);
  const [buildingsData, setBuildingsData] = useState([]);
  const [departmentsData, setDepartmentsData] = useState([]);
  const [abnormalConditions, setAbnormalConditions] = useState([]);

  // Filter States
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Applied Filters State
  const [appliedFilters, setAppliedFilters] = useState({
    buildingId: 'all',
    departmentId: 'all',
    timeRange: 'all',
    status: 'all',
  });

  // Table Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 8;

  // Ref for cleanup & polling interval
  const timerRef = useRef(null);

  // Fetch all live telemetry data from backend APIs
  const loadLiveData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    setError(null);

    try {
      const filters = {
        buildingId: appliedFilters.buildingId,
        departmentId: appliedFilters.departmentId,
        timeRange: appliedFilters.timeRange,
        status: appliedFilters.status,
        limit: 1200,
      };

      const [summaryRes, readingsRes, bldgsRes, deptsRes, abnormalRes] = await Promise.all([
        fetchLiveSummary(),
        fetchLiveReadings(filters),
        fetchBuildingLiveMetrics(),
        fetchDepartmentLiveMetrics(appliedFilters.buildingId),
        fetchAbnormalConditions(),
      ]);

      // Client-side safety filter: ensure no future-dated records are processed
      const nowMs = Date.now();
      const validReadings = (readingsRes || []).filter((r) => {
        if (!r.reading_date) return true;
        const rTime = new Date(r.reading_date).getTime();
        return isNaN(rTime) || rTime <= nowMs;
      });

      setSummaryData(summaryRes);
      setLiveReadings(validReadings);
      setBuildingsData(bldgsRes || []);
      setDepartmentsData(deptsRes || []);
      setAbnormalConditions(abnormalRes || []);

      // Format last updated timestamp from latest valid telemetry record or current local time
      const latestTs = summaryRes?.lastUpdated
        ? new Date(summaryRes.lastUpdated)
        : new Date();

      setLastUpdatedTime(
        isNaN(latestTs.getTime())
          ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
          : latestTs.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
    } catch (err) {
      console.error('Failed to load live monitoring telemetry:', err);
      setError(err.message || 'Unable to connect to live monitoring backend API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appliedFilters]);

  // Initial load
  useEffect(() => {
    loadLiveData();
  }, [loadLiveData]);

  // Real-time polling timer setup and cleanup
  useEffect(() => {
    if (autoPolling && !error) {
      timerRef.current = setInterval(() => {
        loadLiveData();
      }, pollingIntervalSec * 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoPolling, pollingIntervalSec, error, loadLiveData]);

  // Handle Filter Application
  const handleApplyFilter = () => {
    setAppliedFilters({
      buildingId: selectedBuilding,
      departmentId: selectedDepartment,
      timeRange: selectedTimeRange,
      status: selectedStatus,
    });
    setCurrentPage(1);
  };

  // Handle Filter Reset
  const handleClearFilter = () => {
    setSelectedBuilding('all');
    setSelectedDepartment('all');
    setSelectedTimeRange('all');
    setSelectedStatus('all');
    setAppliedFilters({
      buildingId: 'all',
      departmentId: 'all',
      timeRange: 'all',
      status: 'all',
    });
    setCurrentPage(1);
  };

  // Building selection change updates department options
  const handleBuildingChange = (e) => {
    const bId = e.target.value;
    setSelectedBuilding(bId);
    setSelectedDepartment('all'); // reset department filter when building changes
  };

  // Click on a building card to set building filter
  const handleSelectBuildingCard = (bldgId) => {
    setSelectedBuilding(bldgId);
    setSelectedDepartment('all');
    setAppliedFilters((prev) => ({
      ...prev,
      buildingId: bldgId,
      departmentId: 'all',
    }));
    setCurrentPage(1);
  };

  // Available department options based on selected building
  const availableDepartmentOptions =
    selectedBuilding !== 'all' && DEPARTMENTS_BY_BUILDING[selectedBuilding]
      ? DEPARTMENTS_BY_BUILDING[selectedBuilding]
      : Object.values(DEPARTMENTS_BY_BUILDING).flat();

  // Prepare chart data for Recharts (group by 15-minute reading_date to present unique continuous time slots <= NOW)
  const chartData = React.useMemo(() => {
    if (!liveReadings || liveReadings.length === 0) return [];

    const nowMs = Date.now();
    const groupedMap = new Map();

    // Process chronological order (ascending time)
    const validReadings = [...liveReadings]
      .filter((item) => {
        if (!item.reading_date) return false;
        const t = new Date(item.reading_date).getTime();
        return !isNaN(t) && t <= nowMs;
      })
      .sort((a, b) => new Date(a.reading_date).getTime() - new Date(b.reading_date).getTime());

    validReadings.forEach((item) => {
      const d = new Date(item.reading_date);
      if (isNaN(d.getTime())) return;

      // Numeric epoch timestamp in ms as Map key guarantees exact 15-minute slot matching
      const timeKey = d.getTime();
      const displayTime = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      if (!groupedMap.has(timeKey)) {
        groupedMap.set(timeKey, {
          time: displayTime,
          powerKwSum: 0,
          kwhConsumedSum: 0,
          voltageSum: 0,
          currentASum: 0,
          count: 0,
        });
      }

      const entry = groupedMap.get(timeKey);
      entry.powerKwSum += parseFloat(item.power_kw || 0);
      entry.kwhConsumedSum += parseFloat(item.energy_consumed_kwh || 0);
      entry.voltageSum += parseFloat(item.voltage || 230);
      entry.currentASum += parseFloat(item.current_a || 0);
      entry.count += 1;
    });

    return Array.from(groupedMap.values()).map((g) => ({
      time: g.time,
      powerKw: parseFloat(g.powerKwSum.toFixed(1)),
      kwhConsumed: parseFloat(g.kwhConsumedSum.toFixed(2)),
      voltage: parseFloat((g.voltageSum / (g.count || 1)).toFixed(1)),
      currentA: parseFloat(g.currentASum.toFixed(1)),
    }));
  }, [liveReadings]);

  // Table Pagination logic
  const totalPages = Math.ceil(liveReadings.length / recordsPerPage) || 1;
  const paginatedReadings = liveReadings.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Status Badge Helper Component
  const renderStatusBadge = (statusStr) => {
    const s = String(statusStr || 'Normal').toLowerCase();
    if (s.includes('critical') || s.includes('high')) {
      return (
        <span className="live-status-badge status-critical">
          <span className="badge-dot" />
          Critical / High Load
        </span>
      );
    }
    if (s.includes('warning') || s.includes('moderate')) {
      return (
        <span className="live-status-badge status-warning">
          <span className="badge-dot" />
          Warning / Moderate
        </span>
      );
    }
    return (
      <span className="live-status-badge status-normal">
        <span className="badge-dot" />
        Normal / Optimal
      </span>
    );
  };

  // Main Render - Loading State
  if (loading && !summaryData) {
    return (
      <div className="live-monitoring-container">
        <div className="live-skeleton-header" />
        <div className="live-skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="live-skeleton-card" />
          ))}
        </div>
        <div className="live-skeleton-chart" />
      </div>
    );
  }

  // Main Render - Error State
  if (error && !summaryData) {
    return (
      <div className="live-monitoring-container">
        <section className="live-header-section">
          <div>
            <h1 className="live-page-title">LIVE MONITORING</h1>
            <p className="live-page-subtitle">
              Real-time electricity consumption and electrical parameter monitoring
            </p>
          </div>
          <div className="connection-pill offline">
            <span className="pill-dot red-pulse" />
            <span>● Offline</span>
          </div>
        </section>

        <ErrorState
          title="Unable to load live monitoring data"
          message={`Failed to connect to MySQL backend REST API: ${error}`}
          retryLabel="Retry API Connection"
          onRetry={() => loadLiveData(true)}
        />
      </div>
    );
  }

  return (
    <div className="live-monitoring-container">
      {/* ─── TOP SECTION ────────────────────────────────────────────────── */}
      <section className="live-header-section">
        <div className="header-left">
          <div className="title-row">
            <h1 className="live-page-title">LIVE MONITORING</h1>
            <div className={`live-indicator-pill ${error ? 'offline' : 'online'}`}>
              <span className={`indicator-dot ${error ? 'red' : 'green-ping'}`} />
              <span className="indicator-label">{error ? '● Offline' : '● Live'}</span>
            </div>
          </div>
          <p className="live-page-subtitle">
            Real-time electricity consumption and electrical parameter monitoring
          </p>
        </div>

        <div className="header-right-controls">
          <div className="last-updated-block">
            <FiClock className="time-icon" />
            <span className="updated-label">Last updated:</span>
            <strong className="updated-time">{lastUpdatedTime || 'Just now'}</strong>
          </div>

          <div className="polling-toggle-box">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={autoPolling}
                onChange={(e) => setAutoPolling(e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
            <span className="toggle-text">
              Auto-poll ({pollingIntervalSec}s)
            </span>
          </div>

          <button
            className={`refresh-action-btn ${refreshing ? 'spinning' : ''}`}
            onClick={() => loadLiveData(true)}
            disabled={refreshing}
            title="Fetch latest MySQL readings"
          >
            <FiRefreshCw className="btn-icon" />
            <span>{refreshing ? 'Refreshing...' : 'Manual Refresh'}</span>
          </button>
        </div>
      </section>

      {/* ─── FILTERS SECTION ────────────────────────────────────────────── */}
      <section className="live-filters-card">
        <div className="filters-header">
          <FiFilter className="filter-section-icon" />
          <h3 className="filters-title">Telemetry Monitoring Filters</h3>
        </div>

        <div className="filters-grid">
          {/* Building Select */}
          <div className="filter-field-group">
            <label className="filter-label">Campus Building</label>
            <select
              value={selectedBuilding}
              onChange={handleBuildingChange}
              className="filter-select-input"
            >
              <option value="all">All Buildings (8 Campus Blocks)</option>
              {BUILDINGS_LIST.map((bldg) => (
                <option key={bldg.id} value={bldg.id}>
                  {bldg.name} ({bldg.code})
                </option>
              ))}
            </select>
          </div>

          {/* Department / Unit Select */}
          <div className="filter-field-group">
            <label className="filter-label">Department / Unit</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="filter-select-input"
            >
              <option value="all">
                {selectedBuilding === 'all'
                  ? 'All Academic & Residential Units (20)'
                  : 'All Building Departments'}
              </option>
              {availableDepartmentOptions.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Select */}
          <div className="filter-field-group">
            <label className="filter-label">Time Window</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="filter-select-input"
            >
              <option value="all">All Valid Telemetry (&le; NOW)</option>
              <option value="today">Today's Live Window</option>
              <option value="6h">Last 6 Hours</option>
              <option value="1h">Last 1 Hour</option>
            </select>
          </div>

          {/* Status Filter Select */}
          <div className="filter-field-group">
            <label className="filter-label">System Load Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select-input"
            >
              <option value="all">All Load Conditions</option>
              <option value="normal">Normal / Optimal</option>
              <option value="warning">Warning / Moderate</option>
              <option value="critical">Critical / High Load</option>
            </select>
          </div>

          {/* Filter Action Buttons */}
          <div className="filter-actions-group">
            <button className="apply-filter-btn" onClick={handleApplyFilter}>
              <FiCheckCircle className="btn-icon" />
              <span>Apply Filter</span>
            </button>

            <button className="clear-filter-btn" onClick={handleClearFilter}>
              <FiX className="btn-icon" />
              <span>Clear Filter</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── LIVE KPI CARDS ─────────────────────────────────────────────── */}
      <section className="live-kpi-grid">
        {/* KPI 1: Current Power */}
        <div className="live-kpi-card accent-blue">
          <div className="kpi-top">
            <span className="kpi-title">Current Power</span>
            <div className="kpi-icon-badge blue">
              <FiZap />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">
              {summaryData?.currentPowerKw ?? '0.0'}
            </span>
            <span className="kpi-unit">kW</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-status-tag active">Live Demand</span>
            <span className="kpi-subtext">Sum of active building loads</span>
          </div>
        </div>

        {/* KPI 2: Current Energy Consumption */}
        <div className="live-kpi-card accent-green">
          <div className="kpi-top">
            <span className="kpi-title">Energy Consumption</span>
            <div className="kpi-icon-badge green">
              <FiActivity />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">
              {summaryData?.todayEnergyKwh?.toLocaleString('en-IN') ?? '0'}
            </span>
            <span className="kpi-unit">kWh</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-status-tag success">Cumulative Today</span>
            <span className="kpi-subtext">Campus total recorded</span>
          </div>
        </div>

        {/* KPI 3: Voltage */}
        <div className="live-kpi-card accent-amber">
          <div className="kpi-top">
            <span className="kpi-title">Line Voltage</span>
            <div className="kpi-icon-badge amber">
              <FiRadio />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">{summaryData?.voltageV ?? '230.0'}</span>
            <span className="kpi-unit">V</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-status-tag normal">Nominal 230V</span>
            <span className="kpi-subtext">3-Phase institutional grid</span>
          </div>
        </div>

        {/* KPI 4: Current */}
        <div className="live-kpi-card accent-purple">
          <div className="kpi-top">
            <span className="kpi-title">Total Current</span>
            <div className="kpi-icon-badge purple">
              <FiCpu />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">{summaryData?.currentA ?? '0.0'}</span>
            <span className="kpi-unit">A</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-status-tag info">Live Amperage</span>
            <span className="kpi-subtext">Substation transformer draw</span>
          </div>
        </div>

        {/* KPI 5: Frequency */}
        <div className="live-kpi-card accent-teal">
          <div className="kpi-top">
            <span className="kpi-title">Grid Frequency</span>
            <div className="kpi-icon-badge teal">
              <FiSliders />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">
              {summaryData?.frequencyHz ?? '50.0'}
            </span>
            <span className="kpi-unit">Hz</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-status-tag success">Synchronized</span>
            <span className="kpi-subtext">Standard 50.0 Hz AC cycle</span>
          </div>
        </div>

        {/* KPI 6: Power Factor */}
        <div className="live-kpi-card accent-indigo">
          <div className="kpi-top">
            <span className="kpi-title">Power Factor</span>
            <div className="kpi-icon-badge indigo">
              <FiTrendingUp />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">
              {summaryData?.powerFactor ?? '0.95'}
            </span>
            <span className="kpi-unit">PF</span>
          </div>
          <div className="kpi-footer">
            <span
              className={`kpi-status-tag ${
                (summaryData?.powerFactor || 0.95) >= 0.94
                  ? 'success'
                  : 'warning'
              }`}
            >
              {(summaryData?.powerFactor || 0.95) >= 0.94
                ? 'Optimal Efficiency'
                : 'Capacitor Check Needed'}
            </span>
            <span className="kpi-subtext">Target: &ge; 0.95 PF</span>
          </div>
        </div>
      </section>

      {/* ─── REAL-TIME CONSUMPTION CHART ───────────────────────────────── */}
      <section className="live-chart-card">
        <div className="chart-card-header">
          <div>
            <h3 className="chart-title">Real-Time Power & Energy Trend</h3>
            <p className="chart-subtitle">
              Live consumption telemetry (&le; current system time) from MySQL Database
            </p>
          </div>
          <div className="chart-legend-pills">
            <span className="legend-pill power">
              <span className="dot blue-dot" /> Power Demand (kW)
            </span>
            <span className="legend-pill energy">
              <span className="dot green-dot" /> Energy Usage (kWh)
            </span>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="kwhGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '1px solid #E2E8F0',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="powerKw"
                  name="Power (kW)"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#powerGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="kwhConsumed"
                  name="Energy (kWh)"
                  stroke="#16A34A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#kwhGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="No live monitoring chart data available"
            description="No recent telemetry records match the current filter criteria."
          />
        )}
      </section>

      {/* ─── ABNORMAL CONDITION DISPLAY ────────────────────────────────── */}
      {abnormalConditions.length > 0 && (
        <section className="abnormal-conditions-card">
          <div className="abnormal-card-header">
            <div className="title-block">
              <FiAlertTriangle className="alert-header-icon" />
              <div>
                <h3 className="abnormal-title">Abnormal Electrical Conditions</h3>
                <p className="abnormal-subtitle">
                  {abnormalConditions.length} active parameter threshold triggers detected in campus telemetry
                </p>
              </div>
            </div>
            <button
              className="view-alerts-btn"
              onClick={() => navigate('/admin/alerts')}
            >
              View System Alerts
            </button>
          </div>

          <div className="abnormal-list">
            {abnormalConditions.slice(0, 4).map((cond) => (
              <div
                key={cond.id}
                className={`abnormal-item severity-${cond.severity}`}
              >
                <div className="item-icon-box">
                  <FiAlertTriangle />
                </div>
                <div className="item-content">
                  <div className="item-top">
                    <strong className="item-title">{cond.title}</strong>
                    <span className={`item-badge badge-${cond.severity}`}>
                      {cond.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="item-details">{cond.details}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── BUILDING-WISE LIVE MONITORING ──────────────────────────────── */}
      <section className="building-monitoring-section">
        <div className="section-title-row">
          <div>
            <h2 className="section-heading">Building-wise Current Consumption</h2>
            <p className="section-subheading">
              Click any campus building to filter telemetry data
            </p>
          </div>
          <span className="bldg-count-badge">8 Official Campus Blocks</span>
        </div>

        <div className="buildings-live-grid">
          {buildingsData.map((bldg) => {
            const isSelected = appliedFilters.buildingId === String(bldg.id);
            return (
              <div
                key={bldg.id}
                className={`bldg-live-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectBuildingCard(String(bldg.id))}
              >
                <div className="bldg-card-top">
                  <div>
                    <h4 className="bldg-name">{bldg.name}</h4>
                    <span className="bldg-code-tag">{bldg.buildingCode}</span>
                  </div>
                  {renderStatusBadge(bldg.status)}
                </div>

                <div className="bldg-metrics-row">
                  <div className="bldg-metric">
                    <span className="m-label">Current Power</span>
                    <span className="m-val power">{bldg.currentPowerKw} kW</span>
                  </div>
                  <div className="bldg-metric">
                    <span className="m-label">Today Usage</span>
                    <span className="m-val energy">
                      {bldg.todayKwh.toLocaleString('en-IN')} kWh
                    </span>
                  </div>
                </div>

                <div className="bldg-card-footer">
                  <span className="cost-tag">₹ {bldg.estimatedCost.toLocaleString('en-IN')} est.</span>
                  <span className="select-prompt">
                    {isSelected ? '✓ Selected Filter' : 'Click to Filter'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── DEPARTMENT / UNIT-WISE MONITORING ──────────────────────────── */}
      <section className="dept-monitoring-section">
        <div className="section-title-row">
          <div>
            <h2 className="section-heading">Department / Unit Monitoring</h2>
            <p className="section-subheading">
              Academic departments, administrative units, and hostel wings
            </p>
          </div>
          <span className="dept-count-badge">
            {departmentsData.length} Units Monitored
          </span>
        </div>

        <div className="dept-table-wrapper">
          <table className="live-data-table">
            <thead>
              <tr>
                <th>Department / Unit</th>
                <th>Parent Building</th>
                <th>Current Power</th>
                <th>Today Usage</th>
                <th>Monthly Usage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {departmentsData.length > 0 ? (
                departmentsData.map((dept) => (
                  <tr key={dept.id}>
                    <td>
                      <div className="dept-name-cell">
                        <strong>{dept.name}</strong>
                        <span className="dept-code">{dept.code}</span>
                      </div>
                    </td>
                    <td>
                      <span className="bldg-pill">{dept.buildingName}</span>
                    </td>
                    <td>
                      <strong className="text-blue">{dept.currentPowerKw} kW</strong>
                    </td>
                    <td>
                      <span className="text-green">{dept.todayKwh} kWh</span>
                    </td>
                    <td>{dept.monthlyKwh.toLocaleString('en-IN')} kWh</td>
                    <td>{renderStatusBadge(dept.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="table-empty-row">
                      No departments match the current building filter.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── RECENT READINGS TABLE ────────────────────────────────────── */}
      <section className="recent-readings-section">
        <div className="section-title-row">
          <div>
            <h2 className="section-heading">Recent Live Readings</h2>
            <p className="section-subheading">
              Latest time-series telemetry records (&le; current system time) from smart meters and sensors
            </p>
          </div>
          <span className="records-count-badge">
            {liveReadings.length} Telemetry Records
          </span>
        </div>

        {liveReadings.length > 0 ? (
          <>
            <div className="readings-table-wrapper">
              <table className="live-data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Building</th>
                    <th>Department</th>
                    <th>Energy (kWh)</th>
                    <th>Power (kW)</th>
                    <th>Voltage (V)</th>
                    <th>Current (A)</th>
                    <th>Frequency</th>
                    <th>Power Factor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReadings.map((reading) => {
                    let dateFormatted = 'N/A';
                    if (reading.reading_date) {
                      const d = new Date(reading.reading_date);
                      if (!isNaN(d.getTime())) {
                        dateFormatted = d.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        });
                      }
                    }

                    return (
                      <tr key={reading.id}>
                        <td className="timestamp-cell">
                          <FiClock className="row-icon" />
                          <span>{dateFormatted}</span>
                        </td>
                        <td>
                          <strong>{reading.building_name}</strong>
                        </td>
                        <td>{reading.department_name}</td>
                        <td>
                          <strong className="text-green">
                            {parseFloat(reading.energy_consumed_kwh).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <strong className="text-blue">
                            {parseFloat(reading.power_kw).toFixed(2)}
                          </strong>
                        </td>
                        <td>{parseFloat(reading.voltage).toFixed(1)} V</td>
                        <td>{parseFloat(reading.current_a).toFixed(1)} A</td>
                        <td>50.0 Hz</td>
                        <td>{parseFloat(reading.power_factor).toFixed(2)}</td>
                        <td>{renderStatusBadge(reading.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-bar">
              <span className="pagination-info">
                Showing Page {currentPage} of {totalPages} ({liveReadings.length} total readings)
              </span>
              <div className="pagination-buttons">
                <button
                  className="paging-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <FiChevronLeft /> Previous
                </button>
                <button
                  className="paging-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title="No live monitoring data available."
            description="No recent energy consumption readings match the current criteria."
          />
        )}
      </section>
    </div>
  );
};

export default AdminLiveMonitoring;
