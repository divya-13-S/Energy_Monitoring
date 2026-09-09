import React, { useState, useEffect } from 'react';
import {
  FiSettings,
  FiDollarSign,
  FiZap,
  FiSliders,
  FiSave,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiLock,
  FiAlertTriangle,
  FiBell,
  FiGlobe,
  FiRotateCcw,
} from 'react-icons/fi';
import { getSettings, updateSettings } from '../services/settingsService';
import ErrorState from '../components/common/ErrorState/ErrorState';
import './AdminSettings.css';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    // Section 1: Financial & Billing
    electricity_tariff_kwh: '8.50',
    currency_symbol: '₹',
    energy_unit: 'kWh',

    // Section 2: Electrical Thresholds
    min_voltage: '215.0',
    max_voltage: '245.0',
    max_current: '120.0',
    high_consumption_kw: '35.0',
    min_frequency: '49.5',
    max_frequency: '50.5',
    min_power_factor: '0.90',

    // Section 3: Alert Settings
    alert_generation_enabled: 'true',
    abnormal_usage_kwh: '12.0',
    alert_auto_escalation: 'true',
    alert_dedup_window_mins: '240',

    // Section 4: System Settings
    data_refresh_interval_sec: '15',
    default_dashboard_period: 'today',
    system_date_format: 'YYYY-MM-DD',
  });

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSettings();
      if (data && data.map) {
        setFormData((prev) => ({
          ...prev,
          ...data.map,
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err.message || 'Failed to load system settings from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReset = () => {
    loadSettings();
    setSuccessMsg('Form reset to saved database configurations.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await updateSettings(formData);
      setSuccessMsg('System settings updated and saved to MySQL database successfully.');
      loadSettings();
    } catch (err) {
      console.error('Error saving settings:', err);
      setErrorMsg(err.message || 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-container">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="settings-toast toast-success">
          <FiCheckCircle className="toast-icon" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="settings-toast toast-error">
          <FiAlertCircle className="toast-icon" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="settings-header">
        <div className="settings-header-title">
          <h1>
            <FiSettings className="title-icon" /> System Settings & Configuration
          </h1>
          <p>
            Configure centralized energy, alert, electrical thresholds, and application system parameters.
          </p>
        </div>
        <button
          className="btn-refresh-settings"
          onClick={loadSettings}
          disabled={loading}
          title="Reload settings from database"
        >
          <FiRefreshCw className={loading ? 'spin-icon' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="settings-loading-card">
          <div className="spinner"></div>
          <p>Loading centralized settings from MySQL database...</p>
        </div>
      ) : error ? (
        <ErrorState
          title="Database Error Loading Settings"
          message={error}
          onRetry={loadSettings}
        />
      ) : (
        <form onSubmit={handleSubmit} className="settings-form-grid">
          {/* Section 1: Financial & Tariff Settings */}
          <div className="settings-card">
            <div className="card-header">
              <FiDollarSign className="card-icon financial" />
              <div>
                <h2>1. Energy & Billing Settings</h2>
                <p>Configure electricity tariff rates and display units used by Reports and Cost Analytics</p>
              </div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Electricity Tariff Rate (per kWh) *</label>
                <div className="input-unit-wrapper">
                  <span className="unit-prefix">{formData.currency_symbol || '₹'}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="electricity_tariff_kwh"
                    value={formData.electricity_tariff_kwh}
                    onChange={handleChange}
                    required
                  />
                  <span className="unit-suffix">/ {formData.energy_unit || 'kWh'}</span>
                </div>
                <small className="help-text">
                  Used dynamically across Reports, Dashboard, and Energy Optimization for cost calculations.
                </small>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Currency Symbol *</label>
                  <select
                    name="currency_symbol"
                    value={formData.currency_symbol}
                    onChange={handleChange}
                    required
                  >
                    <option value="₹">₹ (INR - Indian Rupee)</option>
                    <option value="$">$ (USD - US Dollar)</option>
                    <option value="€">€ (EUR - Euro)</option>
                    <option value="£">£ (GBP - British Pound)</option>
                  </select>
                </div>

                <div className="form-group half">
                  <label>Energy Consumption Unit *</label>
                  <select
                    name="energy_unit"
                    value={formData.energy_unit}
                    onChange={handleChange}
                    required
                  >
                    <option value="kWh">kWh (Kilowatt Hour)</option>
                    <option value="MWh">MWh (Megawatt Hour)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Electrical Monitoring Thresholds */}
          <div className="settings-card">
            <div className="card-header">
              <FiZap className="card-icon electrical" />
              <div>
                <h2>2. Electrical Monitoring Thresholds</h2>
                <p>Configure baseline voltage, feeder current, active power, frequency, and power factor parameters</p>
              </div>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group half">
                  <label>Minimum Voltage Threshold (V) *</label>
                  <div className="input-unit-wrapper">
                    <input
                      type="number"
                      step="0.1"
                      name="min_voltage"
                      value={formData.min_voltage}
                      onChange={handleChange}
                      required
                    />
                    <span className="unit-suffix">V</span>
                  </div>
                  <small className="help-text">Under-voltage alert trigger level (default 215.0V).</small>
                </div>

                <div className="form-group half">
                  <label>Maximum Voltage Limit (V) *</label>
                  <div className="input-unit-wrapper">
                    <input
                      type="number"
                      step="0.1"
                      name="max_voltage"
                      value={formData.max_voltage}
                      onChange={handleChange}
                      required
                    />
                    <span className="unit-suffix">V</span>
                  </div>
                  <small className="help-text">Over-voltage alert trigger level (default 245.0V).</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Maximum Feeder Load Current (A) *</label>
                  <div className="input-unit-wrapper">
                    <input
                      type="number"
                      step="0.1"
                      name="max_current"
                      value={formData.max_current}
                      onChange={handleChange}
                      required
                    />
                    <span className="unit-suffix">A</span>
                  </div>
                  <small className="help-text">Feeder current overload threshold.</small>
                </div>

                <div className="form-group half">
                  <label>High Active Power Demand (kW) *</label>
                  <div className="input-unit-wrapper">
                    <input
                      type="number"
                      step="0.1"
                      name="high_consumption_kw"
                      value={formData.high_consumption_kw}
                      onChange={handleChange}
                      required
                    />
                    <span className="unit-suffix">kW</span>
                  </div>
                  <small className="help-text">Triggers high power demand alerts (default 35.0 kW).</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Minimum Frequency Threshold (Hz) *</label>
                  <div className="input-unit-wrapper">
                    <input
                      type="number"
                      step="0.1"
                      name="min_frequency"
                      value={formData.min_frequency}
                      onChange={handleChange}
                      required
                    />
                    <span className="unit-suffix">Hz</span>
                  </div>
                  <small className="help-text">Under-frequency limit (default 49.5 Hz).</small>
                </div>

                <div className="form-group half">
                  <label>Maximum Frequency Threshold (Hz) *</label>
                  <div className="input-unit-wrapper">
                    <input
                      type="number"
                      step="0.1"
                      name="max_frequency"
                      value={formData.max_frequency}
                      onChange={handleChange}
                      required
                    />
                    <span className="unit-suffix">Hz</span>
                  </div>
                  <small className="help-text">Over-frequency limit (default 50.5 Hz).</small>
                </div>
              </div>

              <div className="form-group">
                <label>Minimum Power Factor Threshold *</label>
                <div className="input-unit-wrapper">
                  <input
                    type="number"
                    step="0.01"
                    min="0.50"
                    max="1.00"
                    name="min_power_factor"
                    value={formData.min_power_factor}
                    onChange={handleChange}
                    required
                  />
                  <span className="unit-suffix">PF</span>
                </div>
                <small className="help-text">Low power factor penalty threshold (default 0.90).</small>
              </div>
            </div>
          </div>

          {/* Section 3: Alert Settings */}
          <div className="settings-card">
            <div className="card-header">
              <FiBell className="card-icon alert-config" />
              <div>
                <h2>3. Alert Settings</h2>
                <p>Configure automatic telemetry alert generation, deduplication, and severity behavior</p>
              </div>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group half">
                  <label>Automatic Alert Generation *</label>
                  <select
                    name="alert_generation_enabled"
                    value={formData.alert_generation_enabled}
                    onChange={handleChange}
                    required
                  >
                    <option value="true">Enabled (Generate telemetry alerts)</option>
                    <option value="false">Disabled (Pause automated alerts)</option>
                  </select>
                  <small className="help-text">Controls background threshold evaluation.</small>
                </div>

                <div className="form-group half">
                  <label>Abnormal 15-Min Usage Limit (kWh) *</label>
                  <div className="input-unit-wrapper">
                    <input
                      type="number"
                      step="0.1"
                      name="abnormal_usage_kwh"
                      value={formData.abnormal_usage_kwh}
                      onChange={handleChange}
                      required
                    />
                    <span className="unit-suffix">kWh</span>
                  </div>
                  <small className="help-text">Triggers consumption spike alerts per 15-min interval.</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Severity Auto-Escalation *</label>
                  <select
                    name="alert_auto_escalation"
                    value={formData.alert_auto_escalation}
                    onChange={handleChange}
                    required
                  >
                    <option value="true">Enabled (Auto-escalate severe breaches)</option>
                    <option value="false">Disabled (Standard severity levels)</option>
                  </select>
                </div>

                <div className="form-group half">
                  <label>Deduplication Prevention Window *</label>
                  <div className="input-unit-wrapper">
                    <input
                      type="number"
                      step="1"
                      min="15"
                      name="alert_dedup_window_mins"
                      value={formData.alert_dedup_window_mins}
                      onChange={handleChange}
                      required
                    />
                    <span className="unit-suffix">mins</span>
                  </div>
                  <small className="help-text">Prevents duplicate alert flooding for identical conditions.</small>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: System Settings */}
          <div className="settings-card">
            <div className="card-header">
              <FiGlobe className="card-icon system-config" />
              <div>
                <h2>4. System & Application Settings</h2>
                <p>Configure user interface preferences, auto-refresh intervals, and default view periods</p>
              </div>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group half">
                  <label>Data Refresh Interval *</label>
                  <select
                    name="data_refresh_interval_sec"
                    value={formData.data_refresh_interval_sec}
                    onChange={handleChange}
                    required
                  >
                    <option value="15">15 Seconds (Real-time telemetry)</option>
                    <option value="30">30 Seconds</option>
                    <option value="60">60 Seconds (1 Minute)</option>
                    <option value="300">300 Seconds (5 Minutes)</option>
                  </select>
                </div>

                <div className="form-group half">
                  <label>Default Dashboard Time Period *</label>
                  <select
                    name="default_dashboard_period"
                    value={formData.default_dashboard_period}
                    onChange={handleChange}
                    required
                  >
                    <option value="today">Today (15-min live resolution)</option>
                    <option value="week">7 Days (Weekly trends)</option>
                    <option value="month">30 Days (Monthly summary)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>System Date Display Format *</label>
                <select
                  name="system_date_format"
                  value={formData.system_date_format}
                  onChange={handleChange}
                  required
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard e.g. 2026-09-09)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (UK/India Standard e.g. 09/09/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard e.g. 09/09/2026)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="settings-footer-card">
            <div className="admin-access-note">
              <FiLock /> Administrator Authorization Enforced. Changes persist directly to MySQL.
            </div>
            <div className="footer-button-group">
              <button
                type="button"
                className="btn-cancel-settings"
                onClick={handleReset}
                disabled={saving}
              >
                <FiRotateCcw />
                <span>Reset / Cancel</span>
              </button>
              <button type="submit" className="btn-save-settings" disabled={saving}>
                <FiSave />
                <span>{saving ? 'Saving to MySQL...' : 'Save System Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettings;
