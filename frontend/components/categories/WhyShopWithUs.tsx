'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Truck, Lock, RotateCcw, Headphones,
} from 'lucide-react';
import { SectionHeader } from '@/components/home/FeaturedCategories';
import { WHY_SHOP_FEATURES } from '@/lib/data/categoriesPage';

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck size={26} />,
  Truck:       <Truck size={26} />,
  Lock:        <Lock size={26} />,
  RotateCcw:   <RotateCcw size={26} />,
  Headphones:  <Headphones size={26} />,
};

// ─── Feature Card ─────────────────────────────────────────────────────────────
function WhyShopCard({
  feat,
  index,
}: {
  feat: typeof WHY_SHOP_FEATURES[0];
  index: number;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0, 0, 0.2, 1] }}
      whileHover={{ y: -6 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group relative flex flex-col gap-4 p-6 rounded-2xl bg-[var(--background-card)] border border-[var(--border)] hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Hover gradient */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${feat.bgColor}90, ${feat.bgColor}30)` }}
      />

      {/* Stat pill (top-right) */}
      <div
        className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold"
        style={{ background: feat.bgColor, color: feat.color }}
      >
        {feat.stat}
      </div>

      {/* Icon */}
      <motion.div
        className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: feat.bgColor }}
        animate={hovered ? { rotate: [-3, 3, 0], scale: 1.08 } : { rotate: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <span style={{ color: feat.color }}>{ICONS[feat.icon] ?? <ShieldCheck size={26} />}</span>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-1.5">
        <h3 className="text-base font-bold text-[var(--text)]">{feat.title}</h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{feat.description}</p>
      </div>

      {/* Stat label */}
      <div className="relative z-10 text-xs text-[var(--text-subtle)]">{feat.statLabel}</div>

      {/* Bottom accent */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${feat.color}, transparent)` }}
        initial={{ width: 0 }}
        animate={{ width: hovered ? '100%' : 0 }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function WhyShopWithUs() {
  return (
    <section
      id="why-shop-with-us"
      className="py-16 bg-[var(--background-alt)]"
      aria-label="Why shop with us"
    >
      <div className="container-fluid">
        <SectionHeader
          eyebrow="Our Commitment"
          title="Why Shop With ElectroHub?"
          subtitle="Five promises we make — and keep — for every order, every customer, every time."
          centered
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-10">
          {WHY_SHOP_FEATURES.map((feat, i) => (
            <WhyShopCard key={feat.title} feat={feat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
