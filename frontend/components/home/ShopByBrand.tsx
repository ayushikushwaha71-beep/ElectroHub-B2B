'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { BrandCard } from '@/components/ui/BrandCard';
import { SectionHeader } from './FeaturedCategories';
import { BRANDS } from '@/lib/data/categories';

// ─── Stagger ─────────────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function ShopByBrand() {
  return (
    <section
      id="brands"
      className="py-16 bg-[var(--background)]"
      aria-label="Shop by brand"
    >
      <div className="container-fluid">
        <SectionHeader
          eyebrow="Trusted Manufacturers"
          title="Shop by Brand"
          subtitle="Authorized reseller for all major electronics brands. 100% genuine products, guaranteed."
          cta="All Brands"
          ctaHref="/brands"
        />

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
        >
          {BRANDS.map((brand) => (
            <motion.div key={brand.id} variants={item}>
              <BrandCard
                brand={brand}
                variant="default"
                showCount
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Partner trust strip */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-xs text-[var(--text-subtle)]"
        >
          Official authorized distributor · ISO 9001:2015 certified · All products carry manufacturer warranty
        </motion.p>
      </div>
    </section>
  );
}
