'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  Cpu,
  Wifi,
  Activity,
  RotateCw,
  Monitor,
  Bot,
  Package,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

// ─── Animated floating particles ──────────────────────────────────────────────
function FloatingParticle({
  x,
  y,
  delay,
  size,
  color,
}: {
  x: number;
  y: number;
  delay: number;
  size: number;
  color: string;
}) {
  return (
    <motion.div
      className="absolute rounded-full opacity-20 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: color }}
      animate={{
        y: [0, -30, 0],
        x: [0, 10, 0],
        opacity: [0.1, 0.3, 0.1],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 4 + delay,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
const STATS = [
  { value: '50K+', label: 'Happy Makers' },
  { value: '155K+', label: 'Products Shipped' },
  { value: '2,500+', label: 'Products Listed' },
  { value: '4.9★', label: 'Avg. Rating' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function HeroSection() {
  const particles = [
    { x: 10, y: 20, delay: 0,   size: 6,  color: '#3b82f6' },
    { x: 85, y: 15, delay: 1,   size: 8,  color: '#7c3aed' },
    { x: 75, y: 70, delay: 2,   size: 5,  color: '#00979d' },
    { x: 20, y: 75, delay: 0.5, size: 7,  color: '#f59e0b' },
    { x: 50, y: 10, delay: 1.5, size: 4,  color: '#c51a4a' },
    { x: 60, y: 85, delay: 3,   size: 9,  color: '#16a34a' },
    { x: 90, y: 50, delay: 2.5, size: 5,  color: '#e7373b' },
    { x: 5,  y: 50, delay: 0.8, size: 6,  color: '#0ea5e9' },
  ];

  // Container animation
  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' as const } },
  };

  return (
    <section
      className="relative overflow-hidden min-h-[600px] flex items-center"
      aria-label="Hero section"
      id="hero"
    >
      {/* ── Background gradient ───────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--background)] via-blue-50/50 to-violet-50/30 dark:from-[var(--background)] dark:via-blue-950/20 dark:to-violet-950/10" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Blurred blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/10 to-violet-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 blur-3xl pointer-events-none" />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="relative w-full container-fluid py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6"
          >
            {/* Badge pill */}
            <motion.div variants={fadeUp}>
              <Badge
                variant="primary"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              >
                <Zap size={13} className="text-yellow-300 fill-yellow-300" />
                India&apos;s Premium Electronics Store
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-black font-display leading-[1.05] tracking-tight"
            >
              <span className="text-[var(--text)]">Build the</span>
              <br />
              <span
                className="bg-gradient-to-r from-blue-600 via-violet-600 to-blue-500 dark:from-blue-400 dark:via-violet-400 dark:to-blue-300 bg-clip-text text-transparent"
              >
                Future
              </span>
              <br />
              <span className="text-[var(--text)]">of Electronics</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p variants={fadeUp} className="text-lg text-[var(--text-muted)] leading-relaxed max-w-xl">
              From Arduino and Raspberry Pi to ESP32, sensors, and robotics — everything
              a maker needs, delivered fast across India.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <Button
                variant="gradient"
                size="lg"
                rightIcon={<ArrowRight size={18} />}
                pill
                className="shadow-xl shadow-blue-500/25"
              >
                Shop Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                rightIcon={<ChevronRight size={18} />}
                pill
              >
                Browse Categories
              </Button>
            </motion.div>

            {/* Feature chips */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 pt-2">
              {['Free shipping ₹499+', 'Genuine parts', '15-day returns', 'Expert support'].map((feat) => (
                <span
                  key={feat}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                  {feat}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Visual illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0, 0, 0.2, 1] }}
            className="relative hidden lg:flex items-center justify-center"
          >
            {/* Central glow */}
            <div className="absolute w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 blur-2xl" />

            {/* Central icon cluster */}
            <div className="relative w-80 h-80">
              {/* Center */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-dashed border-blue-200/40 dark:border-blue-700/30"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-8 rounded-full border border-dashed border-violet-200/40 dark:border-violet-700/30"
              />

              {/* Center chip */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-2xl shadow-blue-500/40"
                >
                  <Cpu size={44} className="text-white" />
                </motion.div>
              </div>

              {/* Orbiting icons */}
              {[
                { Icon: Wifi,     color: '#e7373b', bg: '#fee2e2', angle: 0   },
                { Icon: Activity, color: '#16a34a', bg: '#dcfce7', angle: 60  },
                { Icon: RotateCw, color: '#7c3aed', bg: '#ede9fe', angle: 120 },
                { Icon: Monitor,  color: '#0ea5e9', bg: '#e0f2fe', angle: 180 },
                { Icon: Bot,      color: '#f97316', bg: '#ffedd5', angle: 240 },
                { Icon: Package,  color: '#ca8a04', bg: '#fef3c7', angle: 300 },
              ].map(({ Icon, color, bg, angle }, i) => {
                const rad = (angle * Math.PI) / 180;
                const r = 118;
                const x = 50 + (r / 160) * 100 * Math.cos(rad);
                const y = 50 + (r / 160) * 100 * Math.sin(rad);
                return (
                  <motion.div
                    key={i}
                    className="absolute flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg"
                    style={{
                      left:  `calc(${x}% - 24px)`,
                      top:   `calc(${y}% - 24px)`,
                      backgroundColor: bg,
                    }}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
                  >
                    <Icon size={22} style={{ color }} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Stats bar ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border)] rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm"
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 py-5 px-4 bg-[var(--background-card)] text-center"
            >
              <span className="text-2xl font-black font-display text-[var(--primary)]">{stat.value}</span>
              <span className="text-xs text-[var(--text-muted)]">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
