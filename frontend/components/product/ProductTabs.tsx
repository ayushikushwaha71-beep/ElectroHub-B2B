'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Cpu, MessageSquare, Truck, PenLine, Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { ReviewCard, RatingSummary } from '@/components/ui/ReviewCard';
import type { Product } from '@/types';
import type { Review, RatingSummary as RatingSummaryType } from '@/types';

// ─── Tab definition ────────────────────────────────────────────────────────────
type TabId = 'description' | 'specifications' | 'reviews' | 'shipping';

interface Tab {
  id:    TabId;
  label: string;
  icon:  React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'description',    label: 'Description',       icon: <FileText size={15} />    },
  { id: 'specifications', label: 'Specifications',    icon: <Cpu size={15} />         },
  { id: 'reviews',        label: 'Reviews',           icon: <MessageSquare size={15} />},
  { id: 'shipping',       label: 'Shipping & Returns',icon: <Truck size={15} />       },
];

// ─── Description Tab ──────────────────────────────────────────────────────────
function DescriptionTab({ product }: { product: Product }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="prose prose-sm max-w-none text-[var(--text-muted)] leading-relaxed">
        <p>{product.fullDescription}</p>
      </div>
      {product.features.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-[var(--text)] mb-3">Key Features</h3>
          <ul className="grid sm:grid-cols-2 gap-2.5">
            {product.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                <Star size={13} className="text-[var(--primary)] shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Specifications Tab ───────────────────────────────────────────────────────
function SpecificationsTab({ product }: { product: Product }) {
  if (product.specifications.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No specifications listed.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {product.specifications.map((group, gi) => (
        <div key={gi}>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            {group.groupName}
          </h3>
          <div className="rounded-xl overflow-hidden border border-[var(--border)]">
            {group.specs.map((spec, si) => (
              <div
                key={si}
                className={cn(
                  'grid grid-cols-2 gap-4 px-4 sm:px-6 py-3 text-sm',
                  si % 2 === 0 ? 'bg-[var(--background-alt)]' : 'bg-[var(--background-card)]',
                )}
              >
                <span className="text-[var(--text-muted)]">{spec.label}</span>
                <span className="font-medium text-[var(--text)]">
                  {spec.value}
                  {spec.unit && <span className="text-[var(--text-muted)] ml-1 font-normal">{spec.unit}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Physical specs */}
      {(product.weight || product.dimensions) && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Physical
          </h3>
          <div className="rounded-xl overflow-hidden border border-[var(--border)]">
            {product.weight && (
              <div className="grid grid-cols-2 gap-4 px-4 sm:px-6 py-3 text-sm bg-[var(--background-alt)]">
                <span className="text-[var(--text-muted)]">Weight</span>
                <span className="font-medium text-[var(--text)]">{product.weight} g</span>
              </div>
            )}
            {product.dimensions && (
              <div className="grid grid-cols-2 gap-4 px-4 sm:px-6 py-3 text-sm bg-[var(--background-card)]">
                <span className="text-[var(--text-muted)]">Dimensions</span>
                <span className="font-medium text-[var(--text)]">
                  {product.dimensions.l} × {product.dimensions.w} × {product.dimensions.h} mm
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reviews Tab ──────────────────────────────────────────────────────────────
function ReviewsTab({
  reviews,
  ratingSummary,
}: {
  reviews:       Review[];
  ratingSummary: RatingSummaryType;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const displayed = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="flex flex-col gap-6" id="reviews">
      {/* Summary */}
      <RatingSummary
        average={ratingSummary.average}
        total={ratingSummary.total}
        distribution={ratingSummary.distribution}
      />

      {/* Write a Review CTA */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-xl bg-[var(--background-alt)] border border-[var(--border)]">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Share your experience</p>
          <p className="text-xs text-[var(--text-muted)]">Help other shoppers make better decisions</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<PenLine size={14} />}
          aria-label="Write a review (UI only)"
        >
          Write a Review
        </Button>
      </div>

      {/* Review cards */}
      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {displayed.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ReviewCard review={review} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {reviews.length > 3 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="text-sm text-[var(--primary)] hover:underline underline-offset-2 font-medium text-center"
          aria-expanded={showAll}
        >
          {showAll ? 'Show less reviews' : `Show all ${reviews.length} reviews`}
        </button>
      )}
    </div>
  );
}

// ─── Shipping Tab ─────────────────────────────────────────────────────────────
function ShippingTab() {
  const sections = [
    {
      title: 'Standard Shipping',
      content: [
        'Free shipping on orders above ₹499',
        'Delivered within 3–5 business days',
        'Available across all major Indian cities and towns',
      ],
    },
    {
      title: 'Express Shipping',
      content: [
        'Express delivery available for ₹99 extra',
        'Delivered within 1–2 business days',
        'Available in select metro cities',
      ],
    },
    {
      title: 'Return Policy',
      content: [
        '7-day easy return policy from delivery date',
        'Item must be unused and in original packaging',
        'Refund processed within 5–7 business days after inspection',
        'Contact support to initiate a return',
      ],
    },
    {
      title: 'Warranty',
      content: [
        '1 Year Manufacturer Warranty against manufacturing defects',
        'Warranty does not cover physical damage or misuse',
        'Raise warranty claim via ElectroHub support portal',
      ],
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {sections.map((sec, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="p-4 rounded-xl bg-[var(--background-alt)] border border-[var(--border)]"
        >
          <h4 className="text-sm font-semibold text-[var(--text)] mb-2.5">{sec.title}</h4>
          <ul className="flex flex-col gap-1.5">
            {sec.content.map((line, j) => (
              <li key={j} className="text-sm text-[var(--text-muted)] flex items-start gap-2">
                <span className="text-[var(--primary)] shrink-0">·</span>
                {line}
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProductTabsProps {
  product:       Product;
  reviews:       Review[];
  ratingSummary: RatingSummaryType;
  className?:    string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProductTabs({
  product,
  reviews,
  ratingSummary,
  className,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>('description');

  return (
    <div className={cn('flex flex-col gap-0', className)}>
      {/* Tab bar */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-[var(--border)] mb-6" role="tablist" aria-label="Product information tabs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tab-panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap',
                'transition-colors shrink-0',
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              {tab.icon}
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              {tab.id === 'reviews' && (
                <span className="ml-0.5 text-xs text-[var(--text-subtle)]">
                  ({ratingSummary.total.toLocaleString('en-IN')})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          role="tabpanel"
          id={`tab-panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
        >
          {activeTab === 'description'    && <DescriptionTab    product={product} />}
          {activeTab === 'specifications' && <SpecificationsTab product={product} />}
          {activeTab === 'reviews'        && <ReviewsTab reviews={reviews} ratingSummary={ratingSummary} />}
          {activeTab === 'shipping'       && <ShippingTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
