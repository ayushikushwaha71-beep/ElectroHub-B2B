'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  Filter,
  LayoutGrid,
  List,
  X,
  Search as SearchIcon,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { SearchBar } from '@/components/ui/SearchBar';
import { ProductCard } from '@/components/ui/ProductCard';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonProductCard } from '@/components/ui/Skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/ui/Sheet';
import { FilterSidebar } from '@/components/shop/FilterSidebar';
import { SortDropdown } from '@/components/shop/SortDropdown';
import { SearchEmptyState } from './SearchEmptyState';
import {
  searchProducts,
  applySearchFilters,
  applySearchSort,
  buildSearchCategoryCounts,
  DEFAULT_FILTERS,
  TRENDING_SEARCHES,
} from '@/lib/data/searchData';
import { countActiveFilters } from '@/lib/data/shopFilters';
import type { Product } from '@/types';
import type { ShopFilters, ShopSortValue } from '@/lib/data/searchData';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 12;

// ─── Filter chip (same pattern as ShopPage) ───────────────────────────────────
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full',
      'border border-[var(--primary)]/30 bg-[var(--primary)]/10',
      'px-3 py-1 text-xs font-medium text-[var(--primary)]',
    )}>
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

// ─── Active filter chips row ──────────────────────────────────────────────────
function ActiveFilterChips({
  filters,
  onFiltersChange,
}: {
  filters:         ShopFilters;
  onFiltersChange: (f: ShopFilters) => void;
}) {
  const activeCount = countActiveFilters(filters);
  if (activeCount === 0) return null;

  return (
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
          onRemove={() => onFiltersChange({ ...filters, categories: filters.categories.filter((c) => c !== cat) })}
        />
      ))}
      {filters.brands.map((brand) => (
        <FilterChip
          key={`brand:${brand}`}
          label={brand}
          onRemove={() => onFiltersChange({ ...filters, brands: filters.brands.filter((b) => b !== brand) })}
        />
      ))}
      {filters.minRating > 0 && (
        <FilterChip
          label={`${filters.minRating}★ & above`}
          onRemove={() => onFiltersChange({ ...filters, minRating: 0 })}
        />
      )}
      {filters.inStockOnly && (
        <FilterChip label="In Stock" onRemove={() => onFiltersChange({ ...filters, inStockOnly: false })} />
      )}
      {filters.onSaleOnly && (
        <FilterChip label="On Sale" onRemove={() => onFiltersChange({ ...filters, onSaleOnly: false })} />
      )}
      {filters.featuredOnly && (
        <FilterChip label="Featured" onRemove={() => onFiltersChange({ ...filters, featuredOnly: false })} />
      )}
      {(filters.priceMin > 0 || filters.priceMax < 10000) && (
        <FilterChip
          label={`₹${filters.priceMin.toLocaleString('en-IN')} – ₹${filters.priceMax.toLocaleString('en-IN')}`}
          onRemove={() => onFiltersChange({ ...filters, priceMin: 0, priceMax: 10000 })}
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
  );
}

// ─── Product grid ──────────────────────────────────────────────────────────────
function SearchProductGrid({
  products,
  isLoading,
  view,
}: {
  products:  Product[];
  isLoading: boolean;
  view:      'grid' | 'list';
}) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid gap-4',
          view === 'list'
            ? 'grid-cols-1'
            : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3',
        )}
        aria-busy="true"
        aria-label="Loading search results"
      >
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <SkeletonProductCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-4',
        view === 'list'
          ? 'grid-cols-1'
          : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3',
      )}
    >
      <AnimatePresence mode="popLayout">
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.25) }}
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

// ─── Search header ─────────────────────────────────────────────────────────────
function SearchHeader({
  query,
  totalResults,
}: {
  query:        string;
  totalResults: number;
}) {
  const breadcrumbs = [
    { label: 'Home',   href: '/' },
    { label: 'Search', current: query === '' },
    ...(query ? [{ label: `"${query}"`, current: true }] : []),
  ];

  return (
    <div className="mb-6 flex flex-col gap-3">
      <Breadcrumb items={breadcrumbs} showHome />
      {query ? (
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--text)]">
            Search results for{' '}
            <span className="text-[var(--primary)]">"{query}"</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {totalResults.toLocaleString('en-IN')}{' '}
            {totalResults === 1 ? 'product' : 'products'} found
          </p>
        </div>
      ) : (
        <h1 className="text-2xl font-bold font-display text-[var(--text)]">
          Search Products
        </h1>
      )}
    </div>
  );
}

