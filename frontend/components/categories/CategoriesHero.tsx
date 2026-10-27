'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Grid3X3, ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Badge } from '@/components/ui/Badge';
import { ALL_CATEGORIES } from '@/lib/data/categoriesPage';

// ─── Hero Section ─────────────────────────────────────────────────────────────
export function CategoriesHero() {
  const totalProducts = ALL_CATEGORIES.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-[var(--background)] via-blue-50/40 to-violet-50/20 dark:via-blue-950/20 dark:to-violet-950/10 py-14 border-b border-[var(--border)]"
      aria-label="Categories page hero"
      id="categories-hero"
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-500/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-violet-500/8 blur-3xl pointer-events-none" />

      <div className="relative container-fluid">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Breadcrumb
            showHome
            items={[
              { label: 'Home', href: '/' },
              { label: 'Categories', current: true },
            ]}
            className="mb-6"
          />
        </motion.div>

        {/* Title area */}
        <div className="flex flex-col gap-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <Badge variant="primary" className="w-fit mb-2">
              <Grid3X3 size={13} className="mr-1" />
              Browse All Categories
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-[var(--text)] leading-[1.05]"
          >
            Explore Our{' '}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
              Categories
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base text-[var(--text-muted)] leading-relaxed"
          >
            Discover {ALL_CATEGORIES.length} curated categories with over{' '}
            <span className="font-semibold text-[var(--text)]">
              {totalProducts.toLocaleString('en-IN')}+ products
            </span>{' '}
            — from beginner Arduino kits to advanced robotics systems and precision sensors.
          </motion.p>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap gap-3 mt-2"
          >
            {[
              { value: `${ALL_CATEGORIES.length}`, label: 'Categories' },
              { value: '2,500+', label: 'Products' },
              { value: '8', label: 'Top Brands' },
              { value: '50K+', label: 'Happy Makers' },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--background-card)] border border-[var(--border)] shadow-sm"
              >
                <span className="font-bold text-sm text-[var(--primary)]">{s.value}</span>
                <span className="text-xs text-[var(--text-muted)]">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
