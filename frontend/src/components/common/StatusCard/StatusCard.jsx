import React from 'react';
import { FiWifi, FiZap, FiRadio, FiActivity } from 'react-icons/fi';
import Badge from '../Badge/Badge';
import './StatusCard.css';

const StatusCard = ({
  name,
  code,
  status = 'online', // online, offline, warning, maintenance
  location,
  lastReading,
  voltage,
  signalStrength,
  className = '',
}) => {
  const getBadgeVariant = () => {
    switch (status) {
      case 'online': return 'success';
      case 'warning': return 'warning';
      case 'maintenance': return 'cyan';
      default: return 'neutral';
    }
  };

  return (
    <div className={`status-card card ${className}`}>
      <div className="status-card-header">
        <div className="status-card-title-group">
          <div className="status-card-icon">
            <FiRadio />
          </div>
          <div>
            <h4 className="status-card-name">{name}</h4>
            <span className="status-card-code">{code}</span>
          </div>
        </div>
        <Badge variant={getBadgeVariant()} size="sm" dot>
          {status.toUpperCase()}
        </Badge>
      </div>

      <div className="status-card-metrics">
        {location && (
          <div className="status-metric-item">
            <span className="metric-label">Location</span>
            <span className="metric-val">{location}</span>
          </div>
        )}
        {lastReading && (
          <div className="status-metric-item">
            <span className="metric-label">Reading</span>
            <span className="metric-val highlight">{lastReading}</span>
          </div>
        )}
        {voltage && (
          <div className="status-metric-item">
            <span className="metric-label">Voltage</span>
            <span className="metric-val">{voltage}</span>
          </div>
        )}
      </div>

      {signalStrength && (
        <div className="status-card-footer">
          <span className="signal-label">
            <FiWifi /> Signal: {signalStrength}%
          </span>
          <div className="signal-bar-container">
            <div className="signal-bar-fill" style={{ width: `${signalStrength}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusCard;
