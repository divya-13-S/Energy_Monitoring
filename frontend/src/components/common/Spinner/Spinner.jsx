import React from 'react';
import './Spinner.css';

const Spinner = ({ size = 'md', label, className = '' }) => {
  return (
    <div className={`spinner-container ${className}`}>
      <div className={`spinner spinner-${size}`} />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
};

export default Spinner;
