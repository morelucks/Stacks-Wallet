import React from 'react';
import './transactions.css';

interface TransactionPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

const TransactionPagination: React.FC<TransactionPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  loading,
}) => {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages();

  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || loading}
        className="pagination-button pagination-prev"
      >
        ← Previous
      </button>

      <div className="pagination-pages">
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="pagination-dots">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                disabled={loading}
                className={`pagination-button pagination-page ${
                  currentPage === page ? 'active' : ''
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || loading}
        className="pagination-button pagination-next"
      >
        Next →
      </button>
    </div>
  );
};

export default TransactionPagination;