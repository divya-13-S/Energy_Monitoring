import React from 'react';
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiCheckCircle, FiChevronRight } from 'react-icons/fi';
import Badge from '../Badge/Badge';
import './AlertCard.css';

const AlertCard = ({
  title,
  message,
  location,
  timestamp,
  severity = 'warning', // danger, warning, info, success
  status = 'Active',
  onAcknowledge,
  className = '',
}) => {
  const getSeverityIcon = () => {
    switch (severity) {
      case 'danger': return <FiAlertTriangle className="alert-card-icon danger" />;
      case 'warning': return <FiAlertCircle className="alert-card-icon warning" />;
      case 'success': return <FiCheckCircle className="alert-card-icon success" />;
      default: return <FiInfo className="alert-card-icon info" />;
    }
  };

  return (
    <div className={`alert-card severity-${severity} ${className}`}>
      <div className="alert-card-left">
        <div className="alert-card-icon-container">{getSeverityIcon()}</div>
        <div className="alert-card-content">
          <div className="alert-card-header-row">
            <h4 className="alert-card-title">{title}</h4>
            <Badge variant={severity === 'danger' ? 'danger' : severity === 'warning' ? 'warning' : 'info'} size="sm">
              {status}
            </Badge>
          </div>
          <p className="alert-card-message">{message}</p>
          <div className="alert-card-meta">
            {location && <span className="alert-meta-item">📍 {location}</span>}
            {timestamp && <span className="alert-meta-item">🕒 {timestamp}</span>}
          </div>
        </div>
      </div>

      {onAcknowledge && (
        <button className="alert-ack-btn" onClick={onAcknowledge} title="Acknowledge Alert">
          <span>Resolve</span>
          <FiChevronRight />
        </button>
      )}
    </div>
  );
};

export default AlertCard;
