'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Cpu, Server, Wifi, Activity, Monitor, RotateCw, Bot, Zap,
  Wrench, Layers, ArrowRight, TrendingUp,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { SectionHeader } from '@/components/home/FeaturedCategories';
import { ALL_CATEGORIES } from '@/lib/data/categoriesPage';

// ─── Icon map (small) ─────────────────────────────────────────────────────────
const ICONS_SM: Record<string, React.ReactNode> = {
  cpu:         <Cpu size={18} />,
  server:      <Server size={18} />,
  wifi:        <Wifi size={18} />,
  activity:    <Activity size={18} />,
  monitor:     <Monitor size={18} />,
  'rotate-cw': <RotateCw size={18} />,
  bot:         <Bot size={18} />,
  zap:         <Zap size={18} />,
  wrench:      <Wrench size={18} />,
  layers:      <Layers size={18} />,
};

// ─── Popular Category Horizontal Card ────────────────────────────────────────
function PopularCard({ category, index }: { category: typeof ALL_CATEGORIES[0]; index: number }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0, 0, 0.2, 1] }}
      whileHover={{ y: -3 }}
    >
      <Link
        href={`/categories/${category.slug}`}
        className="group flex items-center gap-4 p-4 rounded-2xl bg-[var(--background-card)] border border-[var(--border)] hover:border-transparent hover:shadow-lg transition-all duration-250 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`${category.name} — ${category.productCount} products`}
      >
        {/* Icon */}
        <motion.div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${category.featuredColor}20` }}
          animate={hovered ? { scale: 1.1 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <span style={{ color: category.featuredColor }}>
            {ICONS_SM[category.iconName ?? 'cpu']}
          </span>
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--text)] truncate group-hover:text-[var(--primary)] transition-colors">
            {category.name}
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
            {category.productCount} products
          </p>
        </div>

        {/* Arrow */}
        <motion.div
          animate={{ x: hovered ? 4 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-[var(--text-subtle)] group-hover:text-[var(--primary)] transition-colors"
        >
          <ArrowRight size={16} />
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PopularCategories() {
  // Sort by productCount descending for "popular"
  const popular = [...ALL_CATEGORIES].sort((a, b) => b.productCount - a.productCount);

  return (
    <section
      id="popular-categories"
      className="py-14 bg-[var(--background)]"
      aria-label="Popular categories"
    >
      <div className="container-fluid">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Left: header + description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="lg:w-80 shrink-0"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
              Most Visited
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)] mt-1.5 leading-tight">
              Popular Categories
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-2.5 leading-relaxed">
              The most-browsed sections on ElectroHub this week — jump straight to what the maker community loves most.
            </p>

            {/* Trending chip */}
            <div className="flex items-center gap-2 mt-5 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200/40 dark:border-amber-700/30">
              <TrendingUp size={16} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-[var(--text)]">Trending This Week</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {popular[0]?.name} · {popular[1]?.name} · {popular[2]?.name}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: responsive grid of horizontal cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {popular.map((cat, i) => (
              <PopularCard key={cat.id} category={cat} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
