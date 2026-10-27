'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ProductCard } from '@/components/ui/ProductCard';
import type { Product } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RelatedProductsProps {
  products:   Product[];
  title?:     string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function RelatedProducts({
  products,
  title     = 'Related Products',
  className,
}: RelatedProductsProps) {
  const scrollRef  = React.useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = React.useState(false);
  const [canRight, setCanRight] = React.useState(true);

  if (products.length === 0) return null;

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scroll = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  return (
    <section className={cn('', className)} aria-label="Related products">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold font-display text-[var(--text)]">{title}</h2>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl',
              'border border-[var(--border)] transition-all',
              canLeft
                ? 'text-[var(--text)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]'
                : 'text-[var(--text-subtle)] opacity-40 cursor-not-allowed',
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canRight}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl',
              'border border-[var(--border)] transition-all',
              canRight
                ? 'text-[var(--text)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]'
                : 'text-[var(--text-subtle)] opacity-40 cursor-not-allowed',
            )}
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable row (mobile) / grid (desktop) */}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className={cn(
          'flex gap-4 overflow-x-auto scrollbar-hide pb-2',
          'sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          'sm:overflow-x-visible',
        )}
      >
        {products.map((product, i) => (
          <motion.a
            key={product.id}
            href={`/product/${product.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="shrink-0 w-64 sm:w-auto block"
            tabIndex={0}
            aria-label={`${product.name} — ${product.brand}`}
          >
            <ProductCard product={product} variant="default" />
          </motion.a>
        ))}
      </div>
    </section>
  );
}
