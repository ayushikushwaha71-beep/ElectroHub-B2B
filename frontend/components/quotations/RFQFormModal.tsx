'use client';

/**
 * ElectroHub — RFQ Form Modal
 * Multi-step form for creating a Request For Quotation.
 * Uses only existing ElectroHub UI components and design tokens.
 * Steps: 1=Product, 2=Requirements, 3=Review, 4=Success
 */

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Package,
  Wrench,
  ChevronRight,
  ChevronLeft,
  Search,
  Link2,
  Calendar,
  MapPin,
  DollarSign,
  Paperclip,
  CheckCircle2,
  ClipboardList,
  ArrowRight,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Modal }    from '@/components/ui/Modal';
import { Button }   from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge }    from '@/components/ui/Badge';
import { EMPTY_RFQ_FORM } from '@/lib/rfq';
import { searchProductsForRFQ, submitRFQToAPI } from '@/lib/rfq-api';
import { useAuth } from '@/lib/providers/AuthProvider';
import type { RFQFormData, RFQSubmission, RFQProductOption } from '@/types';

// ─── Step constants ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Product',      icon: Package      },
  { id: 2, label: 'Requirements', icon: Wrench       },
  { id: 3, label: 'Review',       icon: ClipboardList },
  { id: 4, label: 'Done',         icon: CheckCircle2 },
] as const;

// ─── Slide animation ──────────────────────────────────────────────────────────
const slideVariants = {
  enter:  (dir: number) => ({ x: dir * 32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir * -32, opacity: 0 }),
};

// ─── StepIndicator ────────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-6 px-1">
      {STEPS.map((step, i) => {
        const done    = current > step.id;
        const active  = current === step.id;
        const Icon    = step.icon;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                  done   && 'bg-[var(--success)] text-white shadow-sm',
                  active && 'bg-[var(--primary)] text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]',
                  !done && !active && 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-subtle)]',
                )}
              >
                {done ? <CheckCircle2 size={14} /> : <Icon size={13} />}
              </div>
              <span className={cn(
                'text-[10px] font-medium hidden sm:block',
                active ? 'text-[var(--primary)]' : done ? 'text-[var(--success)]' : 'text-[var(--text-subtle)]',
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'h-px flex-1 max-w-[40px] transition-colors duration-300 mb-4',
                current > step.id ? 'bg-[var(--success)]' : 'bg-[var(--border)]',
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── ProductToggle ────────────────────────────────────────────────────────────
function ProductTypeToggle({
  value,
  onChange,
}: {
  value: 'existing' | 'custom';
  onChange: (v: 'existing' | 'custom') => void;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-1 p-1 rounded-xl',
        'bg-[var(--background-alt)] border border-[var(--border)]',
      )}
      role="tablist"
      aria-label="Product type"
    >
      {(['existing', 'custom'] as const).map((type) => (
        <button
          key={type}
          type="button"
          role="tab"
          aria-selected={value === type}
          onClick={() => onChange(type)}
          className={cn(
            'flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium',
            'transition-all duration-200',
            value === type
              ? 'bg-[var(--primary)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
          )}
        >
          {type === 'existing' ? <Package size={14} /> : <Sparkles size={14} />}
          {type === 'existing' ? 'Existing Product' : 'Custom / External'}
        </button>
      ))}
    </div>
  );
}

