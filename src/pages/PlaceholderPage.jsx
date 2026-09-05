import React from 'react';
import './PlaceholderPage.css';

const PlaceholderPage = ({ title, description }) => {
  return (
    <div className="placeholder-page-container">
      <div className="placeholder-card">
        <h2 className="placeholder-title">{title}</h2>
        <p className="placeholder-description">
          {description || `The ${title} section will be configured in the next development phase.`}
        </p>
        <span className="placeholder-badge">Module Scheduled</span>
      </div>
    </div>
  );
};

export default PlaceholderPage;
