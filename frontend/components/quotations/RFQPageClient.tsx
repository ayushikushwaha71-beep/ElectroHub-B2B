'use client';

/**
 * ElectroHub — Standalone RFQ Page Client
 * Renders a hero section and auto-opens the RFQ form for customers
 * who arrive via /rfq without a specific product context.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  ShieldCheck,
  Users,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button }       from '@/components/ui/Button';
import { Breadcrumb }   from '@/components/ui/Breadcrumb';
import { Badge }        from '@/components/ui/Badge';
import { RFQFormModal } from '@/components/quotations/RFQFormModal';

// ─── Stat card data ───────────────────────────────────────────────────────────
const STATS = [
  {
    icon:  Clock,
    value: '1–2 Days',
    label: 'Average response time',
    color: 'text-blue-500',
    bg:    'bg-blue-500/10',
  },
  {
    icon:  ShieldCheck,
    value: '100%',
    label: 'Verified suppliers',
    color: 'text-emerald-500',
    bg:    'bg-emerald-500/10',
  },
  {
    icon:  Users,
    value: '2,400+',
    label: 'B2B customers served',
    color: 'text-violet-500',
    bg:    'bg-violet-500/10',
  },
  {
    icon:  Zap,
    value: 'Free',
    label: 'No cost to request',
    color: 'text-amber-500',
    bg:    'bg-amber-500/10',
  },
];

const STEPS = [
  {
    num:   '01',
    title: 'Submit your RFQ',
    desc:  'Describe your product, quantity, and technical requirements.',
  },
  {
    num:   '02',
    title: 'We review & source',
    desc:  'Our team checks stock, contacts suppliers, and prepares your quote.',
  },
  {
    num:   '03',
    title: 'Receive your quote',
    desc:  'Get a tailored quotation via email within 1–2 business days.',
  },
  {
    num:   '04',
    title: 'Place your order',
    desc:  'Approve the quote and confirm your order seamlessly.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function RFQPageClient() {
  const [modalOpen, setModalOpen] = React.useState(false);

  const breadcrumbs = [
    { label: 'Home',           href: '/' },
    { label: 'Request a Quote', current: true },
  ];

  const fadeUp = {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <div className="container-fluid py-6">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Breadcrumb items={breadcrumbs} showHome />
        </motion.div>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          className={cn(
            'relative overflow-hidden rounded-3xl mb-12',
            'bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700',
            'p-8 md:p-12',
          )}
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4 pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            <Badge variant="info" size="sm" className="mb-4 bg-white/15 text-white border-white/20">
              B2B & Bulk Procurement
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-white mb-4 leading-tight">
              Request a Quote for
              <br />
              Any Electronics Part
            </h1>
            <p className="text-blue-100 text-base md:text-lg mb-8 leading-relaxed">
              Whether it&apos;s a single component or a bulk order, tell us what you need and we&apos;ll get back to you with the best price.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                id="rfq-page-primary-btn"
                variant="primary"
                size="lg"
                className="bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-lg"
                leftIcon={<FileText size={18} />}
                rightIcon={<ChevronRight size={16} />}
                onClick={() => setModalOpen(true)}
              >
                Start Your Request
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/40 text-white hover:bg-white/10"
                onClick={() => setModalOpen(true)}
              >
                Custom Product
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14"
        >
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={cn(
                  'flex flex-col items-center gap-3 p-5 rounded-2xl text-center',
                  'border border-[var(--border)] bg-[var(--background-card)]',
                  'shadow-[var(--shadow-card)]',
                )}
              >
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', stat.bg)}>
                  <Icon size={20} className={stat.color} />
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--text)]">{stat.value}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="mb-14"
          aria-label="How the RFQ process works"
        >
          <h2 className="text-xl font-bold font-display text-[var(--text)] mb-2">How It Works</h2>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            Simple 4-step process from request to confirmed order.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={cn(
                  'relative flex flex-col gap-3 p-5 rounded-2xl',
                  'border border-[var(--border)] bg-[var(--background-card)]',
                )}
              >
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%+1px)] w-[calc(100%_+_1rem)] h-px bg-[var(--border)] z-0" />
                )}
                <span className={cn(
                  'text-2xl font-black font-mono',
                  'bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent',
                )}>
                  {step.num}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)] mb-1">{step.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── CTA strip ─────────────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
          className={cn(
            'flex flex-col sm:flex-row items-center justify-between gap-4',
            'px-6 py-5 rounded-2xl',
            'bg-[var(--background-alt)] border border-[var(--border)]',
            'mb-8',
          )}
        >
          <div>
            <p className="font-semibold text-[var(--text)]">Ready to submit your request?</p>
            <p className="text-sm text-[var(--text-muted)]">It takes less than 3 minutes to fill out the form.</p>
          </div>
          <Button
            id="rfq-page-cta-btn"
            variant="gradient"
            size="lg"
            leftIcon={<FileText size={16} />}
            onClick={() => setModalOpen(true)}
            className="shrink-0"
          >
            Request a Quote
          </Button>
        </motion.div>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      <RFQFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
