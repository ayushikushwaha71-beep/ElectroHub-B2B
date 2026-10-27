'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { TESTIMONIALS, type Testimonial } from '@/lib/data/categories';
import { SectionHeader } from './FeaturedCategories';
import { cn } from '@/utils/cn';

// ─── Star row ─────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-[var(--border)] text-[var(--border)]'}
        />
      ))}
    </div>
  );
}

// ─── Single testimonial card ──────────────────────────────────────────────────
function TestimonialCard({
  testimonial,
  isActive,
}: {
  testimonial: Testimonial;
  isActive: boolean;
}) {
  const colorMap: Record<string, string> = {
    t1: '#2563eb',
    t2: '#c51a4a',
    t3: '#16a34a',
    t4: '#7c3aed',
    t5: '#ca8a04',
    t6: '#e7373b',
  };
  const color = colorMap[testimonial.id] ?? '#2563eb';

  return (
    <div
      className={cn(
        'flex flex-col gap-5 p-7 rounded-2xl border transition-all duration-300',
        isActive
          ? 'bg-[var(--background-card)] border-[var(--primary)]/30 shadow-xl'
          : 'bg-[var(--background-card)] border-[var(--border)] opacity-60 scale-95'
      )}
    >
      {/* Quote icon */}
      <Quote size={28} className="text-[var(--primary)]/30" aria-hidden="true" />

      {/* Review text */}
      <p className="text-sm text-[var(--text-muted)] leading-relaxed flex-1">
        &ldquo;{testimonial.text}&rdquo;
      </p>

      {/* Product chip */}
      <div className="text-xs font-mono text-[var(--text-subtle)] bg-[var(--background-alt)] rounded-lg px-3 py-1.5 w-fit">
        re: {testimonial.product}
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border)]" />

      {/* Author */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
          aria-hidden="true"
        >
          {testimonial.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text)] truncate">{testimonial.name}</p>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
        <Stars rating={testimonial.rating} />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Testimonials() {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [direction, setDirection]  = React.useState(1);

  // Auto-advance
  React.useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setActiveIdx((i) => (i + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => {
    setDirection(-1);
    setActiveIdx((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };
  const next = () => {
    setDirection(1);
    setActiveIdx((i) => (i + 1) % TESTIMONIALS.length);
  };

  // Show 3 cards: prev, active, next
  const indices = [
    (activeIdx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length,
    activeIdx,
    (activeIdx + 1) % TESTIMONIALS.length,
  ];

  return (
    <section
      id="testimonials"
      className="py-16 bg-[var(--background-alt)]"
      aria-label="Customer testimonials"
    >
      <div className="container-fluid">
        <SectionHeader
          eyebrow="Customer Reviews"
          title="What Our Community Says"
          subtitle="Trusted by 50,000+ engineers, students, and makers across India."
          centered
        />

        {/* Overall rating summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-4 mb-10 flex-wrap"
        >
          <div className="flex items-center gap-2">
            <span className="text-4xl font-black font-display text-[var(--text)]">4.9</span>
            <div className="flex flex-col gap-0.5">
              <Stars rating={5} />
              <span className="text-xs text-[var(--text-muted)]">Based on 14,280 reviews</span>
            </div>
          </div>
          <div className="w-px h-12 bg-[var(--border)] hidden sm:block" />
          {[
            { label: 'Product Quality',   pct: 98 },
            { label: 'Delivery Speed',    pct: 96 },
            { label: 'Customer Support',  pct: 94 },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 min-w-[140px]">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{stat.label}</span>
                <span className="font-semibold text-[var(--text)]">{stat.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--background)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${stat.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Testimonial carousel */}
        <div className="relative">
          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {indices.map((idx, pos) => (
              <motion.div
                key={`${idx}-${pos}`}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
                className={cn(
                  'transition-all duration-300',
                  pos === 1 ? '' : 'hidden md:block'
                )}
              >
                <TestimonialCard
                  testimonial={TESTIMONIALS[idx]}
                  isActive={pos === 1}
                />
              </motion.div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background-card)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Dot indicators */}
            <div className="flex gap-1.5">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > activeIdx ? 1 : -1); setActiveIdx(i); }}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i === activeIdx
                      ? 'w-6 h-2 bg-[var(--primary)]'
                      : 'w-2 h-2 bg-[var(--border-strong)] hover:bg-[var(--text-muted)]'
                  )}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background-card)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all"
              aria-label="Next testimonial"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
