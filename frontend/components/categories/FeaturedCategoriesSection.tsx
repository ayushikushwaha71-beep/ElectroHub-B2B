'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/home/FeaturedCategories';
import { FEATURED_CATEGORY_PROMOS, type FeaturedCategoryPromo } from '@/lib/data/categoriesPage';

// ─── Large Featured Promo Card ────────────────────────────────────────────────
function FeaturedPromoCard({
  promo,
  index,
  reverse = false,
}: {
  promo: FeaturedCategoryPromo;
  index: number;
  reverse?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay: index * 0.1, ease: [0, 0, 0.2, 1] }}
    >
      <div
        className={`group relative flex flex-col lg:flex-row ${reverse ? 'lg:flex-row-reverse' : ''} overflow-hidden rounded-3xl min-h-[280px] lg:min-h-[320px]`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ background: promo.gradient }}
      >
        {/* Patterns */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />

        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none" />

        {/* Content side */}
        <div className="relative z-10 flex flex-col justify-center gap-5 p-8 lg:p-12 lg:w-1/2">
          <div className="flex flex-col gap-3">
            <motion.span
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-full text-xs font-bold text-white bg-white/20 backdrop-blur-sm"
            >
              <Tag size={11} />
              {promo.badgeText}
            </motion.span>

            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {promo.name}
            </h3>
            <p className="text-sm font-semibold text-white/80 italic">
              &ldquo;{promo.tagline}&rdquo;
            </p>
            <p className="text-sm text-white/75 leading-relaxed max-w-sm">
              {promo.description}
            </p>
          </div>

          {/* Top products list */}
          <div className="flex flex-wrap gap-2">
            {promo.topProducts.map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-sm text-xs text-white font-medium border border-white/10"
              >
                {p}
              </span>
            ))}
          </div>

          <Link
            href={promo.href}
            className="inline-flex items-center gap-2 w-fit px-6 py-3 rounded-xl bg-white font-bold text-sm transition-all duration-200 hover:shadow-xl hover:scale-105 group/btn"
            style={{ color: promo.accentColor }}
            aria-label={`${promo.ctaText} — ${promo.productCount} products`}
          >
            {promo.ctaText}
            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Visual side */}
        <div className="relative lg:w-1/2 flex items-center justify-center p-8 min-h-[160px]">
          {/* Big decorative emoji/number */}
          <motion.div
            animate={hovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.4 }}
            className="text-9xl sm:text-[10rem] select-none opacity-40"
            aria-hidden="true"
          >
            {promo.imageText}
          </motion.div>

          {/* Product count circle */}
          <div className="absolute bottom-6 right-6 flex flex-col items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border border-white/20">
            <span className="text-2xl font-black text-white">{promo.productCount}</span>
            <span className="text-[9px] text-white/70 font-medium uppercase tracking-wide">products</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function FeaturedCategoriesSection() {
  return (
    <section
      id="featured-categories-promos"
      className="py-16 bg-[var(--background-alt)]"
      aria-label="Featured categories"
    >
      <div className="container-fluid">
        <SectionHeader
          eyebrow="Editor's Picks"
          title="Featured Categories"
          subtitle="Hand-curated collections highlighting our best product lines and latest arrivals."
        />

        <div className="flex flex-col gap-6">
          {FEATURED_CATEGORY_PROMOS.map((promo, i) => (
            <FeaturedPromoCard
              key={promo.id}
              promo={promo}
              index={i}
              reverse={i % 2 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
