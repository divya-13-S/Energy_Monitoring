import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './Pagination.css';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  itemsPerPage,
  className = '',
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`pagination-container ${className}`}>
      {totalItems !== undefined && itemsPerPage !== undefined && (
        <span className="pagination-info">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
        </span>
      )}
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous Page"
        >
          <FiChevronLeft />
        </button>

        {getPageNumbers().map((num) => (
          <button
            key={num}
            className={`pagination-num ${num === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(num)}
          >
            {num}
          </button>
        ))}

        <button
          className="pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next Page"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
