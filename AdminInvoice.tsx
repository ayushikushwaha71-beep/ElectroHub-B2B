'use client';

/**
 * ElectroHub — Admin Invoice
 * Rendered inside AdminDashboard when the "Invoice" nav item is active.
 *
 * For each po_issued quotation admin can:
 *  1. Generate and view a GST-compliant invoice (INV number, HSN, CGST/SGST/IGST, due date)
 *  2. Print / Download the invoice document
 *  3. Send the invoice to the customer (mock)
 *  4. Mark invoice as paid (transitions to payment_confirmed)
 *
 * Document layout mirrors PODocument in AdminPurchaseOrder.tsx.
 * List/detail shell mirrors AdminApprovals.tsx patterns exactly.
 *
 * All state is local/mock. No backend. No new routes.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  FileText,
  Hash,
  IndianRupee,
  MapPin,
  Package,
  Percent,
  Phone,
  Printer,
  Receipt,
  Search,
  Send,
  Sparkles,
  Stamp,
  Truck,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge }  from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';
import { Modal }  from '@/components/ui/Modal';
import { toast }  from '@/components/ui/Toast';
import { adminQuotationApi } from '@/lib/quotation-api';
import type { ApprovableQuotation, ApproverRole, ApprovalStatus } from './AdminApprovals';

// ─── Invoice status ───────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'payment_confirmed';

const INV_STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; variant: 'default' | 'warning' | 'info' | 'success'; icon: React.ElementType }
> = {
  draft:             { label: 'Draft',              variant: 'default', icon: FileText    },
  sent:              { label: 'Invoice Sent',        variant: 'info',    icon: Send        },
  payment_confirmed: { label: 'Payment Confirmed',   variant: 'success', icon: CheckCircle2 },
};

// ─── Invoice log entry ────────────────────────────────────────────────────────

export interface InvoiceLogEntry {
  id:        string;
  action:    'created' | 'sent' | 'payment_confirmed';
  by:        string;
  notes:     string;
  timestamp: string;
}

// ─── Per-quotation Invoice record ─────────────────────────────────────────────

export interface InvoiceRecord {
  quotationId:  string;
  invoiceNumber: string;
  status:       InvoiceStatus;
  dueDate:      string;          // ISO YYYY-MM-DD
  isIntraState: boolean;         // true → CGST+SGST, false → IGST
  buyerGstin:   string;
  sentAt:       string | null;
  paidAt:       string | null;
  utrReference: string;          // payment UTR/ref filled by admin on mark-paid
  log:          InvoiceLogEntry[];
}

// ─── GST Helpers ──────────────────────────────────────────────────────────────

export function computeGst(taxable: number, taxPct: number, isIntraState: boolean) {
  const total = taxable * (taxPct / 100);
  if (isIntraState) {
    const half = total / 2;
    return { cgst: half, sgst: half, igst: 0, total };
  }
  return { cgst: 0, sgst: 0, igst: total, total };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  if (!iso) return '—';
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

function invoiceNumberFromQuot(quotNumber: string) {
  return `INV-${quotNumber.replace('QT-', '')}`;
}

function dueDateFromNow(days = 15): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Shared sub-components (mirrors AdminPurchaseOrder) ───────────────────────

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

// ─── GST Invoice Document ─────────────────────────────────────────────────────

export function InvoiceDocument({
  quotation,
  record,
}: {
  quotation: ApprovableQuotation;
  record:    InvoiceRecord;
}) {
  const sub     = quotation.quantity * quotation.unitPrice;
  const disc    = sub * (quotation.discountPct / 100);
  const taxable = sub - disc;
  const gst     = computeGst(taxable, quotation.taxPct, record.isIntraState);
  const grand   = taxable + gst.total + quotation.shippingCharge;

  const halfPct = quotation.taxPct / 2;

  return (
    <div
      id="inv-print-root"
      className="space-y-5 text-sm bg-[var(--background-card)] rounded-2xl border border-[var(--border)] p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">ElectroHub</span>
            <span className="text-[var(--text-subtle)]">·</span>
            <span className="text-xs text-[var(--text-subtle)]">Tax Invoice</span>
          </div>
          <h2 className="text-xl font-bold font-display text-[var(--text)] font-mono">{record.invoiceNumber}</h2>
          <p className="text-xs text-[var(--text-subtle)] mt-0.5">
            PO ref: {`PO-${quotation.quotationNumber.replace('QT-', '')}`} · Quotation: {quotation.quotationNumber}
          </p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <Badge variant={INV_STATUS_CONFIG[record.status].variant} size="sm">
            {INV_STATUS_CONFIG[record.status].label}
          </Badge>
          <p className="text-xs text-[var(--text-subtle)]">Date: {fmtDate(new Date().toISOString())}</p>
          <p className="text-xs text-[var(--text-subtle)]">Due: {fmtDate(record.dueDate)}</p>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-6">
        {/* Seller */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)] mb-1.5">Seller / Supplier</p>
          <p className="font-semibold text-[var(--text)]">ElectroHub Pvt. Ltd.</p>
          <p className="text-[var(--text-muted)] text-xs">123 Electronics Hub, Koramangala</p>
          <p className="text-[var(--text-muted)] text-xs">Bengaluru, Karnataka 560034</p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">
            <span className="font-semibold">GSTIN:</span> 29ABCDE1234F1Z5
          </p>
          <p className="text-[var(--text-muted)] text-xs">PAN: ABCDE1234F</p>
          <p className="text-[var(--text-muted)] text-xs">accounts@electrohub.in</p>
        </div>
        {/* Buyer */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)] mb-1.5">Buyer / Bill To</p>
          <p className="font-semibold text-[var(--text)]">{quotation.customerName}</p>
          <p className="text-[var(--text-muted)] text-xs">{quotation.customerCompany}</p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">{quotation.customerEmail}</p>
          <p className="text-[var(--text-muted)] text-xs flex items-start gap-1 mt-0.5">
            <MapPin size={10} className="mt-0.5 shrink-0" />
            {quotation.deliveryLocation}
          </p>
          {record.buyerGstin && (
            <p className="text-[var(--text-muted)] text-xs mt-0.5">
              <span className="font-semibold">GSTIN:</span> {record.buyerGstin}
            </p>
          )}
        </div>
      </div>

      {/* Line items table with HSN */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[var(--background-alt)] border-b border-[var(--border)]">
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--text-muted)] text-xs">#</th>
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--text-muted)] text-xs">Description</th>
              <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">HSN/SAC</th>
              <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">Qty</th>
              <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">Unit Rate</th>
              <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">Disc.</th>
              <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">Taxable</th>
              {record.isIntraState ? (
                <>
                  <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">CGST {halfPct}%</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">SGST {halfPct}%</th>
                </>
              ) : (
                <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">IGST {quotation.taxPct}%</th>
              )}
              <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {quotation.items && quotation.items.length > 0 ? (
              quotation.items.map((item: any, idx: number) => {
                const itemSub = item.quantity * Number(item.unit_price || 0);
                const itemDisc = itemSub * (Number(item.discount_pct || 0) / 100);
                const itemTaxable = itemSub - itemDisc;
                const itemGst = computeGst(itemTaxable, Number(item.tax_pct || 0), record.isIntraState);
                return (
                  <tr key={item.id || idx}>
                    <td className="px-3 py-3 text-[var(--text-muted)]">{idx + 1}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-[var(--text)]">{item.product_name || item.product_display?.name}</p>
                      {item.notes && <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.notes}</p>}
                    </td>
                    <td className="px-3 py-3 text-right text-[var(--text-muted)] text-xs font-mono">{item.hsn_code || '8542'}</td>
                    <td className="px-3 py-3 text-right text-[var(--text)]">{item.quantity.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3 text-right font-medium text-[var(--text)]">{fmtINR(Number(item.unit_price || 0))}</td>
                    <td className="px-3 py-3 text-right text-[var(--text-muted)]">{fmtINR(itemDisc)}</td>
                    <td className="px-3 py-3 text-right text-[var(--text)]">{fmtINR(itemTaxable)}</td>
                    {record.isIntraState ? (
                      <>
                        <td className="px-3 py-3 text-right text-[var(--text)]">{fmtINR(itemGst.cgst)}</td>
                        <td className="px-3 py-3 text-right text-[var(--text)]">{fmtINR(itemGst.sgst)}</td>
                      </>
                    ) : (
                      <td className="px-3 py-3 text-right text-[var(--text)]">{fmtINR(itemGst.igst)}</td>
                    )}
                    <td className="px-3 py-3 text-right font-semibold text-[var(--text)]">{fmtINR(itemTaxable + itemGst.total)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-3 py-3 text-[var(--text-muted)]">1</td>
                <td className="px-3 py-3">
                  <p className="font-medium text-[var(--text)]">{quotation.productName}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {quotation.productType === 'custom' ? 'Custom / External' : 'ElectroHub Catalogue Item'}
                  </p>
                </td>
                <td className="px-3 py-3 text-right text-[var(--text-muted)] text-xs font-mono">8542</td>
                <td className="px-3 py-3 text-right text-[var(--text)]">{quotation.quantity.toLocaleString('en-IN')}</td>
                <td className="px-3 py-3 text-right font-medium text-[var(--text)]">{fmtINR(quotation.unitPrice)}</td>
                <td className="px-3 py-3 text-right text-[var(--text-muted)]">{fmtINR(disc)}</td>
                <td className="px-3 py-3 text-right text-[var(--text)]">{fmtINR(taxable)}</td>
                {record.isIntraState ? (
                  <>
                    <td className="px-3 py-3 text-right text-[var(--text)]">{fmtINR(gst.cgst)}</td>
                    <td className="px-3 py-3 text-right text-[var(--text)]">{fmtINR(gst.sgst)}</td>
                  </>
                ) : (
                  <td className="px-3 py-3 text-right text-[var(--text)]">{fmtINR(gst.igst)}</td>
                )}
                <td className="px-3 py-3 text-right font-semibold text-[var(--text)]">{fmtINR(taxable + gst.total)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* GST Summary + Totals */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* GST Summary box */}
        <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--background-alt)] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)] mb-2">GST Summary</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="pb-1.5 text-left font-medium">HSN</th>
                <th className="pb-1.5 text-right font-medium">Taxable</th>
                {record.isIntraState ? (
                  <>
                    <th className="pb-1.5 text-right font-medium">CGST</th>
                    <th className="pb-1.5 text-right font-medium">SGST</th>
                  </>
                ) : (
                  <th className="pb-1.5 text-right font-medium">IGST</th>
                )}
                <th className="pb-1.5 text-right font-medium">Total Tax</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-[var(--text)]">
                <td className="pt-1.5 font-mono">8542</td>
                <td className="pt-1.5 text-right">{fmtINR(taxable)}</td>
                {record.isIntraState ? (
                  <>
                    <td className="pt-1.5 text-right">{fmtINR(gst.cgst)}</td>
                    <td className="pt-1.5 text-right">{fmtINR(gst.sgst)}</td>
                  </>
                ) : (
                  <td className="pt-1.5 text-right">{fmtINR(gst.igst)}</td>
                )}
                <td className="pt-1.5 text-right font-semibold">{fmtINR(gst.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="w-full sm:w-72 space-y-1.5">
          {[
            { label: 'Subtotal',                            value: fmtINR(sub)   },
            { label: `Discount (${quotation.discountPct}%)`, value: `-${fmtINR(disc)}` },
            { label: 'Taxable Amount',                      value: fmtINR(taxable) },
            ...(record.isIntraState
              ? [
                  { label: `CGST (${halfPct}%)`,  value: fmtINR(gst.cgst) },
                  { label: `SGST (${halfPct}%)`,  value: fmtINR(gst.sgst) },
                ]
              : [{ label: `IGST (${quotation.taxPct}%)`, value: fmtINR(gst.igst) }]
            ),
            { label: 'Shipping & Handling',                 value: quotation.shippingCharge === 0 ? 'Free' : fmtINR(quotation.shippingCharge) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">{label}</span>
              <span className="text-[var(--text)] tabular-nums">{value}</span>
            </div>
          ))}
          <div className="border-t border-[var(--border)] pt-1.5 flex justify-between">
            <span className="font-bold text-[var(--text)]">Grand Total</span>
            <span className="font-bold text-[var(--primary)] text-base tabular-nums">{fmtINR(grand)}</span>
          </div>
        </div>
      </div>

      {/* Payment details */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-alt)] px-4 py-3 grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)] mb-1.5">Bank Details (NEFT/RTGS)</p>
          <p className="text-xs text-[var(--text-muted)]">Bank: HDFC Bank Ltd.</p>
          <p className="text-xs text-[var(--text-muted)]">A/C No: 50200012345678</p>
          <p className="text-xs text-[var(--text-muted)]">IFSC: HDFC0001234</p>
          <p className="text-xs text-[var(--text-muted)]">A/C Name: ElectroHub Pvt. Ltd.</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)] mb-1.5">UPI / Quick Pay</p>
          <p className="text-xs text-[var(--text-muted)]">UPI ID: electrohub@hdfcbank</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Payment due by: <strong className="text-[var(--text)]">{fmtDate(record.dueDate)}</strong></p>
          <p className="text-xs text-[var(--text-muted)]">Reference: {record.invoiceNumber}</p>
        </div>
      </div>

      {/* Payment status if confirmed */}
      {record.status === 'payment_confirmed' && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/5 px-4 py-3">
          <CheckCircle2 size={16} className="text-[var(--success)] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Payment Confirmed</p>
            <p className="text-xs text-[var(--text-muted)]">
              {record.paidAt ? `Received on ${fmtDateTime(record.paidAt)}` : ''}
              {record.utrReference ? ` · UTR: ${record.utrReference}` : ''}
            </p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-[var(--text-subtle)] text-center italic">
        This is a computer-generated tax invoice. No signature required. Subject to jurisdiction of Bengaluru courts.
      </p>
    </div>
  );
}

