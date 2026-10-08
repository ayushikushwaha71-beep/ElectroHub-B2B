'use client';

/**
 * ElectroHub — Admin Purchase Order
 * Rendered inside AdminDashboard when the "Purchase Order" nav item is active.
 *
 * For each po_ready quotation admin can:
 *  1. View the auto-generated PO document (buyer / seller, line items, totals, terms)
 *  2. Print / Download the PO document
 *  3. Mark the PO as "Issued" (mock, transitions po_issued badge)
 *  4. View a PO issuance log per quotation
 *
 * Document layout mirrors PreviewModal in AdminQuotationBuilder.tsx.
 * List/detail shell mirrors AdminApprovals.tsx patterns exactly.
 *
 * All state is local/mock. No backend. No new routes.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Hash,
  MapPin,
  Package,
  Phone,
  Printer,
  Receipt,
  Search,
  Send,
  Sparkles,
  Stamp,
  Truck,
  User,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge }  from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';
import { Modal }  from '@/components/ui/Modal';
import { toast }  from '@/components/ui/Toast';
import { adminQuotationApi } from '@/lib/quotation-api';
import type { ApprovableQuotation, ApproverRole, ApprovalStatus } from './AdminApprovals';

export type POStatus = 'pending' | 'issued' | 'acknowledged';

const PO_STATUS_CONFIG: Record<POStatus, { label: string; variant: 'warning' | 'success' | 'info'; icon: React.ElementType }> = {
  pending:      { label: 'Pending Issuance', variant: 'warning', icon: Clock         },
  issued:       { label: 'PO Issued',        variant: 'success', icon: CheckCircle2  },
  acknowledged: { label: 'Acknowledged',     variant: 'info',    icon: Stamp          },
};

// ─── PO Issue log entry ───────────────────────────────────────────────────────

export interface POIssueEntry {
  id:        string;
  action:    'issued' | 'acknowledged';
  by:        string;
  notes:     string;
  timestamp: string;
}

// ─── Per-quotation PO record ──────────────────────────────────────────────────

export interface PORecord {
  quotationId: string;
  poNumber:    string;
  status:      POStatus;
  issuedAt:    string | null;
  log:         POIssueEntry[];
}

// ─── Formatters ───────────────────────────────────────────────────────────────

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

function poNumberFromQuot(quotNumber: string) {
  return `PO-${quotNumber.replace('QT-', '')}`;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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

// ─── PO Document (printable layout, mirroring PreviewModal body) ──────────────

function PODocument({ quotation, poNumber }: { quotation: ApprovableQuotation; poNumber: string }) {
  const sub     = quotation.quantity * quotation.unitPrice;
  const disc    = sub * (quotation.discountPct / 100);
  const taxable = sub - disc;
  const tax     = taxable * (quotation.taxPct / 100);

  return (
    <div
      id="po-print-root"
      className="space-y-5 text-sm bg-[var(--background-card)] rounded-2xl border border-[var(--border)] p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">ElectroHub</span>
            <span className="text-[var(--text-subtle)]">\u00b7</span>
            <span className="text-xs text-[var(--text-subtle)]">Purchase Order</span>
          </div>
          <h2 className="text-xl font-bold font-display text-[var(--text)] font-mono">{poNumber}</h2>
          <p className="text-xs text-[var(--text-subtle)] mt-0.5">
            Quotation ref: {quotation.quotationNumber} \u00b7 RFQ ref: {quotation.rfqNumber}
          </p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <Badge variant="success" size="sm" icon={<CheckCircle2 size={11} />}>PO Ready</Badge>
          <p className="text-xs text-[var(--text-subtle)]">Date: {fmtDate(new Date().toISOString())}</p>
          <p className="text-xs text-[var(--text-subtle)]">Valid until: {fmtDate(quotation.validUntil)}</p>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-6">
        {/* From (Buyer — ElectroHub is raising PO to vendor on behalf of customer) */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)] mb-1.5">Buyer / Consignee</p>
          <p className="font-semibold text-[var(--text)]">{quotation.customerName}</p>
          <p className="text-[var(--text-muted)] text-xs">{quotation.customerCompany}</p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">{quotation.customerEmail}</p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5 flex items-start gap-1">
            <MapPin size={10} className="mt-0.5 shrink-0" />
            {quotation.deliveryLocation}
          </p>
        </div>
        {/* To (Seller — ElectroHub) */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)] mb-1.5">Seller / Supplier</p>
          <p className="font-semibold text-[var(--text)]">ElectroHub Pvt. Ltd.</p>
          <p className="text-[var(--text-muted)] text-xs">123 Electronics Hub, Koramangala</p>
          <p className="text-[var(--text-muted)] text-xs">Bengaluru, Karnataka 560034</p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">GST: 29ABCDE1234F1Z5</p>
          <p className="text-[var(--text-muted)] text-xs">procurement@electrohub.in</p>
        </div>
      </div>

      {/* Line items table */}
      <div className="rounded-xl overflow-hidden border border-[var(--border)] print:overflow-visible print:border-none">
        <table className="min-w-full text-sm print:break-inside-auto">
          <thead className="print:table-header-group">
            <tr className="bg-[var(--background-alt)] border-b border-[var(--border)]">
              <th className="px-4 py-2.5 text-left font-semibold text-[var(--text-muted)] text-xs">#</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[var(--text-muted)] text-xs">Description</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">Qty</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">HSN/SAC</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">Unit Price</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">Amount</th>
            </tr>
          </thead>
          <tbody className="print:break-inside-auto divide-y divide-[var(--border)]">
            <tr className="print:break-inside-avoid">
              <td className="px-4 py-3 text-[var(--text-muted)]">1</td>
              <td className="px-4 py-3">
                <p className="font-medium text-[var(--text)]">{quotation.productName}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {quotation.productType === 'custom' ? 'Custom / External' : 'ElectroHub Catalogue Item'}
                </p>
              </td>
              <td className="px-4 py-3 text-right text-[var(--text)]">{quotation.quantity.toLocaleString('en-IN')}</td>
              <td className="px-4 py-3 text-right text-[var(--text-muted)] text-xs">8542</td>
              <td className="px-4 py-3 text-right text-[var(--text)] font-medium">{fmtINR(quotation.unitPrice)}</td>
              <td className="px-4 py-3 text-right font-semibold text-[var(--text)]">{fmtINR(sub)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-80 space-y-1.5">
          {[
            { label: 'Subtotal',                            value: fmtINR(sub)   },
            { label: `Discount (${quotation.discountPct}%)`, value: `-${fmtINR(disc)}` },
            { label: `GST / Tax (${quotation.taxPct}%)`,    value: fmtINR(tax)   },
            { label: 'Shipping & Handling',                  value: quotation.shippingCharge === 0 ? 'Free' : fmtINR(quotation.shippingCharge) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">{label}</span>
              <span className="text-[var(--text)] tabular-nums">{value}</span>
            </div>
          ))}
          <div className="border-t border-[var(--border)] pt-1.5 flex justify-between">
            <span className="font-bold text-[var(--text)]">Grand Total</span>
            <span className="font-bold text-[var(--primary)] text-base tabular-nums">{fmtINR(quotation.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Delivery & Commercial */}
      <div className="grid grid-cols-2 gap-4 text-xs text-[var(--text-muted)]">
        <div>
          <p className="font-semibold text-[var(--text)] mb-1">Delivery Details</p>
          <p>Location: {quotation.deliveryLocation}</p>
          <p>Expected by: {fmtDate(quotation.expectedDelivery)}</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--text)] mb-1">Commercial Terms</p>
          <p>Payment: 50% advance, balance before dispatch</p>
          <p>Currency: INR (Indian Rupees)</p>
        </div>
      </div>

      {/* Terms */}
      {quotation.termsNotes && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background-alt)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)] mb-1.5">
            Terms & Conditions
          </p>
          <p className="text-xs text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed">
            {quotation.termsNotes}
          </p>
        </div>
      )}

      {/* Approval chain summary */}
      <div className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/5 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--success)] mb-1.5">
          Internal Approval Status
        </p>
        <div className="flex items-center gap-3 flex-wrap text-xs text-[var(--text-muted)]">
          {(['HOD', 'Director', 'Accountant'] as const).map((role, idx) => {
            const entry = quotation.history.find((h) => h.role === role && h.action === 'approved');
            return (
              <React.Fragment key={role}>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className={entry ? 'text-[var(--success)]' : 'text-[var(--text-subtle)]'} />
                  <span className={entry ? 'text-[var(--text)]' : 'text-[var(--text-subtle)]'}>{role}</span>
                  {entry && <span className="text-[var(--text-subtle)]">({fmtDate(entry.timestamp)})</span>}
                </span>
                {idx < 2 && <ChevronRight size={12} className="text-[var(--border)]" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-[var(--text-subtle)] text-center italic">
        This is a system-generated Purchase Order. Approved and authorised by ElectroHub internal procurement team.
      </p>
    </div>
  );
}

// ─── Issue PO Modal ───────────────────────────────────────────────────────────

function IssuePOModal({
  open,
  onClose,
  quotation,
  poNumber,
  onIssue,
}: {
  open:      boolean;
  onClose:   () => void;
  quotation: ApprovableQuotation;
  poNumber:  string;
  onIssue:   (notes: string) => void;
}) {
  const [notes, setNotes]       = React.useState('');
  const [busy, setBusy]         = React.useState(false);

  React.useEffect(() => {
    if (open) setNotes('');
  }, [open]);

  const handleIssue = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 800));
    setBusy(false);
    onIssue(notes.trim());
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" title="Issue Purchase Order">
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/5">
          <Stamp size={18} className="text-[var(--success)] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Issue {poNumber}</p>
            <p className="text-xs text-[var(--text-muted)]">{quotation.quotationNumber} \u00b7 {quotation.customerCompany}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
            Issuance Notes <span className="text-[var(--text-subtle)] font-normal">(optional)</span>
          </label>
          <textarea
            id="po-issue-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes for the vendor or internal team\u2026"
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none transition-all',
              'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]',
              'placeholder:text-[var(--text-subtle)]',
              'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
            )}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" onClick={onClose} fullWidth id="po-issue-cancel">Cancel</Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Stamp size={14} />}
            onClick={handleIssue}
            isLoading={busy}
            loadingText="Issuing\u2026"
            fullWidth
            id="po-issue-confirm"
          >
            Issue PO
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── PO Issuance Log timeline ─────────────────────────────────────────────────

