import React, { useState, useEffect, useCallback } from 'react';
import {
  FiAlertTriangle,
  FiBell,
  FiFilter,
  FiX,
  FiCheckCircle,
  FiClock,
  FiCheck,
  FiInfo,
  FiSliders,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
  FiRefreshCw,
  FiZap,
  FiActivity,
} from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  getAlerts,
  getAlertSummary,
  getAlertThresholds,
  updateAlertThresholds,
  acknowledgeAlert,
  resolveAlert,
} from '../services/alertService';

import EmptyState from '../components/common/EmptyState/EmptyState';
import ErrorState from '../components/common/ErrorState/ErrorState';
import './AdminAlerts.css';

// Institution Building and Department mappings matching MySQL database structure
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
    { id: '2', name: 'ECE Department', code: 'ECE' },
  ],
  '2': [
    { id: '3', name: 'Textile Technology', code: 'TEXTILE' },
    { id: '4', name: 'Fashion Technology', code: 'FASHION' },
    { id: '5', name: 'Physics & Chemistry Labs', code: 'SCI-LABS' },
  ],
  '3': [
    { id: '6', name: 'Mechanical Workshop', code: 'MECH-SHOP' },
    { id: '7', name: 'Mechatronics Lab', code: 'MECHATRONICS' },
  ],
  '4': [
    { id: '8', name: 'Computer Science & Engg', code: 'CSE' },
    { id: '9', name: 'Information Technology', code: 'IT' },
    { id: '10', name: 'AI & Data Science', code: 'AIDS' },
  ],
  '5': [
    { id: '11', name: 'Incubation Center', code: 'INCUBATION' },
    { id: '12', name: 'Robotics Research Lab', code: 'ROBOTICS' },
    { id: '13', name: 'VLSI Design Center', code: 'VLSI' },
  ],
  '6': [
    { id: '14', name: 'Central Digital Library', code: 'DIGITAL-LIB' },
    { id: '15', name: 'Server & IT Center', code: 'DATA-CENTER' },
  ],
  '7': [
    { id: '16', name: 'Lotus Block', code: 'Lotus' },
    { id: '17', name: 'Jasmine Block', code: 'Jasmine' },
  ],
  '8': [
    { id: '18', name: 'Emerald Block', code: 'Emerald' },
    { id: '19', name: 'Sapphire Block', code: 'Sapphire' },
    { id: '20', name: 'Ruby Block', code: 'Ruby' },
  ],
};

const ALL_DEPARTMENTS = Object.values(DEPARTMENTS_BY_BUILDING).flat();

const ALERT_TYPES = [
  'High Voltage',
  'Low Voltage',
  'Overload / High Current',
  'Low Power Factor',
  'High Energy Consumption',
  'Abnormal Energy Usage',
];

