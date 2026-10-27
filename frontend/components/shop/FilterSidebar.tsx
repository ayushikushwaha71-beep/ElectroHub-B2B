'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Star,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import {
  ShopFilters,
  DEFAULT_FILTERS,
  SHOP_CATEGORIES,
  SHOP_BRANDS,
  RATING_OPTIONS,
  PRICE_RANGE_MIN,
  PRICE_RANGE_MAX,
  countActiveFilters,
} from '@/lib/data/shopFilters';

// ─── Section accordion ─────────────────────────────────────────────────────────
function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-[var(--border)] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between px-4 py-3.5',
          'text-sm font-semibold text-[var(--text)]',
          'hover:bg-[var(--surface-hover)] transition-colors rounded-t-lg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]'
        )}
        aria-expanded={open}
      >
        {title}
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={15} className="text-[var(--text-muted)]" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Checkbox option ───────────────────────────────────────────────────────────
function CheckOption({
  id,
  label,
  checked,
  onChange,
  count,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  count?: number;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center justify-between gap-2 py-1.5',
        'text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors'
      )}
    >
      <span className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-[var(--border)] accent-[var(--primary)] focus:ring-[var(--ring)]"
        />
        <span className={checked ? 'font-medium text-[var(--text)]' : ''}>
          {label}
        </span>
      </span>
      {count !== undefined && (
        <span className="text-xs text-[var(--text-subtle)]">({count})</span>
      )}
    </label>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────
