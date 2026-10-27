'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SectionHeader } from '@/components/home/FeaturedCategories';
import { ALL_BRANDS } from '@/lib/data/categoriesPage';
import type { Brand } from '@/types';

// ─── Stagger ─────────────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemAnim = {
  hidden: { opacity: 0, scale: 0.88 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

// ─── Brand Logo Card ──────────────────────────────────────────────────────────
function BrandLogoCard({ brand }: { brand: Brand }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.div variants={itemAnim}>
      <Link
        href={`/brands/${brand.slug}`}
        className="group relative flex flex-col items-center gap-3 p-5 rounded-2xl bg-[var(--background-card)] border border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-lg transition-all duration-250 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`Shop ${brand.name} — ${brand.productCount} products`}
      >
        {/* Logo */}
        <motion.div
          className="w-full h-14 flex items-center justify-center"
          animate={hovered ? { scale: 1.08 } : { scale: 1 }}
          transition={{ duration: 0.25 }}
        >
          <img
            src={brand.logoUrl}
            alt={`${brand.name} logo`}
            className="h-10 max-w-[130px] w-auto object-contain transition-all duration-300 grayscale-[30%] group-hover:grayscale-0"
            loading="lazy"
          />
        </motion.div>

        {/* Info */}
        <div className="text-center">
          <p className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
            {brand.name}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {brand.productCount} products
          </p>
          {brand.country && (
            <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">{brand.country}</p>
          )}
        </div>

        {/* Hover external link */}
        {hovered && brand.website && (
          <motion.a
            href={brand.website}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--background-alt)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
            aria-label={`Visit ${brand.name} website`}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={12} />
          </motion.a>
        )}
      </Link>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ShopByBrandSection() {
  return (
    <section
      id="shop-by-brand"
      className="py-16 bg-[var(--background-alt)]"
      aria-label="Shop by brand"
    >
      <div className="container-fluid">
        <SectionHeader
          eyebrow="Trusted Manufacturers"
          title="Shop by Brand"
          subtitle="Authorized distributor for all major electronics brands — 100% genuine products with manufacturer warranty."
          cta="View All Brands"
          ctaHref="/brands"
        />

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4"
        >
          {ALL_BRANDS.map((brand) => (
            <BrandLogoCard key={brand.id} brand={brand} />
          ))}
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-subtle)]"
        >
          {[
            '✓ Official Authorized Distributor',
            '✓ Manufacturer Warranty on all products',
            '✓ ISO 9001:2015 Certified',
            '✓ Pan-India delivery',
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
