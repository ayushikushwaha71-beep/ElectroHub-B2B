'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Truck,
  Headphones,
  RotateCcw,
  Tag,
  Award,
} from 'lucide-react';
import { WHY_CHOOSE_FEATURES } from '@/lib/data/categories';
import { SectionHeader } from './FeaturedCategories';

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck size={26} />,
  Truck:       <Truck size={26} />,
  Headphones:  <Headphones size={26} />,
  RotateCcw:   <RotateCcw size={26} />,
  Tag:         <Tag size={26} />,
  Award:       <Award size={26} />,
};

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  description,
  color,
  bgColor,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  delay: number;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay, ease: [0, 0, 0.2, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col gap-4 p-6 rounded-2xl bg-[var(--background-card)] border border-[var(--border)] hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden cursor-default"
    >
      {/* Hover gradient overlay */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${bgColor}80, ${bgColor}20)` }}
      />

      {/* Icon */}
      <motion.div
        animate={hovered ? { scale: 1.1, rotate: [-3, 3, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <span style={{ color }}>{ICONS[icon]}</span>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-1.5">
        <h3 className="text-base font-bold text-[var(--text)]">{title}</h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{description}</p>
      </div>

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 rounded-b-2xl"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
        initial={{ width: 0 }}
        animate={{ width: hovered ? '100%' : 0 }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function WhyChooseUs() {
  return (
    <section
      id="why-choose-us"
      className="py-16 bg-[var(--background)]"
      aria-label="Why choose ElectroHub"
    >
      <div className="container-fluid">
        <SectionHeader
          eyebrow="Our Promise"
          title="Why Choose ElectroHub?"
          subtitle="Built by makers, for makers. We understand what engineers and hobbyists need."
          centered
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {WHY_CHOOSE_FEATURES.map((feature, i) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={i * 0.07}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
