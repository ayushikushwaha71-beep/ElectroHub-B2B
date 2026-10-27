'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { ProductCard } from '@/components/ui/ProductCard';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonProductCard } from '@/components/ui/Skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/ui/Sheet';
import { ShopHero } from './ShopHero';
import { FilterSidebar } from './FilterSidebar';
import { SortDropdown } from './SortDropdown';
import { PRODUCTS } from '@/lib/data/products';
import { getMarketplaceProducts } from '@/lib/products-api';
import {
  ShopFilters,
  DEFAULT_FILTERS,
  ShopSortValue,
  countActiveFilters,
} from '@/lib/data/shopFilters';
import type { Product } from '@/types';

// ─── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 12;

// ─── Filtering & Sorting Logic ─────────────────────────────────────────────────
function applyFilters(products: Product[], filters: ShopFilters): Product[] {
  return products.filter((p) => {
    if (filters.categories.length > 0 && !filters.categories.includes(p.category)) return false;
    if (filters.brands.length > 0 && !filters.brands.includes(p.brand))             return false;
    if (p.sellingPrice < filters.priceMin || p.sellingPrice > filters.priceMax)      return false;
    if (filters.minRating > 0 && p.rating < filters.minRating)                       return false;
    if (filters.inStockOnly && p.stock <= 0)                                          return false;
    if (filters.onSaleOnly && p.sellingPrice >= p.originalPrice)                      return false;
    if (filters.featuredOnly && !p.isFeatured)                                        return false;
    return true;
  });
}

function applySort(products: Product[], sort: ShopSortValue): Product[] {
  const arr = [...products];
  switch (sort) {
    case 'featured':   return arr.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    case 'newest':     return arr.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    case 'price-asc':  return arr.sort((a, b) => a.sellingPrice - b.sellingPrice);
    case 'price-desc': return arr.sort((a, b) => b.sellingPrice - a.sellingPrice);
    case 'rating':     return arr.sort((a, b) => b.rating - a.rating);
    case 'bestseller': return arr.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
    default:           return arr;
  }
}

// ─── Category counts for filter display ───────────────────────────────────────
function buildCategoryCounts(products: Product[]): Record<string, number> {
  return products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
}

// ─── Product Grid ─────────────────────────────────────────────────────────────
function ProductGrid({
  products,
  isLoading,
  view,
}: {
  products: Product[];
  isLoading: boolean;
  view: 'grid' | 'list';
}) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid gap-4',
          view === 'list'
            ? 'grid-cols-1'
            : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
        )}
        aria-busy="true"
        aria-label="Loading products"
      >
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <SkeletonProductCard key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div
      className={cn(
        'grid gap-4',
        view === 'list'
          ? 'grid-cols-1'
          : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
      )}
    >
      <AnimatePresence mode="popLayout">
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.3) }}
          >
            <ProductCard
              product={product}
              variant={view === 'list' ? 'horizontal' : 'default'}
              showCompare
              showQuickView
              className="h-full"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Toolbar (sort + view toggle + active filter chips) ───────────────────────
function ShopToolbar({
  total,
  filtered,
  sort,
  onSortChange,
  view,
  onViewChange,
  filters,
  onFiltersChange,
  onOpenMobileFilter,
}: {
  total:    number;
  filtered: number;
  sort:     ShopSortValue;
  onSortChange: (v: ShopSortValue) => void;
  view:     'grid' | 'list';
  onViewChange: (v: 'grid' | 'list') => void;
  filters:  ShopFilters;
  onFiltersChange: (f: ShopFilters) => void;
  onOpenMobileFilter: () => void;
}) {
  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: counts + controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: count */}
        <p className="text-sm text-[var(--text-muted)]">
          Showing{' '}
          <span className="font-semibold text-[var(--text)]">
            {filtered.toLocaleString('en-IN')}
          </span>
          {filtered !== total && (
            <> of {total.toLocaleString('en-IN')}</>
          )}{' '}
          products
        </p>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          {/* Mobile filter button */}
          <button
            type="button"
            onClick={onOpenMobileFilter}
            aria-label="Open filters"
            className={cn(
              'lg:hidden flex items-center gap-1.5 rounded-xl border border-[var(--border)]',
              'bg-[var(--background-card)] px-3 py-2 text-sm font-medium text-[var(--text)]',
              'hover:bg-[var(--surface-hover)] transition-colors shadow-[var(--shadow-card)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]'
            )}
          >
            <Filter size={14} />
            Filters
            {activeCount > 0 && (
              <span
                className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ background: 'var(--primary)' }}
              >
                {activeCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <SortDropdown value={sort} onChange={onSortChange} />

          {/* View toggle — desktop only */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-1 shadow-[var(--shadow-card)]">
            <button
              type="button"
              onClick={() => onViewChange('grid')}
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                view === 'grid'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
              )}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => onViewChange('list')}
              aria-label="List view"
              aria-pressed={view === 'list'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                view === 'list'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
              )}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Active filter chips */}
      {activeCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap items-center gap-2"
        >
          {filters.categories.map((cat) => (
            <FilterChip
              key={`cat:${cat}`}
              label={cat}
              onRemove={() =>
                onFiltersChange({
                  ...filters,
                  categories: filters.categories.filter((c) => c !== cat),
                })
              }
            />
          ))}
          {filters.brands.map((brand) => (
            <FilterChip
              key={`brand:${brand}`}
              label={brand}
              onRemove={() =>
                onFiltersChange({
                  ...filters,
                  brands: filters.brands.filter((b) => b !== brand),
                })
              }
            />
          ))}
          {filters.minRating > 0 && (
            <FilterChip
              label={`${filters.minRating}★ & above`}
              onRemove={() => onFiltersChange({ ...filters, minRating: 0 })}
            />
          )}
          {filters.inStockOnly && (
            <FilterChip
              label="In Stock"
              onRemove={() => onFiltersChange({ ...filters, inStockOnly: false })}
            />
          )}
          {filters.onSaleOnly && (
            <FilterChip
              label="On Sale"
              onRemove={() => onFiltersChange({ ...filters, onSaleOnly: false })}
            />
          )}
          {filters.featuredOnly && (
            <FilterChip
              label="Featured"
              onRemove={() => onFiltersChange({ ...filters, featuredOnly: false })}
            />
          )}
          {(filters.priceMin > 0 || filters.priceMax < 10000) && (
            <FilterChip
              label={`₹${filters.priceMin.toLocaleString('en-IN')} – ₹${filters.priceMax.toLocaleString('en-IN')}`}
              onRemove={() =>
                onFiltersChange({ ...filters, priceMin: 0, priceMax: 10000 })
              }
            />
          )}
          <button
            type="button"
            onClick={() => onFiltersChange(DEFAULT_FILTERS)}
            className="text-xs font-medium text-[var(--primary)] hover:underline focus-visible:outline-none"
          >
            Clear all
          </button>
        </motion.div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full',
        'border border-[var(--primary)]/30 bg-[var(--primary)]/10',
        'px-3 py-1 text-xs font-medium text-[var(--primary)]'
      )}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="ml-0.5 rounded-full hover:text-[var(--primary-hover)] focus-visible:outline-none"
      >
        <X size={11} />
      </button>
    </span>
  );
}