// ─── ProductSearchDropdown ────────────────────────────────────────────────────
function ProductSearchDropdown({
  value,
  onSelect,
  error,
}: {
  value: RFQProductOption | null;
  onSelect: (p: RFQProductOption) => void;
  error?: string;
}) {
  const [query,    setQuery]    = React.useState('');
  const [open,     setOpen]     = React.useState(false);
  const [products, setProducts] = React.useState<RFQProductOption[]>([]);
  const [loading,  setLoading]  = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load initial products on mount
  React.useEffect(() => {
    searchProductsForRFQ('').then(setProducts).catch(() => setProducts([]));
  }, []);

  // Debounced search as user types
  const handleQueryChange = (q: string) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      searchProductsForRFQ(q).then((res) => {
        setProducts(res);
        setLoading(false);
      }).catch(() => setLoading(false));
    }, 350);
  };

  const filtered = query.trim()
    ? products
    : products.slice(0, 8);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[var(--text)]">
        Select Product <span className="text-[var(--danger)]">*</span>
      </label>
      <div className="relative">
        <div
          className={cn(
            'flex items-center h-10 px-4 rounded-lg border cursor-pointer gap-2',
            'bg-[var(--surface)] transition-all duration-200',
            open
              ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
              : error
              ? 'border-[var(--danger)]'
              : 'border-[var(--border)] hover:border-[var(--border-strong)]',
          )}
          onClick={() => setOpen((o) => !o)}
        >
          <Search size={15} className="text-[var(--text-subtle)] shrink-0" />
          <span className={cn('flex-1 text-sm truncate', value ? 'text-[var(--text)]' : 'text-[var(--text-subtle)]')}>
            {value ? value.name : 'Search product name, SKU, brand…'}
          </span>
          {value && (
            <button
              type="button"
              aria-label="Clear selection"
              onClick={(e) => { e.stopPropagation(); setQuery(''); }}
              className="text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute top-[calc(100%+4px)] left-0 right-0 z-50',
                'bg-[var(--background-card)] border border-[var(--border)] rounded-xl',
                'shadow-[var(--shadow-dropdown)] overflow-hidden',
              )}
            >
              {/* Search inside dropdown */}
              <div className="p-2 border-b border-[var(--border)]">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder="Type to filter…"
                    className={cn(
                      'w-full pl-8 pr-3 h-8 text-sm rounded-lg outline-none',
                      'bg-[var(--background-alt)] text-[var(--text)]',
                      'placeholder:text-[var(--text-subtle)]',
                    )}
                  />
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto">
                {loading ? (
                  <p className="py-6 text-center text-sm text-[var(--text-muted)]">Searching…</p>
                ) : filtered.length === 0 ? (
                  <p className="py-6 text-center text-sm text-[var(--text-muted)]">No products found</p>
                ) : (
                  filtered.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { onSelect(p); setOpen(false); setQuery(''); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left',
                        'hover:bg-[var(--surface-hover)] transition-colors',
                        value?.id === p.id && 'bg-blue-500/8',
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text)] truncate">{p.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{p.brand} · {p.sku}</p>
                      </div>
                      {p.sellingPrice > 0 && (
                        <span className="text-xs font-semibold text-[var(--primary)] shrink-0">
                          ₹{p.sellingPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <p role="alert" className="text-xs text-[var(--danger)] flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── AttachmentPlaceholder ────────────────────────────────────────────────────
function AttachmentPlaceholder() {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl',
      'border border-dashed border-[var(--border-strong)]',
      'bg-[var(--background-alt)] text-[var(--text-muted)]',
    )}>
      <Paperclip size={16} className="shrink-0 text-[var(--text-subtle)]" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-muted)]">Attach Datasheet / Image</p>
        <p className="text-xs text-[var(--text-subtle)]">File upload coming soon — note your requirements in the fields above</p>
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-subtle)]">
        Soon
      </span>
    </div>
  );
}

// ─── ReviewRow ────────────────────────────────────────────────────────────────
function ReviewRow({ label, value, optional }: { label: string; value: string | number; optional?: boolean }) {
  if (!value && optional) return null;
  return (
    <div className="flex gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--text-subtle)] w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[var(--text)] font-medium flex-1 break-words">
        {value || <span className="text-[var(--text-subtle)] font-normal italic">Not provided</span>}
      </span>
    </div>
  );
}