const AdminAlerts = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const userRole = user?.role || 'Administrator';
  const userDeptId = user?.department_id || null;

  // Filter State
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedAlertType, setSelectedAlertType] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({ total: 0, totalPages: 1, limit: 15, page: 1 });

  // Data & UI State
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({
    totalAlerts: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    unresolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail Modal State
  const [selectedAlertModal, setSelectedAlertModal] = useState(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  // Settings Modal State
  const [showThresholdsModal, setShowThresholdsModal] = useState(false);
  const [thresholdsForm, setThresholdsForm] = useState({
    max_voltage: '245.0',
    min_voltage: '215.0',
    max_current: '120.0',
    min_power_factor: '0.90',
    high_consumption_kw: '35.0',
    abnormal_usage_kwh: '12.0',
  });
  const [savingThresholds, setSavingThresholds] = useState(false);

  // Department dropdown dependent on selected building
  const availableDepartments =
    selectedBuilding === 'all'
      ? ALL_DEPARTMENTS
      : DEPARTMENTS_BY_BUILDING[selectedBuilding] || [];

  const handleBuildingChange = (e) => {
    setSelectedBuilding(e.target.value);
    setSelectedDepartment('all');
  };

  const roleContext = {
    role: userRole,
    userDeptId,
  };

  // Fetch Alerts & Summary
  const fetchAlertsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        buildingId: selectedBuilding,
        departmentId: selectedDepartment,
        alertType: selectedAlertType,
        severity: selectedSeverity,
        status: selectedStatus,
        startDate,
        endDate,
      };

      const [alertsRes, summaryRes] = await Promise.all([
        getAlerts(filters, { page: currentPage, limit: 15 }, roleContext),
        getAlertSummary(filters, roleContext),
      ]);

      const fetchedAlerts = alertsRes.data || [];
      setAlerts(fetchedAlerts);

      // Safe extraction of pagination meta from API response
      const metaPagination = alertsRes.meta?.pagination || alertsRes.pagination || {
        total: fetchedAlerts.length,
        page: currentPage,
        limit: 15,
        totalPages: 1,
      };
      setPaginationInfo(metaPagination);
      setSummary(summaryRes);

      // Sync active unread notifications if critical/high alerts present
      if (fetchedAlerts.length > 0) {
        const topActive = fetchedAlerts.find(a => a.status === 'Active' && (a.severity === 'Critical' || a.severity === 'High'));
        if (topActive) {
          addNotification({
            title: topActive.title,
            message: topActive.message || topActive.description,
            type: topActive.severity === 'Critical' ? 'danger' : 'warning',
            link: '/admin/alerts',
          });
        }
      }
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError(err.message || 'Failed to connect to MySQL database. Please verify backend server.');
    } finally {
      setLoading(false);
    }
  }, [
    selectedBuilding,
    selectedDepartment,
    selectedAlertType,
    selectedSeverity,
    selectedStatus,
    startDate,
    endDate,
    currentPage,
    userRole,
    userDeptId,
  ]);

  useEffect(() => {
    fetchAlertsData();
  }, [fetchAlertsData]);

  // Load Threshold Settings
  const handleOpenThresholds = async () => {
    try {
      setShowThresholdsModal(true);
      const data = await getAlertThresholds();
      if (data) {
        setThresholdsForm({
          max_voltage: data.max_voltage || '245.0',
          min_voltage: data.min_voltage || '215.0',
          max_current: data.max_current || '120.0',
          min_power_factor: data.min_power_factor || '0.90',
          high_consumption_kw: data.high_consumption_kw || '35.0',
          abnormal_usage_kwh: data.abnormal_usage_kwh || '12.0',
        });
      }
    } catch (err) {
      console.error('Error fetching thresholds:', err);
    }
  };

  const handleSaveThresholds = async () => {
    setSavingThresholds(true);
    try {
      await updateAlertThresholds(thresholdsForm);
      setShowThresholdsModal(false);
      fetchAlertsData();
    } catch (err) {
      console.error('Error updating thresholds:', err);
      alert('Failed to update threshold settings. Please try again.');
    } finally {
      setSavingThresholds(false);
    }
  };

  // Acknowledge Action
  const handleAcknowledge = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await acknowledgeAlert(id, user?.name || 'Administrator');
      fetchAlertsData();
      if (selectedAlertModal && selectedAlertModal.id === id) {
        setSelectedAlertModal(prev => prev ? { ...prev, status: 'Acknowledged', acknowledged_by: user?.name } : null);
      }
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      alert('Failed to acknowledge alert.');
    }
  };

  // Resolve Action
  const handleResolve = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await resolveAlert(id, user?.name || 'Administrator', resolutionRemarks);
      setResolutionRemarks('');
      fetchAlertsData();
      setSelectedAlertModal(null);
    } catch (err) {
      console.error('Error resolving alert:', err);
      alert('Failed to resolve alert.');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedBuilding('all');
    setSelectedDepartment('all');
    setSelectedAlertType('all');
    setSelectedSeverity('all');
    setSelectedStatus('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Format Timestamps
  const formatDateTime = (ts) => {
    if (!ts) return 'N/A';
    const date = new Date(ts);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Helper for alert type icon
  const getAlertTypeIcon = (type) => {
    if (type?.includes('Voltage') || type?.includes('Current') || type?.includes('Power Factor') || type?.includes('Overload')) {
      return <FiZap style={{ color: '#0284c7' }} />;
    }
    return <FiActivity style={{ color: '#0284c7' }} />;
  };

  const startIndex = (paginationInfo.page - 1) * paginationInfo.limit + 1;
  const endIndex = Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total);

  return (
    <div className="alerts-container">
      {/* 1. Page Header Section */}
      <div className="alerts-header-section">
        <div className="alerts-title-row">
          <FiAlertTriangle className="alerts-header-icon" />
          <div>
            <h1 className="alerts-page-title">Alerts</h1>
            <p className="alerts-page-subtitle">
              Monitor and manage abnormal energy and electrical conditions across the campus.
            </p>
          </div>
        </div>

        <div className="alerts-header-actions">
          <span className="role-badge-tag">
            <FiShield /> {userRole}
          </span>
          {userRole === 'Administrator' && (
            <button className="btn-header-action" onClick={handleOpenThresholds}>
              <FiSliders /> Threshold Settings
            </button>
          )}
          <button className="btn-header-action" onClick={fetchAlertsData} title="Refresh Data">
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* 2. Alert Summary KPI Cards Grid */}
      <div className="alerts-summary-grid">
        <div className="alert-kpi-card total">
          <div className="kpi-icon-box">
            <FiBell />
          </div>
          <div className="kpi-content">
            <span className="kpi-number">{summary.totalAlerts.toLocaleString()}</span>
            <span className="kpi-title-text">Total Alerts</span>
          </div>
        </div>

        <div className="alert-kpi-card critical">
          <div className="kpi-icon-box">
            <FiAlertTriangle />
          </div>
          <div className="kpi-content">
            <span className="kpi-number">{summary.critical.toLocaleString()}</span>
            <span className="kpi-title-text">Critical Severity</span>
          </div>
        </div>

        <div className="alert-kpi-card high">
          <div className="kpi-icon-box">
            <FiAlertTriangle />
          </div>
          <div className="kpi-content">
            <span className="kpi-number">{summary.high.toLocaleString()}</span>
            <span className="kpi-title-text">High Severity</span>
          </div>
        </div>

        <div className="alert-kpi-card medium">
          <div className="kpi-icon-box">
            <FiInfo />
          </div>
          <div className="kpi-content">
            <span className="kpi-number">{summary.medium.toLocaleString()}</span>
            <span className="kpi-title-text">Medium Severity</span>
          </div>
        </div>

        <div className="alert-kpi-card low">
          <div className="kpi-icon-box">
            <FiInfo />
          </div>
          <div className="kpi-content">
            <span className="kpi-number">{summary.low.toLocaleString()}</span>
            <span className="kpi-title-text">Low / Informational</span>
          </div>
        </div>

        <div className="alert-kpi-card unresolved">
          <div className="kpi-icon-box">
            <FiClock />
          </div>
          <div className="kpi-content">
            <span className="kpi-number">{summary.unresolved.toLocaleString()}</span>
            <span className="kpi-title-text">Unresolved Alerts</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Section */}
      <div className="alerts-filter-card">
        <div className="filter-card-header">
          <h3>
            <FiFilter /> Alert Filters
          </h3>
        </div>

        <div className="filters-form-grid">
          {/* Row 1: Building, Department, Alert Type */}
          <div className="filter-row">
            <div className="filter-field">
              <label>Building</label>
              <select
                className="filter-select"
                value={selectedBuilding}
                onChange={handleBuildingChange}
              >
                <option value="all">All Buildings (8 Blocks)</option>
                {BUILDINGS_LIST.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label>Department / Unit</label>
              <select
                className="filter-select"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="all">All Departments / Units</option>
                {availableDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label>Alert Type</label>
              <select
                className="filter-select"
                value={selectedAlertType}
                onChange={(e) => setSelectedAlertType(e.target.value)}
              >
                <option value="all">All Alert Types</option>
                {ALERT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Severity, Status, Start Date, End Date */}
          <div className="filter-row">
            <div className="filter-field">
              <label>Severity</label>
              <select
                className="filter-select"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="filter-field">
              <label>Status</label>
              <select
                className="filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="filter-field">
              <label>Start Date</label>
              <input
                type="date"
                className="filter-input-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="filter-field">
              <label>End Date</label>
              <input
                type="date"
                className="filter-input-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Action Buttons */}
          <div className="filter-buttons-row">
            <button className="btn-apply-filters" onClick={() => setCurrentPage(1)}>
              <FiFilter /> Apply Filters
            </button>
            <button className="btn-reset-filters" onClick={handleResetFilters}>
              <FiX /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* 4. Alert Data Table Card */}
      <div className="alerts-table-card">
        <div className="alerts-table-header">
          <h3>
            <FiBell /> Alert Records ({paginationInfo.total.toLocaleString()})
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <FiRefreshCw className="animate-spin" style={{ fontSize: '2rem', marginBottom: '1rem', color: '#2563eb' }} />
            <p style={{ fontWeight: 600 }}>Loading alert records from MySQL database...</p>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchAlertsData} />
        ) : alerts.length === 0 ? (
          <EmptyState
            title="No alerts found"
            description="Try changing your filters or date range."
          />
        ) : (
          <>
            <div className="table-responsive-wrapper">
              <table className="alerts-main-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Building</th>
                    <th>Department/Unit</th>
                    <th>Alert Type</th>
                    <th>Description</th>
                    <th>Trigger Value</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => {
                    const sevLower = (a.severity || 'medium').toLowerCase();
                    const rowClass = sevLower === 'critical' ? 'row-severity-critical' : sevLower === 'high' ? 'row-severity-high' : '';

                    return (
                      <tr
                        key={a.id || a.alert_id}
                        className={rowClass}
                        onClick={() => setSelectedAlertModal(a)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="col-datetime">{formatDateTime(a.timestamp || a.created_at)}</td>
                        <td>
                          <span className="bldg-name-text">{a.building_name || `Building #${a.building_id}`}</span>
                        </td>
                        <td>
                          <span className="dept-code-sub">{a.department_name || `Department #${a.department_id}`}</span>
                        </td>
                        <td>
                          <span className="col-alert-type">
                            {getAlertTypeIcon(a.alert_type)} {a.alert_type}
                          </span>
                        </td>
                        <td className="col-description" title={a.message || a.description}>
                          {a.message || a.description}
                        </td>
                        <td className="col-trigger-val">{a.trigger_value || 'N/A'}</td>
                        <td>
                          <span className={`severity-pill ${sevLower}`}>
                            {a.severity}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${(a.status || 'active').toLowerCase()}`}>
                            {a.status}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="table-action-group">
                            <button
                              className="btn-table-action"
                              title="View Details"
                              onClick={() => setSelectedAlertModal(a)}
                            >
                              <FiEye /> View Details
                            </button>

                            {a.status === 'Active' && (
                              <button
                                className="btn-table-action ack"
                                title="Acknowledge Alert"
                                onClick={(e) => handleAcknowledge(a.id, e)}
                              >
                                <FiCheck /> Acknowledge
                              </button>
                            )}

                            {a.status !== 'Resolved' && (
                              <button
                                className="btn-table-action resolve"
                                title="Resolve Alert"
                                onClick={() => setSelectedAlertModal(a)}
                              >
                                <FiCheckCircle /> Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="alerts-pagination-bar">
              <span className="pagination-text">
                Showing {startIndex}–{endIndex} of {paginationInfo.total.toLocaleString()} alerts
              </span>
              <div className="pagination-buttons">
                <button
                  className="btn-pagination"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  <FiChevronLeft /> Previous
                </button>
                <button
                  className="btn-pagination"
                  disabled={currentPage >= paginationInfo.totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, paginationInfo.totalPages))}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 5. Alert Details Modal */}
      {selectedAlertModal && (
        <div className="alerts-modal-backdrop" onClick={() => setSelectedAlertModal(null)}>
          <div className="alerts-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="alerts-modal-header">
              <h3>
                <FiAlertTriangle style={{ color: '#ef4444' }} /> Alert Inspection Detail
              </h3>
              <button className="btn-close-modal" onClick={() => setSelectedAlertModal(null)}>
                <FiX />
              </button>
            </div>

            <div className="alerts-modal-body">
              {/* SECTION 1: ALERT INFORMATION */}
              <div>
                <div className="modal-section-title">ALERT INFORMATION</div>
                <div className="modal-grid-2col">
                  <div className="modal-info-item">
                    <span className="info-item-label">Alert ID</span>
                    <span className="info-item-value">{selectedAlertModal.id || selectedAlertModal.alert_id}</span>
                  </div>

                  <div className="modal-info-item">
                    <span className="info-item-label">Date & Time</span>
                    <span className="info-item-value">{formatDateTime(selectedAlertModal.timestamp || selectedAlertModal.created_at)}</span>
                  </div>

                  <div className="modal-info-item">
                    <span className="info-item-label">Alert Type</span>
                    <span className="info-item-value" style={{ color: '#0284c7' }}>{selectedAlertModal.alert_type}</span>
                  </div>

                  <div className="modal-info-item">
                    <span className="info-item-label">Severity</span>
                    <span className="info-item-value">
                      <span className={`severity-pill ${(selectedAlertModal.severity || 'medium').toLowerCase()}`}>
                        {selectedAlertModal.severity}
                      </span>
                    </span>
                  </div>

                  <div className="modal-info-item">
                    <span className="info-item-label">Status</span>
                    <span className="info-item-value">
                      <span className={`status-pill ${(selectedAlertModal.status || 'active').toLowerCase()}`}>
                        {selectedAlertModal.status}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: LOCATION */}
              <div>
                <div className="modal-section-title">LOCATION</div>
                <div className="modal-grid-2col">
                  <div className="modal-info-item">
                    <span className="info-item-label">Building</span>
                    <span className="info-item-value">{selectedAlertModal.building_name || `Building #${selectedAlertModal.building_id}`}</span>
                  </div>

                  <div className="modal-info-item">
                    <span className="info-item-label">Department / Unit</span>
                    <span className="info-item-value">{selectedAlertModal.department_name || `Department #${selectedAlertModal.department_id}`}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: DETECTION */}
              <div>
                <div className="modal-section-title">DETECTION</div>
                <div className="modal-grid-2col" style={{ marginBottom: '0.75rem' }}>
                  <div className="modal-info-item">
                    <span className="info-item-label">Trigger Value</span>
                    <span className="info-item-value trigger-val-text">{selectedAlertModal.trigger_value || 'N/A'}</span>
                  </div>

                  <div className="modal-info-item">
                    <span className="info-item-label">Threshold</span>
                    <span className="info-item-value threshold-val-text">{selectedAlertModal.threshold_value || 'N/A'}</span>
                  </div>
                </div>

                <div className="modal-info-item">
                  <span className="info-item-label">Description</span>
                  <p style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', margin: 0, fontSize: '0.875rem' }}>
                    {selectedAlertModal.message || selectedAlertModal.description}
                  </p>
                </div>
              </div>

              {/* SECTION 4: RESOLUTION */}
              <div>
                <div className="modal-section-title">RESOLUTION</div>
                <div className="modal-grid-2col" style={{ marginBottom: '0.75rem' }}>
                  {selectedAlertModal.acknowledged_by ? (
                    <div className="modal-info-item">
                      <span className="info-item-label">Acknowledged By</span>
                      <span className="info-item-value">
                        {selectedAlertModal.acknowledged_by} ({formatDateTime(selectedAlertModal.acknowledged_at)})
                      </span>
                    </div>
                  ) : (
                    <div className="modal-info-item">
                      <span className="info-item-label">Acknowledged By</span>
                      <span className="info-item-value" style={{ color: '#94a3b8' }}>Not Yet Acknowledged</span>
                    </div>
                  )}

                  {selectedAlertModal.resolved_by ? (
                    <div className="modal-info-item">
                      <span className="info-item-label">Resolved By</span>
                      <span className="info-item-value">
                        {selectedAlertModal.resolved_by} ({formatDateTime(selectedAlertModal.resolved_at)})
                      </span>
                    </div>
                  ) : (
                    <div className="modal-info-item">
                      <span className="info-item-label">Resolved By</span>
                      <span className="info-item-value" style={{ color: '#94a3b8' }}>Unresolved</span>
                    </div>
                  )}
                </div>

                {selectedAlertModal.status !== 'Resolved' && (
                  <div className="modal-info-item">
                    <span className="info-item-label">Resolution Remarks</span>
                    <textarea
                      className="modal-remarks-textarea"
                      placeholder="Enter technician / maintenance resolution notes..."
                      value={resolutionRemarks}
                      onChange={(e) => setResolutionRemarks(e.target.value)}
                    />
                  </div>
                )}

                {selectedAlertModal.resolution_remarks && selectedAlertModal.status === 'Resolved' && (
                  <div className="modal-info-item">
                    <span className="info-item-label">Resolution Remarks</span>
                    <p style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#166534', margin: 0, fontSize: '0.875rem' }}>
                      {selectedAlertModal.resolution_remarks}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="alerts-modal-footer">
              <button className="btn-reset-filters" onClick={() => setSelectedAlertModal(null)}>
                Close
              </button>

              {selectedAlertModal.status === 'Active' && (
                <button className="btn-header-action" onClick={() => handleAcknowledge(selectedAlertModal.id)}>
                  <FiCheck /> Acknowledge
                </button>
              )}

              {selectedAlertModal.status !== 'Resolved' && (
                <button className="btn-apply-filters" onClick={() => handleResolve(selectedAlertModal.id)}>
                  <FiCheckCircle /> Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Threshold Settings Modal */}
      {showThresholdsModal && (
        <div className="alerts-modal-backdrop" onClick={() => setShowThresholdsModal(false)}>
          <div className="alerts-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="alerts-modal-header">
              <h3>
                <FiSliders /> System Alert Threshold Configuration
              </h3>
              <button className="btn-close-modal" onClick={() => setShowThresholdsModal(false)}>
                <FiX />
              </button>
            </div>

            <div className="alerts-modal-body">
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Configure global electrical and energy parameters stored in MySQL table <code>system_settings</code>. Telemetry readings exceeding these thresholds will automatically trigger alerts.
              </p>

              <div className="modal-grid-2col">
                <div className="filter-field">
                  <label>Max Voltage (V)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="filter-select"
                    value={thresholdsForm.max_voltage}
                    onChange={(e) => setThresholdsForm({ ...thresholdsForm, max_voltage: e.target.value })}
                  />
                </div>

                <div className="filter-field">
                  <label>Min Voltage (V)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="filter-select"
                    value={thresholdsForm.min_voltage}
                    onChange={(e) => setThresholdsForm({ ...thresholdsForm, min_voltage: e.target.value })}
                  />
                </div>

                <div className="filter-field">
                  <label>Max Current Limit (A)</label>
                  <input
                    type="number"
                    step="1"
                    className="filter-select"
                    value={thresholdsForm.max_current}
                    onChange={(e) => setThresholdsForm({ ...thresholdsForm, max_current: e.target.value })}
                  />
                </div>

                <div className="filter-field">
                  <label>Min Power Factor (PF)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="filter-select"
                    value={thresholdsForm.min_power_factor}
                    onChange={(e) => setThresholdsForm({ ...thresholdsForm, min_power_factor: e.target.value })}
                  />
                </div>

                <div className="filter-field">
                  <label>High Demand Threshold (kW)</label>
                  <input
                    type="number"
                    step="1"
                    className="filter-select"
                    value={thresholdsForm.high_consumption_kw}
                    onChange={(e) => setThresholdsForm({ ...thresholdsForm, high_consumption_kw: e.target.value })}
                  />
                </div>

                <div className="filter-field">
                  <label>Abnormal Usage 15-min (kWh)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="filter-select"
                    value={thresholdsForm.abnormal_usage_kwh}
                    onChange={(e) => setThresholdsForm({ ...thresholdsForm, abnormal_usage_kwh: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="alerts-modal-footer">
              <button className="btn-reset-filters" onClick={() => setShowThresholdsModal(false)}>
                Cancel
              </button>
              <button className="btn-apply-filters" onClick={handleSaveThresholds} disabled={savingThresholds}>
                {savingThresholds ? 'Saving Settings...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;
