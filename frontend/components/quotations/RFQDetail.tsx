'use client';

/**
 * ElectroHub — RFQ Detail Panel
 * Shows full details for a single MockRFQ, including a customer-facing
 * status timeline (Submitted → Under Review → Quotation Ready →
 * Accepted / Rejected).
 *
 * When status is 'quoted', a prominent CTA directs the customer to
 * My Quotations to view, accept, reject, or negotiate.
 *
 * Uses ONLY existing ElectroHub UI tokens and components.
 * No backend calls — local/mock state only.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  Wrench,
  MapPin,
  Calendar,
  DollarSign,
  Link2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  CreditCard,
  ShoppingCart,
  ExternalLink,
  Sparkles,
  NotebookText,
  Receipt,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { RFQ, RFQStatus } from '@/lib/quotation-api';

// ─── Status config ────────────────────────────────────────────────────────────

export const RFQ_STATUS_CONFIG: Record<
  RFQStatus,
  {
    label:   string;
    variant: 'default' | 'warning' | 'info' | 'success' | 'danger';
    icon:    React.ElementType;
  }
> = {
  submitted:       { label: 'Submitted',        variant: 'info',    icon: FileText      },
  under_review:    { label: 'Under Review',      variant: 'warning', icon: Clock         },
  quoted:          { label: 'Quotation Ready',   variant: 'info',    icon: ClipboardCheck },
  accepted:        { label: 'Accepted',          variant: 'success', icon: CheckCircle2  },
  rejected:        { label: 'Rejected',          variant: 'danger',  icon: XCircle       },
  payment_pending: { label: 'Payment Pending',   variant: 'warning', icon: CreditCard    },
  order_placed:    { label: 'Order Placed',      variant: 'success', icon: ShoppingCart  },
};

// ─── Timeline definition ──────────────────────────────────────────────────────

interface TimelineStep {
  status:      RFQStatus;
  label:       string;
  description: string;
  icon:        React.ElementType;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    status:      'submitted',
    label:       'Submitted',
    description: 'Your RFQ has been received by ElectroHub.',
    icon:        FileText,
  },
  {
    status:      'under_review',
    label:       'Under Review',
    description: 'Our team is reviewing your requirements and sourcing options.',
    icon:        Clock,
  },
  {
    status:      'quoted',
    label:       'Quotation Ready',
    description: 'We have prepared a tailored quote for your requirements.',
    icon:        ClipboardCheck,
  },
  {
    status:      'accepted',
    label:       'Accepted / Rejected',
    description: 'You have reviewed and responded to the quotation.',
    icon:        CheckCircle2,
  },
  {
    status:      'payment_pending',
    label:       'Payment',
    description: 'Payment is being processed for the confirmed order.',
    icon:        CreditCard,
  },
  {
    status:      'order_placed',
    label:       'Order',
    description: 'Your order has been confirmed and is being prepared.',
    icon:        ShoppingCart,
  },
];

/**
 * Returns the zero-based index of the current status in the timeline.
 * Returns -1 for 'rejected' (end-state, not on the positive path).
 */
function getTimelineProgress(status: RFQStatus): number {
  if (status === 'rejected') return -1;
  const idx = TIMELINE_STEPS.findIndex((s) => s.status === status);
  return idx;
}

