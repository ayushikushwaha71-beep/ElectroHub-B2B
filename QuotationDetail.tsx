'use client';

/**
 * ElectroHub — Customer Quotation Detail
 * Shown when a customer opens a quotation attached to one of their RFQs.
 *
 * Features:
 *  - Full quotation breakdown (unit price, discount, tax, shipping, grand total)
 *  - Availability / inventory / ETA display
 *  - Validity date with expiry warning
 *  - Reference Product URL (read-only)
 *  - Terms & Notes
 *  - Accept / Reject / Negotiate actions
 *  - Negotiation panel: proposed price + message + submit
 *  - Full revision history timeline
 *  - Status flow: sent → viewed → negotiating → revised → accepted / rejected
 *
 * Uses ONLY existing ElectroHub design tokens and components.
 * No backend calls — localStorage mock state only.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  IndianRupee,
  Link2,
  MapPin,
  Package,
  Percent,
  Receipt,
  Send,
  Sparkles,
  Truck,
  Warehouse,
  XCircle,
  NotebookText,
  MessageSquare,
  RotateCcw,
  AlertTriangle,
  BadgeCheck,
  User,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge }   from '@/components/ui/Badge';
import { Button }  from '@/components/ui/Button';
import { Modal }   from '@/components/ui/Modal';
import { B2BPayment } from './B2BPayment';
import { Quotation, QuotationStatus } from '@/lib/quotation-api';

export interface QuotationTotals {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  shipping: number;
  grandTotal: number;
}

export function calcQuotationTotals(q: Quotation): QuotationTotals {
  const qty = q.quantity || 0;
  const unit = Number(q.unit_price) || 0;
  const discPct = Number(q.discount_pct) || 0;
  const taxPct = Number(q.tax_pct) || 0;
  const shipping = Number(q.shipping_charge) || 0;

  const subtotal = qty * unit;
  const discount = subtotal * (discPct / 100);
  const taxable = subtotal - discount;
  const tax = taxable * (taxPct / 100);
  const grandTotal = taxable + tax + shipping;

  return { subtotal, discount, taxable, tax, shipping, grandTotal };
}

// ─── Status config ────────────────────────────────────────────────────────────

export const QUOT_STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; variant: 'default' | 'warning' | 'info' | 'success' | 'danger'; icon: React.ElementType }
> = {
  draft:             { label: 'Draft',              variant: 'default', icon: FileText      },
  sent:              { label: 'Quotation Received', variant: 'info',    icon: FileText      },
  viewed:            { label: 'Viewed',             variant: 'info',    icon: CheckCircle2  },
  negotiating:       { label: 'Under Negotiation',  variant: 'warning', icon: MessageSquare },
  revised:           { label: 'Revised',            variant: 'info',    icon: RotateCcw     },
  accepted:          { label: 'Accepted',           variant: 'success', icon: CheckCircle2  },
  rejected:          { label: 'Rejected',           variant: 'danger',  icon: XCircle       },
  invoice_sent:      { label: 'Invoice Sent',       variant: 'info',    icon: Receipt       },
  partially_paid:    { label: 'Partially Paid',     variant: 'warning', icon: IndianRupee   },
  payment_confirmed: { label: 'Payment Confirmed',  variant: 'success', icon: IndianRupee   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon:       React.ElementType;
  title:      string;
  children:   React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden shadow-[var(--shadow-card)]', className)}>
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border)] bg-[var(--background-alt)]">
        <Icon size={15} className="text-[var(--primary)]" />
        <h3 className="font-semibold text-sm text-[var(--text)]">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--text-subtle)] w-36 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0 text-sm text-[var(--text)] font-medium">{children}</div>
    </div>
  );
}

function TotalRow({
  label,
  value,
  bold,
  muted,
  large,
}: {
  label:  string;
  value:  string;
  bold?:  boolean;
  muted?: boolean;
  large?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-2',
      bold && 'border-t border-[var(--border)] pt-2 mt-1',
    )}>
      <span className={cn('text-sm', muted ? 'text-[var(--text-subtle)]' : 'text-[var(--text-muted)]', bold && 'font-bold text-[var(--text)]')}>
        {label}
      </span>
      <span className={cn(
        'tabular-nums font-medium',
        large ? 'text-xl font-bold text-[var(--primary)]' : 'text-sm',
        muted && 'text-[var(--text-subtle)]',
        bold && !large && 'font-bold text-[var(--text)]',
      )}>
        {value}
      </span>
    </div>
  );
}

// ─── Negotiation History Timeline ─────────────────────────────────────────────

function NegotiationHistory({ quotation }: { quotation: Quotation }) {
  if (quotation.negotiations.length === 0) {
    return (
      <div className="text-center py-6 text-[var(--text-subtle)] text-sm italic">
        No negotiation history yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Initial quote as first entry */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--primary)]/10 shrink-0">
            <FileText size={13} className="text-[var(--primary)]" />
          </div>
          {quotation.negotiations.length > 0 && (
            <div className="w-0.5 flex-1 bg-[var(--border)] mt-1" />
          )}
        </div>
        <div className="flex-1 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--text)]">ElectroHub</span>
            <Badge variant="info" size="xs">Original Quote</Badge>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Unit price: <strong className="text-[var(--text)]">{fmtINR(Number(quotation.unit_price))}</strong>
          </p>
          <p className="text-xs text-[var(--text-subtle)] mt-0.5">{fmtDateTime(quotation.sent_at || quotation.created_at)}</p>
        </div>
      </div>

      {quotation.negotiations.map((entry, idx) => {
        const isLast     = idx === quotation.negotiations.length - 1;
        const isCustomer = entry.by === 'customer';

        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                isCustomer ? 'bg-violet-500/10' : 'bg-[var(--primary)]/10',
              )}>
                {isCustomer
                  ? <User size={13} className="text-violet-500" />
                  : <FileText size={13} className="text-[var(--primary)]" />
                }
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-[var(--border)] mt-1" />}
            </div>
            <div className={cn('flex-1 pb-3', isLast && 'pb-0')}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-[var(--text)]">
                  {isCustomer ? 'You' : 'ElectroHub'}
                </span>
                <Badge variant={isCustomer ? 'warning' : 'info'} size="xs">
                  {isCustomer ? 'Counter-offer' : 'Revised Quote'}
                </Badge>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Proposed price:{' '}
                <strong className="text-[var(--text)]">{fmtINR(Number(entry.proposed_price))}/unit</strong>
              </p>
              {entry.message && (
                <div className={cn(
                  'mt-1.5 px-3 py-2 rounded-xl text-sm text-[var(--text-muted)] leading-relaxed',
                  isCustomer
                    ? 'bg-violet-500/5 border border-violet-500/15'
                    : 'bg-[var(--background-alt)] border border-[var(--border)]',
                )}>
                  {entry.message}
                </div>
              )}
              <p className="text-xs text-[var(--text-subtle)] mt-1">{fmtDateTime(entry.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Negotiate Modal ──────────────────────────────────────────────────────────

function NegotiateModal({
  open,
  onClose,
  quotation,
  onSubmit,
}: {
  open:        boolean;
  onClose:     () => void;
  quotation:   Quotation;
  onSubmit:    (proposed_price: number, message: string) => void;
}) {
  const [price, setPrice]     = React.useState(String(quotation.unit_price));
  const [message, setMessage] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError]     = React.useState('');

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setPrice(String(quotation.unit_price));
      setMessage('');
      setError('');
    }
  }, [open, quotation.unit_price]);

  const handleSubmit = async () => {
    const parsed = parseFloat(price);
    if (!parsed || parsed <= 0) {
      setError('Please enter a valid price.');
      return;
    }
    if (!message.trim()) {
      setError('Please provide a reason or message for your counter-offer.');
      return;
    }
    setError('');
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    onSubmit(parsed, message.trim());
    onClose();
  };

  const saving = parseFloat(price) > 0
    ? ((Number(quotation.unit_price) - parseFloat(price)) / Number(quotation.unit_price) * 100).toFixed(1)
    : '0';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Submit Revision Request"
      size="md"
      scroll="inside"
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-muted)]">
          Propose a revised unit price and provide a reason. ElectroHub will review your request and respond.
        </p>

        {/* Current price reference */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--background-alt)] border border-[var(--border)]">
          <DollarSign size={15} className="text-[var(--text-subtle)] shrink-0" />
          <div>
            <p className="text-xs text-[var(--text-subtle)]">Current quoted price</p>
            <p className="text-sm font-bold text-[var(--text)]">{fmtINR(Number(quotation.unit_price))} / unit</p>
          </div>
          {parseFloat(price) > 0 && parseFloat(price) !== Number(quotation.unit_price) && (
            <div className="ml-auto text-right">
              <p className="text-xs text-[var(--text-subtle)]">Your saving</p>
              <p className={cn(
                'text-sm font-semibold',
                parseFloat(price) < Number(quotation.unit_price) ? 'text-[var(--success)]' : 'text-[var(--danger)]',
              )}>
                {parseFloat(price) < Number(quotation.unit_price) ? '-' : '+'}{saving}%
              </p>
            </div>
          )}
        </div>

        {/* Proposed price */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
            Your Proposed Price (₹ per unit) <span className="text-[var(--danger)]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-subtle)] pointer-events-none">₹</span>
            <input
              type="number"
              id="negotiate-price"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={cn(
                'h-10 w-full rounded-lg border pl-7 pr-3 text-sm outline-none transition-all',
                'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]',
                'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
              )}
              placeholder="e.g. 1200"
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
            Reason / Message <span className="text-[var(--danger)]">*</span>
          </label>
          <textarea
            id="negotiate-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain your proposed price — competing quotes, volume commitment, long-term partnership, etc."
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none transition-all',
              'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]',
              'placeholder:text-[var(--text-subtle)]',
              'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
            )}
          />
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-[var(--danger)]">
            <AlertTriangle size={14} />
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" onClick={onClose} fullWidth id="negotiate-cancel">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Send size={14} />}
            onClick={handleSubmit}
            isLoading={submitting}
            loadingText="Submitting…"
            fullWidth
            id="negotiate-submit"
          >
            Submit Revision Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Confirm Accept/Reject Modal ──────────────────────────────────────────────

