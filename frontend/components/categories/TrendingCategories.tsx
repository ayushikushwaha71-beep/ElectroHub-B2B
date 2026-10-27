'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Server, Wifi, Activity, Monitor, RotateCw, Bot, Zap,
  Wrench, Layers, ChevronLeft, ChevronRight, TrendingUp, ArrowRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { SectionHeader } from '@/components/home/FeaturedCategories';
import { ALL_CATEGORIES } from '@/lib/data/categoriesPage';

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  cpu:         <Cpu size={22} />,
  server:      <Server size={22} />,
  wifi:        <Wifi size={22} />,
  activity:    <Activity size={22} />,
  monitor:     <Monitor size={22} />,
  'rotate-cw': <RotateCw size={22} />,
  bot:         <Bot size={22} />,
  zap:         <Zap size={22} />,
  wrench:      <Wrench size={22} />,
  layers:      <Layers size={22} />,
};

// ─── Trending card ────────────────────────────────────────────────────────────
function TrendingCard({
  category,
  rank,
}: {
  category: typeof ALL_CATEGORIES[0];
  rank: number;
}) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative flex-shrink-0 w-52 sm:w-60 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-card)] hover:border-transparent hover:shadow-xl transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      aria-label={`${category.name} — trending category`}
    >
      {/* Image */}
      <div className="relative h-36 overflow-hidden bg-[var(--background-alt)]">
        <motion.img
          src={category.imageUrl}
          alt={category.name}
          className="w-full h-full object-cover"
          loading="lazy"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.4 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Rank badge */}
        <div
          className="absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-lg"
          style={{ background: `${category.featuredColor}dd` }}
          aria-label={`Rank ${rank}`}
        >
          #{rank}
        </div>

        {/* Trending badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-[9px] font-bold text-white">
          <TrendingUp size={9} />
          HOT
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${category.featuredColor}20`, color: category.featuredColor }}
          >
            <span className="[&>svg]:w-4 [&>svg]:h-4">
              {ICONS[category.iconName ?? 'cpu']}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--text)] truncate group-hover:text-[var(--primary)] transition-colors">
              {category.name}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {category.productCount} products
            </p>
          </div>
        </div>

        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
          {category.description}
        </p>

        <span
          className="inline-flex items-center gap-1 text-xs font-semibold mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: category.featuredColor }}
        >
          View category <ArrowRight size={11} />
        </span>
      </div>
    </Link>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TrendingCategories() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = React.useState(false);
  const [canRight, setCanRight] = React.useState(true);

  // Trending = sorted by productCount, take top 8
  const trending = [...ALL_CATEGORIES]
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 8);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <section
      id="trending-categories"
      className="py-14 bg-[var(--background)]"
      aria-label="Trending categories"
    >
      <div className="container-fluid">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
              Hot Right Now
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)] mt-1 leading-tight">
              Trending Categories
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">
              The most-searched categories among Indian makers this week.
            </p>
          </div>

          {/* Scroll controls */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={() => scrollBy(-1)}
              disabled={!canLeft}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background-card)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              disabled={!canRight}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background-card)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable carousel */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
          role="list"
          aria-label="Trending categories carousel"
        >
          {trending.map((cat, i) => (
            <motion.div
              key={cat.id}
              role="listitem"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
            >
              <TrendingCard category={cat} rank={i + 1} />
            </motion.div>
          ))}
        </div>

        {/* Mobile scroll hint */}
        <p className="mt-3 text-center text-xs text-[var(--text-subtle)] sm:hidden">
          ← Swipe to see more →
        </p>
      </div>
    </section>
  );
}
