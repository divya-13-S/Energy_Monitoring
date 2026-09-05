import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import './Breadcrumb.css';

const Breadcrumb = ({ customItems, className = '' }) => {
  const location = useLocation();

  const getBreadcrumbs = () => {
    if (customItems) return customItems;

    const pathnames = location.pathname.split('/').filter((x) => x);
    const items = [{ label: 'Dashboard', path: '/' }];

    let currentPath = '';
    pathnames.forEach((name) => {
      currentPath += `/${name}`;
      const formattedLabel = name
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      items.push({ label: formattedLabel, path: currentPath });
    });

    return items;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className={`breadcrumb-container ${className}`} aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {breadcrumbs.map((item, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <li key={item.path || idx} className="breadcrumb-item">
              {idx === 0 ? (
                <Link to={item.path} className="breadcrumb-link home">
                  <FiHome className="breadcrumb-icon" />
                  <span>{item.label}</span>
                </Link>
              ) : isLast ? (
                <span className="breadcrumb-active" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.path} className="breadcrumb-link">
                  {item.label}
                </Link>
              )}
              {!isLast && <FiChevronRight className="breadcrumb-separator" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
