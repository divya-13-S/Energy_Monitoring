import React, { useState, useEffect } from 'react';
import { FiSearch, FiZap, FiServer, FiActivity } from 'react-icons/fi';
import { getBuildingsEnergyData } from '../services/dashboardService';
import './AdminBuildings.css';

const AdminBuildings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all'); // 'all' | 'high' | 'moderate' | 'okay'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getBuildingsEnergyData();
        setData(result);
      } catch (err) {
        console.error('Failed to load buildings energy data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="buildings-page-container">
        <div className="buildings-loading">Loading campus buildings energy metrics...</div>
      </div>
    );
  }

  // Filter buildings by search query and load level
  const filteredBuildings = data.buildings.filter((bldg) => {
    const matchesSearch =
      bldg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bldg.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bldg.units && bldg.units.some((u) => u.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesLevel = filterLevel === 'all' || bldg.consumptionLevel === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="buildings-page-container">
      {/* Page Header */}
      <section className="buildings-header-section">
        <div className="header-title-block">
          <h1 className="buildings-title">Buildings Infrastructure & Performance</h1>
          <p className="buildings-subtitle">
            Physical campus building metrics: energy consumption, monthly usage, power demand, and status level.
          </p>
        </div>

        {/* Status Indicator Legend */}
        <div className="consumption-legend-card">
          <span className="legend-title">Building Status Legend:</span>
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
      <section className="buildings-summary-bar">
        <div className="summary-pill">
          <FiServer className="summary-icon blue" />
          <span className="summary-label">Total Buildings:</span>
          <span className="summary-value">{data.totalBuildings}</span>
        </div>

        <div className="summary-pill">
          <FiZap className="summary-icon purple" />
          <span className="summary-label">Campus Today Usage:</span>
          <span className="summary-value">{data.totalCampusKwh.toLocaleString('en-IN')} kWh</span>
        </div>

        <div className="summary-pill">
          <FiActivity className="summary-icon orange" />
          <span className="summary-label">Building Status:</span>
          <span className="summary-breakdown">
            <strong className="text-red">{data.highCount} High</strong> •{' '}
            <strong className="text-yellow">{data.moderateCount} Moderate</strong> •{' '}
            <strong className="text-green">{data.okayCount} Normal</strong>
          </span>
        </div>
      </section>

      {/* Toolbar & Filters */}
      <section className="buildings-toolbar">
        <div className="search-input-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search building or department name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field"
          />
        </div>

        <div className="filter-buttons-group">
          <button
            className={`filter-btn ${filterLevel === 'all' ? 'active' : ''}`}
            onClick={() => setFilterLevel('all')}
          >
            All Buildings ({data.totalBuildings})
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

      {/* Buildings Cards Grid */}
      <section className="buildings-grid">
        {filteredBuildings.length > 0 ? (
          filteredBuildings.map((bldg) => (
            <div key={bldg.id} className={`building-card level-${bldg.consumptionLevel}`}>
              {/* Card Header & Status Indicator Box */}
              <div className="card-top-row">
                <div className="bldg-identity">
                  <h3 className="bldg-name">{bldg.name}</h3>
                  <div className="bldg-units-tag">{bldg.unitsText}</div>
                </div>

                {/* Status Box */}
                <div className={`status-indicator-box level-${bldg.consumptionLevel}`}>
                  <span className="status-dot" />
                  <span className="status-label">{bldg.levelLabel}</span>
                </div>
              </div>

              {/* Today's Usage Primary Block */}
              <div className="primary-metric-box">
                <span className="metric-label">Today's Usage</span>
                <span className="primary-metric-value">{bldg.todayKwh.toLocaleString('en-IN')} kWh</span>
              </div>

              {/* Secondary Metrics Row (Monthly Usage, Current Power, Estimated Cost - Active Alerts Removed) */}
              <div className="secondary-metrics-block">
                <div className="metric-col">
                  <span className="metric-label">Monthly Usage</span>
                  <span className="metric-value">{bldg.monthlyKwh.toLocaleString('en-IN')} kWh</span>
                </div>
                <div className="metric-divider" />
                <div className="metric-col">
                  <span className="metric-label">Current Power</span>
                  <span className="metric-value">{bldg.currentPowerKw} kW</span>
                </div>
                <div className="metric-divider" />
                <div className="metric-col align-right">
                  <span className="metric-label">Estimated Cost</span>
                  <span className="metric-value cost">₹ {bldg.estCost.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-buildings-found">
            No buildings match the current search or status filter.
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminBuildings;
