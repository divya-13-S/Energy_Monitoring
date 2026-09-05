import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import './KpiCard.css';

const KpiCard = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  supportingText,
  badge,
  variant = 'primary', // primary (blue), success (green), warning (amber), danger (red), info
  className = '',
}) => {
  const renderTrendIcon = () => {
    if (trendDirection === 'up') return <FiTrendingUp className="trend-icon" />;
    if (trendDirection === 'down') return <FiTrendingDown className="trend-icon" />;
    return <FiMinus className="trend-icon" />;
  };

  return (
    <div className={`kpi-card variant-${variant} ${className}`}>
      {/* Top Header Row */}
      <div className="kpi-card-header">
        <span className="kpi-title">{title}</span>
        <div className="kpi-header-right">
          {badge && <span className="kpi-badge">{badge}</span>}
          {Icon && (
            <div className={`kpi-icon-box icon-${variant}`}>
              <Icon className="kpi-icon" />
            </div>
          )}
        </div>
      </div>

      {/* Main Metric Value Row */}
      <div className="kpi-card-body">
        <div className="kpi-value-container">
          <span className="kpi-value">{value}</span>
          {unit && <span className="kpi-unit">{unit}</span>}
        </div>

        {/* Footer / Trend Row */}
        {(trend || supportingText) && (
          <div className="kpi-card-footer">
            {trend && (
              <span className={`kpi-trend-pill direction-${trendDirection} variant-${variant}`}>
                {renderTrendIcon()}
                <span>{trend}</span>
              </span>
            )}
            {supportingText && <span className="kpi-supporting-text">{supportingText}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
