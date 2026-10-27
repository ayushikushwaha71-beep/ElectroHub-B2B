'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Tag, ShoppingCart, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// ─── Promo Card ───────────────────────────────────────────────────────────────
interface PromoCardProps {
  tag: string;
  tagVariant?: 'sale' | 'new' | 'bestseller' | 'primary';
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  gradient: string;
  accentColor: string;
  icon: React.ReactNode;
  imageText: string;
  delay?: number;
}

function PromoCard({
  tag,
  tagVariant = 'sale',
  title,
  subtitle,
  ctaText,
  ctaHref,
  gradient,
  accentColor,
  icon,
  imageText,
  delay = 0,
}: PromoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0, 0, 0.2, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative overflow-hidden rounded-3xl min-h-[280px] flex flex-col justify-between p-8 cursor-pointer group"
      style={{ background: gradient }}
      aria-label={`Promotion: ${title}`}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 80% 20%, white 1px, transparent 1px),
                            radial-gradient(circle at 20% 80%, white 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Decorative circle */}
      <div
        className="absolute -right-16 -top-16 w-56 h-56 rounded-full opacity-20"
        style={{ background: 'white' }}
      />
      <div
        className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10"
        style={{ background: 'white' }}
      />

      {/* Icon illustration */}
      <div className="absolute right-8 bottom-8 opacity-20 group-hover:opacity-30 transition-opacity">
        <div className="text-white text-8xl font-black select-none">{imageText}</div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-4">
        <Badge variant={tagVariant} className="w-fit">
          {tag}
        </Badge>
        <div>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">{title}</h3>
          <p className="text-sm text-white/80 mt-2 leading-relaxed max-w-xs">{subtitle}</p>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
          {icon}
        </div>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-sm font-bold transition-all duration-200 hover:shadow-lg hover:scale-105"
          style={{ color: accentColor }}
        >
          {ctaText}
          <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PromotionalBanner() {
  return (
    <section
      id="promotions"
      className="py-16 bg-[var(--background-alt)]"
      aria-label="Promotional offers"
    >
      <div className="container-fluid">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Flash Sale */}
          <PromoCard
            tag="⚡ Flash Sale"
            tagVariant="sale"
            title="Upto 40% Off on Arduino Kits"
            subtitle="Limited time offer on official Arduino boards and starter kits. Grab yours before stock runs out!"
            ctaText="Shop Arduino"
            ctaHref="/categories/arduino"
            gradient="linear-gradient(135deg, #00979d 0%, #006b70 100%)"
            accentColor="#00979d"
            icon={<Zap size={22} />}
            imageText="⚡"
            delay={0}
          />

          {/* Card 2: New Arrivals */}
          <PromoCard
            tag="🆕 Just Arrived"
            tagVariant="new"
            title="Raspberry Pi 5 — Now In Stock"
            subtitle="The most powerful Raspberry Pi ever. PCIe 2.0, 2.4GHz Cortex-A76, and dual 4K display. Order yours today!"
            ctaText="Shop Raspberry Pi"
            ctaHref="/categories/raspberry-pi"
            gradient="linear-gradient(135deg, #c51a4a 0%, #8b1236 100%)"
            accentColor="#c51a4a"
            icon={<Package size={22} />}
            imageText="🍓"
            delay={0.1}
          />

          {/* Card 3: Bulk/Bundle */}
          <PromoCard
            tag="📦 Bundle Deal"
            tagVariant="bestseller"
            title="Sensor Starter Bundle — Save ₹500"
            subtitle="25 essential sensors bundled together — DHT22, MPU6050, ultrasonic, IR, gas, and more. Best value for projects!"
            ctaText="Get the Bundle"
            ctaHref="/products?tag=bundle"
            gradient="linear-gradient(135deg, #16a34a 0%, #0d7a31 100%)"
            accentColor="#16a34a"
            icon={<Tag size={22} />}
            imageText="🔬"
            delay={0.2}
          />
        </div>
      </div>
    </section>
  );
}
