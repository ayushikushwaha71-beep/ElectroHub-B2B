'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { ProductCard } from '@/components/ui/ProductCard';
import {
  getRecentlyViewedProducts,
  trackRecentlyViewed,
} from '@/lib/data/productDetail';
import type { Product } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RecentlyViewedProps {
  currentProductId: string;
  currentProduct:   Product;
  className?:       string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function RecentlyViewed({
  currentProductId,
  currentProduct,
  className,
}: RecentlyViewedProps) {
  const [products, setProducts] = React.useState<Product[]>([]);

  // Track the current product as viewed and load list from localStorage
  React.useEffect(() => {
    // Track after a small delay so the current product is recorded
    const timer = setTimeout(() => {
      trackRecentlyViewed(currentProductId);
      const viewed = getRecentlyViewedProducts(currentProductId);
      setProducts(viewed);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentProductId, currentProduct]);

  if (products.length === 0) return null;

  return (
    <section className={cn('', className)} aria-label="Recently viewed products">
      <h2 className="text-xl font-bold font-display text-[var(--text)] mb-6">
        Recently Viewed
      </h2>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {products.map((product, i) => (
          <motion.a
            key={product.id}
            href={`/product/${product.id}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="shrink-0 w-44 block"
            aria-label={`${product.name} — ${product.brand}`}
          >
            <ProductCard product={product} variant="compact" />
          </motion.a>
        ))}
      </div>
    </section>
  );
}