// ─── Send Invoice Modal ───────────────────────────────────────────────────────

function SendInvoiceModal({
  open,
  onClose,
  quotation,
  record,
  onSend,
}: {
  open:      boolean;
  onClose:   () => void;
  quotation: ApprovableQuotation;
  record:    InvoiceRecord;
  onSend:    (notes: string) => void;
}) {
  const [notes, setNotes] = React.useState('');
  const [busy, setBusy]   = React.useState(false);

  React.useEffect(() => { if (open) setNotes(''); }, [open]);

  const handleSend = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 800));
    setBusy(false);
    onSend(notes.trim());
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" title="Send Invoice to Customer">
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5">
          <Send size={18} className="text-[var(--primary)] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Send {record.invoiceNumber}</p>
            <p className="text-xs text-[var(--text-muted)]">{quotation.quotationNumber} · {quotation.customerCompany}</p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--background-alt)] px-3 py-2.5 text-xs text-[var(--text-muted)] space-y-1">
          <p>Invoice will be sent to: <strong className="text-[var(--text)]">{quotation.customerEmail}</strong></p>
          <p>Due date: <strong className="text-[var(--text)]">{fmtDate(record.dueDate)}</strong></p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
            Cover note <span className="text-[var(--text-subtle)] font-normal">(optional)</span>
          </label>
          <textarea
            id="inv-send-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any message for the customer…"
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none transition-all',
              'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]',
              'placeholder:text-[var(--text-subtle)]',
              'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
            )}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" onClick={onClose} fullWidth id="inv-send-cancel">Cancel</Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Send size={14} />}
            onClick={handleSend}
            isLoading={busy}
            loadingText="Sending…"
            fullWidth
            id="inv-send-confirm"
          >
            Send Invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Mark as Paid Modal ───────────────────────────────────────────────────────

