import React, { useState, useEffect, useCallback } from 'react';
import {
  FiBarChart2,
  FiZap,
  FiDollarSign,
  FiTrendingDown,
  FiFilter,
  FiX,
  FiCheckCircle,
  FiDownload,
  FiFileText,
  FiClock,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import {
  fetchReportSummary,
  fetchReportTrend,
  fetchReportBuildings,
  fetchReportCostAnalysis,
  fetchReportSavingsSummary,
  fetchReportAlertsSummary,
  fetchReportDetails,
  downloadCsvReport,
  downloadPdfReport,
} from '../services/reportsService';

import EmptyState from '../components/common/EmptyState/EmptyState';
import ErrorState from '../components/common/ErrorState/ErrorState';
import './AdminReports.css';

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

const AdminReports = () => {
  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data States
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [buildingsData, setBuildingsData] = useState([]);
  const [costAnalysis, setCostAnalysis] = useState(null);
  const [savingsSummary, setSavingsSummary] = useState(null);
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [detailsData, setDetailsData] = useState(null);

  // Filter States
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedReportType, setSelectedReportType] = useState('energy');

  // Applied Filters State
  const [appliedFilters, setAppliedFilters] = useState({
    period: 'today',
    startDate: '',
    endDate: '',
    building: 'all',
    department: 'all',
    reportType: 'energy',
  });

  // Table Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Load Report Data from Backend REST APIs
  const loadReportData = useCallback(async () => {
    setError(null);

    try {
      const filters = {
        period: appliedFilters.period,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
        building: appliedFilters.building,
        department: appliedFilters.department,
        reportType: appliedFilters.reportType,
      };

      const [summaryRes, trendRes, buildingsRes, costRes, savingsRes, alertsRes, detailsRes] = await Promise.all([
        fetchReportSummary(filters),
        fetchReportTrend(filters),
        fetchReportBuildings(filters),
        fetchReportCostAnalysis(filters),
        fetchReportSavingsSummary(filters),
        fetchReportAlertsSummary(filters),
        fetchReportDetails({ ...filters, page: currentPage, limit: recordsPerPage }),
      ]);

      setSummary(summaryRes);
      setTrend(trendRes || []);
      setBuildingsData(buildingsRes || []);
      setCostAnalysis(costRes);
      setSavingsSummary(savingsRes);
      setAlertsSummary(alertsRes);
      setDetailsData(detailsRes);
    } catch (err) {
      console.error('Failed to load report data:', err);
      setError(err.message || 'Unable to connect to reports backend REST API');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Filter Actions
  const handleApplyFilters = () => {
    setAppliedFilters({
      period: selectedPeriod,
      startDate: selectedPeriod === 'custom' ? startDate : '',
      endDate: selectedPeriod === 'custom' ? endDate : '',
      building: selectedBuilding,
      department: selectedDepartment,
      reportType: selectedReportType,
    });
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedPeriod('today');
    setStartDate('');
    setEndDate('');
    setSelectedBuilding('all');
    setSelectedDepartment('all');
    setSelectedReportType('energy');
    setAppliedFilters({
      period: 'today',
      startDate: '',
      endDate: '',
      building: 'all',
      department: 'all',
      reportType: 'energy',
    });
    setCurrentPage(1);
  };

  const handleBuildingChange = (e) => {
    const bId = e.target.value;
    setSelectedBuilding(bId);
    setSelectedDepartment('all');
  };

  // Export Handlers
  const handleExportCsv = () => {
    downloadCsvReport({
      period: appliedFilters.period,
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      building: appliedFilters.building,
      department: appliedFilters.department,
      reportType: appliedFilters.reportType,
    });
  };

  const handleExportPdf = () => {
    downloadPdfReport({
      period: appliedFilters.period,
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      building: appliedFilters.building,
      department: appliedFilters.department,
      reportType: appliedFilters.reportType,
    });
  };

  // Department dropdown options based on selected building
  const availableDepartmentOptions =
    selectedBuilding !== 'all' && DEPARTMENTS_BY_BUILDING[selectedBuilding]
      ? DEPARTMENTS_BY_BUILDING[selectedBuilding]
      : Object.values(DEPARTMENTS_BY_BUILDING).flat();

  // Helper Badge Renderers
  const renderStatusBadge = (statusStr) => {
    const s = String(statusStr || 'Normal').toLowerCase();
    if (s.includes('critical') || s.includes('high')) {
      return (
        <span className="status-pill high">
          ● High Load / Critical
        </span>
      );
    }
    if (s.includes('warning') || s.includes('moderate')) {
      return (
        <span className="status-pill moderate">
          ● Moderate Usage
        </span>
      );
    }
    return (
      <span className="status-pill optimal">
        ● Normal / Optimal
      </span>
    );
  };

  // Loading State
  if (loading && !summary) {
    return (
      <div className="reports-container">
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
      <div className="reports-container">
        <section className="reports-header-section">
          <div>
            <h1 className="reports-page-title">HISTORICAL ENERGY REPORTS</h1>
            <p className="reports-page-subtitle">
              Comprehensive institutional historical analysis and downloadable energy performance reports
            </p>
          </div>
        </section>

        <ErrorState
          title="Unable to load report data"
          message={`Failed to connect to MySQL backend REST API: ${error}`}
          retryLabel="Retry API Connection"
          onRetry={loadReportData}
        />
      </div>
    );
  }

  return (
    <div className="reports-container">
      {/* ─── 1. TOP HEADER SECTION ───────────────────────────────────────── */}
      <section className="reports-header-section">
        <div>
          <div className="reports-title-row">
            <h1 className="reports-page-title">HISTORICAL ENERGY REPORTS</h1>
            <span className="badge-count">MySQL Historical Engine</span>
          </div>
          <p className="reports-page-subtitle">
            Comprehensive institutional performance analysis, cost breakdowns, and exportable reports
          </p>
        </div>

        <div className="reports-export-actions">
          <button className="export-btn csv" onClick={handleExportCsv} title="Export CSV Data">
            <FiDownload />
            <span>Export CSV</span>
          </button>

          <button className="export-btn pdf" onClick={handleExportPdf} title="Generate PDF Document">
            <FiFileText />
            <span>Export PDF</span>
          </button>
        </div>
      </section>

      {/* ─── 2. FILTERS SECTION ──────────────────────────────────────────── */}
      <section className="reports-filters-card">
        <div className="filters-header">
          <FiFilter />
          <h3 className="filters-title">Report Analysis Filters</h3>
        </div>

        <div className="filters-grid">
          {/* Period Select */}
          <div className="filter-field-group">
            <label className="filter-label">Reporting Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="filter-select-input"
            >
              <option value="today">Today</option>
              <option value="week">This Week (Last 7 Days)</option>
              <option value="month">This Month (Last 30 Days)</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Custom Date Inputs */}
          {selectedPeriod === 'custom' && (
            <div className="filter-field-group">
              <label className="filter-label">Custom Date Range</label>
              <div className="custom-date-row">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="filter-date-input"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="filter-date-input"
                  placeholder="End Date"
                />
              </div>
            </div>
          )}

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

          {/* Department Select */}
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

          {/* Report Type Select */}
          <div className="filter-field-group">
            <label className="filter-label">Report Focus Type</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="filter-select-input"
            >
              <option value="energy">Energy Consumption Report</option>
              <option value="cost">Cost Analysis Report</option>
              <option value="savings">Energy Saving Report</option>
              <option value="alerts">Alerts Summary Report</option>
            </select>
          </div>

          {/* Filter Action Buttons */}
          <div className="filter-actions-group">
            <button className="apply-filter-btn" onClick={handleApplyFilters}>
              <FiCheckCircle />
              <span>Apply Filters</span>
            </button>
            <button className="clear-filter-btn" onClick={handleResetFilters}>
              <FiX />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 3. REPORT SUMMARY KPI CARDS ─────────────────────────────────── */}
      <section className="reports-kpi-grid">
        {/* KPI 1: Total Energy Consumption */}
        <div className="reports-kpi-card accent-blue">
          <div className="kpi-top">
            <span className="kpi-title">Total Energy Consumption</span>
            <div className="kpi-icon-badge blue">
              <FiZap />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">
              {summary?.totalEnergyKwh?.toLocaleString('en-IN') ?? '0'}
            </span>
            <span className="kpi-unit">kWh</span>
          </div>
          <div className="kpi-footer">
            <span>Period: {appliedFilters.period.toUpperCase()}</span>
          </div>
        </div>

        {/* KPI 2: Estimated Electricity Cost */}
        <div className="reports-kpi-card accent-amber">
          <div className="kpi-top">
            <span className="kpi-title">Estimated Electricity Cost</span>
            <div className="kpi-icon-badge amber">
              <FiDollarSign />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-unit">₹</span>
            <span className="kpi-number">
              {summary?.totalCost?.toLocaleString('en-IN') ?? '0'}
            </span>
          </div>
          <div className="kpi-footer">
            <span className="tariff-badge">@ ₹ {summary?.tariff ?? '8.5'}/kWh Tariff</span>
          </div>
        </div>

        {/* KPI 3: Energy Saving */}
        <div className="reports-kpi-card accent-green">
          <div className="kpi-top">
            <span className="kpi-title">Energy Saving</span>
            <div className="kpi-icon-badge green">
              <FiTrendingDown />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">
              {summary?.energySavingKwh?.toLocaleString('en-IN') ?? '0'}
            </span>
            <span className="kpi-unit">kWh</span>
          </div>
          <div className="kpi-footer">
            <span>Historical Recoverable Savings</span>
          </div>
        </div>

        {/* KPI 4: Cost Saving */}
        <div className="reports-kpi-card accent-indigo">
          <div className="kpi-top">
            <span className="kpi-title">Cost Saving</span>
            <div className="kpi-icon-badge indigo">
              <FiBarChart2 />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-unit">₹</span>
            <span className="kpi-number">
              {summary?.costSaving?.toLocaleString('en-IN') ?? '0'}
            </span>
          </div>
          <div className="kpi-footer">
            <span>Calculated from ₹ {summary?.tariff ?? '8.5'}/kWh Tariff</span>
          </div>
        </div>
      </section>

      {/* ─── 4. ENERGY CONSUMPTION TREND CHART ───────────────────────────── */}
      <section className="reports-chart-card">
        <div className="chart-card-header">
          <div>
            <h3 className="chart-title">
              {appliedFilters.reportType === 'cost'
                ? 'Historical Electricity Cost Trend'
                : appliedFilters.reportType === 'savings'
                ? 'Historical Energy Saving Trend'
                : 'Historical Energy Consumption Trend'}
            </h3>
            <p className="chart-subtitle">
              Aggregated MySQL historical telemetry data for selected filter criteria
            </p>
          </div>
        </div>

        {trend.length > 0 ? (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={trend}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
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
                  dataKey={
                    appliedFilters.reportType === 'cost'
                      ? 'cost'
                      : appliedFilters.reportType === 'savings'
                      ? 'savingsKwh'
                      : 'energyKwh'
                  }
                  name={
                    appliedFilters.reportType === 'cost'
                      ? 'Electricity Cost (₹)'
                      : appliedFilters.reportType === 'savings'
                      ? 'Energy Saved (kWh)'
                      : 'Energy Consumed (kWh)'
                  }
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#trendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="No trend data available"
            description="No energy telemetry matches the selected filter parameters."
          />
        )}
      </section>

      {/* ─── 5. REPORT TYPE SPECIFIC SECTIONS ───────────────────────────── */}
      {appliedFilters.reportType === 'alerts' && alertsSummary ? (
        <section className="alerts-summary-section">
          <div className="section-title-row">
            <div>
              <h2 className="reports-section-heading">Alerts Summary Report</h2>
              <p className="reports-section-subheading">
                Historical parameter anomaly triggers and resolution statuses
              </p>
            </div>
            <span className="badge-count">{alertsSummary.totalAlerts} Total Alerts</span>
          </div>

          <div className="alerts-summary-grid">
            <div className="alert-stat-card danger">
              <span className="stat-label">Critical / Danger Alerts</span>
              <div className="stat-value text-red">{alertsSummary.severity?.danger || 0}</div>
            </div>
            <div className="alert-stat-card warning">
              <span className="stat-label">Warning Alerts</span>
              <div className="stat-value text-amber">{alertsSummary.severity?.warning || 0}</div>
            </div>
            <div className="alert-stat-card info">
              <span className="stat-label">Active Alerts</span>
              <div className="stat-value text-blue">{alertsSummary.status?.Active || 0}</div>
            </div>
            <div className="alert-stat-card success">
              <span className="stat-label">Resolved Alerts</span>
              <div className="stat-value text-green">{alertsSummary.status?.Resolved || 0}</div>
            </div>
          </div>
        </section>
      ) : (
        /* BUILDING-WISE CONSUMPTION SECTION */
        <section className="building-reports-section">
          <div className="section-title-row">
            <div>
              <h2 className="reports-section-heading">Building-wise Energy Performance</h2>
              <p className="reports-section-subheading">
                Energy consumption and cost analysis breakdown across campus blocks
              </p>
            </div>
            <span className="badge-count">{buildingsData.length} Campus Blocks</span>
          </div>

          <div className="charts-grid-two">
            <div className="reports-chart-card">
              <h4 className="chart-title">Building Consumption Bar Breakdown</h4>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={buildingsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="code" fontSize={11} stroke="#64748B" />
                    <YAxis fontSize={11} stroke="#64748B" />
                    <Tooltip />
                    <Bar dataKey="totalKwh" name="Energy (kWh)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="reports-data-table">
                <thead>
                  <tr>
                    <th>Building Name</th>
                    <th>Code</th>
                    <th>Total Energy</th>
                    <th>Est. Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {buildingsData.map((bldg) => (
                    <tr key={bldg.id}>
                      <td><strong>{bldg.name}</strong></td>
                      <td><span className="reports-page-subtitle">{bldg.code}</span></td>
                      <td><strong className="text-blue">{bldg.totalKwh.toLocaleString('en-IN')} kWh</strong></td>
                      <td><strong>₹ {bldg.estimatedCost.toLocaleString('en-IN')}</strong></td>
                      <td>{renderStatusBadge(bldg.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ─── 6. DETAILED REPORT TABLE WITH PAGINATION ────────────────────── */}
      <section className="detailed-report-section">
        <div className="section-title-row">
          <div>
            <h2 className="reports-section-heading">Detailed Telemetry Log Report</h2>
            <p className="reports-section-subheading">
              Paginated historical time-series telemetry records matching selected criteria
            </p>
          </div>
          {detailsData && (
            <span className="badge-count">
              {detailsData.totalRecords} Total Telemetry Records
            </span>
          )}
        </div>

        {detailsData && detailsData.records.length > 0 ? (
          <div className="table-wrapper">
            <table className="reports-data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Building</th>
                  <th>Department</th>
                  <th>Energy (kWh)</th>
                  <th>Estimated Cost</th>
                  <th>Power (kW)</th>
                  <th>Voltage (V)</th>
                  <th>Current (A)</th>
                  <th>Power Factor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {detailsData.records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="timestamp-cell">
                        <FiClock />
                        <span>{r.readingDate}</span>
                      </div>
                    </td>
                    <td><strong>{r.buildingName}</strong></td>
                    <td>{r.departmentName}</td>
                    <td><strong className="text-blue">{r.energyKwh} kWh</strong></td>
                    <td><strong>₹ {r.estimatedCost.toLocaleString('en-IN')}</strong></td>
                    <td>{r.powerKw} kW</td>
                    <td>{r.voltage} V</td>
                    <td>{r.currentA} A</td>
                    <td>{r.powerFactor}</td>
                    <td>{renderStatusBadge(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="pagination-bar">
              <span>
                Showing Page {detailsData.page} of {detailsData.totalPages} ({detailsData.totalRecords} total records)
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
                  onClick={() => setCurrentPage((p) => Math.min(detailsData.totalPages, p + 1))}
                  disabled={currentPage === detailsData.totalPages}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No detailed telemetry log records available"
            description="No historical records match the selected filter criteria."
          />
        )}
      </section>
    </div>
  );
};

export default AdminReports;
