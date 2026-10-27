'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, ArrowUpDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SHOP_SORT_OPTIONS, ShopSortValue } from '@/lib/data/shopFilters';

interface SortDropdownProps {
  value:    ShopSortValue;
  onChange: (v: ShopSortValue) => void;
  className?: string;
}

export function SortDropdown({ value, onChange, className }: SortDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const selectedLabel = SHOP_SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Sort';

  // Close on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on Escape
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <button
        type="button"
        id="sort-button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Sort by: ${selectedLabel}`}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-[var(--border)]',
          'bg-[var(--background-card)] px-3.5 py-2 text-sm font-medium',
          'text-[var(--text)] shadow-[var(--shadow-card)]',
          'hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
          open && 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
        )}
      >
        <ArrowUpDown size={14} className="text-[var(--text-muted)]" />
        <span>{selectedLabel}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
        >
          <ChevronDown size={14} className="text-[var(--text-muted)]" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label="Sort options"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{  opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'absolute right-0 top-full z-40 mt-2 w-52 origin-top-right',
              'rounded-xl border border-[var(--border)]',
              'bg-[var(--background-card)] shadow-[var(--shadow-dialog)]',
              'overflow-hidden py-1'
            )}
          >
            {SHOP_SORT_OPTIONS.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => {
                    onChange(opt.value as ShopSortValue);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-2.5 text-sm',
                    'transition-colors duration-100',
                    isSelected
                      ? 'bg-[var(--primary)]/10 font-semibold text-[var(--primary)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
                  )}
                >
                  {opt.label}
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