// ─── Toolbar (counts + mobile buttons + sort + view toggle + chips) ─────────
function SearchToolbar({
  query,
  filteredCount,
  totalSearchCount,
  sort,
  onSortChange,
  view,
  onViewChange,
  filters,
  onFiltersChange,
  onOpenMobileFilter,
}: {
  query:              string;
  filteredCount:      number;
  totalSearchCount:   number;
  sort:               ShopSortValue;
  onSortChange:       (v: ShopSortValue) => void;
  view:               'grid' | 'list';
  onViewChange:       (v: 'grid' | 'list') => void;
  filters:            ShopFilters;
  onFiltersChange:    (f: ShopFilters) => void;
  onOpenMobileFilter: () => void;
}) {
  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Count */}
        <p className="text-sm text-[var(--text-muted)]">
          Showing{' '}
          <span className="font-semibold text-[var(--text)]">
            {filteredCount.toLocaleString('en-IN')}
          </span>
          {filteredCount !== totalSearchCount && (
            <> of {totalSearchCount.toLocaleString('en-IN')}</>
          )}{' '}
          {filteredCount === 1 ? 'result' : 'results'}
          {query && (
            <span className="text-[var(--text-subtle)]"> for "{query}"</span>
          )}
        </p>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile filter */}
          <button
            type="button"
            onClick={onOpenMobileFilter}
            aria-label={`Open filters${activeCount > 0 ? `, ${activeCount} active` : ''}`}
            className={cn(
              'lg:hidden flex items-center gap-1.5 rounded-xl border border-[var(--border)]',
              'bg-[var(--background-card)] px-3 py-2 text-sm font-medium text-[var(--text)]',
              'hover:bg-[var(--surface-hover)] transition-colors shadow-[var(--shadow-card)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
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

          {/* View toggle — desktop */}
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
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
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
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
              )}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: active filter chips */}
      <AnimatePresence>
        {activeCount > 0 && (
          <ActiveFilterChips filters={filters} onFiltersChange={onFiltersChange} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Inline search bar ─────────────────────────────────────────────────────────
function InlineSearchBar({
  query,
  onSearch,
}: {
  query:    string;
  onSearch: (q: string) => void;
}) {
  const suggestions = React.useMemo(
    () =>
      TRENDING_SEARCHES.slice(0, 5).map((t) => ({
        type:  'query' as const,
        label: t,
        href:  `/search?q=${encodeURIComponent(t)}`,
      })),
    []
  );

  return (
    <div className="mb-6">
      <SearchBar
        defaultValue={query}
        size="lg"
        placeholder="Search products, brands, categories…"
        suggestions={suggestions}
        onSearch={onSearch}
        onSuggestionClick={(item) => onSearch(item.label)}
        showVoice
        aria-label="Search products"
      />
    </div>
  );
}

// ─── Main Client Component ─────────────────────────────────────────────────────
export function SearchResultsClient() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const query = (searchParams.get('q') ?? '').trim();

  // ── State ──────────────────────────────────────────────────────────────────
  const [filters,           setFilters]           = React.useState<ShopFilters>(DEFAULT_FILTERS);
  const [sort,              setSort]              = React.useState<ShopSortValue>('featured');
  const [currentPage,       setCurrentPage]       = React.useState(1);
  const [view,              setView]              = React.useState<'grid' | 'list'>('grid');
  const [isLoading,         setIsLoading]         = React.useState(false);
  const [mobileFilterOpen,  setMobileFilterOpen]  = React.useState(false);

  // ── Search results (memoized) ──────────────────────────────────────────────
  const rawSearchResults = React.useMemo(
    () => searchProducts(query),
    [query]
  );

  const filteredResults = React.useMemo(
    () => applySearchSort(applySearchFilters(rawSearchResults, filters), sort),
    [rawSearchResults, filters, sort]
  );

  const categoryCounts = React.useMemo(
    () => buildSearchCategoryCounts(rawSearchResults),
    [rawSearchResults]
  );

  // Paginated slice
  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredResults.slice(start, start + PAGE_SIZE);
  }, [filteredResults, currentPage]);

  // Reset page on query / filter / sort change
  React.useEffect(() => {
    setCurrentPage(1);
    if (!query) return;
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 380);
    return () => clearTimeout(t);
  }, [query, filters, sort]);

  // Reset filters when query changes
  React.useEffect(() => {
    setFilters(DEFAULT_FILTERS);
  }, [query]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleSearch = (newQuery: string) => {
    const trimmed = newQuery.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/search');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById('search-results-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const activeFilterCount = countActiveFilters(filters);
  const hasQuery          = query.length > 0;
  const hasResults        = filteredResults.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Search Header */}
      <SearchHeader query={query} totalResults={filteredResults.length} />

      {/* Inline Search Bar */}
      <InlineSearchBar query={query} onSearch={handleSearch} />

      {/* Empty query state */}
      {!hasQuery && (
        <SearchEmptyState />
      )}

      {/* Query present: layout with sidebar */}
      {hasQuery && (
        <div className="flex gap-6" id="search-results-top">
          {/* ── Desktop Filter Sidebar ──────────────────────────────────── */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0" aria-label="Search filters">
            <div className="sticky top-24">
              <FilterSidebar
                filters={filters}
                onFiltersChange={setFilters}
                categoryCounts={categoryCounts}
              />
            </div>
          </aside>

          {/* ── Main Content Area ────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-5">
              <SearchToolbar
                query={query}
                filteredCount={filteredResults.length}
                totalSearchCount={rawSearchResults.length}
                sort={sort}
                onSortChange={setSort}
                view={view}
                onViewChange={setView}
                filters={filters}
                onFiltersChange={setFilters}
                onOpenMobileFilter={() => setMobileFilterOpen(true)}
              />
            </div>

            {/* Results / No-results / Loading */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SearchProductGrid products={[]} isLoading view={view} />
                </motion.div>
              ) : !hasResults ? (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SearchEmptyState
                    query={query}
                    activeFilters={activeFilterCount}
                    onClearFilters={() => setFilters(DEFAULT_FILTERS)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SearchProductGrid
                    products={paginatedProducts}
                    isLoading={false}
                    view={view}
                  />

                  {/* Pagination */}
                  {filteredResults.length > PAGE_SIZE && (
                    <div className="mt-8">
                      <Pagination
                        total={filteredResults.length}
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Mobile Filter Sheet ─────────────────────────────────────────── */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
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
              onFiltersChange={setFilters}
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
                'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors',
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
              )}
              style={{ background: 'var(--primary)' }}
            >
              Show {filteredResults.length} Result{filteredResults.length !== 1 ? 's' : ''}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
