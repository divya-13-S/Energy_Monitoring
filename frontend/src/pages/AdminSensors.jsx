import React, { useState, useEffect, useCallback } from 'react';
import {
  FiCpu,
  FiPlus,
  FiSearch,
  FiFilter,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiTool,
  FiEdit,
  FiEye,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiSliders,
  FiMapPin,
  FiLayers,
  FiPower,
  FiClock,
  FiZap,
} from 'react-icons/fi';

import {
  getSensors,
  getSensorSummary,
  createSensor,
  updateSensor,
  toggleSensorStatus,
  getSensorHistory,
} from '../services/sensorService';

import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState/EmptyState';
import ErrorState from '../components/common/ErrorState/ErrorState';
import './AdminSensors.css';

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

const PARAMETERS_LIST = [
  'Energy & Power Demand',
  'Voltage Transducer',
  'Current Transformer',
  'Power Factor Monitor',
];

const STATUS_OPTIONS = ['Online', 'Offline', 'Maintenance'];

const AdminSensors = () => {
  const { role } = useAuth();
  const isElectrician = role === 'Electrician / Maintenance Staff';

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedParameter, setSelectedParameter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  // Data State
  const [sensors, setSensors] = useState([]);
  const [summary, setSummary] = useState({
    totalSensors: 0,
    onlineSensors: 0,
    offlineSensors: 0,
    maintenanceSensors: 0,
  });

  // UI / Async State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Active item selections
  const [activeSensor, setActiveSensor] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form State
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    id: null,
    sensor_code: '',
    sensor_name: '',
    building_id: '',
    department_id: '',
    parameter: 'Energy & Power Demand',
    room_location: '',
    status: 'Online',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Clear toast notifications after 4 seconds
  useEffect(() => {
    if (actionSuccess || actionError) {
      const timer = setTimeout(() => {
        setActionSuccess('');
        setActionError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess, actionError]);

  // Available departments based on selected building in filter / form
  const filterAvailableDepts =
    selectedBuilding !== 'all'
      ? DEPARTMENTS_BY_BUILDING[selectedBuilding] || []
      : ALL_DEPARTMENTS;

  const formAvailableDepts = formData.building_id
    ? DEPARTMENTS_BY_BUILDING[formData.building_id] || []
    : [];

  // Reset department filter if building changes
  const handleBuildingFilterChange = (e) => {
    const val = e.target.value;
    setSelectedBuilding(val);
    setSelectedDept('all');
    setPage(1);
  };

  // Fetch sensors data
  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const filterParams = {
          search: searchTerm.trim(),
          buildingId: selectedBuilding !== 'all' ? selectedBuilding : '',
          departmentId: selectedDept !== 'all' ? selectedDept : '',
          parameter: selectedParameter !== 'all' ? selectedParameter : '',
          status: selectedStatus !== 'all' ? selectedStatus : '',
        };

        const paginationParams = { page, limit };

        const [sensorRes, summaryRes] = await Promise.all([
          getSensors(filterParams, paginationParams),
          getSensorSummary(),
        ]);

        if (sensorRes?.success || sensorRes?.status === 'success') {
          setSensors(sensorRes.data || []);
          if (sensorRes.meta?.pagination) {
            setPaginationInfo(sensorRes.meta.pagination);
          } else if (sensorRes.pagination) {
            setPaginationInfo(sensorRes.pagination);
          }
        }

        if (summaryRes) {
          setSummary(summaryRes);
        }
      } catch (err) {
        console.error('Failed to fetch sensor management data:', err);
        setError(err.message || 'Error communicating with MySQL database server.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchTerm, selectedBuilding, selectedDept, selectedParameter, selectedStatus, page, limit]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Search Input Change with pagination reset
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBuilding('all');
    setSelectedDept('all');
    setSelectedParameter('all');
    setSelectedStatus('all');
    setPage(1);
  };

  // Open Add Sensor Modal
  const handleOpenAddModal = () => {
    setFormMode('add');
    const defaultBldg = '1';
    const defaultDepts = DEPARTMENTS_BY_BUILDING[defaultBldg] || [];
    setFormData({
      id: null,
      sensor_code: `SNS-EM-${Date.now().toString().slice(-6)}`,
      sensor_name: '',
      building_id: defaultBldg,
      department_id: defaultDepts[0]?.id || '1',
      parameter: 'Energy & Power Demand',
      room_location: 'Main Distribution Panel Room',
      status: 'Online',
    });
    setFormErrors({});
    setIsAddEditModalOpen(true);
  };

  // Open Edit Sensor Modal
  const handleOpenEditModal = (sensor) => {
    setFormMode('edit');
    setFormData({
      id: sensor.id,
      sensor_code: sensor.sensor_code,
      sensor_name: sensor.sensor_name,
      building_id: sensor.building_id?.toString() || '1',
      department_id: sensor.department_id?.toString() || '1',
      parameter: sensor.parameter || 'Energy & Power Demand',
      room_location: sensor.room_location || '',
      status: sensor.status || 'Online',
    });
    setFormErrors({});
    setIsAddEditModalOpen(true);
  };

  // Open Details Modal
  const handleOpenDetailsModal = (sensor) => {
    setActiveSensor(sensor);
    setIsDetailsModalOpen(true);
  };

  // Open Telemetry History Modal
  const handleOpenHistoryModal = async (sensor) => {
    setActiveSensor(sensor);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);

    try {
      const historyRes = await getSensorHistory(sensor.id, 20);
      setTelemetryHistory(historyRes.readings || []);
    } catch (err) {
      console.error('Failed to fetch telemetry history:', err);
      setActionError(err.message || 'Failed to load telemetry history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.sensor_code.trim()) errors.sensor_code = 'Sensor code is required.';
    if (!formData.sensor_name.trim()) errors.sensor_name = 'Sensor name is required.';
    if (!formData.building_id) errors.building_id = 'Please select a building facility.';
    if (!formData.department_id) errors.department_id = 'Please select a department unit.';
    if (!formData.room_location.trim()) errors.room_location = 'Room location is required.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Add/Edit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (formMode === 'add') {
        await createSensor({
          sensor_code: formData.sensor_code,
          sensor_name: formData.sensor_name,
          building_id: parseInt(formData.building_id, 10),
          department_id: parseInt(formData.department_id, 10),
          parameter: formData.parameter,
          room_location: formData.room_location,
          status: formData.status,
        });
        setActionSuccess(`Sensor "${formData.sensor_name}" added successfully.`);
      } else {
        await updateSensor(formData.id, {
          sensor_name: formData.sensor_name,
          building_id: parseInt(formData.building_id, 10),
          department_id: parseInt(formData.department_id, 10),
          parameter: formData.parameter,
          room_location: formData.room_location,
          status: formData.status,
        });
        setActionSuccess(`Sensor "${formData.sensor_name}" updated successfully.`);
      }

      setIsAddEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Form submission error:', err);
      setActionError(err.message || `Failed to ${formMode} sensor.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Sensor Status
  const handleToggleStatus = async (sensor, newStatus) => {
    try {
      await toggleSensorStatus(sensor.id, newStatus);
      setActionSuccess(`Sensor "${sensor.sensor_name}" status set to ${newStatus}.`);
      fetchData();
    } catch (err) {
      console.error('Status toggle error:', err);
      setActionError(err.message || 'Failed to update sensor status.');
    }
  };

  // Format timestamp helper
  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'No signal';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="sensors-management-container">
      {/* Toast Notifications */}
      {actionSuccess && (
        <div className="sensor-toast sensor-toast-success">
          <FiCheckCircle className="toast-icon" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="sensor-toast sensor-toast-error">
          <FiAlertCircle className="toast-icon" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="sensors-header">
        <div className="sensors-header-title">
          <h1>
            <FiCpu className="title-icon" /> Sensor Management
          </h1>
          <p>
            Configure IoT sensors, parameters, physical location, operational status, and real telemetry histories
          </p>
        </div>
        <div className="sensors-header-actions">
          <button
            className="btn-refresh"
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            title="Refresh database records"
          >
            <FiRefreshCw className={refreshing ? 'spin-icon' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          {!isElectrician && (
            <button className="btn-add-sensor" onClick={handleOpenAddModal}>
              <FiPlus /> <span>Add Sensor</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="sensors-kpi-grid">
        <div className="sensor-kpi-card total">
          <div className="kpi-icon-wrapper total-icon">
            <FiCpu />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Total Sensors</span>
            <h2 className="kpi-value">{summary.totalSensors}</h2>
            <span className="kpi-subtext">Configured campus hardware</span>
          </div>
        </div>

        <div className="sensor-kpi-card online">
          <div className="kpi-icon-wrapper online-icon">
            <FiCheckCircle />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Online Sensors</span>
            <h2 className="kpi-value">{summary.onlineSensors}</h2>
            <span className="kpi-subtext">Normal 15-min telemetry active</span>
          </div>
        </div>

        <div className="sensor-kpi-card offline">
          <div className="kpi-icon-wrapper offline-icon">
            <FiAlertCircle />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Offline Sensors</span>
            <h2 className="kpi-value">{summary.offlineSensors}</h2>
            <span className="kpi-subtext">No telemetry signal detected</span>
          </div>
        </div>

        <div className="sensor-kpi-card maintenance">
          <div className="kpi-icon-wrapper maintenance-icon">
            <FiTool />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">In Maintenance</span>
            <h2 className="kpi-value">{summary.maintenanceSensors}</h2>
            <span className="kpi-subtext">Scheduled servicing / calibration</span>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="sensors-filter-card">
        <div className="filter-row">
          {/* Search Box */}
          <div className="filter-group search-group">
            <label>Search Sensors</label>
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search Code, Name, or Room Location..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>

          {/* Building Filter */}
          <div className="filter-group">
            <label>Building Facility</label>
            <select value={selectedBuilding} onChange={handleBuildingFilterChange}>
              <option value="all">All Buildings (8)</option>
              {BUILDINGS_LIST.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="filter-group">
            <label>Department Unit</label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Departments</option>
              {filterAvailableDepts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Parameter Filter */}
          <div className="filter-group">
            <label>Monitored Parameter</label>
            <select
              value={selectedParameter}
              onChange={(e) => {
                setSelectedParameter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Parameters</option>
              {PARAMETERS_LIST.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label>Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="filter-group filter-actions-group">
            <button
              className="btn-reset-filters"
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              <FiFilter /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Sensor Table / Content */}
      <div className="sensors-table-card">
        {loading ? (
          <div className="sensors-loading-state">
            <div className="spinner"></div>
            <p>Loading MySQL sensor configurations...</p>
          </div>
        ) : error ? (
          <ErrorState
            title="Database Communication Error"
            message={error}
            onRetry={fetchData}
          />
        ) : sensors.length === 0 ? (
          <EmptyState
            title="No Sensors Found"
            message="No campus IoT sensors match your current search and filter criteria."
            actionText="Reset Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="sensors-table">
                <thead>
                  <tr>
                    <th>Sensor Code</th>
                    <th>Sensor Name</th>
                    <th>Facility Location</th>
                    <th>Room Location</th>
                    <th>Monitored Parameter</th>
                    <th>Status</th>
                    <th>Last Communication</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sensors.map((sensor) => (
                    <tr key={sensor.id}>
                      <td className="sensor-code-cell">
                        <span className="code-badge">{sensor.sensor_code}</span>
                      </td>
                      <td className="sensor-name-cell font-weight-bold">
                        {sensor.sensor_name}
                      </td>
                      <td className="facility-cell">
                        <div className="facility-info">
                          <span className="building-name">
                            <FiMapPin className="cell-icon" /> {sensor.building_name}
                          </span>
                          <span className="dept-name">{sensor.department_name}</span>
                        </div>
                      </td>
                      <td className="room-cell">{sensor.room_location}</td>
                      <td className="parameter-cell">
                        <span className="parameter-pill">
                          <FiZap className="cell-icon" /> {sensor.parameter}
                        </span>
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge status-${sensor.status.toLowerCase()}`}>
                          {sensor.status === 'Online' && <FiCheckCircle />}
                          {sensor.status === 'Offline' && <FiAlertCircle />}
                          {sensor.status === 'Maintenance' && <FiTool />}
                          {sensor.status}
                        </span>
                      </td>
                      <td className="last-ping-cell">
                        <span className="ping-time">
                          <FiClock className="cell-icon" /> {formatTimestamp(sensor.last_ping)}
                        </span>
                      </td>
                      <td className="actions-cell text-right">
                        <div className="action-buttons-group">
                          <button
                            className="btn-action btn-action-view"
                            onClick={() => handleOpenDetailsModal(sensor)}
                            title="View Sensor Details"
                          >
                            <FiEye />
                          </button>

                          <button
                            className="btn-action btn-action-history"
                            onClick={() => handleOpenHistoryModal(sensor)}
                            title="View Telemetry History"
                          >
                            <FiActivity />
                          </button>

                          {!isElectrician && (
                            <button
                              className="btn-action btn-action-edit"
                              onClick={() => handleOpenEditModal(sensor)}
                              title="Edit Sensor Configuration"
                            >
                              <FiEdit />
                            </button>
                          )}

                          {sensor.status === 'Online' ? (
                            <button
                              className="btn-action btn-action-status-offline"
                              onClick={() => handleToggleStatus(sensor, 'Maintenance')}
                              title="Set to Maintenance"
                            >
                              <FiTool />
                            </button>
                          ) : (
                            <button
                              className="btn-action btn-action-status-online"
                              onClick={() => handleToggleStatus(sensor, 'Online')}
                              title="Set to Online"
                            >
                              <FiPower />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="sensors-pagination">
              <div className="pagination-info">
                Showing{' '}
                <strong>
                  {(paginationInfo.currentPage - 1) * paginationInfo.limit + 1}
                </strong>{' '}
                to{' '}
                <strong>
                  {Math.min(
                    paginationInfo.currentPage * paginationInfo.limit,
                    paginationInfo.totalItems
                  )}
                </strong>{' '}
                of <strong>{paginationInfo.totalItems}</strong> IoT sensors
              </div>

              <div className="pagination-buttons">
                <button
                  className="btn-paginate"
                  disabled={paginationInfo.currentPage <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  <FiChevronLeft /> Previous
                </button>

                <span className="pagination-page-indicator">
                  Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
                </span>

                <button
                  className="btn-paginate"
                  disabled={
                    paginationInfo.currentPage >= paginationInfo.totalPages
                  }
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(prev + 1, paginationInfo.totalPages)
                    )
                  }
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Sensor Modal */}
      {isAddEditModalOpen && (
        <div className="sensor-modal-backdrop" onClick={() => setIsAddEditModalOpen(false)}>
          <div className="sensor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sensor-modal-header">
              <h3>
                <FiCpu className="modal-title-icon" />
                {formMode === 'add' ? 'Add New IoT Sensor' : 'Edit Sensor Configuration'}
              </h3>
              <button className="btn-modal-close" onClick={() => setIsAddEditModalOpen(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="sensor-modal-body">
              <div className="form-row">
                <div className="form-group half">
                  <label>Sensor Code *</label>
                  <input
                    type="text"
                    disabled={formMode === 'edit'}
                    value={formData.sensor_code}
                    onChange={(e) =>
                      setFormData({ ...formData, sensor_code: e.target.value })
                    }
                    placeholder="e.g. SNS-EM-0101-01"
                  />
                  {formErrors.sensor_code && (
                    <span className="form-error-msg">{formErrors.sensor_code}</span>
                  )}
                </div>

                <div className="form-group half">
                  <label>Monitored Parameter *</label>
                  <select
                    value={formData.parameter}
                    onChange={(e) =>
                      setFormData({ ...formData, parameter: e.target.value })
                    }
                  >
                    {PARAMETERS_LIST.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Sensor Name *</label>
                <input
                  type="text"
                  value={formData.sensor_name}
                  onChange={(e) =>
                    setFormData({ ...formData, sensor_name: e.target.value })
                  }
                  placeholder="e.g. EEE Main Distribution Smart Energy Meter"
                />
                {formErrors.sensor_name && (
                  <span className="form-error-msg">{formErrors.sensor_name}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Building Facility *</label>
                  <select
                    value={formData.building_id}
                    onChange={(e) => {
                      const newBldgId = e.target.value;
                      const depts = DEPARTMENTS_BY_BUILDING[newBldgId] || [];
                      setFormData({
                        ...formData,
                        building_id: newBldgId,
                        department_id: depts[0]?.id || '',
                      });
                    }}
                  >
                    {BUILDINGS_LIST.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.building_id && (
                    <span className="form-error-msg">{formErrors.building_id}</span>
                  )}
                </div>

                <div className="form-group half">
                  <label>Department Unit *</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) =>
                      setFormData({ ...formData, department_id: e.target.value })
                    }
                  >
                    {formAvailableDepts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                  {formErrors.department_id && (
                    <span className="form-error-msg">{formErrors.department_id}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Room Location *</label>
                  <input
                    type="text"
                    value={formData.room_location}
                    onChange={(e) =>
                      setFormData({ ...formData, room_location: e.target.value })
                    }
                    placeholder="e.g. Sub-panel Room 101"
                  />
                  {formErrors.room_location && (
                    <span className="form-error-msg">{formErrors.room_location}</span>
                  )}
                </div>

                <div className="form-group half">
                  <label>Operational Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sensor-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsAddEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={submitting}>
                  {submitting ? 'Saving...' : formMode === 'add' ? 'Add Sensor' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sensor Details Modal */}
      {isDetailsModalOpen && activeSensor && (
        <div className="sensor-modal-backdrop" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="sensor-modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="sensor-modal-header">
              <h3>
                <FiCpu className="modal-title-icon" />
                Sensor Technical Specifications
              </h3>
              <button className="btn-modal-close" onClick={() => setIsDetailsModalOpen(false)}>
                <FiX />
              </button>
            </div>

            <div className="sensor-modal-body">
              <div className="details-header-card">
                <div className="details-main-info">
                  <h2>{activeSensor.sensor_name}</h2>
                  <span className="details-code-badge">{activeSensor.sensor_code}</span>
                </div>
                <span className={`status-badge status-${activeSensor.status.toLowerCase()}`}>
                  {activeSensor.status}
                </span>
              </div>

              <div className="details-grid">
                <div className="details-item">
                  <label>Building Facility</label>
                  <p>{activeSensor.building_name}</p>
                </div>

                <div className="details-item">
                  <label>Department Unit</label>
                  <p>{activeSensor.department_name}</p>
                </div>

                <div className="details-item">
                  <label>Monitored Parameter</label>
                  <p>{activeSensor.parameter}</p>
                </div>

                <div className="details-item">
                  <label>Room Location</label>
                  <p>{activeSensor.room_location}</p>
                </div>

                <div className="details-item">
                  <label>Last Communication Ping</label>
                  <p>{formatTimestamp(activeSensor.last_ping)}</p>
                </div>

                <div className="details-item">
                  <label>System Registration Date</label>
                  <p>{formatTimestamp(activeSensor.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="sensor-modal-footer">
              <button
                className="btn-modal-cancel"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </button>
              <button
                className="btn-modal-submit"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleOpenHistoryModal(activeSensor);
                }}
              >
                <FiActivity /> View Telemetry History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telemetry History Modal */}
      {isHistoryModalOpen && activeSensor && (
        <div className="sensor-modal-backdrop" onClick={() => setIsHistoryModalOpen(false)}>
          <div className="sensor-modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sensor-modal-header">
              <h3>
                <FiActivity className="modal-title-icon" />
                15-Minute Telemetry History — {activeSensor.sensor_code}
              </h3>
              <button className="btn-modal-close" onClick={() => setIsHistoryModalOpen(false)}>
                <FiX />
              </button>
            </div>

            <div className="sensor-modal-body">
              <div className="history-modal-meta">
                <span>
                  <strong>Facility:</strong> {activeSensor.building_name} — {activeSensor.department_name}
                </span>
                <span>
                  <strong>Parameter:</strong> {activeSensor.parameter}
                </span>
              </div>

              {historyLoading ? (
                <div className="sensors-loading-state">
                  <div className="spinner"></div>
                  <p>Querying 15-minute telemetry logs from MySQL...</p>
                </div>
              ) : telemetryHistory.length === 0 ? (
                <EmptyState
                  title="No Telemetry Data Available"
                  message="No recent 15-minute telemetry readings were found for this sensor's location."
                />
              ) : (
                <div className="table-responsive">
                  <table className="sensors-table history-table">
                    <thead>
                      <tr>
                        <th>Reading Timestamp</th>
                        <th>Power Demand (kW)</th>
                        <th>Energy Consumed (kWh)</th>
                        <th>Voltage (V)</th>
                        <th>Current (A)</th>
                        <th>Power Factor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {telemetryHistory.map((row) => (
                        <tr key={row.id}>
                          <td>{formatTimestamp(row.reading_date)}</td>
                          <td className="font-weight-bold">{row.power_kw} kW</td>
                          <td>{row.energy_consumed_kwh} kWh</td>
                          <td>{row.voltage} V</td>
                          <td>{row.current_a} A</td>
                          <td>{row.power_factor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="sensor-modal-footer">
              <button
                className="btn-modal-cancel"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSensors;
