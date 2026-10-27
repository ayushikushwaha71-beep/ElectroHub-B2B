'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/ui/ProductCard';
import {
  TRENDING_SEARCHES,
  DEMO_RECENT_SEARCHES,
  POPULAR_SEARCH_CATEGORIES,
} from '@/lib/data/searchData';
import { PRODUCTS } from '@/lib/data/products';

// ─── Item reveal animation ─────────────────────────────────────────────────────
const itemVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y:       0,
    transition: { delay: i * 0.04, duration: 0.28 },
  }),
};

// ─── Search chip ───────────────────────────────────────────────────────────────
function SearchChip({
  label,
  href,
  icon,
}: {
  label: string;
  href:  string;
  icon?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm',
        'border border-[var(--border)] bg-[var(--background-card)]',
        'text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]',
        'transition-all duration-150 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
      )}
    >
      {icon}
      {label}
    </a>
  );
}

// ─── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[var(--primary)]">{icon}</span>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        {title}
      </h2>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SearchEmptyStateProps {
  /** Query that returned 0 results. If undefined → empty query state */
  query?:         string;
  activeFilters?: number;
  onClearFilters?: () => void;
  className?:     string;
}

// ─── Empty Query State ────────────────────────────────────────────────────────
function EmptyQueryState() {
  const featured = PRODUCTS.filter((p) => p.isFeatured).slice(0, 4);

  return (
    <div className="flex flex-col gap-12 py-4">
      {/* Hero prompt */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg mx-auto"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--primary)]/10 mx-auto mb-5">
          <Search size={36} className="text-[var(--primary)]" />
        </div>
        <h1 className="text-2xl font-bold font-display text-[var(--text)] mb-2">
          What are you looking for?
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          Search across 2,500+ electronics — Arduino, Raspberry Pi, sensors, motors, displays and more.
        </p>
      </motion.div>

      {/* Recent Searches */}
      {DEMO_RECENT_SEARCHES.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          aria-label="Recent searches"
        >
          <SectionHeading icon={<Clock size={14} />} title="Recent Searches" />
          <div className="flex flex-wrap gap-2">
            {DEMO_RECENT_SEARCHES.map((term, i) => (
              <motion.div key={term} custom={i} variants={itemVariants} initial="hidden" animate="visible">
                <SearchChip
                  label={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  icon={<Clock size={13} />}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Trending Searches */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        aria-label="Trending searches"
      >
        <SectionHeading icon={<TrendingUp size={14} />} title="Trending Searches" />
        <div className="flex flex-wrap gap-2">
          {TRENDING_SEARCHES.map((term, i) => (
            <motion.div key={term} custom={i} variants={itemVariants} initial="hidden" animate="visible">
              <SearchChip
                label={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                icon={<TrendingUp size={12} />}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Popular Categories */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        aria-label="Popular categories"
      >
        <SectionHeading icon={<Sparkles size={14} />} title="Popular Categories" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {POPULAR_SEARCH_CATEGORIES.map((cat, i) => (
            <motion.a
              key={cat.label}
              href={cat.href}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -2 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 rounded-xl',
                'border border-[var(--border)] bg-[var(--background-card)]',
                'hover:border-[var(--border-strong)] hover:shadow-md',
                'transition-all duration-200 group',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
              )}
              aria-label={`Browse ${cat.label}`}
            >
              <span className="text-xl shrink-0">{cat.emoji}</span>
              <span className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                {cat.label}
              </span>
              <ArrowRight size={13} className="ml-auto text-[var(--text-subtle)] group-hover:text-[var(--primary)] transition-colors" />
            </motion.a>
          ))}
        </div>
      </motion.section>

      {/* Featured products preview */}
      {featured.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          aria-label="Featured products"
        >
          <div className="flex items-center justify-between mb-5">
            <SectionHeading icon={<Sparkles size={14} />} title="Featured Products" />
            <a href="/shop" className="text-sm text-[var(--primary)] hover:underline underline-offset-2 font-medium">
              View all →
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((product, i) => (
              <motion.a
                key={product.id}
                href={`/product/${product.id}`}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="block"
              >
                <ProductCard product={product} variant="compact" />
              </motion.a>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

// ─── No Results State ─────────────────────────────────────────────────────────
function NoResultsState({
  query,
  activeFilters,
  onClearFilters,
}: {
  query:          string;
  activeFilters?: number;
  onClearFilters?: () => void;
}) {
  const suggested = PRODUCTS.filter((p) => p.isFeatured || p.isBestseller).slice(0, 4);

  return (
    <div className="flex flex-col gap-10 py-4">
      {/* Message */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg mx-auto"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--background-alt)] mx-auto mb-5">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Search size={36} className="text-[var(--text-subtle)]" />
          </motion.div>
        </div>
        <h1 className="text-xl font-bold font-display text-[var(--text)] mb-2">
          No results for{' '}
          <span className="text-[var(--primary)]">"{query}"</span>
        </h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">
          {activeFilters && activeFilters > 0
            ? `Try removing some filters or broadening your search.`
            : `Check your spelling or try a different search term.`}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {activeFilters && activeFilters > 0 && onClearFilters && (
            <Button variant="primary" size="sm" onClick={onClearFilters}>
              Clear {activeFilters} Filter{activeFilters > 1 ? 's' : ''}
            </Button>
          )}
          <a
            href="/shop"
            className={cn(
              'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium',
              'bg-transparent text-[var(--primary)] border-[var(--primary)]',
              'hover:bg-[var(--primary)] hover:text-white transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
            )}
          >
            Browse All Products
          </a>
        </div>
      </motion.div>

      {/* Spelling / Try these */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
        aria-label="Try these searches"
      >
        <SectionHeading icon={<TrendingUp size={14} />} title="Try These Searches" />
        <div className="flex flex-wrap gap-2">
          {TRENDING_SEARCHES.slice(0, 8).map((term, i) => (
            <motion.div key={term} custom={i} variants={itemVariants} initial="hidden" animate="visible">
              <SearchChip label={term} href={`/search?q=${encodeURIComponent(term)}`} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Popular categories */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        aria-label="Popular categories"
      >
        <SectionHeading icon={<Sparkles size={14} />} title="Popular Categories" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {POPULAR_SEARCH_CATEGORIES.slice(0, 4).map((cat, i) => (
            <motion.a
              key={cat.label}
              href={cat.href}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -2 }}
              className={cn(
                'flex items-center gap-2.5 px-4 py-3 rounded-xl',
                'border border-[var(--border)] bg-[var(--background-card)]',
                'hover:border-[var(--primary)] group transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
              )}
              aria-label={`Browse ${cat.label}`}
            >
              <span className="text-lg">{cat.emoji}</span>
              <span className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                {cat.label}
              </span>
            </motion.a>
          ))}
        </div>
      </motion.section>

      {/* You might like */}
      {suggested.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          aria-label="You might like"
        >
          <div className="flex items-center justify-between mb-5">
            <SectionHeading icon={<Sparkles size={14} />} title="You Might Like" />
            <a href="/shop" className="text-sm text-[var(--primary)] hover:underline underline-offset-2 font-medium">
              View all →
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {suggested.map((product, i) => (
              <motion.a
                key={product.id}
                href={`/product/${product.id}`}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="block"
              >
                <ProductCard product={product} variant="compact" />
              </motion.a>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function SearchEmptyState({
  query,
  activeFilters,
  onClearFilters,
  className,
}: SearchEmptyStateProps) {
  return (
    <div className={className}>
      {query ? (
        <NoResultsState
          query={query}
          activeFilters={activeFilters}
          onClearFilters={onClearFilters}
        />
      ) : (
        <EmptyQueryState />
      )}
    </div>
  );
}
