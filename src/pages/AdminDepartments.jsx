import React, { useState, useEffect } from 'react';
import {
  FiSearch,
  FiZap,
  FiGrid,
  FiActivity,
  FiHome,
} from 'react-icons/fi';
import { getDepartmentsEnergyData } from '../services/dashboardService';
import './AdminDepartments.css';

const AdminDepartments = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all'); // 'all' | 'high' | 'moderate' | 'okay'
  const [selectedBuilding, setSelectedBuilding] = useState('all'); // 'all' or buildingId
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getDepartmentsEnergyData();
        setData(result);
      } catch (err) {
        console.error('Failed to load departments energy data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="departments-page-container">
        <div className="departments-loading">Loading campus departments energy metrics...</div>
      </div>
    );
  }

  // Filter departments by search query, load level, and selected building
  const filteredDepartments = data.departments.filter((dept) => {
    const matchesSearch =
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.buildingName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'all' || dept.consumptionLevel === filterLevel;
    const matchesBuilding = selectedBuilding === 'all' || dept.buildingId === selectedBuilding;
    return matchesSearch && matchesLevel && matchesBuilding;
  });

  return (
    <div className="departments-page-container">
      {/* Page Header */}
      <section className="departments-header-section">
        <div className="header-title-block">
          <h1 className="departments-title">Departments & Units Energy Performance</h1>
          <p className="departments-subtitle">
            Department-level energy consumption, monthly usage, power demand, saving potential, and efficiency status.
          </p>
        </div>

        {/* Consumption Level Legend */}
        <div className="consumption-legend-card">
          <span className="legend-title">Department Status Legend:</span>
          <div className="legend-items">
            <div className="legend-item red">
              <span className="indicator-box red" />
              <span>High Load</span>
            </div>
            <div className="legend-item yellow">
              <span className="indicator-box yellow" />
              <span>Moderate Load</span>
            </div>
            <div className="legend-item green">
              <span className="indicator-box green" />
              <span>Normal</span>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Summary Bar */}
      <section className="departments-summary-bar">
        <div className="summary-pill">
          <FiGrid className="summary-icon blue" />
          <span className="summary-label">Total Units & Depts:</span>
          <span className="summary-value">{data.totalDepartments} Units</span>
        </div>

        <div className="summary-pill">
          <FiZap className="summary-icon purple" />
          <span className="summary-label">Total Dept Usage Today:</span>
          <span className="summary-value">{data.totalCampusKwh.toLocaleString('en-IN')} kWh</span>
        </div>

        <div className="summary-pill">
          <FiActivity className="summary-icon orange" />
          <span className="summary-label">Department Status:</span>
          <span className="summary-breakdown">
            <strong className="text-red">{data.highCount} High</strong> •{' '}
            <strong className="text-yellow">{data.moderateCount} Moderate</strong> •{' '}
            <strong className="text-green">{data.okayCount} Normal</strong>
          </span>
        </div>
      </section>

      {/* Search & Toolbar Controls */}
      <section className="departments-toolbar">
        <div className="search-input-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search department, unit, or building..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field"
          />
        </div>

        {/* Building Selector Dropdown */}
        <div className="building-select-wrapper">
          <FiHome className="select-icon" />
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="building-select"
          >
            <option value="all">All Buildings (8)</option>
            {data.groupedByBuilding.map((bldg) => (
              <option key={bldg.buildingId} value={bldg.buildingId}>
                {bldg.buildingName} ({bldg.departments.length} units)
              </option>
            ))}
          </select>
        </div>

        {/* Load Filter Buttons */}
        <div className="filter-buttons-group">
          <button
            className={`filter-btn ${filterLevel === 'all' ? 'active' : ''}`}
            onClick={() => setFilterLevel('all')}
          >
            All Units ({data.totalDepartments})
          </button>
          <button
            className={`filter-btn level-high ${filterLevel === 'high' ? 'active' : ''}`}
            onClick={() => setFilterLevel('high')}
          >
            High ({data.highCount})
          </button>
          <button
            className={`filter-btn level-moderate ${filterLevel === 'moderate' ? 'active' : ''}`}
            onClick={() => setFilterLevel('moderate')}
          >
            Moderate ({data.moderateCount})
          </button>
          <button
            className={`filter-btn level-okay ${filterLevel === 'okay' ? 'active' : ''}`}
            onClick={() => setFilterLevel('okay')}
          >
            Normal ({data.okayCount})
          </button>
        </div>
      </section>

      {/* Departments Standalone Cards Grid (Same spacious UI as Buildings page) */}
      <section className="departments-grid">
        {filteredDepartments.length > 0 ? (
          filteredDepartments.map((dept) => (
            <div key={dept.id} className={`department-card level-${dept.consumptionLevel}`}>
              {/* Card Header & Color Indicator Box */}
              <div className="card-top-row">
                <div className="dept-identity">
                  <h3 className="dept-name">{dept.name}</h3>
                  <div className="dept-bldg-badge">
                    <FiHome className="bldg-badge-icon" />
                    <span>{dept.buildingName}</span>
                  </div>
                </div>

                {/* Color Indicator Box */}
                <div className={`status-indicator-box level-${dept.consumptionLevel}`}>
                  <span className="status-dot" />
                  <span className="status-label">{dept.levelLabel}</span>
                </div>
              </div>

              {/* Today's Usage Primary Block */}
              <div className="primary-metric-box">
                <span className="metric-label">Today's Usage</span>
                <span className="primary-metric-value">{dept.todayKwh.toLocaleString('en-IN')} kWh</span>
              </div>

              {/* Secondary Metrics Row (Monthly Usage, Current Power, Estimated Cost) */}
              <div className="secondary-metrics-block">
                <div className="metric-col">
                  <span className="metric-label">Monthly Usage</span>
                  <span className="metric-value">{dept.monthlyKwh.toLocaleString('en-IN')} kWh</span>
                </div>
                <div className="metric-divider" />
                <div className="metric-col">
                  <span className="metric-label">Current Power</span>
                  <span className="metric-value">{dept.currentPowerKw} kW</span>
                </div>
                <div className="metric-divider" />
                <div className="metric-col align-right">
                  <span className="metric-label">Estimated Cost</span>
                  <span className="metric-value cost">₹ {dept.estCost.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-departments-found">
            No departments or units match the current search, building, or status filter.
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDepartments;