// ─── Step 1 — Product ─────────────────────────────────────────────────────────
function Step1Product({
  data,
  errors,
  onChange,
  onProductSelect,
  selectedProduct,
}: {
  data: RFQFormData;
  errors: Partial<Record<keyof RFQFormData, string>>;
  onChange: (field: keyof RFQFormData, value: string | number | boolean) => void;
  onProductSelect: (p: RFQProductOption) => void;
  selectedProduct: RFQProductOption | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold text-[var(--text)] mb-1">What product do you need?</h3>
        <p className="text-sm text-[var(--text-muted)]">Select an existing product from our catalogue or describe a custom requirement.</p>
      </div>

      <ProductTypeToggle
        value={data.productType}
        onChange={(v) => onChange('productType', v)}
      />

      <AnimatePresence mode="wait">
        {data.productType === 'existing' ? (
          <motion.div
            key="existing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <ProductSearchDropdown
              value={selectedProduct}
              onSelect={onProductSelect}
              error={errors.existingProductId}
            />

            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl',
                  'bg-blue-500/5 border border-blue-500/20',
                )}
              >
                <Package size={16} className="text-[var(--primary)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)] truncate">{selectedProduct.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {selectedProduct.brand} · SKU: {selectedProduct.sku} · ₹{selectedProduct.sellingPrice.toLocaleString('en-IN')}
                  </p>
                </div>
                <Badge variant="primary" size="sm">Selected</Badge>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <Input
              label="Product / Requirement Name"
              placeholder="e.g. 32-bit ARM Cortex-M4 microcontroller with CAN bus"
              value={data.customProductName}
              onChange={(e) => onChange('customProductName', e.target.value)}
              error={errors.customProductName}
              required
              leftIcon={<FileText size={15} />}
            />
            <Input
              label="Reference Product URL"
              placeholder="https://example.com/product (optional)"
              type="url"
              value={data.referenceUrl}
              onChange={(e) => onChange('referenceUrl', e.target.value)}
              error={errors.referenceUrl}
              hint="Paste a link to a product page, datasheet, or similar item for reference."
              leftIcon={<Link2 size={15} />}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Step 2 — Requirements ────────────────────────────────────────────────────
function Step2Requirements({
  data,
  errors,
  onChange,
}: {
  data: RFQFormData;
  errors: Partial<Record<keyof RFQFormData, string>>;
  onChange: (field: keyof RFQFormData, value: string | number | boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--text)] mb-1">Specify your requirements</h3>
        <p className="text-sm text-[var(--text-muted)]">Help us prepare an accurate quote for you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Quantity"
          type="number"
          min={1}
          value={String(data.quantity)}
          onChange={(e) => onChange('quantity', Math.max(1, parseInt(e.target.value) || 1))}
          error={errors.quantity}
          required
          hint="Minimum order quantity: 1"
        />

        <Input
          label="Required By"
          type="date"
          value={data.requiredByDate}
          onChange={(e) => onChange('requiredByDate', e.target.value)}
          error={errors.requiredByDate}
          required
          leftIcon={<Calendar size={15} />}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <Input
        label="Delivery Location"
        placeholder="City, State, PIN code"
        value={data.deliveryLocation}
        onChange={(e) => onChange('deliveryLocation', e.target.value)}
        error={errors.deliveryLocation}
        required
        leftIcon={<MapPin size={15} />}
      />

      <Input
        label="Budget (₹)"
        placeholder="e.g. 50,000 (optional)"
        value={data.budget}
        onChange={(e) => onChange('budget', e.target.value)}
        hint="Providing a budget helps us suggest the best options."
        leftIcon={<DollarSign size={15} />}
      />

      <Textarea
        label="Technical Specifications"
        placeholder="Voltage, frequency, form factor, certifications, temperature range…"
        value={data.technicalSpecs}
        onChange={(e) => onChange('technicalSpecs', e.target.value)}
        error={errors.technicalSpecs}
        showCount
        maxLength={1000}
        rows={3}
        required
      />

      <Textarea
        label="Additional Requirements / Notes"
        placeholder="Any special packing, warranty, documentation, or other needs…"
        value={data.additionalNotes}
        onChange={(e) => onChange('additionalNotes', e.target.value)}
        showCount
        maxLength={500}
        rows={3}
      />

      <AttachmentPlaceholder />
    </div>
  );
}

// ─── Step 3 — Review ──────────────────────────────────────────────────────────
function Step3Review({
  data,
  onEdit,
}: {
  data: RFQFormData;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text)] mb-1">Review your RFQ</h3>
          <p className="text-sm text-[var(--text-muted)]">Please confirm all details before submitting.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>

      {/* Product section */}
      <div className={cn(
        'rounded-xl border border-[var(--border)]',
        'bg-[var(--background-alt)] overflow-hidden',
      )}>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border-b border-[var(--border)]">
          <Package size={13} className="text-[var(--primary)]" />
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Product</span>
          <Badge variant="info" size="xs" className="ml-auto">
            {data.productType === 'existing' ? 'Catalogue' : 'Custom'}
          </Badge>
        </div>
        <div className="px-4">
          {data.productType === 'existing' ? (
            <ReviewRow label="Product" value={data.existingProductName ?? ''} />
          ) : (
            <>
              <ReviewRow label="Requirement" value={data.customProductName} />
              <ReviewRow label="Reference URL" value={data.referenceUrl ?? ''} optional />
            </>
          )}
        </div>
      </div>

      {/* Requirements section */}
      <div className={cn(
        'rounded-xl border border-[var(--border)]',
        'bg-[var(--background-alt)] overflow-hidden',
      )}>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border-b border-[var(--border)]">
          <Wrench size={13} className="text-[var(--primary)]" />
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Requirements</span>
        </div>
        <div className="px-4">
          <ReviewRow label="Quantity"         value={data.quantity} />
          <ReviewRow label="Required By"      value={data.requiredByDate} />
          <ReviewRow label="Delivery To"      value={data.deliveryLocation} />
          <ReviewRow label="Budget"           value={data.budget ? `₹${data.budget}` : ''} optional />
          <ReviewRow label="Technical Specs"  value={data.technicalSpecs} />
          <ReviewRow label="Notes"            value={data.additionalNotes} optional />
        </div>
      </div>

      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl',
        'bg-[var(--warning-bg)] border border-[var(--warning)]/20',
      )}>
        <AlertCircle size={15} className="text-[var(--warning)] shrink-0" />
        <p className="text-xs text-[var(--warning)]">
          Once submitted, the ElectroHub team will review your RFQ and respond within 1–2 business days.
        </p>
      </div>
    </div>
  );
}

