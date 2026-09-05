import React from 'react';
import './Avatar.css';

const Avatar = ({
  src,
  name = 'User',
  size = 'md', // sm, md, lg, xl
  status, // online, offline, busy, away
  className = '',
  ...props
}) => {
  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className={`avatar avatar-${size} ${className}`} {...props}>
      {src ? (
        <img src={src} alt={name} className="avatar-img" />
      ) : (
        <span className="avatar-initials">{getInitials(name)}</span>
      )}
      {status && <span className={`avatar-status status-${status}`} />}
    </div>
  );
};

export default Avatar;
