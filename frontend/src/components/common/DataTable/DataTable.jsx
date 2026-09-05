import React, { useState } from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import Spinner from '../Spinner/Spinner';
import EmptyState from '../EmptyState/EmptyState';
import Pagination from '../Pagination/Pagination';
import './DataTable.css';

const DataTable = ({
  columns = [], // [{ key: 'id', title: 'ID', render: (val, row) => ..., sortable: true }]
  data = [],
  isLoading = false,
  emptyMessage = 'No records found.',
  pagination = null, // { currentPage, totalPages, onPageChange, totalItems, itemsPerPage }
  className = '',
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key, sortable) => {
    if (!sortable) return;
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  return (
    <div className={`data-table-container ${className}`}>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key || col.title}
                  onClick={() => handleSort(col.key, col.sortable)}
                  className={`${col.sortable ? 'sortable' : ''} ${
                    sortConfig.key === col.key ? 'active-sort' : ''
                  }`}
                  style={{ width: col.width }}
                >
                  <div className="th-content">
                    <span>{col.title}</span>
                    {col.sortable && (
                      <span className="sort-icons">
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === 'asc' ? (
                            <FiChevronUp />
                          ) : (
                            <FiChevronDown />
                          )
                        ) : (
                          <FiChevronDown className="sort-icon-idle" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="table-loading-cell">
                  <Spinner label="Loading telemetry data..." size="md" />
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty-cell">
                  <EmptyState description={emptyMessage} />
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx} className="table-row">
                  {columns.map((col) => (
                    <td key={col.key || col.title}>
                      {col.render
                        ? col.render(row[col.key], row, rowIdx)
                        : row[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
        />
      )}
    </div>
  );
};

export default DataTable;