function MarkPaidModal({
  open,
  onClose,
  record,
  onMarkPaid,
}: {
  open:       boolean;
  onClose:    () => void;
  record:     InvoiceRecord;
  onMarkPaid: (utr: string, notes: string) => void;
}) {
  const [utr, setUtr]     = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [busy, setBusy]   = React.useState(false);

  React.useEffect(() => { if (open) { setUtr(''); setNotes(''); } }, [open]);

  const handleConfirm = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900));
    setBusy(false);
    onMarkPaid(utr.trim(), notes.trim());
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" title="Mark Invoice as Paid">
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/5">
          <CheckCircle2 size={18} className="text-[var(--success)] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Confirm payment for {record.invoiceNumber}</p>
            <p className="text-xs text-[var(--text-muted)]">This will mark the order as payment_confirmed</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
            UTR / Reference Number <span className="text-[var(--text-subtle)] font-normal">(optional)</span>
          </label>
          <Input
            id="inv-paid-utr"
            placeholder="e.g. HDFC0123456789012"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
            Notes <span className="text-[var(--text-subtle)] font-normal">(optional)</span>
          </label>
          <textarea
            id="inv-paid-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment notes…"
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none transition-all',
              'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]',
              'placeholder:text-[var(--text-subtle)]',
              'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
            )}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" onClick={onClose} fullWidth id="inv-paid-cancel">Cancel</Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<CheckCircle2 size={14} />}
            onClick={handleConfirm}
            isLoading={busy}
            loadingText="Confirming…"
            fullWidth
            id="inv-paid-confirm"
          >
            Mark as Paid
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Invoice Activity Log ─────────────────────────────────────────────────────

