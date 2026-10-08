'use client';

/**
 * ElectroHub — Admin Approval Workflow
 * Rendered inside AdminDashboard when the "Approvals" nav item is active.
 *
 * Flow:   hod_review → director_review → accountant_review → po_ready
 *
 * Three queues, one per approver level.
 * Each queue shows pending quotations, a detail view with approval history
 * (timeline), and Approve / Reject + remarks actions.
 *
 * Patterns mirror AdminRFQs.tsx / AdminQuotationBuilder.tsx exactly:
 *  - DetailSection, DetailRow
 *  - Filter chips with count badges
 *  - Animated table rows (AnimatePresence / motion.tr)
 *  - Modal for remarks (mirrors NegotiateModal)
 *  - ApprovalHistory timeline (mirrors NegotiationHistory)
 *  - toast for feedback
 *
 * All state is local/mock. No backend. No new routes.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  Package,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  UserCheck,
  Wallet,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge }  from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';
import { Modal }  from '@/components/ui/Modal';
import { toast }  from '@/components/ui/Toast';
import { adminQuotationApi } from '@/lib/quotation-api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApprovalStatus =
  | 'hod_review'
  | 'director_review'
  | 'accountant_review'
  | 'po_ready'
  | 'rejected';

export type ApproverRole = 'HOD' | 'Director' | 'Accountant';

export interface ApprovalEntry {
  id:        string;
  role:      ApproverRole;
  action:    'approved' | 'rejected';
  remarks:   string;
  timestamp: string;
}

export interface ApprovableQuotation {
  id:              string;
  quotationNumber: string;
  rfqNumber:       string;
  customerName:    string;
  customerEmail:   string;
  customerCompany: string;
  productName:     string;
  productType:     'existing' | 'custom';
  quantity:        number;
  unitPrice:       number;
  discountPct:     number;
  taxPct:          number;
  shippingCharge:  number;
  grandTotal:      number;
  deliveryLocation: string;
  expectedDelivery: string;
  validUntil:      string;
  termsNotes:      string;
  status:          ApprovalStatus;
  sentAt:          string;
  updatedAt:       string;
  history:         ApprovalEntry[];
  items?:          any[];
}

// ─── Status config ────────────────────────────────────────────────────────────

const APPROVAL_STATUS_CONFIG: Record<
  ApprovalStatus,
  { label: string; variant: 'default' | 'warning' | 'info' | 'success' | 'danger'; icon: React.ElementType; queue: ApproverRole | null }
> = {
  hod_review:        { label: 'Awaiting HOD',        variant: 'warning', icon: UserCheck,    queue: 'HOD'        },
  director_review:   { label: 'Awaiting Director',   variant: 'info',    icon: Building2,    queue: 'Director'   },
  accountant_review: { label: 'Awaiting Accountant', variant: 'info',    icon: Wallet,       queue: 'Accountant' },
  po_ready:          { label: 'PO Ready',            variant: 'success', icon: CheckCircle2, queue: null         },
  rejected:          { label: 'Rejected',            variant: 'danger',  icon: XCircle,      queue: null         },
};

const ROLE_STATUS: Record<ApproverRole, ApprovalStatus> = {
  HOD:        'hod_review',
  Director:   'director_review',
  Accountant: 'accountant_review',
};

const NEXT_STATUS: Record<ApprovalStatus, ApprovalStatus | null> = {
  hod_review:        'director_review',
  director_review:   'accountant_review',
  accountant_review: 'po_ready',
  po_ready:          null,
  rejected:          null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcTotal(q: Pick<ApprovableQuotation, 'quantity' | 'unitPrice' | 'discountPct' | 'taxPct' | 'shippingCharge'>) {
  const sub     = q.quantity * q.unitPrice;
  const disc    = sub * (q.discountPct / 100);
  const taxable = sub - disc;
  const tax     = taxable * (q.taxPct / 100);
  return +(taxable + tax + q.shippingCharge).toFixed(2);
}

function fmtINR(n: number) {
  return `\u20B9${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Seed data ────────────────────────────────────────────────────────────────



// ─── Shared sub-components (mirror AdminRFQs.tsx patterns) ────────────────────

function DetailSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--background-alt)]">
        <Icon size={14} className="text-[var(--primary)]" />
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-4 py-3 space-y-2.5">{children}</div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-[var(--text-subtle)] w-32 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0 text-sm text-[var(--text)] font-medium">{children}</div>
    </div>
  );
}

// ─── Approval History Timeline (mirrors NegotiationHistory) ───────────────────

const ROLE_ICON: Record<ApproverRole, React.ElementType> = {
  HOD:        UserCheck,
  Director:   Building2,
  Accountant: Wallet,
};

function ApprovalHistory({ history }: { history: ApprovalEntry[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-[var(--text-subtle)] italic py-2">No approvals recorded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {history.map((entry, idx) => {
        const RoleIcon  = ROLE_ICON[entry.role];
        const isLast    = idx === history.length - 1;
        const isApprove = entry.action === 'approved';

        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                isApprove ? 'bg-[var(--success)]/10' : 'bg-[var(--danger)]/10',
              )}>
                <RoleIcon size={14} className={isApprove ? 'text-[var(--success)]' : 'text-[var(--danger)]'} />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-[var(--border)] mt-1" />}
            </div>
            <div className={cn('flex-1', isLast ? 'pb-0' : 'pb-3')}>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-sm font-semibold text-[var(--text)]">{entry.role}</span>
                <Badge variant={isApprove ? 'success' : 'danger'} size="xs">
                  {isApprove ? 'Approved' : 'Rejected'}
                </Badge>
              </div>
              {entry.remarks && (
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-1 px-3 py-2 rounded-xl bg-[var(--background-alt)] border border-[var(--border)]">
                  {entry.remarks}
                </p>
              )}
              <p className="text-xs text-[var(--text-subtle)] mt-1">{fmtDateTime(entry.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Remarks Modal (mirrors NegotiateModal) ───────────────────────────────────

interface RemarksModalProps {
  open:     boolean;
  onClose:  () => void;
  mode:     'approve' | 'reject';
  role:     ApproverRole;
  quotNum:  string;
  onSubmit: (remarks: string) => void;
}

function RemarksModal({ open, onClose, mode, role, quotNum, onSubmit }: RemarksModalProps) {
  const [remarks, setRemarks]   = React.useState('');
  const [busy, setBusy]         = React.useState(false);
  const [error, setError]       = React.useState('');
  const isApprove               = mode === 'approve';

  React.useEffect(() => {
    if (open) { setRemarks(''); setError(''); }
  }, [open]);

  const handleSubmit = async () => {
    if (!remarks.trim()) { setError('Please provide a remark before proceeding.'); return; }
    setError('');
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    onSubmit(remarks.trim());
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" title={isApprove ? `Approve as ${role}` : `Reject as ${role}`}>
      <div className="space-y-4">
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl border',
          isApprove ? 'bg-[var(--success)]/5 border-[var(--success)]/30' : 'bg-[var(--danger)]/5 border-[var(--danger)]/30',
        )}>
          {isApprove
            ? <CheckCircle2 size={18} className="text-[var(--success)] shrink-0" />
            : <XCircle      size={18} className="text-[var(--danger)]  shrink-0" />
          }
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">
              {isApprove ? 'Approve & Forward' : 'Reject Quotation'}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{quotNum}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
            Remarks <span className="text-[var(--danger)]">*</span>
          </label>
          <textarea
            id="approval-remarks"
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={isApprove ? 'State your approval reasoning or any conditions…' : 'State the reason for rejection…'}
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
            <AlertCircle size={14} />{error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" onClick={onClose} fullWidth id="appr-modal-cancel">Cancel</Button>
          <Button
            variant={isApprove ? 'primary' : 'destructive'}
            size="md"
            leftIcon={isApprove ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            onClick={handleSubmit}
            isLoading={busy}
            loadingText={isApprove ? 'Approving\u2026' : 'Rejecting\u2026'}
            fullWidth
            id={`appr-modal-confirm-${mode}`}
          >
            {isApprove ? `Approve as ${role}` : 'Confirm Rejection'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Queue stat pill ──────────────────────────────────────────────────────────

interface QueuePillProps {
  label:   string;
  count:   number;
  icon:    React.ElementType;
  active:  boolean;
  variant: 'warning' | 'info';
  onClick: () => void;
}

function QueuePill({ label, count, icon: Icon, active, variant, onClick }: QueuePillProps) {
  const tone = {
    warning: {
      bg:     active ? 'bg-amber-500'     : 'bg-[var(--surface)]',
      border: active ? 'border-amber-500'  : 'border-[var(--border)]',
      text:   active ? 'text-white'       : 'text-amber-600',
      iconBg: active ? 'bg-amber-400/30'  : 'bg-amber-500/10',
    },
    info: {
      bg:     active ? 'bg-[var(--primary)]'     : 'bg-[var(--surface)]',
      border: active ? 'border-[var(--primary)]'  : 'border-[var(--border)]',
      text:   active ? 'text-white'              : 'text-[var(--primary)]',
      iconBg: active ? 'bg-white/20'             : 'bg-[var(--primary)]/10',
    },
  }[variant];

  return (
    <button
      onClick={onClick}
      className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left min-w-[158px]',
        tone.bg, tone.border, !active && 'hover:border-[var(--border-strong)]')}
    >
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', tone.iconBg)}>
        <Icon size={16} className={tone.text} />
      </div>
      <div>
        <p className={cn('text-sm font-semibold', tone.text)}>{label}</p>
        <p className={cn('text-xl font-bold leading-none mt-0.5', tone.text)}>{count}</p>
      </div>
    </button>
  );
}

// ─── Approval chain step indicator ───────────────────────────────────────────

function ApprovalChain({ quotation }: { quotation: ApprovableQuotation }) {
  return (
    <DetailSection icon={ShieldCheck} title="Approval Chain">
      {(['HOD', 'Director', 'Accountant'] as ApproverRole[]).map((role, idx) => {
        const approvedEntry = quotation.history.find((h) => h.role === role && h.action === 'approved');
        const rejectedEntry = quotation.history.find((h) => h.role === role && h.action === 'rejected');
        const isPending     = quotation.status === ROLE_STATUS[role];
        const isApproved    = !!approvedEntry;
        const isRejected    = !!rejectedEntry;

        return (
          <div key={role} className="flex items-center gap-3 py-1">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
              isApproved ? 'bg-[var(--success)]/10' : isRejected ? 'bg-[var(--danger)]/10' : isPending ? 'bg-amber-500/10' : 'bg-[var(--background-alt)]',
            )}>
              {isApproved
                ? <CheckCircle2 size={14} className="text-[var(--success)]" />
                : isRejected
                  ? <XCircle  size={14} className="text-[var(--danger)]" />
                  : <Clock    size={14} className={isPending ? 'text-amber-500' : 'text-[var(--text-subtle)]'} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text)]">{role}</p>
              <p className="text-xs text-[var(--text-subtle)]">
                {isApproved ? `Approved \u00b7 ${fmtDate(approvedEntry!.timestamp)}`
                 : isRejected ? `Rejected \u00b7 ${fmtDate(rejectedEntry!.timestamp)}`
                 : isPending  ? 'Pending review'
                 : 'Waiting'}
              </p>
            </div>
            {idx < 2 && <ChevronRight size={14} className="text-[var(--border)] shrink-0" />}
          </div>
        );
      })}
    </DetailSection>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

interface DetailPanelProps {
  quotation:  ApprovableQuotation;
  activeRole: ApproverRole;
  onBack:     () => void;
  onApprove:  (id: string, role: ApproverRole, remarks: string) => void;
  onReject:   (id: string, role: ApproverRole, remarks: string) => void;
}

function DetailPanel({ quotation, activeRole, onBack, onApprove, onReject }: DetailPanelProps) {
  const [modalMode, setModalMode] = React.useState<'approve' | 'reject' | null>(null);

  const statusCfg  = APPROVAL_STATUS_CONFIG[quotation.status];
  const StatusIcon = statusCfg.icon;
  const isMyQueue  = quotation.status === ROLE_STATUS[activeRole];

  const sub     = quotation.quantity * quotation.unitPrice;
  const disc    = sub * (quotation.discountPct / 100);
  const taxable = sub - disc;
  const tax     = taxable * (quotation.taxPct / 100);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
        className="space-y-5"
      >
        {/* Back bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            id="appr-detail-back"
          >
            <ArrowLeft size={15} />
            Back to queue
          </button>
          <div className="h-4 w-px bg-[var(--border)]" />
          <span className="font-mono font-semibold text-[var(--text)]">{quotation.quotationNumber}</span>
          <Badge variant={statusCfg.variant} size="sm" icon={<StatusIcon size={11} />}>
            {statusCfg.label}
          </Badge>
          <span className="text-xs text-[var(--text-subtle)] ml-auto">
            Submitted {fmtDateTime(quotation.sentAt)}
          </span>
        </div>

        {/* Action bar */}
        {isMyQueue && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border bg-[var(--background-alt)] border-[var(--border)]">
            <BadgeCheck size={15} className="text-[var(--primary)] shrink-0" />
            <span className="text-sm text-[var(--text-muted)] flex-1">
              Awaiting <strong>{activeRole}</strong> approval.
            </span>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="destructive" size="sm" leftIcon={<XCircle size={14} />}
                onClick={() => setModalMode('reject')} id="appr-action-reject"
              >
                Reject
              </Button>
              <Button
                variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />}
                onClick={() => setModalMode('approve')} id="appr-action-approve"
              >
                {activeRole === 'Accountant' ? 'Approve & Mark PO Ready' : 'Approve & Forward'}
              </Button>
            </div>
          </div>
        )}

        {/* Terminal banners */}
        {quotation.status === 'po_ready' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/5">
            <CheckCircle2 size={16} className="text-[var(--success)] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Full approval chain complete. PO Ready.</p>
              <p className="text-xs text-[var(--text-muted)]">Approved by HOD, Director and Accountant. Proceed to issue a Purchase Order.</p>
            </div>
          </div>
        )}
        {quotation.status === 'rejected' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/5">
            <XCircle size={16} className="text-[var(--danger)] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Quotation rejected.</p>
              <p className="text-xs text-[var(--text-muted)]">Rejected during the approval process. See history below.</p>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">

          {/* Left */}
          <div className="space-y-4">

            {/* Financials */}
            <DetailSection icon={Receipt} title="Quotation Financials">
              <div className="overflow-x-auto mb-3">
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
                      <td className="py-2.5 pr-4 font-medium text-[var(--text)]">{quotation.productName}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--text)]">{quotation.quantity.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[var(--text)]">{fmtINR(quotation.unitPrice)}</td>
                      <td className="py-2.5 pl-3 text-right font-semibold text-[var(--text)]">{fmtINR(sub)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Subtotal', value: fmtINR(sub) },
                  { label: `Discount (${quotation.discountPct}%)`, value: `-${fmtINR(disc)}` },
                  { label: `GST / Tax (${quotation.taxPct}%)`, value: fmtINR(tax) },
                  { label: 'Shipping & Handling', value: quotation.shippingCharge === 0 ? 'Free' : fmtINR(quotation.shippingCharge) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-[var(--text-muted)]">{label}</span>
                    <span className="text-sm font-medium tabular-nums text-[var(--text)]">{value}</span>
                  </div>
                ))}
                <div className="border-t border-[var(--border)] pt-1.5 flex items-center justify-between gap-2">
                  <span className="font-bold text-[var(--text)]">Grand Total</span>
                  <span className="font-bold text-[var(--primary)] text-base tabular-nums">{fmtINR(quotation.grandTotal)}</span>
                </div>
              </div>
            </DetailSection>

            {/* Customer */}
            <DetailSection icon={User} title="Customer / Buyer">
              <DetailRow label="Name"><span>{quotation.customerName}</span></DetailRow>
              <DetailRow label="Company"><span className="text-[var(--text-muted)]">{quotation.customerCompany}</span></DetailRow>
              <DetailRow label="Email">
                <a href={`mailto:${quotation.customerEmail}`} className="text-[var(--primary)] hover:underline">{quotation.customerEmail}</a>
              </DetailRow>
            </DetailSection>

            {/* Terms */}
            {quotation.termsNotes && (
              <DetailSection icon={ClipboardList} title="Terms & Conditions">
                <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">{quotation.termsNotes}</p>
              </DetailSection>
            )}

            {/* History */}
            <DetailSection icon={Clock} title={`Approval History (${quotation.history.length} ${quotation.history.length === 1 ? 'entry' : 'entries'})`}>
              <ApprovalHistory history={quotation.history} />
            </DetailSection>

          </div>

          {/* Right */}
          <div className="space-y-4">

            {/* Product */}
            <DetailSection icon={quotation.productType === 'existing' ? Package : Sparkles} title="Product / Requirement">
              <DetailRow label="Product"><span className="leading-snug">{quotation.productName}</span></DetailRow>
              <DetailRow label="Type">
                <Badge variant={quotation.productType === 'existing' ? 'primary' : 'info'} size="xs">
                  {quotation.productType === 'existing' ? 'ElectroHub Catalogue' : 'Custom / External'}
                </Badge>
              </DetailRow>
            </DetailSection>

            {/* Delivery */}
            <DetailSection icon={Truck} title="Delivery">
              <DetailRow label="Location">
                <span className="flex items-start gap-1">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-[var(--text-subtle)]" />
                  {quotation.deliveryLocation}
                </span>
              </DetailRow>
              <DetailRow label="Expected By">
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-[var(--text-subtle)]" />
                  {fmtDate(quotation.expectedDelivery)}
                </span>
              </DetailRow>
              <DetailRow label="Valid Until"><span>{fmtDate(quotation.validUntil)}</span></DetailRow>
            </DetailSection>

            {/* Meta */}
            <DetailSection icon={FileText} title="Quotation Meta">
              <DetailRow label="Quotation #"><span className="font-mono text-xs">{quotation.quotationNumber}</span></DetailRow>
              <DetailRow label="For RFQ"><span className="font-mono text-xs">{quotation.rfqNumber}</span></DetailRow>
              <DetailRow label="Status">
                <Badge variant={statusCfg.variant} size="xs" icon={<StatusIcon size={10} />}>{statusCfg.label}</Badge>
              </DetailRow>
              <DetailRow label="Submitted"><span className="text-xs text-[var(--text-muted)] font-normal">{fmtDateTime(quotation.sentAt)}</span></DetailRow>
              <DetailRow label="Last Updated"><span className="text-xs text-[var(--text-muted)] font-normal">{fmtDateTime(quotation.updatedAt)}</span></DetailRow>
            </DetailSection>

            {/* Chain progress */}
            <ApprovalChain quotation={quotation} />

          </div>
        </div>
      </motion.div>

      {/* Remarks modal */}
      {modalMode && (
        <RemarksModal
          open
          onClose={() => setModalMode(null)}
          mode={modalMode}
          role={activeRole}
          quotNum={quotation.quotationNumber}
          onSubmit={(remarks) => {
            if (modalMode === 'approve') onApprove(quotation.id, activeRole, remarks);
            else onReject(quotation.id, activeRole, remarks);
            setModalMode(null);
          }}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main AdminApprovals Component
// ═══════════════════════════════════════════════════════════════════════════════

export function AdminApprovals() {
  const [quotations, setQuotations] = React.useState<ApprovableQuotation[]>([]);
  const [activeRole, setActiveRole] = React.useState<ApproverRole>('HOD');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [search, setSearch]         = React.useState('');
  const [loading, setLoading]       = React.useState(true);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminQuotationApi.listQuotations();
      const mapped = (Array.isArray(res) ? res : (res as any).results ?? [])
        .filter((q: any) => q.approval != null)
        .map((q: any) => ({
          id: q.id.toString(),
          quotationNumber: q.quotation_number,
          rfqNumber: q.rfq_number,
          customerName: q.customer_name,
          customerEmail: q.customer_email,
          customerCompany: q.customer_name,
          productName: q.product_name,
          productType: q.product_type,
          quantity: q.quantity,
          unitPrice: parseFloat(q.unit_price),
          discountPct: parseFloat(q.discount_pct),
          taxPct: parseFloat(q.tax_pct),
          shippingCharge: parseFloat(q.shipping_charge),
          grandTotal: q.grand_total,
          deliveryLocation: q.delivery_location,
          expectedDelivery: q.expected_delivery || '',
          validUntil: q.valid_until || '',
          termsNotes: q.terms_notes,
          status: q.approval!.approval_status as ApprovalStatus,
          sentAt: q.sent_at || q.created_at,
          updatedAt: q.approval!.updated_at,
          history: q.approval!.entries.map((e: any) => ({
            id: e.id.toString(),
            role: e.approver_role as ApproverRole,
            action: e.action,
            remarks: e.remarks,
            timestamp: e.timestamp,
          })),
        }));
      setQuotations(mapped);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleApprove = async (id: string, role: ApproverRole, remarks: string) => {
    try {
      await adminQuotationApi.approveQuotation(Number(id), remarks);
      toast.success(`Quotation approved by ${role}`);
      await loadData();
      setSelectedId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve quotation');
    }
  };

  const handleReject = async (id: string, role: ApproverRole, remarks: string) => {
    try {
      await adminQuotationApi.rejectApproval(Number(id), remarks);
      toast.info(`Quotation rejected by ${role}`);
      await loadData();
      setSelectedId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject quotation');
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const hodCount        = quotations.filter((q) => q.status === 'hod_review').length;
  const directorCount   = quotations.filter((q) => q.status === 'director_review').length;
  const accountantCount = quotations.filter((q) => q.status === 'accountant_review').length;
  const poReadyCount    = quotations.filter((q) => q.status === 'po_ready').length;
  const rejectedCount   = quotations.filter((q) => q.status === 'rejected').length;

  const filtered = React.useMemo(() => {
    const s = search.toLowerCase();
    return quotations.filter((q) => {
      // Show active queue items + closed items (po_ready, rejected) for context
      const inQueue = q.status === ROLE_STATUS[activeRole] || q.status === 'po_ready' || q.status === 'rejected';
      if (!inQueue) return false;
      if (!s) return true;
      return (
        q.quotationNumber.toLowerCase().includes(s) ||
        q.rfqNumber.toLowerCase().includes(s) ||
        q.customerName.toLowerCase().includes(s) ||
        q.customerEmail.toLowerCase().includes(s) ||
        q.productName.toLowerCase().includes(s)
      );
    });
  }, [quotations, activeRole, search]);

  const pendingCount = quotations.filter((q) => q.status === ROLE_STATUS[activeRole]).length;

  const selectedQ = quotations.find((q) => q.id === selectedId) ?? null;

  // ── Detail view ───────────────────────────────────────────────────────────────
  if (selectedQ) {
    return (
      <DetailPanel
        quotation={selectedQ}
        activeRole={activeRole}
        onBack={() => setSelectedId(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Approval Workflow
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1.5 text-[11px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">HOD &rarr; Director &rarr; Accountant &rarr; PO Ready</p>
        </div>

        <div className="w-full md:w-72">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
            <Input
              id="appr-search"
              aria-label="Search approvals"
              className="pl-9"
              placeholder="Search quotation #, customer, product\u2026"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Queue pills */}
      <div className="flex flex-wrap gap-3">
        <QueuePill label="HOD Queue"        count={hodCount}        icon={UserCheck}  active={activeRole === 'HOD'}        variant="warning" onClick={() => { setActiveRole('HOD');        setSearch(''); }} />
        <QueuePill label="Director Queue"   count={directorCount}   icon={Building2}  active={activeRole === 'Director'}   variant="info"    onClick={() => { setActiveRole('Director');   setSearch(''); }} />
        <QueuePill label="Accountant Queue" count={accountantCount} icon={Wallet}     active={activeRole === 'Accountant'} variant="info"    onClick={() => { setActiveRole('Accountant'); setSearch(''); }} />

        <div className="w-px bg-[var(--border)] self-stretch mx-1 hidden sm:block" />

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/5 text-sm">
            <CheckCircle2 size={14} className="text-[var(--success)]" />
            <span className="font-semibold text-[var(--success)]">{poReadyCount} PO Ready</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 text-sm">
            <XCircle size={14} className="text-[var(--danger)]" />
            <span className="font-semibold text-[var(--danger)]">{rejectedCount} Rejected</span>
          </div>
        </div>
      </div>

      {/* Flow indicator breadcrumb */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background-alt)]">
        {(['HOD', 'Director', 'Accountant'] as ApproverRole[]).map((role, idx) => (
          <React.Fragment key={role}>
            <button
              onClick={() => { setActiveRole(role); setSearch(''); }}
              id={`appr-tab-${role.toLowerCase()}`}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                activeRole === role
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              {role === 'HOD'        && <UserCheck  size={12} />}
              {role === 'Director'   && <Building2  size={12} />}
              {role === 'Accountant' && <Wallet     size={12} />}
              {role}
              <span className={cn(
                'h-4 min-w-[16px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center',
                activeRole === role ? 'bg-white/20 text-white' : 'bg-[var(--background-alt)] text-[var(--text-subtle)]',
              )}>
                {quotations.filter((q) => q.status === ROLE_STATUS[role]).length}
              </span>
            </button>
            {idx < 2 && <ChevronRight size={14} className="text-[var(--border)] shrink-0" />}
          </React.Fragment>
        ))}
        <span className="ml-1 text-[var(--border)]">&rarr;</span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--success)]/10 text-[var(--success)]">
          <CheckCircle2 size={12} />
          PO Ready
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] py-16 text-center">
          <p className="font-semibold text-[var(--text)]">Loading...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] py-16 text-center">
          <ClipboardList size={32} className="mx-auto text-[var(--text-subtle)] mb-3" />
          <p className="font-semibold text-[var(--text)]">
            {search ? 'No matching quotations' : `No quotations in ${activeRole} queue`}
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {search ? 'Try adjusting your search.' : `Quotations forwarded to the ${activeRole} will appear here.`}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background-alt)] text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Quotation #</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Product</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Grand Total</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Stage</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Updated</th>
                  <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((q, idx) => {
                    const cfg       = APPROVAL_STATUS_CONFIG[q.status];
                    const CfgIcon   = cfg.icon;
                    const isPending = q.status === ROLE_STATUS[activeRole];

                    return (
                      <motion.tr
                        key={q.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: idx * 0.04 } }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          'border-b border-[var(--border)] last:border-none',
                          'hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group',
                          isPending && 'bg-amber-500/[0.02]',
                        )}
                        onClick={() => setSelectedId(q.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isPending && <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />}
                            <span className="font-mono font-semibold text-[var(--text)] whitespace-nowrap">{q.quotationNumber}</span>
                          </div>
                          <p className="text-xs text-[var(--text-subtle)] font-normal mt-0.5">{q.rfqNumber}</p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--text)] whitespace-nowrap">{q.customerName}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate max-w-[160px]">{q.customerCompany}</p>
                        </td>

                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="flex items-start gap-1.5">
                            {q.productType === 'custom'
                              ? <Sparkles size={13} className="text-violet-500 shrink-0 mt-0.5" />
                              : <Package   size={13} className="text-blue-500  shrink-0 mt-0.5" />
                            }
                            <span className="text-[var(--text)] line-clamp-2 leading-snug">{q.productName}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-semibold text-[var(--text)] whitespace-nowrap tabular-nums">
                          {fmtINR(q.grandTotal)}
                        </td>

                        <td className="px-4 py-3">
                          <Badge variant={cfg.variant} size="sm" icon={<CfgIcon size={11} />}>{cfg.label}</Badge>
                        </td>

                        <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap text-xs">
                          <span title={fmtDateTime(q.updatedAt)}>{timeAgo(q.updatedAt)}</span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {isPending ? (
                              <>
                                <Button
                                  variant="destructive" size="xs" leftIcon={<XCircle size={12} />}
                                  onClick={(e) => { e.stopPropagation(); setSelectedId(q.id); }}
                                  id={`appr-row-reject-${q.id}`}
                                >
                                  Reject
                                </Button>
                                <Button
                                  variant="primary" size="xs" leftIcon={<CheckCircle2 size={12} />}
                                  onClick={(e) => { e.stopPropagation(); setSelectedId(q.id); }}
                                  id={`appr-row-review-${q.id}`}
                                >
                                  Review
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="secondary" size="xs" rightIcon={<ChevronRight size={12} />}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(q.id); }}
                                id={`appr-row-view-${q.id}`}
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