// ─── Detail row helper ────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon:     React.ElementType;
  label:    string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-[var(--border)] last:border-0">
      <div className="shrink-0 w-5 h-5 mt-0.5 text-[var(--primary)]">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-subtle)] mb-0.5">{label}</p>
        <div className="text-sm text-[var(--text)] font-medium">{children}</div>
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon:     React.ElementType;
  title:    string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border)] bg-[var(--background-alt)]">
        <Icon size={15} className="text-[var(--primary)]" />
        <h3 className="font-semibold text-sm text-[var(--text)]">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ status }: { status: RFQStatus }) {
  const progress    = getTimelineProgress(status);
  const isRejected  = status === 'rejected';

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5 shadow-[var(--shadow-card)]">
      <h3 className="font-semibold text-sm text-[var(--text)] mb-5 flex items-center gap-2">
        <Clock size={16} className="text-[var(--primary)]" />
        RFQ Progress
      </h3>

      <div className="relative">
        {/* Vertical line track */}
        <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-[var(--border)]" />
        {/* Filled progress line */}
        {!isRejected && progress > 0 && (
          <div
            className="absolute left-4 top-5 w-0.5 bg-[var(--primary)] transition-all duration-700"
            style={{
              height: `${(progress / (TIMELINE_STEPS.length - 1)) * 100}%`,
            }}
          />
        )}

        <div className="space-y-5">
          {TIMELINE_STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            let stepState: 'completed' | 'active' | 'future' | 'rejected-active';

            if (isRejected) {
              if (idx < 3) {
                stepState = progress >= idx ? 'completed' : 'future';
              } else if (idx === 3) {
                stepState = 'rejected-active';
              } else {
                stepState = 'future';
              }
            } else {
              if (idx < progress)      stepState = 'completed';
              else if (idx === progress) stepState = 'active';
              else                      stepState = 'future';
            }

            const isCompleted      = stepState === 'completed';
            const isActive         = stepState === 'active';
            const isRejectedActive = stepState === 'rejected-active';

            return (
              <div key={step.status} className="flex items-start gap-4 relative">
                {/* Node */}
                <div
                  className={cn(
                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all',
                    isCompleted
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                      : isActive
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                      : isRejectedActive
                      ? 'bg-[var(--danger)] border-[var(--danger)] text-white'
                      : 'bg-[var(--background-card)] border-[var(--border)] text-[var(--text-subtle)]',
                  )}
                >
                  {isRejectedActive ? <XCircle size={14} /> : <StepIcon size={14} />}
                </div>

                {/* Label */}
                <div className="pt-1 flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCompleted || isActive
                        ? 'text-[var(--text)]'
                        : isRejectedActive
                        ? 'text-[var(--danger)]'
                        : 'text-[var(--text-muted)]',
                    )}
                  >
                    {isRejectedActive ? 'Rejected' : step.label}
                  </p>
                  {(isActive || isRejectedActive) && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {isRejectedActive
                        ? 'This RFQ could not be fulfilled. Please contact support or submit a new request.'
                        : step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main RFQDetail Component
// ═══════════════════════════════════════════════════════════════════════════════

interface RFQDetailProps {
  rfq:                 RFQ;
  onBack:              () => void;
  /** Navigate the account dashboard to My Quotations section */
  onGoToQuotations?:  () => void;
}

export function RFQDetail({ rfq, onBack, onGoToQuotations }: RFQDetailProps) {
  const statusCfg  = RFQ_STATUS_CONFIG[rfq.status] || RFQ_STATUS_CONFIG.submitted;
  const StatusIcon = statusCfg.icon;

  const submittedDate = rfq.submitted_at ? new Date(rfq.submitted_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) : '—';
  const updatedDate = rfq.updated_at ? new Date(rfq.updated_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) : '—';
  const requiredDate = rfq.required_by_date
    ? new Date(rfq.required_by_date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
      className="space-y-5"
    >
      {/* ── Back + header ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={15} />}
          onClick={onBack}
          id="rfq-detail-back"
        >
          Back
        </Button>
        <div className="h-5 w-px bg-[var(--border)] self-center" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold font-display text-[var(--text)] text-lg leading-none font-mono">
              {rfq.rfq_number}
            </h2>
            <Badge
              variant={statusCfg.variant}
              size="sm"
              icon={<StatusIcon size={11} />}
            >
              {statusCfg.label}
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Submitted {submittedDate}
            {rfq.updated_at !== rfq.submitted_at && ` · Updated ${updatedDate}`}
          </p>
        </div>
      </div>

      {/* ── Status timeline ────────────────────────────────────────────────── */}
      <StatusTimeline status={rfq.status} />

      {/* ── Quotation Ready banner ─────────────────────────────────────────── */}
      {rfq.status === 'quoted' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4 rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 flex items-center justify-center shrink-0">
              <Receipt size={18} className="text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">
                Your quotation is ready!
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                ElectroHub has prepared a tailored quote for this RFQ. Review, accept, reject, or negotiate the price.
              </p>
            </div>
          </div>
          {onGoToQuotations && (
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ChevronRight size={14} />}
              onClick={onGoToQuotations}
              id="rfq-detail-view-quotation"
            >
              View Quotation
            </Button>
          )}
        </div>
      )}

      {/* ── Under Review banner ────────────────────────────────────────────── */}
      {rfq.status === 'under_review' && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <Clock size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--text-muted)]">
            Our team is reviewing your request and will prepare a quotation within <strong className="text-[var(--text)]">1–2 business days</strong>.
          </p>
        </div>
      )}

      {/* ── Product / requirement ─────────────────────────────────────────── */}
      <SectionCard
        icon={rfq.product_type === 'existing' ? Package : Sparkles}
        title={rfq.product_type === 'existing' ? 'Product' : 'Custom Requirement'}
      >
        <DetailRow icon={rfq.product_type === 'existing' ? Package : FileText} label="Product / Requirement">
          <span className="leading-snug">{rfq.product_name || rfq.custom_product_name || 'Unknown Product'}</span>
        </DetailRow>
        <DetailRow icon={NotebookText} label="Product Type">
          <Badge variant={rfq.product_type === 'existing' ? 'primary' : 'info'} size="xs">
            {rfq.product_type === 'existing' ? 'ElectroHub Catalogue' : 'Custom / External'}
          </Badge>
        </DetailRow>
        {rfq.reference_url && (
          <DetailRow icon={Link2} label="Reference URL">
            <a
              href={rfq.reference_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:underline inline-flex items-center gap-1 break-all"
            >
              <span className="truncate max-w-xs">{rfq.reference_url}</span>
              <ExternalLink size={12} className="shrink-0" />
            </a>
          </DetailRow>
        )}
      </SectionCard>

      {/* ── Technical specifications ───────────────────────────────────────── */}
      <SectionCard icon={Wrench} title="Technical Specifications">
        <div className="py-3">
          <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
            {rfq.technical_specs || (
              <span className="text-[var(--text-subtle)] italic">None provided</span>
            )}
          </p>
        </div>
      </SectionCard>

      {/* ── Requirements ──────────────────────────────────────────────────── */}
      <SectionCard icon={Package} title="Requirements">
        <DetailRow icon={Package} label="Quantity">
          <span>{rfq.quantity.toLocaleString('en-IN')} units</span>
        </DetailRow>
        <DetailRow icon={DollarSign} label="Budget">
          {rfq.budget
            ? <span>₹{Number(rfq.budget).toLocaleString('en-IN')}</span>
            : <span className="text-[var(--text-subtle)] italic font-normal">Not specified</span>
          }
        </DetailRow>
        <DetailRow icon={MapPin} label="Delivery Location">
          <span>{rfq.delivery_location}</span>
        </DetailRow>
        <DetailRow icon={Calendar} label="Required By">
          <span>{requiredDate}</span>
        </DetailRow>
      </SectionCard>

      {/* ── Additional requirements ────────────────────────────────────────── */}
      {rfq.additional_notes && (
        <SectionCard icon={NotebookText} title="Additional Requirements / Notes">
          <div className="py-3">
            <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
              {rfq.additional_notes}
            </p>
          </div>
        </SectionCard>
      )}

      {/* ── Submission info ────────────────────────────────────────────────── */}
      <SectionCard icon={FileText} title="Submission Information">
        <DetailRow icon={FileText} label="RFQ Number">
          <span className="font-mono">{rfq.rfq_number}</span>
        </DetailRow>
        <DetailRow icon={Clock} label="Submitted At">
          <span>
            {rfq.submitted_at ? new Date(rfq.submitted_at).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            }) : '—'}
          </span>
        </DetailRow>
        <DetailRow icon={Clock} label="Last Updated">
          <span>
            {rfq.updated_at ? new Date(rfq.updated_at).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            }) : '—'}
          </span>
        </DetailRow>
        <DetailRow icon={statusCfg.icon} label="Current Status">
          <Badge variant={statusCfg.variant} size="xs" icon={<StatusIcon size={10} />}>
            {statusCfg.label}
          </Badge>
        </DetailRow>
      </SectionCard>
    </motion.div>
  );
}
