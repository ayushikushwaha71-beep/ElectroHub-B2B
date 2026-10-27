'use client';

/**
 * ElectroHub — B2B Payment Screen (Customer-facing)
 * Shown inside AccountQuotations → QuotationDetail for quotations
 * that are in `invoice_sent` or `payment_confirmed` status.
 *
 * Features:
 *  - Invoice summary card (invoice #, grand total, due date, GST breakdown)
 *  - Bank details (NEFT/RTGS) and UPI quick-pay
 *  - "Pay via Link" button (mock)
 *  - "I have paid — Mark as Paid" with UTR confirmation modal
 *  - Payment confirmed receipt view
 *
 * Uses ONLY existing ElectroHub design tokens and components.
 * No backend calls — localStorage mock state only.
 * Mirrors QuotationDetail.tsx SectionCard / DataRow patterns.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  Banknote,
  Calendar,
  CheckCircle2,
  ClipboardCopy,
  CreditCard,
  Download,
  ExternalLink,
  Hash,
  IndianRupee,
  QrCode,
  Receipt,
  Send,
  ShieldCheck,
  Smartphone,
  Truck,
  Wallet,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge }  from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';
import { Modal }  from '@/components/ui/Modal';
import { toast }  from '@/components/ui/Toast';
import { Quotation } from '@/lib/quotation-api';
import { InvoiceDocument } from '@/components/admin/AdminInvoice';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Derived invoice details from quotation ───────────────────────────────────

interface InvoiceDetails {
  invoiceNumber: string;
  dueDate:       string;
  taxable:       number;
  cgst:          number;
  sgst:          number;
  igst:          number;
  isIntraState:  boolean;
  grand_total:    number;
  paidAmount:    number;
  pendingAmount: number;
  status?:       string;
  buyerGstin?:   string;
  paidAt?:       string;
  utrReference?: string;
}

function deriveInvoiceDetails(q: Quotation): InvoiceDetails {
  const sub      = q.quantity * Number(q.unit_price);
  const disc     = sub * (Number(q.discount_pct) / 100);
  const taxable  = sub - disc;
  const taxTotal = taxable * (Number(q.tax_pct) / 100);
  // Default to intra-state (Karnataka seller) unless location is outside Karnataka
  const isIntra  = !q.delivery_location.toLowerCase().includes('delhi') &&
                   !q.delivery_location.toLowerCase().includes('maharashtra') &&
                   !q.delivery_location.toLowerCase().includes('telangana') &&
                   !q.delivery_location.toLowerCase().includes('punjab');
  const cgst     = isIntra ? taxTotal / 2 : 0;
  const sgst     = isIntra ? taxTotal / 2 : 0;
  const igst     = isIntra ? 0 : taxTotal;
  const grand    = taxable + taxTotal + Number(q.shipping_charge);

  // Due date = 15 days from updated_at (invoice sent date)
  const dueDate  = new Date(new Date(q.updated_at).getTime() + 15 * 86400000).toISOString().split('T')[0];

  return {
    invoiceNumber: q.invoice?.invoice_number || `INV-${q.quotation_number.replace('QT-', '')}`,
    dueDate: q.invoice?.due_date || dueDate,
    taxable,
    cgst,
    sgst,
    igst,
    isIntraState: isIntra,
    grand_total: q.grand_total ?? grand,
    paidAmount: q.paid_amount ?? 0,
    pendingAmount: q.pending_amount ?? (q.grand_total ?? grand),
    status: (q.invoice as any)?.status || (q.status === 'payment_confirmed' ? 'paid' : 'sent'),
    buyerGstin: (q.invoice as any)?.buyer_gstin || (q.rfq as any)?.customer?.vendor_profile?.gstin || '',
    paidAt: (q.invoice as any)?.paid_at || (q.status === 'payment_confirmed' ? q.updated_at : undefined),
    utrReference: (q.invoice as any)?.utr_reference || (q as any).utr_reference || '',
  };
}

// ─── Section card (mirrors QuotationDetail SectionCard) ───────────────────────

function SectionCard({
  icon: Icon,
  title,
  children,
  className,
  accent,
}: {
  icon:       React.ElementType;
  title:      string;
  children:   React.ReactNode;
  className?: string;
  accent?:    string;
}) {
  return (
    <div className={cn('rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden shadow-[var(--shadow-card)]', className)}>
      <div className={cn('flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border)]', accent ?? 'bg-[var(--background-alt)]')}>
        <Icon size={15} className="text-[var(--primary)]" />
        <h3 className="font-semibold text-sm text-[var(--text)]">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--text-subtle)] w-28 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0 text-sm text-[var(--text)] font-medium">{children}</div>
    </div>
  );
}

// ─── Copy to clipboard helper ──────────────────────────────────────────────────

function CopyableField({ label, value }: { label: string; value: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--text-subtle)] w-28 shrink-0">{label}</span>
      <span className="flex-1 text-sm text-[var(--text)] font-medium font-mono truncate">{value}</span>
      <button
        onClick={handleCopy}
        className="shrink-0 p-1 rounded-md hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-subtle)] hover:text-[var(--primary)]"
        title={`Copy ${label}`}
      >
        <ClipboardCopy size={13} />
      </button>
    </div>
  );
}

// ─── Mark as Paid Modal (customer-side) ───────────────────────────────────────

function MarkPaidModal({
  open,
  onClose,
  invoice,
  onConfirm,
}: {
  open:      boolean;
  onClose:   () => void;
  invoice:   InvoiceDetails;
  onConfirm: (amount: number, utr: string) => void;
}) {
  const [utr, setUtr]       = React.useState('');
  const [amount, setAmount] = React.useState(String(invoice.pendingAmount));
  const [busy, setBusy]     = React.useState(false);

  React.useEffect(() => { 
    if (open) {
      setUtr('');
      setAmount(String(invoice.pendingAmount));
    }
  }, [open, invoice.pendingAmount]);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900));
    setBusy(false);
    onConfirm(numAmount, utr.trim());
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" title="Confirm Your Payment">
      <div className="space-y-4">
        {/* Amount reminder */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5">
          <IndianRupee size={18} className="text-[var(--primary)] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Amount Due: {fmtINR(invoice.grand_total)}</p>
            <p className="text-xs text-[var(--text-muted)]">{invoice.invoiceNumber} · Due {fmtDate(invoice.dueDate)}</p>
          </div>
        </div>

        <p className="text-sm text-[var(--text-muted)]">
          After initiating your payment via NEFT/RTGS/UPI, enter your transaction reference number below and click submit. Our team will verify and confirm your order.
        </p>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
            Amount Paying Now
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]">₹</span>
            <Input
              id="b2b-amount-input"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-7"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
            UTR / Transaction Reference <span className="text-[var(--text-subtle)] font-normal">(optional but recommended)</span>
          </label>
          <Input
            id="b2b-utr-input"
            placeholder="e.g. HDFC0123456789012 or UPI ref"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            ⚠️ Submitting this does not automatically confirm payment. Our accounts team will verify within 1 business day and update the order status.
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" onClick={onClose} fullWidth id="b2b-paid-cancel">Cancel</Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<CheckCircle2 size={14} />}
            onClick={handleSubmit}
            isLoading={busy}
            loadingText="Submitting…"
            fullWidth
            id="b2b-paid-confirm"
          >
            I Have Paid
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main B2BPayment Component
// ═══════════════════════════════════════════════════════════════════════════════

