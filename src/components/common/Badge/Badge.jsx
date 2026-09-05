import React from 'react';
import './Badge.css';

const Badge = ({
  children,
  variant = 'primary', // primary, success, warning, danger, info, neutral, cyan
  size = 'md', // sm, md
  dot = false,
  className = '',
  ...props
}) => {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`} {...props}>
      {dot && <span className="badge-dot" />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
