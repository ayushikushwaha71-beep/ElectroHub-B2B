'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/ui/ProductCard';
import { SectionHeader } from './FeaturedCategories';
import { getMarketplaceProducts } from '@/lib/products-api';
import type { Product } from '@/types';

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' as const },
  },
};

interface ProductGridSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  cta?: string;
  ctaHref?: string;
  products: Product[];
  bgAlt?: boolean;
  variant?: 'default' | 'compact';
  columns?: 2 | 3 | 4 | 5;
  maxItems?: number;
}

export function ProductGridSection({
  id,
  eyebrow,
  title,
  subtitle,
  cta,
  ctaHref = '#',
  products,
  bgAlt = false,
  variant = 'default',
  columns = 4,
  maxItems = 8,
}: ProductGridSectionProps) {
  const displayed = products.slice(0, maxItems);

  const colClass =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : columns === 5
          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <section
      id={id}
      className={
        bgAlt
          ? 'py-16 bg-[var(--background-alt)]'
          : 'py-16 bg-[var(--background)]'
      }
      aria-label={title}
    >
      <div className="container-fluid">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          cta={cta}
          ctaHref={ctaHref}
        />

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className={`grid ${colClass} gap-5`}
        >
          {displayed.map((product) => (
            <motion.div key={product.id} variants={cardItem}>
              <ProductCard
                product={product}
                variant={variant}
                showCompare
                showQuickView
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function useMarketplaceProducts() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const data = await getMarketplaceProducts();

        if (!cancelled) {
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to load marketplace products:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading };
}

export function FeaturedProducts() {
  const { products, loading } = useMarketplaceProducts();

  if (loading) return null;

  return (
    <ProductGridSection
      id="featured-products"
      eyebrow="Handpicked"
      title="Featured Products"
      subtitle="Our engineers' top picks — quality components tested and trusted by the maker community."
      cta="View All Products"
      ctaHref="/products"
      products={products.filter((product) => product.isFeatured)}
      bgAlt={false}
      columns={4}
      maxItems={8}
    />
  );
}

export function BestSellers() {
  const { products, loading } = useMarketplaceProducts();

  if (loading) return null;

  return (
    <ProductGridSection
      id="best-sellers"
      eyebrow="Most Popular"
      title="Best Sellers"
      subtitle="The community's most loved products — consistently high-rated and in demand."
      cta="See All Bestsellers"
      ctaHref="/products?sort=bestseller"
      products={products}
      bgAlt
      columns={4}
      maxItems={8}
    />
  );
}

export function NewArrivals() {
  const { products, loading } = useMarketplaceProducts();

  if (loading) return null;

  const sortedProducts = [...products].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  return (
    <ProductGridSection
      id="new-arrivals"
      eyebrow="Just Landed"
      title="New Arrivals"
      subtitle="Fresh stock alert! The latest boards, modules, and kits added to our inventory."
      cta="See All New Products"
      ctaHref="/products?sort=newest"
      products={sortedProducts}
      bgAlt={false}
      columns={4}
      maxItems={8}
    />
  );
}

export function TrendingProducts() {
  const { products, loading } = useMarketplaceProducts();

  if (loading) return null;

  return (
    <ProductGridSection
      id="trending"
      eyebrow="Hot Right Now"
      title="Trending Products"
      subtitle="What makers across India are buying this week — from budget beginner boards to pro modules."
      cta="View All Trending"
      ctaHref="/products?sort=trending"
      products={products.filter((product) => product.isFeatured)}
      bgAlt
      columns={4}
      maxItems={8}
    />
  );
}