export interface FilterSidebarProps {
  filters:       ShopFilters;
  onFiltersChange: (f: ShopFilters) => void;
  /** Product counts per category for display */
  categoryCounts?: Record<string, number>;
  className?:    string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function FilterSidebar({
  filters,
  onFiltersChange,
  categoryCounts,
  className,
}: FilterSidebarProps) {
  const activeCount = countActiveFilters(filters);

  const toggleArr = (key: 'categories' | 'brands', value: string) => {
    const arr = filters[key];
    const next = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    onFiltersChange({ ...filters, [key]: next });
  };

  const clearAll = () => onFiltersChange(DEFAULT_FILTERS);

  return (
    <aside
      className={cn(
        'flex flex-col rounded-2xl border border-[var(--border)]',
        'bg-[var(--background-card)] shadow-[var(--shadow-card)]',
        'overflow-hidden',
        className
      )}
      aria-label="Product filters"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-[var(--primary)]" />
          <span className="text-sm font-bold text-[var(--text)]">Filters</span>
          {activeCount > 0 && (
            <span
              className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
              style={{ background: 'var(--primary)' }}
            >
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              'text-[var(--primary)] hover:text-[var(--primary-hover)]',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded'
            )}
            aria-label="Clear all filters"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* ── Category ──────────────────────────────────────────────────────── */}
      <FilterSection title="Category">
        <div className="flex flex-col">
          {SHOP_CATEGORIES.map((cat) => (
            <CheckOption
              key={cat}
              id={`cat-${cat}`}
              label={cat}
              checked={filters.categories.includes(cat)}
              onChange={() => toggleArr('categories', cat)}
              count={categoryCounts?.[cat]}
            />
          ))}
        </div>
      </FilterSection>

      {/* ── Brand ────────────────────────────────────────────────────────── */}
      <FilterSection title="Brand">
        <div className="flex flex-col">
          {SHOP_BRANDS.map((brand) => (
            <CheckOption
              key={brand}
              id={`brand-${brand}`}
              label={brand}
              checked={filters.brands.includes(brand)}
              onChange={() => toggleArr('brands', brand)}
            />
          ))}
        </div>
      </FilterSection>

      {/* ── Price Range ──────────────────────────────────────────────────── */}
      <FilterSection title="Price Range">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">₹</span>
              <input
                type="number"
                min={PRICE_RANGE_MIN}
                max={filters.priceMax}
                value={filters.priceMin}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    priceMin: Math.max(PRICE_RANGE_MIN, Number(e.target.value)),
                  })
                }
                className={cn(
                  'w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]',
                  'pl-6 pr-2 py-1.5 text-xs text-[var(--text)]',
                  'focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30 outline-none',
                  'transition-colors'
                )}
                aria-label="Minimum price"
              />
            </div>
            <span className="text-xs text-[var(--text-muted)]">–</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">₹</span>
              <input
                type="number"
                min={filters.priceMin}
                max={PRICE_RANGE_MAX}
                value={filters.priceMax}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    priceMax: Math.min(PRICE_RANGE_MAX, Number(e.target.value)),
                  })
                }
                className={cn(
                  'w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]',
                  'pl-6 pr-2 py-1.5 text-xs text-[var(--text)]',
                  'focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30 outline-none',
                  'transition-colors'
                )}
                aria-label="Maximum price"
              />
            </div>
          </div>

          {/* Slider */}
          <div className="px-1">
            <input
              type="range"
              min={PRICE_RANGE_MIN}
              max={PRICE_RANGE_MAX}
              step={100}
              value={filters.priceMax}
              onChange={(e) =>
                onFiltersChange({ ...filters, priceMax: Number(e.target.value) })
              }
              className="w-full accent-[var(--primary)]"
              aria-label="Price range slider"
            />
            <div className="mt-1 flex justify-between text-[10px] text-[var(--text-subtle)]">
              <span>₹{PRICE_RANGE_MIN.toLocaleString('en-IN')}</span>
              <span>₹{PRICE_RANGE_MAX.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </FilterSection>

      {/* ── Rating ───────────────────────────────────────────────────────── */}
      <FilterSection title="Minimum Rating">
        <div className="flex flex-col gap-1">
          {/* "All" option */}
          <label
            htmlFor="rating-all"
            className="flex cursor-pointer items-center gap-2 py-1 text-sm"
          >
            <input
              id="rating-all"
              type="radio"
              name="minRating"
              checked={filters.minRating === 0}
              onChange={() => onFiltersChange({ ...filters, minRating: 0 })}
              className="accent-[var(--primary)]"
            />
            <span className={cn('text-[var(--text-muted)]', filters.minRating === 0 && 'font-medium text-[var(--text)]')}>
              All ratings
            </span>
          </label>

          {RATING_OPTIONS.map((r) => (
            <label
              key={r}
              htmlFor={`rating-${r}`}
              className="flex cursor-pointer items-center gap-2 py-1 text-sm"
            >
              <input
                id={`rating-${r}`}
                type="radio"
                name="minRating"
                checked={filters.minRating === r}
                onChange={() => onFiltersChange({ ...filters, minRating: r })}
                className="accent-[var(--primary)]"
              />
              <span className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < r
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-[var(--border-strong)] text-[var(--border-strong)]'
                    }
                  />
                ))}
                <span
                  className={cn(
                    'ml-1 text-xs text-[var(--text-muted)]',
                    filters.minRating === r && 'font-medium text-[var(--text)]'
                  )}
                >
                  &amp; above
                </span>
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* ── Availability ─────────────────────────────────────────────────── */}
      <FilterSection title="Availability">
        <CheckOption
          id="in-stock"
          label="In Stock Only"
          checked={filters.inStockOnly}
          onChange={(v) => onFiltersChange({ ...filters, inStockOnly: v })}
        />
      </FilterSection>

      {/* ── Discount & Featured ───────────────────────────────────────────── */}
      <FilterSection title="Offers">
        <div className="flex flex-col">
          <CheckOption
            id="on-sale"
            label="On Sale / Discounted"
            checked={filters.onSaleOnly}
            onChange={(v) => onFiltersChange({ ...filters, onSaleOnly: v })}
          />
          <CheckOption
            id="featured"
            label="Featured Products"
            checked={filters.featuredOnly}
            onChange={(v) => onFiltersChange({ ...filters, featuredOnly: v })}
          />
        </div>
      </FilterSection>

      {/* Footer — clear all */}
      {activeCount > 0 && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={clearAll}
            leftIcon={<X size={14} />}
          >
            Clear All Filters ({activeCount})
          </Button>
        </div>
      )}
    </aside>
  );
}