// ─── Step 4 — Success ─────────────────────────────────────────────────────────
function Step4Success({
  submission,
  onClose,
}: {
  submission: RFQSubmission;
  onClose: () => void;
}) {
  const submittedDate = submission.submittedAt
    ? new Date(submission.submittedAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
      className="flex flex-col items-center gap-6 py-4 text-center"
    >
      {/* Success icon */}
      <div className="relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
          className={cn(
            'h-20 w-20 rounded-full flex items-center justify-center',
            'bg-gradient-to-br from-green-400 to-emerald-600',
            'shadow-[0_0_32px_rgba(16,185,129,0.4)]',
          )}
        >
          <CheckCircle2 size={36} className="text-white" />
        </motion.div>
        {/* Pulse rings */}
        <div className="absolute inset-0 rounded-full animate-ping bg-[var(--success)]/20 pointer-events-none" style={{ animationDuration: '2s' }} />
      </div>

      <div>
        <h3 className="text-xl font-bold text-[var(--text)] mb-1">RFQ Submitted!</h3>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          Your Request For Quotation has been received. Our team will get back to you shortly.
        </p>
      </div>

      {/* RFQ Number card */}
      <div className={cn(
        'w-full max-w-xs px-5 py-4 rounded-2xl',
        'bg-[var(--background-alt)] border border-[var(--border)]',
        'flex flex-col items-center gap-2',
      )}>
        <span className="text-xs text-[var(--text-subtle)] uppercase tracking-widest font-medium">Your RFQ Number</span>
        <span className="text-2xl font-bold font-mono text-[var(--primary)] tracking-wider">
          {submission.rfqNumber}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="warning" size="sm">Under Review</Badge>
          <span className="text-xs text-[var(--text-subtle)]">·</span>
          <span className="text-xs text-[var(--text-subtle)]">Submitted {submittedDate}</span>
        </div>
      </div>

      {/* Next steps */}
      <div className={cn(
        'w-full text-left px-4 py-4 rounded-xl',
        'bg-[var(--surface)] border border-[var(--border)]',
      )}>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">What happens next?</p>
        {[
          { icon: '📋', text: 'Our team reviews your requirements' },
          { icon: '💬', text: 'We prepare a tailored quotation' },
          { icon: '📧', text: 'You receive the quote via email within 1–2 business days' },
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3 mb-2 last:mb-0">
            <span className="text-base mt-0.5">{step.icon}</span>
            <p className="text-sm text-[var(--text-muted)]">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 w-full">
        <Link href="/account" className="flex-1" onClick={onClose}>
          <Button variant="outline" fullWidth>
            View My RFQs
          </Button>
        </Link>
        <Button variant="primary" fullWidth onClick={onClose}>
          Done
          <ArrowRight size={15} />
        </Button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main RFQFormModal Component
// ═══════════════════════════════════════════════════════════════════════════════

export interface RFQFormModalProps {
  open:      boolean;
  onClose:   () => void;
  /** Optional: prefill with an existing product from the catalogue */
  prefillProductId?:   string;
  prefillProductName?: string;
  prefillQuantity?:    number;
}

export function RFQFormModal({
  open,
  onClose,
  prefillProductId,
  prefillProductName,
  prefillQuantity,
}: RFQFormModalProps) {
  const { user } = useAuth();
  const [step,            setStep]            = React.useState(1);
  const [slideDir,        setSlideDir]        = React.useState(1);
  const [form,            setForm]            = React.useState<RFQFormData>(() => ({
    ...EMPTY_RFQ_FORM,
    productType:          prefillProductId ? 'existing' : 'existing',
    existingProductId:    prefillProductId   ?? '',
    existingProductName:  prefillProductName ?? '',
    quantity:             prefillQuantity    ?? 1,
  }));
  const [errors,          setErrors]          = React.useState<Partial<Record<keyof RFQFormData, string>>>({});
  const [selectedProduct, setSelectedProduct] = React.useState<RFQProductOption | null>(() => {
    if (!prefillProductId) return null;
    // Will be populated when products load from backend
    return prefillProductName
      ? { id: prefillProductId, name: prefillProductName, sku: '', brand: '', sellingPrice: 0 }
      : null;
  });
  const [submitting,      setSubmitting]      = React.useState(false);
  const [submission,      setSubmission]      = React.useState<RFQSubmission | null>(null);

  // Reset when modal opens
  React.useEffect(() => {
    if (open) {
      setStep(1);
      setSlideDir(1);
      setErrors({});
      setSubmission(null);
      setSubmitting(false);
      setForm({
        ...EMPTY_RFQ_FORM,
        productType:         prefillProductId ? 'existing' : 'existing',
        existingProductId:   prefillProductId   ?? '',
        existingProductName: prefillProductName ?? '',
        quantity:            prefillQuantity    ?? 1,
      });
      setSelectedProduct(
        prefillProductId && prefillProductName
          ? { id: prefillProductId, name: prefillProductName, sku: '', brand: '', sellingPrice: 0 }
          : null
      );
    }
  }, [open, prefillProductId, prefillProductName, prefillQuantity]);

  // ── Auto-fill delivery location from stored user address ───────────────────
  React.useEffect(() => {
    if (!open) return;
    try {
      // Try to read the default address from localStorage (set by AccountAddresses)
      const stored = localStorage.getItem('electrohub_addresses');
      if (stored) {
        const addresses = JSON.parse(stored) as Array<{
          isDefault?: boolean;
          city?: string;
          state?: string;
          pincode?: string;
        }>;
        const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
        if (defaultAddr && !form.deliveryLocation) {
          const parts = [defaultAddr.city, defaultAddr.state, defaultAddr.pincode].filter(Boolean);
          if (parts.length > 0) {
            setForm((prev) => ({
              ...prev,
              deliveryLocation: prev.deliveryLocation || parts.join(', '),
            }));
          }
        }
      }
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateField = (field: keyof RFQFormData, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleProductSelect = (p: RFQProductOption) => {
    setSelectedProduct(p);
    setForm((prev) => ({
      ...prev,
      existingProductId:        p.id,
      existingProductNumericId: p.numericId,
      existingProductName:      p.name,
    }));
    setErrors((prev) => ({ ...prev, existingProductId: undefined }));
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    const newErrors: typeof errors = {};
    if (form.productType === 'existing') {
      if (!form.existingProductId) {
        newErrors.existingProductId = 'Please select a product from the list.';
      }
    } else {
      if (!form.customProductName.trim()) {
        newErrors.customProductName = 'Please describe the product or requirement.';
      }
      if (form.referenceUrl && !/^https?:\/\/.+/.test(form.referenceUrl)) {
        newErrors.referenceUrl = 'Please enter a valid URL starting with http:// or https://';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.quantity || form.quantity < 1)          newErrors.quantity         = 'Quantity must be at least 1.';
    if (!form.requiredByDate)                          newErrors.requiredByDate   = 'Please select a required-by date.';
    if (!form.deliveryLocation.trim())                 newErrors.deliveryLocation = 'Please enter a delivery location.';
    if (!form.technicalSpecs.trim())                   newErrors.technicalSpecs  = 'Please provide technical specifications.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ───────────────────────────────────────────────────────────────
  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setSlideDir(1);
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    setSlideDir(-1);
    setStep((s) => s - 1);
  };

  // ── Submit — calls real Django API ──────────────────────────────────────────
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitRFQToAPI(form);
      setSubmission(result);
      setSlideDir(1);
      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit RFQ. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Title ────────────────────────────────────────────────────────────────────
  const stepTitle = step === 4 ? '' : 'Request a Quote';
  const stepDesc  = step === 4 ? undefined : `Step ${step} of 3`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={stepTitle}
      description={stepDesc}
      size="xl"
      scroll="inside"
      showClose={step < 4}
      closeOnOverlay={step < 4}
    >
      {/* Step indicator (steps 1-3 only) */}
      {step < 4 && (
        <StepIndicator current={step} />
      )}

      {/* Animated step content */}
      <AnimatePresence mode="wait" custom={slideDir}>
        <motion.div
          key={step}
          custom={slideDir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
        >
          {step === 1 && (
            <Step1Product
              data={form}
              errors={errors}
              onChange={updateField}
              onProductSelect={handleProductSelect}
              selectedProduct={selectedProduct}
            />
          )}
          {step === 2 && (
            <Step2Requirements
              data={form}
              errors={errors}
              onChange={updateField}
            />
          )}
          {step === 3 && (
            <Step3Review
              data={form}
              onEdit={() => { setSlideDir(-1); setStep(1); }}
            />
          )}
          {step === 4 && submission && (
            <Step4Success submission={submission} onClose={onClose} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer navigation (steps 1-3) */}
      {step < 4 && (
        <div className={cn(
          'flex items-center justify-between gap-3 pt-4 mt-4',
          'border-t border-[var(--border)]',
        )}>
          <Button
            variant="ghost"
            size="md"
            onClick={step === 1 ? onClose : goPrev}
            leftIcon={step > 1 ? <ChevronLeft size={15} /> : undefined}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < 3 ? (
            <Button
              variant="primary"
              size="md"
              onClick={goNext}
              rightIcon={<ChevronRight size={15} />}
            >
              Next
            </Button>
          ) : (
            <div className="flex flex-col items-end gap-2">
              {submitError && (
                <p role="alert" className="text-xs text-[var(--danger)] flex items-center gap-1">
                  <AlertCircle size={12} />
                  {submitError}
                </p>
              )}
              <Button
                variant="gradient"
                size="md"
                onClick={handleSubmit}
                isLoading={submitting}
                loadingText="Submitting…"
                rightIcon={!submitting ? <CheckCircle2 size={15} /> : undefined}
              >
                Submit RFQ
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
