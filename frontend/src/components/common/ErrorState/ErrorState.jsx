import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import Button from '../Button/Button';
import './ErrorState.css';

const ErrorState = ({
  icon: Icon = FiAlertTriangle,
  title = 'Something Went Wrong',
  message = 'Failed to load system data. Please verify network connection or try again.',
  onRetry,
  retryLabel = 'Retry Connection',
  className = '',
}) => {
  return (
    <div className={`error-state ${className}`}>
      <div className="error-state-icon-wrapper">
        <Icon className="error-state-icon" />
      </div>
      <h4 className="error-state-title">{title}</h4>
      <p className="error-state-message">{message}</p>
      {onRetry && (
        <div className="error-state-action">
          <Button variant="danger" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
