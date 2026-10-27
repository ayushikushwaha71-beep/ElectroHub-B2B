'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

interface ShopHeroProps {
  productCount: number;
  filteredCount: number;
}

export function ShopHero({ productCount, filteredCount }: ShopHeroProps) {
  return (
    <section
      className="relative overflow-hidden border-b border-[var(--border)]"
      style={{
        background:
          'linear-gradient(135deg, var(--background) 0%, var(--background-alt) 60%, color-mix(in srgb, var(--primary) 8%, var(--background-alt)) 100%)',
      }}
    >
      {/* Subtle decorative background orb */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-[0.07]"
        style={{
          background:
            'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 left-1/3 h-64 w-64 rounded-full opacity-[0.05]"
        style={{
          background:
            'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop', current: true },
          ]}
          showHome
          className="mb-5"
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
            className="flex flex-col gap-2"
          >
            {/* Icon + title */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background:
                    'linear-gradient(135deg, var(--primary), var(--accent))',
                }}
              >
                <ShoppingBag size={20} className="text-white" />
              </div>
              <h1 className="font-display text-3xl font-bold text-[var(--text)] sm:text-4xl">
                Shop All Products
              </h1>
            </div>

            {/* Description */}
            <p className="max-w-2xl text-sm text-[var(--text-muted)] sm:text-base">
              Discover{' '}
              <span className="font-semibold text-[var(--text)]">
                {productCount.toLocaleString('en-IN')}
              </span>{' '}
              premium electronics — Arduino, Raspberry Pi, ESP32, Sensors,
              Motors, Displays &amp; more. Shipped from India.
            </p>
          </motion.div>

          {/* Product count badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="shrink-0"
          >
            <div
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)]"
              style={{ background: 'var(--background-card)' }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: 'var(--primary)' }}
              />
              <span>
                <span className="font-bold text-[var(--text)]">
                  {filteredCount.toLocaleString('en-IN')}
                </span>{' '}
                {filteredCount === productCount ? 'products' : `of ${productCount.toLocaleString('en-IN')} products`}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
