import React from 'react';
import './ChartCard.css';

const ChartCard = ({
  title,
  subtitle,
  children,
  action,
  headerFilters,
  className = '',
}) => {
  return (
    <div className={`chart-card card ${className}`}>
      {(title || action || headerFilters) && (
        <div className="chart-card-header">
          <div className="chart-title-group">
            {title && <h3 className="chart-title">{title}</h3>}
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>

          <div className="chart-header-actions">
            {headerFilters && <div className="chart-filters">{headerFilters}</div>}
            {action && <div className="chart-action">{action}</div>}
          </div>
        </div>
      )}

      <div className="chart-card-body">{children}</div>
    </div>
  );
};

export default ChartCard;