function InvoiceLog({ log }: { log: InvoiceLogEntry[] }) {
  if (log.length === 0) {
    return <p className="text-sm text-[var(--text-subtle)] italic py-2">Invoice not yet sent.</p>;
  }

  const ACTION_ICON: Record<InvoiceLogEntry['action'], React.ElementType> = {
    created:           FileText,
    sent:              Send,
    payment_confirmed: CheckCircle2,
  };
  const ACTION_COLOR: Record<InvoiceLogEntry['action'], string> = {
    created:           'text-[var(--text-muted)]',
    sent:              'text-[var(--primary)]',
    payment_confirmed: 'text-[var(--success)]',
  };
  const ACTION_BG: Record<InvoiceLogEntry['action'], string> = {
    created:           'bg-[var(--background-alt)]',
    sent:              'bg-[var(--primary)]/10',
    payment_confirmed: 'bg-[var(--success)]/10',
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
                <span className="text-sm font-semibold text-[var(--text)] capitalize">
                  {entry.action === 'payment_confirmed' ? 'Payment Confirmed' : entry.action}
                </span>
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

// ─── GST type toggle (intra/inter state) ─────────────────────────────────────

function GSTTypeToggle({
  isIntraState,
  onChange,
}: {
  isIntraState: boolean;
  onChange:     (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--text-muted)]">GST Type:</span>
      <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs">
        <button
          className={cn(
            'px-3 py-1.5 transition-colors',
            isIntraState
              ? 'bg-[var(--primary)] text-white font-medium'
              : 'bg-[var(--background-alt)] text-[var(--text-muted)] hover:text-[var(--text)]',
          )}
          onClick={() => onChange(true)}
          id="gst-intra"
        >
          Intra-state (CGST+SGST)
        </button>
        <button
          className={cn(
            'px-3 py-1.5 transition-colors',
            !isIntraState
              ? 'bg-[var(--primary)] text-white font-medium'
              : 'bg-[var(--background-alt)] text-[var(--text-muted)] hover:text-[var(--text)]',
          )}
          onClick={() => onChange(false)}
          id="gst-inter"
        >
          Inter-state (IGST)
        </button>
      </div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

function downloadInvoicePdfAdmin(quotationId: string | number) {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('electrohub_access_token') || '')
    : '';
  const url = `${API_BASE}/quotations/${quotationId}/invoice/pdf/?token=${encodeURIComponent(token)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

interface InvoiceDetailPanelProps {
  quotation: ApprovableQuotation;
  record:    InvoiceRecord;
  onBack:    () => void;
  onSend:    (quotId: string, notes: string) => void;
  onMarkPaid: (quotId: string, utr: string, notes: string) => void;
  onToggleGST: (quotId: string, isIntra: boolean) => void;
}

function InvoiceDetailPanel({
  quotation,
  record,
  onBack,
  onSend,
  onMarkPaid,
  onToggleGST,
}: InvoiceDetailPanelProps) {
  const [sendOpen, setSendOpen]     = React.useState(false);
  const [paidOpen, setPaidOpen]     = React.useState(false);

  const statusCfg  = INV_STATUS_CONFIG[record.status];
  const StatusIcon = statusCfg.icon;

  const sub     = quotation.quantity * quotation.unitPrice;
  const disc    = sub * (quotation.discountPct / 100);
  const taxable = sub - disc;
  const gst     = computeGst(taxable, quotation.taxPct, record.isIntraState);
  const grand   = taxable + gst.total + quotation.shippingCharge;

  const handlePrint = () => {
    window.print();
    toast.info('Print dialog opened');
  };

  const handleDownload = () => {
    downloadInvoicePdfAdmin(quotation.id);
    toast.info('Downloading invoice PDF…');
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
            id="inv-detail-back"
          >
            <ArrowLeft size={15} />
            Back to Invoice list
          </button>
          <div className="h-4 w-px bg-[var(--border)]" />
          <span className="font-mono font-semibold text-[var(--text)]">{record.invoiceNumber}</span>
          <Badge variant={statusCfg.variant} size="sm" icon={<StatusIcon size={11} />}>
            {statusCfg.label}
          </Badge>

          {/* Actions */}
          <div className="ml-auto flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" leftIcon={<Printer size={14} />} onClick={handlePrint} id="inv-print-btn">
              Print
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={handleDownload} id="inv-download-btn">
              Download PDF
            </Button>
            {record.status === 'draft' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Send size={14} />}
                onClick={() => setSendOpen(true)}
                id="inv-send-btn"
              >
                Send Invoice
              </Button>
            )}
            {record.status === 'sent' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 size={14} />}
                onClick={() => setPaidOpen(true)}
                id="inv-mark-paid-btn"
              >
                Mark as Paid
              </Button>
            )}
          </div>
        </div>

        {/* GST toggle (only when draft) */}
        {record.status === 'draft' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background-alt)]">
            <Percent size={14} className="text-[var(--primary)] shrink-0" />
            <GSTTypeToggle
              isIntraState={record.isIntraState}
              onChange={(v) => onToggleGST(quotation.id, v)}
            />
            <span className="text-xs text-[var(--text-subtle)] ml-auto">
              {record.isIntraState ? `CGST ${quotation.taxPct/2}% + SGST ${quotation.taxPct/2}%` : `IGST ${quotation.taxPct}%`}
            </span>
          </div>
        )}

        {/* Two-column: Document + sidebar */}
        <div className="grid gap-5 xl:grid-cols-[1fr_300px]">

          {/* Invoice Document */}
          <InvoiceDocument quotation={quotation} record={record} />

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Invoice Meta */}
            <DetailSection icon={Hash} title="Invoice Details">
              <DetailRow label="Invoice #"><span className="font-mono text-xs">{record.invoiceNumber}</span></DetailRow>
              <DetailRow label="Quotation #"><span className="font-mono text-xs">{quotation.quotationNumber}</span></DetailRow>
              <DetailRow label="RFQ #"><span className="font-mono text-xs">{quotation.rfqNumber}</span></DetailRow>
              <DetailRow label="Status">
                <Badge variant={statusCfg.variant} size="xs" icon={<StatusIcon size={10} />}>{statusCfg.label}</Badge>
              </DetailRow>
              <DetailRow label="Due Date">
                <span className="flex items-center gap-1 text-xs">
                  <Calendar size={11} className="text-[var(--text-subtle)]" />
                  {fmtDate(record.dueDate)}
                </span>
              </DetailRow>
              {record.sentAt && (
                <DetailRow label="Sent At"><span className="text-xs font-normal text-[var(--text-muted)]">{fmtDateTime(record.sentAt)}</span></DetailRow>
              )}
              {record.paidAt && (
                <DetailRow label="Paid At"><span className="text-xs font-normal text-[var(--success)]">{fmtDateTime(record.paidAt)}</span></DetailRow>
              )}
            </DetailSection>

            {/* Pricing summary */}
            <DetailSection icon={IndianRupee} title="Pricing Summary">
              <DetailRow label="Taxable"><span className="tabular-nums">{fmtINR(taxable)}</span></DetailRow>
              {record.isIntraState ? (
                <>
                  <DetailRow label={`CGST ${quotation.taxPct/2}%`}><span className="tabular-nums">{fmtINR(gst.cgst)}</span></DetailRow>
                  <DetailRow label={`SGST ${quotation.taxPct/2}%`}><span className="tabular-nums">{fmtINR(gst.sgst)}</span></DetailRow>
                </>
              ) : (
                <DetailRow label={`IGST ${quotation.taxPct}%`}><span className="tabular-nums">{fmtINR(gst.igst)}</span></DetailRow>
              )}
              <DetailRow label="Grand Total">
                <span className="tabular-nums font-bold text-[var(--primary)]">{fmtINR(grand)}</span>
              </DetailRow>
            </DetailSection>

            {/* Buyer */}
            <DetailSection icon={User} title="Buyer">
              <DetailRow label="Name"><span>{quotation.customerName}</span></DetailRow>
              <DetailRow label="Company"><span className="text-[var(--text-muted)]">{quotation.customerCompany}</span></DetailRow>
              <DetailRow label="Email">
                <a href={`mailto:${quotation.customerEmail}`} className="text-[var(--primary)] hover:underline">{quotation.customerEmail}</a>
              </DetailRow>
              {record.buyerGstin && (
                <DetailRow label="GSTIN"><span className="font-mono text-xs">{record.buyerGstin}</span></DetailRow>
              )}
            </DetailSection>

            {/* UTR if paid */}
            {record.utrReference && (
              <DetailSection icon={Wallet} title="Payment Reference">
                <DetailRow label="UTR / Ref"><span className="font-mono text-xs">{record.utrReference}</span></DetailRow>
              </DetailSection>
            )}

            {/* Invoice log */}
            <DetailSection icon={Clock} title={`Invoice Activity (${record.log.length})`}>
              <InvoiceLog log={record.log} />
            </DetailSection>

          </div>
        </div>
      </motion.div>

      {/* Send modal */}
      <SendInvoiceModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        quotation={quotation}
        record={record}
        onSend={(notes) => {
          onSend(quotation.id, notes);
          setSendOpen(false);
        }}
      />

      {/* Mark paid modal */}
      <MarkPaidModal
        open={paidOpen}
        onClose={() => setPaidOpen(false)}
        record={record}
        onMarkPaid={(utr, notes) => {
          onMarkPaid(quotation.id, utr, notes);
          setPaidOpen(false);
        }}
      />
    </>
  );
}

export function AdminInvoice({
  onNavigateToInvoice,
}: {
  onNavigateToInvoice?: () => void;
}) {
  const [quotations, setQuotations] = React.useState<ApprovableQuotation[]>([]);
  const [search, setSearch]         = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [records, setRecords]       = React.useState<Record<string, InvoiceRecord>>({});
  const [loading, setLoading]       = React.useState(true);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [poRes, invRes] = await Promise.all([
        adminQuotationApi.listPOs(),
        adminQuotationApi.listInvoices()
      ]);

      const validPOs = (Array.isArray(poRes) ? poRes : (poRes as any).results ?? []).filter((po: any) => po.status !== 'pending');
      const quotData = validPOs.map((po: any) => {
        const q = po.quotation_data;
        return {
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
          updatedAt: q.updated_at,
          history: [],
          items: q.items || [],
        };
      });

      setQuotations(quotData as any);

      const newRecords: Record<string, InvoiceRecord> = {};
      const invByQuotId = new Map((Array.isArray(invRes) ? invRes : (invRes as any).results ?? []).map((inv: any) => [inv.quotation.toString(), inv]));

      for (const po of validPOs) {
        const qId = po.quotation.toString();
        const existingInv = invByQuotId.get(qId) as any;
        if (existingInv) {
          newRecords[qId] = {
            quotationId: qId,
            invoiceNumber: existingInv.invoice_number,
            status: existingInv.status,
            dueDate: existingInv.due_date || dueDateFromNow(15),
            isIntraState: true,
            buyerGstin: existingInv.gstin_buyer || '',
            sentAt: existingInv.status !== 'draft' ? (existingInv as any).updated_at || existingInv.paid_at : null,
            paidAt: existingInv.paid_at || null,
            utrReference: existingInv.utr_number || '',
            log: existingInv.log ? existingInv.log.map((l: any) => ({
              id: String(l.id),
              action: l.action === 'created' ? 'created' : l.action === 'sent' ? 'sent' : 'payment_confirmed',
              by: l.actor_name || 'System',
              notes: l.notes || '',
              timestamp: l.timestamp
            })) : [],
          };
        } else {
          newRecords[qId] = {
            quotationId: qId,
            invoiceNumber: invoiceNumberFromQuot(po.quotation_data.quotation_number),
            status: 'draft',
            dueDate: dueDateFromNow(15),
            isIntraState: true,
            buyerGstin: '',
            sentAt: null,
            paidAt: null,
            utrReference: '',
            log: [],
          };
        }
      }
      setRecords(newRecords);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = React.useMemo(() => {
    const s = search.toLowerCase();
    if (!s) return quotations;
    return quotations.filter((q) =>
      q.quotationNumber.toLowerCase().includes(s) ||
      q.rfqNumber.toLowerCase().includes(s) ||
      q.customerName.toLowerCase().includes(s) ||
      q.productName.toLowerCase().includes(s),
    );
  }, [quotations, search]);

  const selectedQ   = quotations.find((q) => q.id === selectedId) ?? null;
  const selectedRec = selectedId ? records[selectedId] : null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSend = async (quotId: string, notes: string) => {
    try {
      const rec = records[quotId];
      if (!rec) return;

      if (rec.status === 'draft') {
        await adminQuotationApi.createInvoice(Number(quotId), {
          due_date: rec.dueDate,
          gstin_buyer: rec.buyerGstin,
        });
      }

      await adminQuotationApi.sendInvoice(Number(quotId));
      toast.success('Invoice sent to customer');
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to send invoice');
    }
  };

  const handleMarkPaid = async (quotId: string, utr: string, notes: string) => {
    try {
      await adminQuotationApi.confirmPayment(Number(quotId), utr);
      toast.success('Payment confirmed');
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark payment as confirmed');
    }
  };

  const handleToggleGST = (quotId: string, isIntra: boolean) => {
    setRecords((prev) => {
      const rec = prev[quotId];
      if (!rec) return prev;
      return { ...prev, [quotId]: { ...rec, isIntraState: isIntra } };
    });
  };

  if (selectedQ && selectedRec) {
    return (
      <InvoiceDetailPanel
        quotation={selectedQ}
        record={selectedRec}
        onBack={() => setSelectedId(null)}
        onSend={handleSend}
        onMarkPaid={handleMarkPaid}
        onToggleGST={handleToggleGST}
      />
    );
  }

  // ── Counts ──────────────────────────────────────────────────────────────────
  const draftCount   = Object.values(records).filter((r) => r.status === 'draft').length;
  const sentCount    = Object.values(records).filter((r) => r.status === 'sent').length;
  const paidCount    = Object.values(records).filter((r) => r.status === 'payment_confirmed').length;

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
            GST Invoices
            {sentCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[11px] font-bold text-white">
                {sentCount}
              </span>
            )}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            PO-ready quotations · {draftCount} draft · {sentCount} awaiting payment · {paidCount} paid
          </p>
        </div>

        <div className="w-full md:w-72">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
            <Input
              id="inv-search"
              aria-label="Search invoices"
              className="pl-9"
              placeholder="Search quotation #, customer…"
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
          <Receipt size={32} className="mx-auto text-[var(--text-subtle)] mb-3" />
          <p className="font-semibold text-[var(--text)]">
            {search ? 'No matching invoices' : 'No invoiceable quotations'}
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {search
              ? 'Try adjusting your search.'
              : 'Issue a Purchase Order first; the quotation will appear here for invoicing.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background-alt)] text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Invoice #</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Product</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Grand Total</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">GST Type</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Due Date</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((q, idx) => {
                    const rec = records[q.id];
                    if (!rec) return null;
                    const cfg     = INV_STATUS_CONFIG[rec.status];
                    const CfgIcon = cfg.icon;
                    const isDraft = rec.status === 'draft';
                    const isSent  = rec.status === 'sent';

                    const sub     = q.quantity * q.unitPrice;
                    const disc    = sub * (q.discountPct / 100);
                    const taxable = sub - disc;
                    const gst     = computeGst(taxable, q.taxPct, rec.isIntraState);
                    const grand   = taxable + gst.total + q.shippingCharge;

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
                          isSent && 'bg-blue-500/[0.02]',
                        )}
                        onClick={() => setSelectedId(q.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isSent && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />}
                            <span className="font-mono font-semibold text-[var(--text)] whitespace-nowrap">{rec.invoiceNumber}</span>
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
                          {fmtINR(grand)}
                        </td>

                        <td className="px-4 py-3">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            rec.isIntraState
                              ? 'bg-violet-500/10 text-violet-600'
                              : 'bg-blue-500/10 text-blue-600',
                          )}>
                            {rec.isIntraState ? 'CGST+SGST' : 'IGST'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-[var(--text-muted)] whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {fmtDate(rec.dueDate)}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <Badge variant={cfg.variant} size="sm" icon={<CfgIcon size={11} />}>{cfg.label}</Badge>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {isDraft ? (
                              <Button
                                variant="primary"
                                size="xs"
                                leftIcon={<Send size={12} />}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(q.id); }}
                                id={`inv-row-send-${q.id}`}
                              >
                                Send
                              </Button>
                            ) : isSent ? (
                              <Button
                                variant="secondary"
                                size="xs"
                                leftIcon={<CheckCircle2 size={12} />}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(q.id); }}
                                id={`inv-row-paid-${q.id}`}
                              >
                                Mark Paid
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="xs"
                                leftIcon={<FileText size={12} />}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(q.id); }}
                                id={`inv-row-view-${q.id}`}
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
