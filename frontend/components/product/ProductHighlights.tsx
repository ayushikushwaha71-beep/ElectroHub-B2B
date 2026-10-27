'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, Box, Cpu, Puzzle, Package } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Product } from '@/types';

// ─── Accordion Item ────────────────────────────────────────────────────────────
function AccordionItem({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title:        string;
  icon:         React.ReactNode;
  children:     React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const id = React.useId();

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between px-5 py-4',
          'text-left transition-colors',
          open ? 'bg-[var(--surface)]' : 'bg-[var(--background-card)] hover:bg-[var(--surface-hover)]',
        )}
        aria-expanded={open}
        aria-controls={id}
      >
        <div className="flex items-center gap-3">
          <span className="text-[var(--primary)]">{icon}</span>
          <span className="font-semibold text-[var(--text)]">{title}</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}>
          <ChevronDown size={18} className="text-[var(--text-muted)]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 bg-[var(--background-card)] border-t border-[var(--border)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProductHighlightsProps {
  product:    Product;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProductHighlights({ product, className }: ProductHighlightsProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Key Features */}
      {product.features.length > 0 && (
        <AccordionItem
          title="Key Features"
          icon={<CheckCircle2 size={18} />}
          defaultOpen
        >
          <ul className="flex flex-col gap-2.5">
            {product.features.map((feat, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2.5 text-sm text-[var(--text-muted)]"
              >
                <CheckCircle2 size={15} className="text-[var(--success)] shrink-0 mt-0.5" />
                {feat}
              </motion.li>
            ))}
          </ul>
        </AccordionItem>
      )}

      {/* Specifications */}
      {product.specifications.length > 0 && (
        <AccordionItem
          title="Specifications"
          icon={<Cpu size={18} />}
          defaultOpen
        >
          <div className="flex flex-col gap-4">
            {product.specifications.map((group, gi) => (
              <div key={gi}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  {group.groupName}
                </h4>
                <div className="rounded-xl overflow-hidden border border-[var(--border)]">
                  {group.specs.map((spec, si) => (
                    <div
                      key={si}
                      className={cn(
                        'grid grid-cols-2 gap-4 px-4 py-2.5 text-sm',
                        si % 2 === 0
                          ? 'bg-[var(--background-alt)]'
                          : 'bg-[var(--background-card)]',
                      )}
                    >
                      <span className="text-[var(--text-muted)] font-medium">{spec.label}</span>
                      <span className="text-[var(--text)] font-semibold">
                        {spec.value}
                        {spec.unit && <span className="text-[var(--text-muted)] font-normal ml-1">{spec.unit}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AccordionItem>
      )}

      {/* Compatibility / Applications */}
      {product.applications.length > 0 && (
        <AccordionItem
          title="Compatible With / Applications"
          icon={<Puzzle size={18} />}
        >
          <div className="flex flex-wrap gap-2">
            {product.applications.map((app, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--background-alt)] text-sm text-[var(--text-muted)]"
              >
                {app}
              </span>
            ))}
          </div>
        </AccordionItem>
      )}

      {/* What's in the Box */}
      {product.packageIncludes.length > 0 && (
        <AccordionItem
          title="What's in the Box"
          icon={<Box size={18} />}
        >
          <ul className="flex flex-col gap-2">
            {product.packageIncludes.map((item, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--text-muted)]">
                <Package size={13} className="text-[var(--primary)] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </AccordionItem>
      )}
    </div>
  );
}
