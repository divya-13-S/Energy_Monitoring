import React, { useState, useEffect, useCallback } from 'react';
import {
  FiCpu,
  FiZap,
  FiClock,
  FiServer,
  FiThermometer,
  FiWind,
  FiTrendingUp,
  FiSliders,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiInfo,
  FiCalendar,
  FiGrid,
  FiActivity,
  FiShield,
  FiLock,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

import { predictEnergyConsumption, fetchPredictionBuildings } from '../services/predictionService';
import EmptyState from '../components/common/EmptyState/EmptyState';
import ErrorState from '../components/common/ErrorState/ErrorState';
import './AdminAIPrediction.css';

// Default campus buildings reference fallback
const DEFAULT_BUILDINGS = [
  { id: '1', building_name: 'IB Block', building_code: 'IB-BLOCK', total_area_sqft: 7432 },
  { id: '2', building_name: 'AS Block', building_code: 'AS-BLOCK', total_area_sqft: 12500 },
  { id: '3', building_name: 'Mechanical Block', building_code: 'MECH-BLOCK', total_area_sqft: 18200 },
  { id: '4', building_name: 'Sunflower Block', building_code: 'SUNFLOWER-BLOCK', total_area_sqft: 9800 },
  { id: '5', building_name: 'Research Park', building_code: 'RESEARCH-PARK', total_area_sqft: 22000 },
  { id: '6', building_name: 'Library', building_code: 'LIBRARY-BLOCK', total_area_sqft: 15400 },
  { id: '7', building_name: 'Girls Hostel', building_code: 'GH-BLOCK', total_area_sqft: 31000 },
  { id: '8', building_name: 'Boys Hostel', building_code: 'BH-BLOCK', total_area_sqft: 34500 },
];

const AdminAIPrediction = () => {
  // Horizon Tabs
  const [activeTab, setActiveTab] = useState('next_hour');

  // Buildings & User Role State
  const [buildings, setBuildings] = useState(DEFAULT_BUILDINGS);
  const [selectedBuildingId, setSelectedBuildingId] = useState('1');
  const [userRole, setUserRole] = useState('Administrator');
  const [userBldgId, setUserBldgId] = useState(null);

  // Input Form Parameters
  const [timestamp, setTimestamp] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [airTemp, setAirTemp] = useState(20.0);
  const [dewTemp, setDewTemp] = useState(15.0);
  const [windSpeed, setWindSpeed] = useState(3.0);
  const [squareFeet, setSquareFeet] = useState(7432);
  const [lag1h, setLag1h] = useState(250.0);
  const [lag24h, setLag24h] = useState(245.0);
  const [rollingMean24h, setRollingMean24h] = useState(248.5);

  // Execution & Output State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load User Info & Building List
  useEffect(() => {
    const savedUser = localStorage.getItem('energy_app_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role) setUserRole(parsed.role);
        if (parsed.building_id) {
          setUserBldgId(String(parsed.building_id));
          setSelectedBuildingId(String(parsed.building_id));
        }
      } catch (e) {
        console.warn('Could not parse user session:', e);
      }
    }

    const loadBuildings = async () => {
      const bldgList = await fetchPredictionBuildings();
      if (bldgList && bldgList.length > 0) {
        setBuildings(bldgList);
        // If user is HOD, find assigned building or default to first
        const savedUserLocal = localStorage.getItem('energy_app_user');
        let hodBldgId = null;
        if (savedUserLocal) {
          try {
            const p = JSON.parse(savedUserLocal);
            if (p.role === 'Department Staff (HOD)' && p.building_id) {
              hodBldgId = String(p.building_id);
            }
          } catch (e) {}
        }
        if (hodBldgId) {
          setSelectedBuildingId(hodBldgId);
        } else if (bldgList[0]?.id) {
          setSelectedBuildingId(String(bldgList[0].id));
        }
      }
    };
    loadBuildings();
  }, []);

  // Update square feet when selected building changes
  useEffect(() => {
    const currentBldg = buildings.find((b) => String(b.id) === String(selectedBuildingId));
    if (currentBldg && currentBldg.total_area_sqft) {
      setSquareFeet(parseFloat(currentBldg.total_area_sqft));
    }
  }, [selectedBuildingId, buildings]);

  // Handle Prediction Request
  const handleGeneratePrediction = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        building_id: parseInt(selectedBuildingId, 10) || selectedBuildingId,
        timestamp: new Date(timestamp).toISOString(),
        air_temperature: parseFloat(airTemp),
        dew_temperature: parseFloat(dewTemp),
        wind_speed: parseFloat(windSpeed),
        square_feet: parseFloat(squareFeet),
        lag_1h: parseFloat(lag1h),
        lag_24h: parseFloat(lag24h),
        rolling_mean_24h: parseFloat(rollingMean24h),
      };

      const result = await predictEnergyConsumption(payload);

      if (result && result.success) {
        setPredictionData(result.data);
      } else {
        throw new Error(result?.message || 'Prediction failed');
      }
    } catch (err) {
      console.error('Prediction Error:', err);
      let errMsg = err.message || 'An unexpected error occurred during prediction generation.';
      if (err.status === 403) {
        errMsg = 'Access Restricted: HOD users can only generate predictions for their assigned building.';
      } else if (err.status === 401) {
        errMsg = 'Session expired. Please log in again.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [selectedBuildingId, timestamp, airTemp, dewTemp, windSpeed, squareFeet, lag1h, lag24h, rollingMean24h]);

  // Initial Auto Prediction Run
  useEffect(() => {
    if (selectedBuildingId) {
      handleGeneratePrediction();
    }
  }, [selectedBuildingId]);

  // Selected building name lookup
  const selectedBuildingObj = buildings.find((b) => String(b.id) === String(selectedBuildingId)) || {
    building_name: `Building ${selectedBuildingId}`,
    building_code: `BLDG-${selectedBuildingId}`,
  };

  const isHodUser = userRole === 'Department Staff (HOD)';

  // Recharts Dataset
  const chartData = predictionData
    ? [
        { name: 'Lag 24h Ago', value: parseFloat(predictionData.inputs?.lag_24h || lag24h), fill: '#94a3b8' },
        { name: '24h Rolling Mean', value: parseFloat(predictionData.inputs?.rolling_mean_24h || rollingMean24h), fill: '#64748b' },
        { name: 'Lag 1h Ago', value: parseFloat(predictionData.inputs?.lag_1h || lag1h), fill: '#3b82f6' },
        { name: 'AI Prediction (Next Hr)', value: parseFloat(predictionData.predictedKwh || 0), fill: '#10b981' },
      ]
    : [];

  return (
    <div className="ai-pred-container">
      {/* Header Section */}
      <div className="ai-pred-header">
        <div className="ai-pred-header-left">
          <div className="ai-pred-icon-wrapper">
            <FiCpu className="ai-pred-header-icon" />
          </div>
          <div>
            <h1 className="ai-pred-title">AI Energy Consumption Prediction</h1>
            <p className="ai-pred-subtitle">
              Single-step hourly forecasting powered by trained OLS Linear Regression on 15 ASHRAE features
            </p>
          </div>
        </div>

        <div className="ai-pred-header-actions">
          {isHodUser && (
            <div className="ai-pred-badge hod-badge">
              <FiLock className="badge-icon" />
              <span>HOD Locked Scope</span>
            </div>
          )}
          <div className="ai-pred-badge live-badge">
            <span className="pulse-dot"></span>
            <span>Node.js Backend Engine Active</span>
          </div>
        </div>
      </div>

      {/* Prediction Horizon Tabs */}
      <div className="ai-pred-tabs">
        <button
          className={`ai-pred-tab ${activeTab === 'next_hour' ? 'active' : ''}`}
          onClick={() => setActiveTab('next_hour')}
        >
          <FiClock className="tab-icon" />
          <span>Next-Hour Forecast</span>
          <span className="tab-pill ready">Verified Live ML</span>
        </button>

        <button
          className={`ai-pred-tab ${activeTab === 'tomorrow' ? 'active' : ''}`}
          onClick={() => setActiveTab('tomorrow')}
        >
          <FiCalendar className="tab-icon" />
          <span>Tomorrow Forecast (24h)</span>
          <span className="tab-pill coming-soon">Coming Soon</span>
        </button>

        <button
          className={`ai-pred-tab ${activeTab === 'week' ? 'active' : ''}`}
          onClick={() => setActiveTab('week')}
        >
          <FiTrendingUp className="tab-icon" />
          <span>7-Day Forecast (168h)</span>
          <span className="tab-pill coming-soon">Coming Soon</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab !== 'next_hour' ? (
        <div className="ai-pred-coming-soon-card">
          <div className="coming-soon-content">
            <FiAlertTriangle className="coming-soon-icon" />
            <h2>Multi-Step Autoregressive Forecasting Required</h2>
            <p>
              The verified Linear Regression model generates single-step next-hour predictions using exact 1h and 24h lag states.
              Multi-step forecasting for <strong>{activeTab === 'tomorrow' ? 'Tomorrow (24 hours)' : '7-Day (168 hours)'}</strong> requires an autoregressive recursive state loop (Feature Pipeline V2) to prevent cascading prediction drift.
            </p>
            <div className="coming-soon-details">
              <span><strong>Current Architecture:</strong> Direct 1-Step OLS Linear Regression</span>
              <span><strong>Target Architecture:</strong> Multi-Step Recursive Model with State Update Loop</span>
            </div>
            <button className="switch-back-btn" onClick={() => setActiveTab('next_hour')}>
              Return to Next-Hour Verified Prediction
            </button>
          </div>
        </div>
      ) : (
        <div className="ai-pred-grid">
          {/* Controls Panel */}
          <div className="ai-pred-panel ai-pred-controls">
            <div className="panel-header">
              <FiSliders className="panel-icon" />
              <h2>Prediction Parameters</h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGeneratePrediction();
              }}
              className="controls-form"
            >
              {/* Building Selector */}
              <div className="form-group">
                <label htmlFor="building-select">
                  <FiServer className="label-icon" /> Select Building
                </label>
                <select
                  id="building-select"
                  className="form-control"
                  value={selectedBuildingId}
                  onChange={(e) => setSelectedBuildingId(e.target.value)}
                  disabled={loading || isHodUser}
                >
                  {buildings.map((bldg) => (
                    <option key={bldg.id} value={bldg.id}>
                      {bldg.building_name || bldg.name} ({bldg.building_code || `ID ${bldg.id}`})
                    </option>
                  ))}
                </select>
                {isHodUser && (
                  <span className="form-help-text info">
                    <FiLock /> Locked to your assigned HOD department building.
                  </span>
                )}
              </div>

              {/* Target Timestamp */}
              <div className="form-group">
                <label htmlFor="timestamp-input">
                  <FiClock className="label-icon" /> Target Prediction Hour
                </label>
                <input
                  id="timestamp-input"
                  type="datetime-local"
                  className="form-control"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Weather Group */}
              <div className="form-section-title">
                <FiThermometer className="section-icon" /> Weather Telemetry Inputs
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="air-temp">Air Temp (°C)</label>
                  <input
                    id="air-temp"
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={airTemp}
                    onChange={(e) => setAirTemp(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dew-temp">Dew Temp (°C)</label>
                  <input
                    id="dew-temp"
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={dewTemp}
                    onChange={(e) => setDewTemp(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="wind-speed">Wind Speed (m/s)</label>
                  <input
                    id="wind-speed"
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={windSpeed}
                    onChange={(e) => setWindSpeed(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sq-feet">Building Area (sq ft)</label>
                  <input
                    id="sq-feet"
                    type="number"
                    className="form-control"
                    value={squareFeet}
                    onChange={(e) => setSquareFeet(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Toggle Advanced Telemetry Lags */}
              <div className="advanced-toggle-row">
                <button
                  type="button"
                  className="toggle-advanced-btn"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? 'Hide Telemetry Lag Controls ▲' : 'Adjust Telemetry Lags (Advanced) ▼'}
                </button>
              </div>

              {showAdvanced && (
                <div className="advanced-controls-box">
                  <div className="form-section-title">
                    <FiActivity className="section-icon" /> Historical Energy Lags (kWh)
                  </div>

                  <div className="form-group">
                    <label htmlFor="lag-1h">Lag 1h Consumption (kWh)</label>
                    <input
                      id="lag-1h"
                      type="number"
                      step="0.1"
                      className="form-control"
                      value={lag1h}
                      onChange={(e) => setLag1h(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lag-24h">Lag 24h Consumption (kWh)</label>
                    <input
                      id="lag-24h"
                      type="number"
                      step="0.1"
                      className="form-control"
                      value={lag24h}
                      onChange={(e) => setLag24h(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="rolling-24h">Rolling Mean 24h (kWh)</label>
                    <input
                      id="rolling-24h"
                      type="number"
                      step="0.1"
                      className="form-control"
                      value={rollingMean24h}
                      onChange={(e) => setRollingMean24h(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button type="submit" className="submit-prediction-btn" disabled={loading}>
                {loading ? (
                  <>
                    <FiRefreshCw className="spinner-icon" /> Generating AI Prediction...
                  </>
                ) : (
                  <>
                    <FiZap className="btn-icon" /> Generate Next-Hour Prediction
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Prediction Output & Results Area */}
          <div className="ai-pred-panel ai-pred-results">
            {error && (
              <ErrorState
                title="Prediction Request Error"
                message={error}
                onRetry={handleGeneratePrediction}
              />
            )}

            {!error && !predictionData && !loading && (
              <EmptyState
                icon={FiCpu}
                title="No Prediction Generated Yet"
                description="Select a building and parameters on the left to compute next-hour energy consumption."
                actionText="Generate Prediction"
                onAction={handleGeneratePrediction}
              />
            )}

            {loading && !predictionData && (
              <div className="loading-state-box">
                <FiRefreshCw className="loading-spinner" />
                <p>Computing Linear Regression inference over 15-feature matrix...</p>
              </div>
            )}

            {!error && predictionData && (
              <>
                {/* Main Prediction KPI Header Card */}
                <div className="prediction-hero-card">
                  <div className="hero-card-header">
                    <div>
                      <span className="hero-building-name">{selectedBuildingObj.building_name}</span>
                      <span className="hero-building-code"> ({selectedBuildingObj.building_code})</span>
                      <div className="hero-timestamp">
                        Target Hour: {new Date(predictionData.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="hero-status-badge">
                      <FiCheckCircle className="badge-icon" /> Model Inferred
                    </div>
                  </div>

                  <div className="hero-kpi-row">
                    <div className="hero-main-stat">
                      <div className="stat-label">Predicted Consumption (Next Hour)</div>
                      <div className="stat-value-group">
                        <span className="stat-number">
                          {predictionData.predictedKwh !== undefined
                            ? Number(predictionData.predictedKwh).toFixed(2)
                            : '0.00'}
                        </span>
                        <span className="stat-unit">kWh</span>
                      </div>
                    </div>

                    <div className="hero-secondary-stats">
                      <div className="sec-stat-item">
                        <span className="sec-stat-label">Predicted Log ($\ln(1+y)$)</span>
                        <span className="sec-stat-value">
                          {predictionData.predictedLog !== undefined
                            ? Number(predictionData.predictedLog).toFixed(4)
                            : '0.0000'}
                        </span>
                      </div>

                      <div className="sec-stat-item">
                        <span className="sec-stat-label">Model Type</span>
                        <span className="sec-stat-value">{predictionData.model || 'Linear Regression'}</span>
                      </div>

                      <div className="sec-stat-item">
                        <span className="sec-stat-label">Upper Bound Guard</span>
                        <span className="sec-stat-value active-guard">
                          <FiShield className="guard-icon" /> Active (11.7869 log)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparative Chart */}
                <div className="results-chart-box">
                  <div className="chart-box-header">
                    <h3>Energy Telemetry vs AI Next-Hour Prediction</h3>
                    <span className="chart-subtitle">Comparing recent historical baseline metrics against ML forecast</span>
                  </div>

                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#475569' }} unit=" kWh" />
                        <Tooltip
                          formatter={(val) => [`${Number(val).toFixed(2)} kWh`, 'Value']}
                          contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', border: 'none' }}
                          itemStyle={{ color: '#38bdf8' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                          {chartData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 15-Feature Input Matrix Summary */}
                <div className="feature-matrix-box">
                  <div className="matrix-header">
                    <FiGrid className="matrix-icon" />
                    <h3>15-Feature Matrix Input Summary</h3>
                  </div>

                  <div className="feature-grid">
                    <div className="feature-cell">
                      <span className="feat-name">Square Feet</span>
                      <span className="feat-val">{predictionData.inputs?.square_feet?.toLocaleString() || squareFeet} sq ft</span>
                    </div>

                    <div className="feature-cell">
                      <span className="feat-name">Air Temp</span>
                      <span className="feat-val">{predictionData.inputs?.air_temperature}°C</span>
                    </div>

                    <div className="feature-cell">
                      <span className="feat-name">Dew Temp</span>
                      <span className="feat-val">{predictionData.inputs?.dew_temperature}°C</span>
                    </div>

                    <div className="feature-cell">
                      <span className="feat-name">Wind Speed</span>
                      <span className="feat-val">{predictionData.inputs?.wind_speed} m/s</span>
                    </div>

                    <div className="feature-cell">
                      <span className="feat-name">Lag 1h</span>
                      <span className="feat-val">{Number(predictionData.inputs?.lag_1h || 0).toFixed(1)} kWh</span>
                    </div>

                    <div className="feature-cell">
                      <span className="feat-name">Lag 24h</span>
                      <span className="feat-val">{Number(predictionData.inputs?.lag_24h || 0).toFixed(1)} kWh</span>
                    </div>

                    <div className="feature-cell">
                      <span className="feat-name">Rolling Mean 24h</span>
                      <span className="feat-val">{Number(predictionData.inputs?.rolling_mean_24h || 0).toFixed(1)} kWh</span>
                    </div>

                    <div className="feature-cell">
                      <span className="feat-name">Building Target Enc</span>
                      <span className="feat-val">
                        {predictionData.inputs?.building_target_enc !== undefined
                          ? Number(predictionData.inputs.building_target_enc).toFixed(4)
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAIPrediction;