function POLog({ log }: { log: POIssueEntry[] }) {
  if (log.length === 0) {
    return <p className="text-sm text-[var(--text-subtle)] italic py-2">PO not yet issued.</p>;
  }

  const ACTION_ICON: Record<POIssueEntry['action'], React.ElementType> = {
    issued:       Stamp,
    acknowledged: CheckCircle2,
  };
  const ACTION_COLOR: Record<POIssueEntry['action'], string> = {
    issued:       'text-[var(--primary)]',
    acknowledged: 'text-[var(--success)]',
  };
  const ACTION_BG: Record<POIssueEntry['action'], string> = {
    issued:       'bg-[var(--primary)]/10',
    acknowledged: 'bg-[var(--success)]/10',
  };

  return (
    <div className="space-y-3">
      {log.map((entry, idx) => {
        const Icon   = ACTION_ICON[entry.action];
        const isLast = idx === log.length - 1;
        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', ACTION_BG[entry.action])}>
                <Icon size={14} className={ACTION_COLOR[entry.action]} />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-[var(--border)] mt-1" />}
            </div>
            <div className={cn('flex-1', isLast ? 'pb-0' : 'pb-3')}>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-sm font-semibold text-[var(--text)] capitalize">{entry.action}</span>
                <span className="text-xs text-[var(--text-subtle)]">by {entry.by}</span>
              </div>
              {entry.notes && (
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-1 px-3 py-2 rounded-xl bg-[var(--background-alt)] border border-[var(--border)]">
                  {entry.notes}
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

// ─── Detail panel ─────────────────────────────────────────────────────────────

interface PODetailPanelProps {
  quotation: ApprovableQuotation;
  record:    PORecord;
  onBack:    () => void;
  onIssue:   (quotId: string, notes: string) => void;
  onNavigateToInvoice?: () => void;
}

function PODetailPanel({ quotation, record, onBack, onIssue, onNavigateToInvoice }: PODetailPanelProps) {
  const [issueOpen, setIssueOpen] = React.useState(false);

  const statusCfg  = PO_STATUS_CONFIG[record.status];
  const StatusIcon = statusCfg.icon;

  const handlePrint = () => {
    window.print();
    toast.info('Print dialog opened');
  };

  const handleDownload = () => {
    window.print();
    toast.info('Print dialog opened for PDF generation');
  };

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
            id="po-detail-back"
          >
            <ArrowLeft size={15} />
            Back to PO list
          </button>
          <div className="h-4 w-px bg-[var(--border)]" />
          <span className="font-mono font-semibold text-[var(--text)]">{record.poNumber}</span>
          <Badge variant={statusCfg.variant} size="sm" icon={<StatusIcon size={11} />}>
            {statusCfg.label}
          </Badge>

          {/* Actions */}
          <div className="ml-auto flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Printer size={14} />}
              onClick={handlePrint}
              id="po-print-btn"
            >
              Print
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={handleDownload}
              id="po-download-btn"
            >
              Download PDF
            </Button>
            {record.status === 'pending' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Stamp size={14} />}
                onClick={() => setIssueOpen(true)}
                id="po-issue-btn"
              >
                Issue PO
              </Button>
            )}
            {record.status !== 'pending' && onNavigateToInvoice && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Receipt size={14} />}
                onClick={onNavigateToInvoice}
                id="po-create-invoice-btn"
              >
                Create Invoice
              </Button>
            )}
          </div>
        </div>

        {/* Two-column: Document + sidebar */}
        <div className="grid gap-5 xl:grid-cols-[1fr_300px]">

          {/* PO Document */}
          <PODocument quotation={quotation} poNumber={record.poNumber} />

          {/* Sidebar */}
          <div className="space-y-4">

            {/* PO Meta */}
            <DetailSection icon={Hash} title="PO Details">
              <DetailRow label="PO Number"><span className="font-mono text-xs">{record.poNumber}</span></DetailRow>
              <DetailRow label="Quotation #"><span className="font-mono text-xs">{quotation.quotationNumber}</span></DetailRow>
              <DetailRow label="RFQ #"><span className="font-mono text-xs">{quotation.rfqNumber}</span></DetailRow>
              <DetailRow label="Status">
                <Badge variant={statusCfg.variant} size="xs" icon={<StatusIcon size={10} />}>{statusCfg.label}</Badge>
              </DetailRow>
              {record.issuedAt && (
                <DetailRow label="Issued On"><span className="text-xs text-[var(--text-muted)] font-normal">{fmtDateTime(record.issuedAt)}</span></DetailRow>
              )}
            </DetailSection>

            {/* Buyer */}
            <DetailSection icon={User} title="Buyer">
              <DetailRow label="Name"><span>{quotation.customerName}</span></DetailRow>
              <DetailRow label="Company"><span className="text-[var(--text-muted)]">{quotation.customerCompany}</span></DetailRow>
              <DetailRow label="Email">
                <a href={`mailto:${quotation.customerEmail}`} className="text-[var(--primary)] hover:underline">{quotation.customerEmail}</a>
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
            </DetailSection>

            {/* PO Log */}
            <DetailSection icon={Clock} title={`PO Activity Log (${record.log.length})`}>
              <POLog log={record.log} />
            </DetailSection>

          </div>
        </div>
      </motion.div>

      {/* Issue modal */}
      <IssuePOModal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        quotation={quotation}
        poNumber={record.poNumber}
        onIssue={(notes) => {
          onIssue(quotation.id, notes);
          setIssueOpen(false);
        }}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main AdminPurchaseOrder Component
// ═══════════════════════════════════════════════════════════════════════════════

export function AdminPurchaseOrder({
  onNavigateToInvoice,
}: {
  onNavigateToInvoice?: () => void;
}) {
  const [quotations, setQuotations] = React.useState<ApprovableQuotation[]>([]);
  const [search, setSearch]         = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [records, setRecords]       = React.useState<Record<string, PORecord>>({});
  const [loading, setLoading]       = React.useState(true);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [quotRes, poRes] = await Promise.all([
        adminQuotationApi.listQuotations(),
        adminQuotationApi.listPOs()
      ]);

      const poReadyQuots = quotRes.data
        .filter((q) => q.approval?.approval_status === 'po_ready')
        .map((q) => ({
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
          status: 'po_ready' as ApprovalStatus,
          sentAt: q.sent_at || q.created_at,
          updatedAt: q.approval!.updated_at,
          history: q.approval!.entries.map((e) => ({
            id: e.id.toString(),
            role: e.approver_role as ApproverRole,
            action: e.action,
            remarks: e.remarks,
            timestamp: e.timestamp,
          })),
        }));

      setQuotations(poReadyQuots);

      const newRecords: Record<string, PORecord> = {};
      const posByQuotId = new Map(poRes.data.map(po => [po.quotation.toString(), po]));

      for (const q of poReadyQuots) {
        const existingPo = posByQuotId.get(q.id);
        if (existingPo) {
          newRecords[q.id] = {
            quotationId: q.id,
            poNumber: existingPo.po_number,
            status: existingPo.status,
            issuedAt: existingPo.issued_at || null,
            log: existingPo.log.map(l => ({
              id: l.id.toString(),
              action: l.action as 'issued' | 'acknowledged',
              by: l.actor_name,
              notes: l.notes,
              timestamp: l.timestamp
            }))
          };
        } else {
          newRecords[q.id] = {
            quotationId: q.id,
            poNumber: poNumberFromQuot(q.quotationNumber),
            status: 'pending',
            issuedAt: null,
            log: []
          };
        }
      }
      setRecords(newRecords);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleIssue = async (quotId: string, notes: string) => {
    try {
      await adminQuotationApi.issuePO(Number(quotId), notes);
      toast.success('PO issued successfully');
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to issue PO');
    }
  };

  if (selectedQ && selectedRec) {
    return (
      <PODetailPanel
        quotation={selectedQ}
        record={selectedRec}
        onBack={() => setSelectedId(null)}
        onIssue={handleIssue}
        onNavigateToInvoice={onNavigateToInvoice}
      />
    );
  }

  const issuedCount  = Object.values(records).filter((r) => r.status !== 'pending').length;
  const pendingCount = Object.values(records).filter((r) => r.status === 'pending').length;

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
            Purchase Orders
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            PO Ready quotations \u00b7 {issuedCount} issued \u00b7 {pendingCount} pending
          </p>
        </div>

        <div className="w-full md:w-72">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
            <Input
              id="po-search"
              aria-label="Search purchase orders"
              className="pl-9"
              placeholder="Search quotation #, customer\u2026"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] py-16 text-center">
          <p className="font-semibold text-[var(--text)]">Loading...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] py-16 text-center">
          <p className="font-semibold text-[var(--text)]">No purchase orders found</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background-alt)] text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">PO Number</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Product</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Grand Total</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Issued On</th>
                  <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((q, idx) => {
                    const rec       = records[q.id];
                    if (!rec) return null;
                    const cfg       = PO_STATUS_CONFIG[rec.status];
                    const CfgIcon   = cfg.icon;
                    const isPending = rec.status === 'pending';

                    return (
                      <motion.tr
                        key={q.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: idx * 0.04 } }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          'border-b border-[var(--border)] last:border-none',
                          'hover:bg-[var(--surface-hover)] transition-colors cursor-pointer',
                          isPending && 'bg-amber-500/[0.02]',
                        )}
                        onClick={() => setSelectedId(q.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isPending && <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />}
                            <span className="font-mono font-semibold text-[var(--text)] whitespace-nowrap">{rec.poNumber}</span>
                          </div>
                          <p className="text-xs text-[var(--text-subtle)] font-normal mt-0.5">{q.quotationNumber}</p>
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

                        <td className="px-4 py-3 text-xs text-[var(--text-muted)] whitespace-nowrap">
                          {rec.issuedAt ? <span title={fmtDateTime(rec.issuedAt)}>{timeAgo(rec.issuedAt)}</span> : <span className="text-[var(--text-subtle)]">\u2014</span>}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {isPending ? (
                              <Button
                                variant="primary"
                                size="xs"
                                leftIcon={<Stamp size={12} />}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(q.id); }}
                                id={`po-row-issue-${q.id}`}
                              >
                                Issue PO
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="xs"
                                leftIcon={<FileText size={12} />}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(q.id); }}
                                id={`po-row-view-${q.id}`}
                              >
                                View PO
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