function ConfirmModal({
  open,
  onClose,
  mode,
  onConfirm,
  quotNumber,
}: {
  open:       boolean;
  onClose:    () => void;
  mode:       'accept' | 'reject';
  onConfirm:  () => void;
  quotNumber: string;
}) {
  const [confirming, setConfirming] = React.useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 600));
    setConfirming(false);
    onConfirm();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center',
          mode === 'accept' ? 'bg-[var(--success)]/10' : 'bg-[var(--danger)]/10',
        )}>
          {mode === 'accept'
            ? <CheckCircle2 size={26} className="text-[var(--success)]" />
            : <XCircle size={26} className="text-[var(--danger)]" />
          }
        </div>
        <div>
          <h3 className="font-bold text-[var(--text)] text-lg">
            {mode === 'accept' ? 'Accept Quotation?' : 'Reject Quotation?'}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {mode === 'accept'
              ? `You're about to accept ${quotNumber}. Our team will proceed with order processing.`
              : `You're about to reject ${quotNumber}. This action cannot be undone.`
            }
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <Button variant="outline" size="md" onClick={onClose} fullWidth>Cancel</Button>
          <Button
            variant={mode === 'accept' ? 'primary' : 'destructive'}
            size="md"
            onClick={handleConfirm}
            isLoading={confirming}
            loadingText={mode === 'accept' ? 'Accepting…' : 'Rejecting…'}
            fullWidth
            id={`confirm-${mode}`}
          >
            {mode === 'accept' ? 'Yes, Accept' : 'Yes, Reject'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Lifecycle Stepper ────────────────────────────────────────────────────────

interface LifecycleStep {
  key:    string;
  label:  string;
  icon:   React.ElementType;
  doneAt: QuotationStatus[];
}

const LIFECYCLE_STEPS: LifecycleStep[] = [
  { key: 'rfq',         label: 'RFQ',        icon: FileText,       doneAt: ['sent','viewed','negotiating','revised','accepted','invoice_sent','payment_confirmed'] },
  { key: 'quote',       label: 'Quotation',  icon: Receipt,        doneAt: ['viewed','negotiating','revised','accepted','invoice_sent','payment_confirmed'] },
  { key: 'negotiation', label: 'Review',     icon: MessageSquare,  doneAt: ['accepted','invoice_sent','payment_confirmed'] },
  { key: 'approval',    label: 'Approval',   icon: BadgeCheck,     doneAt: ['invoice_sent','payment_confirmed'] },
  { key: 'po',          label: 'PO',         icon: NotebookText,   doneAt: ['invoice_sent','payment_confirmed'] },
  { key: 'invoice',     label: 'Invoice',    icon: IndianRupee,    doneAt: ['invoice_sent','payment_confirmed'] },
  { key: 'payment',     label: 'Payment',    icon: CheckCircle2,   doneAt: ['payment_confirmed'] },
  { key: 'ship',        label: 'Shipment',   icon: Truck,          doneAt: ['payment_confirmed'] },
];

function LifecycleStepper({
  status,
  onNavigateToOrders,
}: {
  status:              QuotationStatus;
  onNavigateToOrders?: () => void;
}) {
  const doneSet = new Set(
    LIFECYCLE_STEPS
      .filter((s) => s.doneAt.includes(status))
      .map((s) => s.key),
  );

  const activeIdx = LIFECYCLE_STEPS.findIndex((s) => !doneSet.has(s.key));

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-1.5 mb-5">
        <Truck size={15} className="text-[var(--primary)]" />
        <h3 className="text-sm font-semibold text-[var(--text)]">Order Lifecycle</h3>
        <span className="text-xs text-[var(--text-subtle)] ml-auto hidden sm:block">
          Full procurement journey
        </span>
      </div>

      {/* Stepper — scrollable on mobile */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex items-center min-w-max gap-0">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const Icon     = step.icon;
            const isDone   = doneSet.has(step.key);
            const isActive = idx === activeIdx;
            const isLast   = idx === LIFECYCLE_STEPS.length - 1;

            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                    isDone
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm'
                      : isActive
                      ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
                      : 'bg-[var(--background-alt)] border-[var(--border)] text-[var(--text-subtle)]',
                  )}>
                    <Icon size={15} />
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium whitespace-nowrap',
                    isDone   ? 'text-[var(--primary)]' :
                    isActive ? 'text-[var(--text)]' :
                               'text-[var(--text-subtle)]',
                  )}>
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <div className={cn(
                    'h-0.5 w-7 xl:w-10 shrink-0 mb-4 transition-colors duration-300',
                    isDone ? 'bg-[var(--primary)]' : 'bg-[var(--border)]',
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Track Order CTA */}
      {status === 'payment_confirmed' && onNavigateToOrders && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[var(--success)]/10 flex items-center justify-center shrink-0">
              <CheckCircle2 size={14} className="text-[var(--success)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-snug">
              Payment confirmed — your order is being prepared for dispatch.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Truck size={13} />}
            onClick={onNavigateToOrders}
            id="lifecycle-track-order"
          >
            Track Shipment
          </Button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main QuotationDetail Component
// ═══════════════════════════════════════════════════════════════════════════════

export interface QuotationDetailProps {
  quotation:            Quotation;
  onBack:               () => void;
  onStatusChange:       (status: QuotationStatus) => void;
  onAddNegotiation:     (proposed_price: number, message: string) => void;
  onPaymentSubmit?:     (amount: number, utr: string) => void;
  onNavigateToOrders?:  () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

function downloadInvoicePdf(quotationId: number) {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('electrohub_access_token') || '')
    : '';
  const url = `${API_BASE}/quotations/${quotationId}/invoice/pdf/?token=${encodeURIComponent(token)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function QuotationDetail({
  quotation,
  onBack,
  onStatusChange,
  onAddNegotiation,
  onPaymentSubmit,
  onNavigateToOrders,
}: QuotationDetailProps) {
  const [negotiateOpen, setNegotiateOpen] = React.useState(false);
  const [confirmMode, setConfirmMode]     = React.useState<'accept' | 'reject' | null>(null);

  const totals      = calcQuotationTotals(quotation);
  const statusCfg   = QUOT_STATUS_CONFIG[quotation.status];
  const StatusIcon  = statusCfg.icon;
  const daysLeft    = quotation.valid_until ? daysUntil(quotation.valid_until) : null;
  const isExpired   = daysLeft !== null && daysLeft < 0;
  const isExpiring  = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
  // canAct: only for negotiable statuses; invoice/payment statuses are read-only
  const canAct      = !isExpired &&
    quotation.status !== 'accepted' &&
    quotation.status !== 'rejected' &&
    quotation.status !== 'invoice_sent' &&
    quotation.status !== 'payment_confirmed';

  const isPaymentStage = quotation.status === 'invoice_sent' || quotation.status === 'payment_confirmed';

  // Mark as viewed on mount
  React.useEffect(() => {
    if (quotation.status === 'sent') {
      onStatusChange('viewed');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotation.id]);

  const handleAccept = () => {
    onStatusChange('accepted');
  };

  const handleReject = () => {
    onStatusChange('rejected');
  };

  const handleNegotiate = (proposed_price: number, message: string) => {
    onAddNegotiation(proposed_price, message);
  };

  const handlePaymentSubmit = (amount: number, utr: string) => {
    onStatusChange('payment_confirmed');
    onPaymentSubmit?.(amount, utr);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
        className="space-y-5"
      >
        {/* ── Header ── */}
        <div className="flex items-start gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft size={15} />}
            onClick={onBack}
            id="quot-detail-back"
          >
            Back
          </Button>
          <div className="h-5 w-px bg-[var(--border)] self-center" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold font-display text-lg text-[var(--text)] font-mono">
                {quotation.quotation_number}
              </h2>
              <Badge variant={statusCfg.variant} size="sm" icon={<StatusIcon size={11} />}>
                {statusCfg.label}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              For RFQ: <span className="font-mono">{quotation.rfq_number}</span>
              {' · '}Received {fmtDate(quotation.sent_at || quotation.created_at)}
            </p>
          </div>
          {/* Download Invoice PDF — visible once invoice is created */}
          {quotation.invoice && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={() => downloadInvoicePdf(quotation.id)}
              id="quot-download-pdf"
              title="Download Invoice PDF"
            >
              Invoice PDF
            </Button>
          )}
        </div>

        {/* ── Validity warning ── */}
        {quotation.valid_until && (isExpired || isExpiring) && (
          <div className={cn(
            'flex items-start gap-3 px-4 py-3 rounded-xl border',
            isExpired
              ? 'bg-[var(--danger)]/5 border-[var(--danger)]/30'
              : 'bg-amber-500/5 border-amber-500/30',
          )}>
            <AlertTriangle size={15} className={cn('shrink-0 mt-0.5', isExpired ? 'text-[var(--danger)]' : 'text-amber-500')} />
            <p className="text-sm">
              {isExpired
                ? `This quotation expired on ${fmtDate(quotation.valid_until || '')}. Contact us to request a new quote.`
                : `This quotation expires on ${fmtDate(quotation.valid_until || '')} (${daysLeft} day${daysLeft === 1 ? '' : 's'} left). Please respond soon.`
              }
            </p>
          </div>
        )}

        {/* ── Action bar ── */}
        {canAct && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background-alt)]">
            <BadgeCheck size={15} className="text-[var(--primary)] shrink-0" />
            <span className="text-sm text-[var(--text-muted)] flex-1">
              Review the quotation and respond below.
            </span>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<MessageSquare size={14} />}
                onClick={() => setNegotiateOpen(true)}
                id="quot-negotiate"
              >
                Negotiate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                leftIcon={<XCircle size={14} />}
                onClick={() => setConfirmMode('reject')}
                id="quot-reject"
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 size={14} />}
                onClick={() => setConfirmMode('accept')}
                id="quot-accept"
              >
                Accept Quotation
              </Button>
            </div>
          </div>
        )}

        {/* ── Accepted / Rejected banner ── */}
        {(quotation.status === 'accepted' || quotation.status === 'rejected') && (
          <div className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl border',
            quotation.status === 'accepted'
              ? 'bg-[var(--success)]/5 border-[var(--success)]/30'
              : 'bg-[var(--danger)]/5 border-[var(--danger)]/30',
          )}>
            {quotation.status === 'accepted'
              ? <CheckCircle2 size={16} className="text-[var(--success)] shrink-0" />
              : <XCircle size={16} className="text-[var(--danger)] shrink-0" />
            }
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">
                {quotation.status === 'accepted'
                  ? 'You accepted this quotation.'
                  : 'You rejected this quotation.'}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {quotation.status === 'accepted'
                  ? 'Our team will issue a GST invoice once the order is processed. You will be notified shortly.'
                  : 'Feel free to submit a new RFQ if your requirements change.'}
              </p>
            </div>
          </div>
        )}

        {/* ── B2B Payment panel (invoice_sent or payment_confirmed) ── */}
        {isPaymentStage && (
          <B2BPayment
            quotation={quotation}
            onPaymentSubmit={handlePaymentSubmit}
            onNavigateToOrders={onNavigateToOrders}
          />
        )}

        {/* ── Lifecycle summary stepper ── */}
        <LifecycleStepper status={quotation.status} onNavigateToOrders={onNavigateToOrders} />

        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          {/* ── Left column ── */}
          <div className="space-y-5">

            {/* Product */}
            <SectionCard
              icon={quotation.product_type === 'existing' ? Package : Sparkles}
              title="Product / Requirement"
            >
              <DataRow label="Name">
                <span className="leading-snug">{quotation.product_name}</span>
              </DataRow>
              <DataRow label="Type">
                <Badge variant={quotation.product_type === 'existing' ? 'primary' : 'info'} size="xs">
                  {quotation.product_type === 'existing' ? 'ElectroHub Catalogue' : 'Custom / External'}
                </Badge>
              </DataRow>
              
            </SectionCard>

            {/* Pricing breakdown */}
            <SectionCard icon={Receipt} title="Pricing Breakdown">
              {/* Line items table */}
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                      <th className="py-2 pr-4 text-left font-medium text-xs">Description</th>
                      <th className="py-2 px-3 text-right font-medium text-xs">Qty</th>
                      <th className="py-2 px-3 text-right font-medium text-xs">Unit Price</th>
                      <th className="py-2 pl-3 text-right font-medium text-xs">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[var(--border)]">
                      <td className="py-2.5 pr-4 font-medium text-[var(--text)]">{quotation.product_name}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--text)]">{quotation.quantity.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[var(--text)]">{fmtINR(Number(quotation.unit_price))}</td>
                      <td className="py-2.5 pl-3 text-right font-semibold text-[var(--text)]">{fmtINR(totals.subtotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-1.5">
                <TotalRow label="Subtotal" value={fmtINR(totals.subtotal)} />
                <TotalRow
                  label={`Discount (${quotation.discount_pct}%)`}
                  value={`-${fmtINR(totals.discount)}`}
                  muted={totals.discount === 0}
                />
                <TotalRow
                  label={`GST / Tax (${quotation.tax_pct}%)`}
                  value={fmtINR(totals.tax)}
                />
                <TotalRow
                  label="Shipping & Handling"
                  value={totals.shipping === 0 ? 'Free' : fmtINR(totals.shipping)}
                  muted={totals.shipping === 0}
                />
                <TotalRow label="Grand Total" value={fmtINR(totals.grandTotal)} bold large />
              </div>
            </SectionCard>

            {/* Delivery */}
            <SectionCard icon={Truck} title="Delivery">
              <DataRow label="Location">
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-[var(--text-subtle)] shrink-0" />
                  {quotation.delivery_location}
                </span>
              </DataRow>
              <DataRow label="Expected By">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-[var(--text-subtle)] shrink-0" />
                  {fmtDate(quotation.expected_delivery || '')}
                </span>
              </DataRow>
              <DataRow label="Valid Until">
                <span className={cn(
                  'flex items-center gap-1.5',
                  isExpired ? 'text-[var(--danger)]' : isExpiring ? 'text-amber-500' : '',
                )}>
                  <Clock size={12} className="shrink-0" />
                  {fmtDate(quotation.valid_until || '')}
                  {daysLeft !== null && !isExpired && (
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full font-medium',
                      isExpiring
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-[var(--background-alt)] text-[var(--text-subtle)]',
                    )}>
                      {daysLeft}d left
                    </span>
                  )}
                  {isExpired && <Badge variant="danger" size="xs">Expired</Badge>}
                </span>
              </DataRow>
            </SectionCard>

            {/* Terms */}
            {quotation.terms_notes && (
              <SectionCard icon={NotebookText} title="Terms & Conditions">
                <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                  {quotation.terms_notes}
                </p>
              </SectionCard>
            )}

            {/* Negotiation history */}
            <SectionCard icon={MessageSquare} title={`Revision History (${quotation.negotiations.length + 1})`}>
              <NegotiationHistory quotation={quotation} />
            </SectionCard>

          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-5">

            {/* Availability */}
            <SectionCard icon={Warehouse} title="Availability">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: 'Available', value: quotation.available_qty, tone: 'border-[var(--border)] bg-[var(--background-alt)]' },
                  { label: 'Reserved',  value: quotation.reserved_qty,  tone: 'border-amber-500/20 bg-amber-500/5' },
                  { label: 'Incoming',  value: quotation.incoming_qty,  tone: 'border-blue-500/20 bg-blue-500/5' },
                ].map(({ label, value, tone }) => (
                  <div key={label} className={cn('flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border', tone)}>
                    <span className="text-lg font-bold text-[var(--text)]">{value.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] font-medium text-[var(--text-subtle)] uppercase tracking-wide">{label}</span>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <span className="text-sm font-semibold text-emerald-600">
                    {quotation.eta ? fmtDate(quotation.eta) : '—'}
                  </span>
                  <span className="text-[10px] font-medium text-[var(--text-subtle)] uppercase tracking-wide">ETA</span>
                </div>
              </div>
              <p className="text-[10px] text-[var(--text-subtle)] italic">
                * Stock values are indicative and subject to change.
              </p>
            </SectionCard>

            {/* Quick summary */}
            <SectionCard icon={FileText} title="Quotation Summary">
              {[
                { label: 'Quotation #', value: quotation.quotation_number },
                { label: 'For RFQ',     value: quotation.rfq_number },
                { label: 'Quantity',    value: `${quotation.quantity.toLocaleString('en-IN')} units` },
                { label: 'Unit Price',  value: fmtINR(Number(quotation.unit_price)) },
                { label: 'Grand Total', value: fmtINR(totals.grandTotal) },
                { label: 'Valid Until', value: fmtDate(quotation.valid_until || '') },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3 py-1.5 border-b border-[var(--border)] last:border-0">
                  <span className="text-xs text-[var(--text-subtle)] w-24 shrink-0">{label}</span>
                  <span className="text-xs font-semibold text-[var(--text)] flex-1 font-mono">{value}</span>
                </div>
              ))}
            </SectionCard>

            {/* Current status */}
            <div className={cn(
              'rounded-2xl border px-5 py-4 flex items-center gap-3',
              quotation.status === 'accepted' && 'border-[var(--success)]/30 bg-[var(--success)]/5',
              quotation.status === 'rejected' && 'border-[var(--danger)]/30 bg-[var(--danger)]/5',
              quotation.status === 'negotiating' && 'border-amber-500/30 bg-amber-500/5',
              !['accepted','rejected','negotiating'].includes(quotation.status) && 'border-[var(--border)] bg-[var(--background-card)]',
            )}>
              <StatusIcon size={18} className={cn(
                quotation.status === 'accepted'   && 'text-[var(--success)]',
                quotation.status === 'rejected'   && 'text-[var(--danger)]',
                quotation.status === 'negotiating' && 'text-amber-500',
                !['accepted','rejected','negotiating'].includes(quotation.status) && 'text-[var(--primary)]',
              )} />
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Status: {statusCfg.label}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Updated {fmtDateTime(quotation.updated_at)}
                </p>
              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* Negotiate modal */}
      <NegotiateModal
        open={negotiateOpen}
        onClose={() => setNegotiateOpen(false)}
        quotation={quotation}
        onSubmit={handleNegotiate}
      />

      {/* Confirm modals */}
      <ConfirmModal
        open={confirmMode === 'accept'}
        onClose={() => setConfirmMode(null)}
        mode="accept"
        onConfirm={handleAccept}
        quotNumber={quotation.quotation_number}
      />
      <ConfirmModal
        open={confirmMode === 'reject'}
        onClose={() => setConfirmMode(null)}
        mode="reject"
        onConfirm={handleReject}
        quotNumber={quotation.quotation_number}
      />
    </>
  );
}
