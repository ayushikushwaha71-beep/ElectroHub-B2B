'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface PaginationProps {
  /** Total number of items */
  total:       number;
  /** Items per page */
  pageSize:    number;
  /** Current page (1-based) */
  currentPage: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Max page numbers to show */
  siblingCount?: number;
  /** Show First/Last buttons */
  showFirstLast?: boolean;
  /** Show page size selector */
  showPageSize?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  className?:   string;
  size?:        'sm' | 'md' | 'lg';
}

// ─── Pagination range generator ────────────────────────────────────────────────
function generatePageRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1
): (number | '...')[] {
  const totalPageNos = siblingCount * 2 + 5;

  if (totalPageNos >= totalPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling  = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showLeftDots  = leftSibling  > 2;
  const showRightDots = rightSibling < totalPages - 2;

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1);
    return [...leftRange, '...', totalPages];
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from(
      { length: 3 + 2 * siblingCount },
      (_, i) => totalPages - (3 + 2 * siblingCount) + 1 + i
    );
    return [1, '...', ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i
  );
  return [1, '...', ...middleRange, '...', totalPages];
}

// ─── Page Button ───────────────────────────────────────────────────────────────
function PageButton({
  page,
  isCurrent,
  onClick,
  size,
  'aria-label': ariaLabel,
}: {
  page:      number | string | React.ReactNode;
  isCurrent?: boolean;
  onClick?:   () => void;
  size:       'sm' | 'md' | 'lg';
  'aria-label'?: string;
}) {
  const sizeMap = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex items-center justify-center rounded-lg font-medium',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        sizeMap[size],
        isCurrent
          ? 'bg-[var(--primary)] text-[var(--primary-fore)] shadow-sm'
          : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
        !onClick && 'opacity-50 cursor-not-allowed',
      )}
      aria-label={ariaLabel}
      aria-current={isCurrent ? 'page' : undefined}
    >
      {page}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Pagination({
  total,
  pageSize,
  currentPage,
  onPageChange,
  siblingCount    = 1,
  showFirstLast   = false,
  showPageSize    = false,
  pageSizeOptions = [12, 24, 48, 96],
  onPageSizeChange,
  className,
  size = 'md',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages      = generatePageRange(currentPage, totalPages, siblingCount);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem   = Math.min(currentPage * pageSize, total);

  if (totalPages <= 1 && !showPageSize) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center justify-between gap-4', className)}
    >
      {/* Item count info */}
      <p className="text-sm text-[var(--text-muted)] shrink-0">
        Showing{' '}
        <span className="font-medium text-[var(--text)]">{startItem}–{endItem}</span>
        {' '}of{' '}
        <span className="font-medium text-[var(--text)]">{total}</span>
        {' '}items
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* First */}
        {showFirstLast && (
          <PageButton
            page={<ChevronLeft size={14} className="mr-[-4px]" />}
            onClick={canPrev ? () => onPageChange(1) : undefined}
            size={size}
            aria-label="First page"
          />
        )}

        {/* Prev */}
        <PageButton
          page={<ChevronLeft size={15} />}
          onClick={canPrev ? () => onPageChange(currentPage - 1) : undefined}
          size={size}
          aria-label="Previous page"
        />

        {/* Page numbers */}
        {pages.map((page, idx) =>
          page === '...' ? (
            <span
              key={`dots-${idx}`}
              className={cn(
                'flex items-center justify-center text-[var(--text-subtle)]',
                size === 'sm' ? 'h-7 w-7 text-xs' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8 text-sm'
              )}
              aria-hidden="true"
            >
              <MoreHorizontal size={14} />
            </span>
          ) : (
            <PageButton
              key={page}
              page={page}
              isCurrent={page === currentPage}
              onClick={() => onPageChange(page as number)}
              size={size}
              aria-label={`Page ${page}`}
            />
          )
        )}

        {/* Next */}
        <PageButton
          page={<ChevronRight size={15} />}
          onClick={canNext ? () => onPageChange(currentPage + 1) : undefined}
          size={size}
          aria-label="Next page"
        />

        {/* Last */}
        {showFirstLast && (
          <PageButton
            page={<ChevronRight size={14} className="ml-[-4px]" />}
            onClick={canNext ? () => onPageChange(totalPages) : undefined}
            size={size}
            aria-label="Last page"
          />
        )}
      </div>

      {/* Page size selector */}
      {showPageSize && (
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-sm text-[var(--text-muted)]">Per page:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className={cn(
              'h-8 px-2 pr-7 text-sm rounded-lg',
              'bg-[var(--surface)] border border-[var(--border)]',
              'text-[var(--text)] outline-none',
              'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
              'transition-all duration-150',
            )}
            aria-label="Items per page"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
    </nav>
  );
}
