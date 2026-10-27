'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Server, Wifi, Activity, Monitor, RotateCw, Bot, Zap,
  Wrench, Layers, ArrowRight, Search, Filter, X, SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { ALL_CATEGORIES } from '@/lib/data/categoriesPage';
import type { Category } from '@/types';

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  cpu:         <Cpu size={28} />,
  server:      <Server size={28} />,
  wifi:        <Wifi size={28} />,
  activity:    <Activity size={28} />,
  monitor:     <Monitor size={28} />,
  'rotate-cw': <RotateCw size={28} />,
  bot:         <Bot size={28} />,
  zap:         <Zap size={28} />,
  wrench:      <Wrench size={28} />,
  layers:      <Layers size={28} />,
};

// ─── Stagger animations ───────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const cardAnim = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// ─── Category Card ────────────────────────────────────────────────────────────
function CategoryGridCard({ category, index }: { category: Category; index: number }) {
  const [hovered, setHovered] = React.useState(false);
  const icon = ICONS[category.iconName ?? 'cpu'];

  return (
    <motion.div variants={cardAnim}>
      <Link
        href={`/categories/${category.slug}`}
        className="group relative flex flex-col h-full overflow-hidden rounded-2xl bg-[var(--background-card)] border border-[var(--border)] hover:border-transparent hover:shadow-2xl transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`Browse ${category.name} — ${category.productCount} products`}
      >
        {/* Hover colour wash */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${category.featuredColor}12, ${category.featuredColor}06)` }}
        />

        {/* Top accent stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-all duration-300"
          style={{
            background: hovered
              ? `linear-gradient(90deg, ${category.featuredColor}, transparent)`
              : 'transparent',
          }}
        />

        {/* Image section */}
        <div className="relative overflow-hidden h-44 bg-[var(--background-alt)]">
          <motion.img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
            loading="lazy"
            animate={{ scale: hovered ? 1.07 : 1 }}
            transition={{ duration: 0.45 }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Product count badge */}
          <div className="absolute top-3 right-3">
            <span
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-white backdrop-blur-sm"
              style={{ background: `${category.featuredColor}cc` }}
            >
              {category.productCount} products
            </span>
          </div>

          {/* Icon in image */}
          <motion.div
            className="absolute bottom-4 left-4 w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg backdrop-blur-sm"
            style={{ background: `${category.featuredColor}cc` }}
            animate={hovered ? { scale: 1.1, rotate: -6 } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="[&>svg]:w-5 [&>svg]:h-5">{icon}</span>
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-5 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-[var(--text)] leading-snug group-hover:text-[var(--primary)] transition-colors">
              {category.name}
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2 flex-1">
            {category.description}
          </p>

          {/* CTA row */}
          <div className="flex items-center justify-between pt-2 mt-auto border-t border-[var(--border)]">
            <span className="text-xs text-[var(--text-subtle)]">
              {category.productCount.toLocaleString('en-IN')} items
            </span>
            <motion.span
              className="inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: category.featuredColor }}
              animate={{ x: hovered ? 4 : 0 }}
              transition={{ duration: 0.2 }}
            >
              Browse <ArrowRight size={13} />
            </motion.span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Search & Filter bar ──────────────────────────────────────────────────────
function SearchFilterBar({
  query,
  setQuery,
  totalShown,
  totalAll,
}: {
  query: string;
  setQuery: (q: string) => void;
  totalShown: number;
  totalAll: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8 items-start sm:items-center justify-between">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
        />
        <input
          type="search"
          id="category-search"
          placeholder="Search categories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search categories"
          className="w-full h-10 pl-9 pr-8 rounded-xl bg-[var(--background-card)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Count */}
      <span className="text-sm text-[var(--text-muted)] shrink-0">
        Showing{' '}
        <span className="font-semibold text-[var(--text)]">{totalShown}</span>{' '}
        of {totalAll} categories
      </span>
    </div>
  );
}

// ─── Main Grid Section ────────────────────────────────────────────────────────
export function CategoryGrid() {
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(
    () =>
      query.trim()
        ? ALL_CATEGORIES.filter(
            (c) =>
              c.name.toLowerCase().includes(query.toLowerCase()) ||
              (c.description ?? '').toLowerCase().includes(query.toLowerCase())
          )
        : ALL_CATEGORIES,
    [query]
  );

  return (
    <section
      id="category-grid"
      className="py-14 bg-[var(--background)]"
      aria-label="All categories"
    >
      <div className="container-fluid">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
            All Categories
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)] mt-1 leading-tight">
            Find What You Need
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1.5 max-w-lg">
            Every product category organized for quick discovery — from single-chip modules to complete system kits.
          </p>
        </motion.div>

        {/* Search bar */}
        <SearchFilterBar
          query={query}
          setQuery={setQuery}
          totalShown={filtered.length}
          totalAll={ALL_CATEGORIES.length}
        />

        {/* Grid */}
        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div
              key="grid"
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-50px' }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
            >
              {filtered.map((cat, i) => (
                <CategoryGridCard key={cat.id} category={cat} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-[var(--background-alt)] flex items-center justify-center">
                <Search size={28} className="text-[var(--text-subtle)]" />
              </div>
              <p className="text-base font-semibold text-[var(--text)]">No categories found</p>
              <p className="text-sm text-[var(--text-muted)]">
                No results for &ldquo;{query}&rdquo;. Try a different search term.
              </p>
              <button
                onClick={() => setQuery('')}
                className="text-sm font-semibold text-[var(--primary)] hover:underline"
              >
                Clear search
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
