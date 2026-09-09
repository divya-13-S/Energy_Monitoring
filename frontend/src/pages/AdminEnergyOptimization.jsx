import React, { useState, useEffect, useCallback } from 'react';
import {
  FiZap,
  FiTrendingDown,
  FiDollarSign,
  FiCheckCircle,
  FiFilter,
  FiX,
  FiRefreshCw,
  FiAlertTriangle,
  FiClock,
  FiLayers,
  FiServer,
  FiSliders,
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
  fetchOptimizationSummary,
  fetchHighConsumptionAreas,
  fetchOptimizationAnalysisChart,
  fetchOptimizationRecommendations,
  updateRecommendationStatusApi,
  fetchOptimizationComparison,
} from '../services/optimizationService';

import EmptyState from '../components/common/EmptyState/EmptyState';
import ErrorState from '../components/common/ErrorState/ErrorState';
import './AdminEnergyOptimization.css';

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

const AdminEnergyOptimization = () => {
  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Data States
  const [summary, setSummary] = useState(null);
  const [highAreas, setHighAreas] = useState([]);
  const [analysisChart, setAnalysisChart] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [comparison, setComparison] = useState([]);

  // Filter States
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [appliedFilters, setAppliedFilters] = useState({
    building: 'all',
    department: 'all',
    period: 'today',
  });

  // Load All Energy Optimization Data from Backend REST APIs
  const loadOptimizationData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);

    try {
      const filters = {
        building: appliedFilters.building,
        department: appliedFilters.department,
        period: appliedFilters.period,
      };

      const [summaryRes, highAreasRes, chartRes, recsRes, compRes] = await Promise.all([
        fetchOptimizationSummary(filters),
        fetchHighConsumptionAreas(filters),
        fetchOptimizationAnalysisChart(filters),
        fetchOptimizationRecommendations(filters),
        fetchOptimizationComparison(filters),
      ]);

      setSummary(summaryRes);
      setHighAreas(highAreasRes || []);
      setAnalysisChart(chartRes || []);
      setRecommendations(recsRes || []);
      setComparison(compRes || []);
    } catch (err) {
      console.error('Failed to load energy optimization data:', err);
      setError(err.message || 'Unable to connect to energy optimization backend REST API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadOptimizationData();
  }, [loadOptimizationData]);

  // Handle Filter Application
  const handleApplyFilter = () => {
    setAppliedFilters({
      building: selectedBuilding,
      department: selectedDepartment,
      period: selectedPeriod,
    });
  };

  // Handle Filter Reset
  const handleClearFilter = () => {
    setSelectedBuilding('all');
    setSelectedDepartment('all');
    setSelectedPeriod('today');
    setAppliedFilters({
      building: 'all',
      department: 'all',
      period: 'today',
    });
  };

  // Building select change updates available department options
  const handleBuildingChange = (e) => {
    const bId = e.target.value;
    setSelectedBuilding(bId);
    setSelectedDepartment('all');
  };

  // Update Recommendation Status (Pending -> Reviewed -> Implemented)
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateRecommendationStatusApi(id, newStatus);
      // Refresh recommendation list
      setRecommendations((prev) =>
        prev.map((rec) => (rec.id === id ? { ...rec, status: newStatus } : rec))
      );
    } catch (err) {
      alert(`Failed to update recommendation status: ${err.message}`);
    }
  };

  // Department options based on building selection
  const availableDepartmentOptions =
    selectedBuilding !== 'all' && DEPARTMENTS_BY_BUILDING[selectedBuilding]
      ? DEPARTMENTS_BY_BUILDING[selectedBuilding]
      : Object.values(DEPARTMENTS_BY_BUILDING).flat();

  // Helper Badge Renderers
  const renderStatusBadge = (statusStr) => {
    const s = String(statusStr || 'Optimal').toLowerCase();
    if (s.includes('high')) {
      return <span className="status-pill high">● High Consumption</span>;
    }
    if (s.includes('moderate')) {
      return <span className="status-pill moderate">● Moderate Usage</span>;
    }
    return <span className="status-pill optimal">● Optimal</span>;
  };

  const renderPriorityBadge = (priorityStr) => {
    const p = String(priorityStr || 'Medium').toLowerCase();
    if (p === 'high') return <span className="priority-pill p-high">High</span>;
    if (p === 'low') return <span className="priority-pill p-low">Low</span>;
    return <span className="priority-pill p-medium">Medium</span>;
  };

  const renderRecStatusBadge = (statusStr) => {
    const s = String(statusStr || 'Pending').toLowerCase();
    if (s === 'implemented') return <span className="rec-status-badge implemented">✓ Implemented</span>;
    if (s === 'reviewed') return <span className="rec-status-badge reviewed">👁 Reviewed</span>;
    return <span className="rec-status-badge pending">⏳ Pending</span>;
  };

  // Loading State
  if (loading && !summary) {
    return (
      <div className="opt-container">
        <div className="live-skeleton-header" />
        <div className="live-skeleton-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="live-skeleton-card" />
          ))}
        </div>
        <div className="live-skeleton-chart" />
      </div>
    );
  }

  // Error State
  if (error && !summary) {
    return (
      <div className="opt-container">
        <section className="opt-header-section">
          <div>
            <h1 className="opt-page-title">ENERGY OPTIMIZATION</h1>
            <p className="opt-page-subtitle">
              Rule-based consumption analysis, waste identification, and savings calculations
            </p>
          </div>
        </section>

        <ErrorState
          title="Unable to load energy optimization data"
          message={`Failed to connect to MySQL backend REST API: ${error}`}
          retryLabel="Retry API Connection"
          onRetry={() => loadOptimizationData(true)}
        />
      </div>
    );
  }

  return (
    <div className="opt-container">
      {/* ─── 1. TOP HEADER SECTION ───────────────────────────────────────── */}
      <section className="opt-header-section">
        <div>
          <div className="opt-title-row">
            <h1 className="opt-page-title">ENERGY OPTIMIZATION</h1>
            <span className="badge-count">Rule-Based Engine</span>
          </div>
          <p className="opt-page-subtitle">
            Rule-based electricity consumption analysis, waste identification, and savings calculations
          </p>
        </div>

        <div className="opt-header-actions">
          <div className="opt-period-selector">
            <FiClock />
            <span>Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setAppliedFilters((prev) => ({ ...prev, period: e.target.value }));
              }}
              className="opt-period-select"
            >
              <option value="today">Today's Live Data</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <button
            className={`refresh-action-btn ${refreshing ? 'spinning' : ''}`}
            onClick={() => loadOptimizationData(true)}
            disabled={refreshing}
          >
            <FiRefreshCw className="btn-icon" />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Analysis'}</span>
          </button>
        </div>
      </section>

      {/* ─── 2. FILTERS SECTION ──────────────────────────────────────────── */}
      <section className="opt-filters-card">
        <div className="filters-header">
          <FiFilter />
          <h3 className="filters-title">Optimization Analysis Filters</h3>
        </div>

        <div className="filters-grid">
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

          <div className="filter-actions-group">
            <button className="apply-filter-btn" onClick={handleApplyFilter}>
              <FiCheckCircle />
              <span>Apply Filters</span>
            </button>
            <button className="clear-filter-btn" onClick={handleClearFilter}>
              <FiX />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 3. OPTIMIZATION SUMMARY KPI CARDS ───────────────────────────── */}
      <section className="opt-kpi-grid">
        {/* KPI 1: Current Energy Consumption */}
        <div className="opt-kpi-card accent-blue">
          <div className="kpi-top">
            <span className="kpi-title">Current Consumption</span>
            <div className="kpi-icon-badge blue">
              <FiZap />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">
              {summary?.currentEnergyKwh?.toLocaleString('en-IN') ?? '0'}
            </span>
            <span className="kpi-unit">kWh</span>
          </div>
          <div className="kpi-footer">
            <span>Est. Cost: ₹ {summary?.currentCost?.toLocaleString('en-IN') ?? '0'}</span>
            <span className="tariff-badge">@ ₹ {summary?.tariff ?? '8.5'}/kWh</span>
          </div>
        </div>

        {/* KPI 2: Potential Energy Saving */}
        <div className="opt-kpi-card accent-green">
          <div className="kpi-top">
            <span className="kpi-title">Potential Energy Saving</span>
            <div className="kpi-icon-badge green">
              <FiTrendingDown />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">
              {summary?.potentialSavingKwh?.toLocaleString('en-IN') ?? '0'}
            </span>
            <span className="kpi-unit">kWh</span>
          </div>
          <div className="kpi-footer">
            <span className="savings-val">
              {summary?.efficiencyGainPercent ?? 0}% Recoverable Gain
            </span>
          </div>
        </div>

        {/* KPI 3: Potential Cost Saving */}
        <div className="opt-kpi-card accent-amber">
          <div className="kpi-top">
            <span className="kpi-title">Potential Cost Saving</span>
            <div className="kpi-icon-badge amber">
              <FiDollarSign />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-unit">₹</span>
            <span className="kpi-number">
              {summary?.potentialCostSaving?.toLocaleString('en-IN') ?? '0'}
            </span>
          </div>
          <div className="kpi-footer">
            <span>Calculated from ₹ {summary?.tariff ?? '8.5'}/kWh tariff</span>
          </div>
        </div>

        {/* KPI 4: Total Recommendations */}
        <div className="opt-kpi-card accent-purple">
          <div className="kpi-top">
            <span className="kpi-title">Total Recommendations</span>
            <div className="kpi-icon-badge purple">
              <FiSliders />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">{summary?.totalRecommendations ?? 0}</span>
            <span className="kpi-unit">Actionable Rules</span>
          </div>
          <div className="kpi-footer">
            <span>Actionable optimization guidance</span>
          </div>
        </div>
      </section>

      {/* ─── 4. ENERGY SAVING ANALYSIS CHART ────────────────────────────── */}
      <section className="opt-chart-card">
        <div className="chart-card-header">
          <div>
            <h3 className="chart-title">Current Consumption vs Potential Optimized Consumption</h3>
            <p className="chart-subtitle">
              Rule-based optimization baseline projection based on MySQL telemetry
            </p>
          </div>
          <div className="chart-legend-pills">
            <span className="legend-pill power">
              <span className="dot blue-dot" /> Actual Consumption (kWh)
            </span>
            <span className="legend-pill energy">
              <span className="dot green-dot" /> Optimized Baseline (kWh)
            </span>
          </div>
        </div>

        {analysisChart.length > 0 ? (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={analysisChart}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="actualKwh"
                  name="Actual Consumption (kWh)"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#actualGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="optimizedKwh"
                  name="Optimized Baseline (kWh)"
                  stroke="#16A34A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#optGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="No optimization chart data available"
            description="No energy telemetry matches the selected building/department filter."
          />
        )}
      </section>

      {/* ─── 5. HIGH CONSUMPTION AREAS RANKING ──────────────────────────── */}
      <section className="high-consumption-section">
        <div className="section-title-row">
          <div>
            <h2 className="opt-section-heading">High Consumption Areas Ranking</h2>
            <p className="opt-section-subheading">
              Identified campus areas ranked by highest energy consumption & potential savings
            </p>
          </div>
          <span className="badge-count">{highAreas.length} Areas Analyzed</span>
        </div>

        <div className="table-wrapper">
          <table className="opt-data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Building / Department</th>
                <th>Energy Consumption</th>
                <th>Baseline Average</th>
                <th>Estimated Cost</th>
                <th>Status</th>
                <th>Potential Saving</th>
                <th>Est. Cost Saving</th>
              </tr>
            </thead>
            <tbody>
              {highAreas.length > 0 ? (
                highAreas.map((area) => (
                  <tr key={`${area.type}_${area.id}`}>
                    <td>
                      <strong>#{area.rank}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{area.name}</strong>
                        <div className="opt-page-subtitle">{area.code} • {area.parentBuilding}</div>
                      </div>
                    </td>
                    <td>
                      <strong className="text-blue">{area.totalKwh.toLocaleString('en-IN')} kWh</strong>
                    </td>
                    <td>{area.avgKwh.toLocaleString('en-IN')} kWh</td>
                    <td>₹ {area.estimatedCost.toLocaleString('en-IN')}</td>
                    <td>{renderStatusBadge(area.status)}</td>
                    <td>
                      <strong className="text-green">{area.potentialSavingKwh} kWh</strong>
                    </td>
                    <td>
                      <strong className="text-green">₹ {area.potentialCostSaving.toLocaleString('en-IN')}</strong>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">
                    <EmptyState
                      title="No high consumption areas found"
                      description="No records match the current filter selection."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 6. OPTIMIZATION RECOMMENDATIONS TABLE ──────────────────────── */}
      <section className="recommendations-section">
        <div className="section-title-row">
          <div>
            <h2 className="opt-section-heading">Rule-Based Optimization Recommendations</h2>
            <p className="opt-section-subheading">
              Practical energy-saving actions generated from consumption patterns and operating rules
            </p>
          </div>
          <span className="badge-count">{recommendations.length} Active Guidance Rules</span>
        </div>

        <div className="table-wrapper">
          <table className="opt-data-table">
            <thead>
              <tr>
                <th>Recommendation Title</th>
                <th>Building & Department</th>
                <th>Trigger Reason</th>
                <th>Energy Saving</th>
                <th>Cost Saving</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <div>
                        <strong>{rec.title}</strong>
                        <div className="opt-page-subtitle">{rec.category}</div>
                      </div>
                    </td>
                    <td>
                      <strong>{rec.buildingName}</strong>
                      <div className="opt-page-subtitle">{rec.departmentName}</div>
                    </td>
                    <td>
                      <span className="opt-page-subtitle">{rec.reason}</span>
                    </td>
                    <td>
                      <strong className="text-green">{rec.estKwhSavings} kWh</strong>
                    </td>
                    <td>
                      <strong className="text-green">₹ {rec.estCostSavings.toLocaleString('en-IN')}</strong>
                    </td>
                    <td>{renderPriorityBadge(rec.priority)}</td>
                    <td>{renderRecStatusBadge(rec.status)}</td>
                    <td>
                      <div className="status-action-btns">
                        {rec.status !== 'Reviewed' && (
                          <button
                            className="action-btn"
                            onClick={() => handleUpdateStatus(rec.id, 'Reviewed')}
                            title="Mark as Reviewed"
                          >
                            Review
                          </button>
                        )}
                        {rec.status !== 'Implemented' && (
                          <button
                            className="action-btn"
                            onClick={() => handleUpdateStatus(rec.id, 'Implemented')}
                            title="Mark as Implemented"
                          >
                            Implement
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">
                    <EmptyState
                      title="No recommendations available"
                      description="No rule-based recommendations for the selected filter."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 7. BUILDING / DEPARTMENT COMPARISON ────────────────────────── */}
      <section className="comparison-section">
        <div className="section-title-row">
          <div>
            <h2 className="opt-section-heading">Optimization Opportunity Comparison</h2>
            <p className="opt-section-subheading">
              Area breakdown showing highest recoverable energy saving opportunities
            </p>
          </div>
        </div>

        <div className="comparison-grid">
          {comparison.map((comp) => (
            <div key={`${comp.type}_${comp.id}`} className="comp-card">
              <div className="comp-card-top">
                <div>
                  <h4 className="comp-name">{comp.name}</h4>
                  <span className="opt-page-subtitle">{comp.code}</span>
                </div>
                {renderPriorityBadge(comp.priority)}
              </div>

              <div className="comp-metrics">
                <div className="comp-row">
                  <span className="label">Current Usage:</span>
                  <span className="val">{comp.currentConsumptionKwh.toLocaleString('en-IN')} kWh</span>
                </div>
                <div className="comp-row">
                  <span className="label">Baseline Average:</span>
                  <span className="val">{comp.baselineAverageKwh.toLocaleString('en-IN')} kWh</span>
                </div>
                <div className="comp-row">
                  <span className="label">Potential Saving:</span>
                  <span className="val highlight">{comp.potentialSavingKwh} kWh</span>
                </div>
                <div className="comp-row">
                  <span className="label">Est. Cost Saving:</span>
                  <span className="val highlight">₹ {comp.potentialCostSaving.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminEnergyOptimization;
