'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { CATEGORIES } from '@/lib/data/categories';
import { cn } from '@/utils/cn';

// ─── Shared Section Header ─────────────────────────────────────────────────────
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  cta,
  ctaHref = '#',
  centered = false,
  id,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  cta?: string;
  ctaHref?: string;
  centered?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        'flex flex-col gap-2 mb-8',
        centered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between sm:gap-4'
      )}
    >
      <div className={cn('flex flex-col gap-1.5', centered && 'items-center')}>
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)] leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-[var(--text-muted)] max-w-xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {cta && !centered && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors shrink-0 group"
        >
          {cta}
          <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
      {cta && centered && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors mt-2 group"
        >
          {cta}
          <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}

// ─── Stagger reveal ────────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function FeaturedCategories() {
  return (
    <section
      className="py-16 bg-[var(--background-alt)]"
      aria-label="Featured categories"
      id="featured-categories"
    >
      <div className="container-fluid">
        <SectionHeader
          eyebrow="Explore"
          title="Shop by Category"
          subtitle="Find components for every project — from beginner kits to advanced IoT systems."
          cta="All Categories"
          ctaHref="/categories"
        />

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        >
          {CATEGORIES.map((category) => (
            <motion.div key={category.id} variants={item}>
              <CategoryCard
                category={category}
                variant="icon"
                showCount
                onClick={() => {/* navigate */}}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
