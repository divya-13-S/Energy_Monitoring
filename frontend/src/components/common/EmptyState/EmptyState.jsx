import React from 'react';
import { FiInbox } from 'react-icons/fi';
import Button from '../Button/Button';
import './EmptyState.css';

const EmptyState = ({
  icon: Icon = FiInbox,
  title = 'No Data Available',
  description = 'There are currently no records to display.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon-wrapper">
        <Icon className="empty-state-icon" />
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-description">{description}</p>
      {actionLabel && onAction && (
        <div className="empty-state-action">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