// ─── Main ShopPage ─────────────────────────────────────────────────────────────
export function ShopPage() {
  const [products, setProducts]             = React.useState<Product[]>([]);
  const [filters, setFilters]               = React.useState<ShopFilters>(DEFAULT_FILTERS);
  const [sort, setSort]                     = React.useState<ShopSortValue>('featured');
  const [currentPage, setCurrentPage]       = React.useState(1);
  const [view, setView]                     = React.useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading]           = React.useState(true);
  const [loadError, setLoadError]           = React.useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  React.useEffect(() => {
    getMarketplaceProducts()
      .then(setProducts)
      .catch((error) => setLoadError(error instanceof Error ? error.message : 'Unable to load products.'))
      .finally(() => setIsLoading(false));
  }, []);

  const categoryCounts = React.useMemo(() => buildCategoryCounts(products), [products]);

  // Filtered + sorted products
  const allFiltered = React.useMemo(
    () => applySort(applyFilters(products, filters), sort),
    [filters, products, sort]
  );

  // Reset page when filters/sort change
  React.useEffect(() => {
    setCurrentPage(1);
    // Simulate a quick loading flash for UX
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 420);
    return () => clearTimeout(t);
  }, [filters, sort]);

  // Paginated slice
  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return allFiltered.slice(start, start + PAGE_SIZE);
  }, [allFiltered, currentPage]);

  const handleFiltersChange = (newFilters: ShopFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: ShopSortValue) => {
    setSort(newSort);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of product grid
    document
      .getElementById('product-grid-top')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero */}
      <ShopHero
        productCount={products.length}
        filteredCount={allFiltered.length}
      />

      {/* Layout */}
      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* ── Desktop Sidebar ────────────────────────────────────────────── */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                categoryCounts={categoryCounts}
              />
            </div>
          </aside>

          {/* ── Main Content ───────────────────────────────────────────────── */}
          <div className="min-w-0 flex-1" id="product-grid-top">
            {/* Toolbar */}
            <div className="mb-5">
              <ShopToolbar
                total={products.length}
                filtered={allFiltered.length}
                sort={sort}
                onSortChange={handleSortChange}
                view={view}
                onViewChange={setView}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onOpenMobileFilter={() => setMobileFilterOpen(true)}
              />
            </div>

            {/* Grid */}
            {!isLoading && loadError ? (
              <EmptyState preset="no-results" title="Products are unavailable" description={loadError} />
            ) : !isLoading && allFiltered.length === 0 ? (
              <EmptyState
                preset="no-results"
                actions={[
                  {
                    label: 'Clear All Filters',
                    onClick: () => setFilters(DEFAULT_FILTERS),
                    variant: 'primary',
                  },
                  {
                    label: 'Browse All',
                    onClick: () => setFilters(DEFAULT_FILTERS),
                    variant: 'outline',
                  },
                ]}
              />
            ) : (
              <ProductGrid
                products={paginatedProducts}
                isLoading={isLoading}
                view={view}
              />
            )}

            {/* Pagination */}
            {!isLoading && allFiltered.length > PAGE_SIZE && (
              <div className="mt-8">
                <Pagination
                  total={allFiltered.length}
                  pageSize={PAGE_SIZE}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  showFirstLast
                  showPageSize={false}
                  siblingCount={1}
                  size="md"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Sheet ───────────────────────────────────────────── */}
      <Sheet
        open={mobileFilterOpen}
        onOpenChange={setMobileFilterOpen}
      >
        <SheetContent side="left" className="flex flex-col p-0">
          <SheetHeader className="border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[var(--primary)]" />
                Filters
              </SheetTitle>
            </div>
          </SheetHeader>
          <SheetBody className="flex-1 overflow-y-auto px-0 py-0">
            <FilterSidebar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              categoryCounts={categoryCounts}
              className="rounded-none border-0 shadow-none"
            />
          </SheetBody>
          <SheetFooter className="border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className={cn(
                'flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium',
                'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors'
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]'
              )}
              style={{ background: 'var(--primary)' }}
            >
              Show {allFiltered.length} Results
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