interface B2BPaymentProps {
  quotation:          Quotation;
  onPaymentSubmit:    (amount: number, utr: string) => void;
  onNavigateToOrders?: () => void;
}

export function B2BPayment({ quotation, onPaymentSubmit, onNavigateToOrders }: B2BPaymentProps) {
  const [paidOpen, setPaidOpen]       = React.useState(false);
  const [payLinkClicked, setPayLink]  = React.useState(false);

  const invoice = deriveInvoiceDetails(quotation);
  const isPaid  = quotation.status === 'payment_confirmed';
  const isPartiallyPaid = quotation.status === 'partially_paid' || invoice.status === 'partially_paid';

  const handlePayLink = () => {
    setPayLink(true);
    toast.info('Payment gateway link would open here (demo mode)');
  };

  const handleConfirm = (amount: number, utr: string) => {
    onPaymentSubmit(amount, utr);
    toast.success('Payment confirmation submitted! Our team will verify shortly.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
      className="space-y-5"
    >
      {/* ── Payment Confirmed Banner ── */}
      {isPaid && (
        <div className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/5">
          <div className="w-10 h-10 rounded-xl bg-[var(--success)]/15 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="text-[var(--success)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text)]">Payment Confirmed — Thank you!</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Your payment for invoice <strong>{invoice.invoiceNumber}</strong> has been confirmed. Our team will dispatch your goods shortly.
            </p>
            <p className="text-xs text-[var(--text-subtle)] mt-1">Updated {fmtDateTime(quotation.updated_at)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="success" size="sm" icon={<CheckCircle2 size={11} />}>Paid</Badge>
            <Button size="sm" variant="outline" className="bg-white/50 border-[var(--success)]/25 text-[var(--success)] hover:bg-[var(--success)]/10" onClick={() => window.print()}>
              <Download size={14} className="mr-1.5" /> Download PDF
            </Button>
          </div>
        </div>
      )}

      {/* ── Awaiting Payment Banner ── */}
      {(!isPaid && !isPartiallyPaid) && (
        <div className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-blue-500/30 bg-blue-500/5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Receipt size={20} className="text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text)]">Invoice Sent — Payment Due</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              ElectroHub has issued a GST invoice for your accepted quotation. Please complete payment by{' '}
              <strong className="text-[var(--text)]">{fmtDate(invoice.dueDate)}</strong>.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="info" size="sm" icon={<Send size={11} />}>Invoice Sent</Badge>
            <Button size="sm" variant="outline" className="bg-white/50 border-blue-500/20 text-blue-600 hover:bg-blue-500/10" onClick={() => window.print()}>
              <Download size={14} className="mr-1.5" /> Download PDF
            </Button>
          </div>
        </div>
      )}

      {/* ── Partially Paid Banner ── */}
      {isPartiallyPaid && (
        <div className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Wallet size={20} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text)]">Partially Paid</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              We have received partial payment of <strong>{fmtINR(invoice.paidAmount)}</strong>. Please pay the remaining balance of{' '}
              <strong className="text-[var(--text)]">{fmtINR(invoice.pendingAmount)}</strong>.
            </p>
          </div>
          <Badge variant="warning" size="sm" icon={<CheckCircle2 size={11} />}>Partial</Badge>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        {/* ── Left: Invoice + Payment Details ── */}
        <div className="space-y-5">

          {/* Invoice Summary */}
          <SectionCard icon={Receipt} title="Invoice Summary">
            <DataRow label="Invoice #"><span className="font-mono">{invoice.invoiceNumber}</span></DataRow>
            <DataRow label="Quotation #"><span className="font-mono">{quotation.quotation_number}</span></DataRow>
            <DataRow label="Product">
              <span className="leading-snug">{quotation.product_name}</span>
            </DataRow>
            <DataRow label="Quantity">
              <span>{quotation.quantity.toLocaleString('en-IN')} units @ {fmtINR(Number(quotation.unit_price))}</span>
            </DataRow>
            <DataRow label="Taxable Amt"><span className="tabular-nums">{fmtINR(invoice.taxable)}</span></DataRow>
            {invoice.isIntraState ? (
              <>
                <DataRow label={`CGST (${Number(quotation.tax_pct)/2}%)`}>
                  <span className="tabular-nums text-[var(--text-muted)]">{fmtINR(invoice.cgst)}</span>
                </DataRow>
                <DataRow label={`SGST (${Number(quotation.tax_pct)/2}%)`}>
                  <span className="tabular-nums text-[var(--text-muted)]">{fmtINR(invoice.sgst)}</span>
                </DataRow>
              </>
            ) : (
              <DataRow label={`IGST (${quotation.tax_pct}%)`}>
                <span className="tabular-nums text-[var(--text-muted)]">{fmtINR(invoice.igst)}</span>
              </DataRow>
            )}
            {Number(quotation.shipping_charge) > 0 && (
              <DataRow label="Shipping"><span className="tabular-nums">{fmtINR(Number(quotation.shipping_charge))}</span></DataRow>
            )}
            <DataRow label="Due Date">
              <span className={cn(
                'flex items-center gap-1.5',
                !isPaid && new Date(invoice.dueDate) < new Date() ? 'text-[var(--danger)]' : '',
              )}>
                <Calendar size={12} className="shrink-0" />
                {fmtDate(invoice.dueDate)}
              </span>
            </DataRow>
            {/* Grand Total */}
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-between items-center">
              <span className="font-bold text-[var(--text)]">Total Amount Due</span>
              <span className="font-bold text-[var(--primary)] text-lg tabular-nums">{fmtINR(invoice.grand_total)}</span>
            </div>
            {isPartiallyPaid && (
              <div className="mt-2 pt-2 border-t border-[var(--border)] flex justify-between items-center">
                <span className="font-semibold text-[var(--text)]">Remaining Balance</span>
                <span className="font-bold text-amber-500 text-lg tabular-nums">{fmtINR(invoice.pendingAmount)}</span>
              </div>
            )}
          </SectionCard>

          {/* Bank / Transfer Details */}
          {!isPaid && (
            <SectionCard icon={Banknote} title="Bank Transfer Details (NEFT / RTGS)">
              <div className="space-y-0">
                <CopyableField label="Bank Name"    value="HDFC Bank Ltd." />
                <CopyableField label="Account No."  value="50200012345678" />
                <CopyableField label="IFSC Code"    value="HDFC0001234" />
                <CopyableField label="Account Name" value="ElectroHub Pvt. Ltd." />
                <CopyableField label="Amount"       value={fmtINR(invoice.pendingAmount)} />
                <CopyableField label="Ref / Narr."  value={invoice.invoiceNumber} />
              </div>
              <p className="text-xs text-[var(--text-subtle)] mt-3 italic">
                Please use the invoice number as the payment reference/narration.
              </p>
            </SectionCard>
          )}

          {/* UPI */}
          {!isPaid && (
            <SectionCard icon={Smartphone} title="UPI Payment">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-[var(--border)] flex items-center justify-center bg-[var(--background-alt)] shrink-0">
                  <QrCode size={36} className="text-[var(--text-subtle)]" />
                </div>
                <div className="flex-1 space-y-3">
                  <CopyableField label="UPI ID" value="electrohub@hdfcbank" />
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<ExternalLink size={13} />}
                    onClick={handlePayLink}
                    id="b2b-pay-link"
                    fullWidth
                  >
                    Pay via UPI / Payment Link
                  </Button>
                  {payLinkClicked && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Payment link opened. After completing payment, click "I Have Paid" below.
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">

          {/* Action card */}
          {!isPaid ? (
            <div className="rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <IndianRupee size={18} className="text-[var(--primary)]" />
                <p className="font-semibold text-[var(--text)]">Ready to pay?</p>
              </div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Complete your payment via NEFT, RTGS, or UPI using the details on the left, then confirm below. Your order will be dispatched after payment verification.
              </p>
              <div className="text-center py-2">
                <p className="text-3xl font-bold font-display text-[var(--primary)] tabular-nums">{fmtINR(invoice.pendingAmount)}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Amount payable</p>
              </div>
              <Button
                variant="primary"
                size="md"
                leftIcon={<CheckCircle2 size={15} />}
                onClick={() => setPaidOpen(true)}
                fullWidth
                id="b2b-mark-paid"
              >
                I Have Paid — Confirm Payment
              </Button>
              <p className="text-xs text-[var(--text-subtle)] text-center">
                Your payment reference will be verified by our accounts team within 1 business day.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[var(--success)]" />
                <p className="font-semibold text-[var(--success)]">Payment Confirmed</p>
              </div>
              <div className="text-center py-2">
                <p className="text-3xl font-bold font-display text-[var(--success)] tabular-nums">{fmtINR(invoice.grand_total)}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Amount received</p>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                Thank you for your payment. Your goods are being prepared for dispatch. You will receive a shipping notification soon.
              </p>
              {onNavigateToOrders && (
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Truck size={14} />}
                  onClick={onNavigateToOrders}
                  fullWidth
                  id="b2b-track-shipment"
                >
                  Track Shipment
                </Button>
              )}
            </div>
          )}

          {/* GST Details card */}
          <SectionCard icon={BadgeCheck} title="GST Details">
            <DataRow label="Invoice #"><span className="font-mono text-xs">{invoice.invoiceNumber}</span></DataRow>
            <DataRow label="HSN Code"><span className="font-mono text-xs">8542</span></DataRow>
            <DataRow label="GST Type">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                invoice.isIntraState
                  ? 'bg-violet-500/10 text-violet-600'
                  : 'bg-blue-500/10 text-blue-600',
              )}>
                {invoice.isIntraState ? 'CGST + SGST (Intra-state)' : 'IGST (Inter-state)'}
              </span>
            </DataRow>
            <DataRow label="Tax Rate"><span>{quotation.tax_pct}% GST</span></DataRow>
            <DataRow label="Seller GSTIN"><span className="font-mono text-xs">29ABCDE1234F1Z5</span></DataRow>
          </SectionCard>

          {/* Need help */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-4">
            <p className="text-sm font-semibold text-[var(--text)] mb-1">Need help?</p>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              For payment queries, contact our accounts team:
            </p>
            <a
              href="mailto:accounts@electrohub.in"
              className="text-xs text-[var(--primary)] hover:underline mt-1.5 flex items-center gap-1"
            >
              accounts@electrohub.in
            </a>
            <p className="text-xs text-[var(--text-muted)] mt-1">Mon–Sat, 9 AM – 6 PM IST</p>
          </div>
        </div>
      </div>

      {/* Mark as Paid modal */}
      <MarkPaidModal
        open={paidOpen}
        onClose={() => setPaidOpen(false)}
        invoice={invoice}
        onConfirm={handleConfirm}
      />

      {/* ── Hidden Print Area ── */}
      <div className="hidden print:block">
        <InvoiceDocument
          quotation={{
            ...quotation,
            quotationNumber: quotation.quotation_number || '',
            productName: quotation.product_name || '',
            productType: quotation.product_type || 'existing',
            quantity: quotation.quantity || 0,
            unitPrice: quotation.unit_price || 0,
            discountPct: quotation.discount_pct || 0,
            taxPct: quotation.tax_pct || 18,
            shippingCharge: quotation.shipping_charge || 0,
            customerName: (quotation.rfq as any)?.customer?.first_name || '',
            customerEmail: (quotation.rfq as any)?.customer?.email || '',
            customerCompany: (quotation.rfq as any)?.customer?.vendor_profile?.company_name || 'Customer',
            deliveryLocation: (quotation.rfq as any)?.delivery_location || '',
          } as any}
          record={{
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status as any,
            dueDate: invoice.dueDate,
            buyerGstin: invoice.buyerGstin,
            paidAt: invoice.paidAt,
            utrReference: invoice.utrReference,
            isIntraState: true,
          } as any}
        />
      </div>
    </motion.div>
  );
}
