'use client';

/**
 * ElectroHub — Admin Quotation Builder
 * Rendered inside AdminRFQs when "Proceed to Quotation" is clicked.
 *
 * Features:
 *  - Pre-filled from linked RFQ data
 *  - Live total calculation (unit price × qty − discount + tax + shipping)
 *  - Inventory summary (mock)
 *  - Reference Product URL display (read-only)
 *  - Save Draft / Preview / Send Quotation actions
 *  - Quotation status: draft → sent → viewed
 *  - Preview modal showing a printable-style quotation
 *
 * Uses ONLY existing ElectroHub design tokens and UI components.
 * No backend changes — all state is local/mock.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  Eye,
  ExternalLink,
  FileText,
  Link2,
  Mail,
  MapPin,
  Package,
  Percent,
  Save,
  Send,
  Sparkles,
  Truck,
  User,
  Warehouse,
  X,
  NotebookText,
  Hash,
  Building2,
  Phone,
  Receipt,
  Clock,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge }  from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal }  from '@/components/ui/Modal';
import { toast }  from '@/components/ui/Toast';
import { adminQuotationApi } from '@/lib/quotation-api';
import type { AdminRFQRow } from './AdminRFQs';

// ─── Quotation status ─────────────────────────────────────────────────────────

export type QuotationStatus = 'draft' | 'sent' | 'viewed';

const QUOT_STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; variant: 'default' | 'warning' | 'info' | 'success'; icon: React.ElementType }
> = {
  draft:  { label: 'Draft',  variant: 'default',  icon: FileText      },
  sent:   { label: 'Sent',   variant: 'info',     icon: Send          },
  viewed: { label: 'Viewed', variant: 'success',  icon: CheckCircle2  },
};

// ─── Quotation form state ─────────────────────────────────────────────────────

export interface QuotationForm {
  // Populated from RFQ
  rfqNumber:       string;
  customerName:    string;
  customerEmail:   string;
  customerPhone:   string;
  customerCompany: string;
  productName:     string;
  productType:     'existing' | 'custom';
  referenceUrl:    string;

  // Pricing
  quantity:        number;
  unitPrice:       string;   // string for controlled input
  discountPct:     string;   // % discount
  taxPct:          string;   // % tax
  shippingCharge:  string;   // flat shipping

  // Delivery
  deliveryLocation: string;
  expectedDelivery: string;  // YYYY-MM-DD

  // Inventory (mock, display-only)
  availableQty:    number;
  reservedQty:     number;
  incomingQty:     number;
  eta:             string;

  // Meta
  validUntil:      string;  // YYYY-MM-DD
  termsNotes:      string;
}

// ─── Default empty form ───────────────────────────────────────────────────────

export const EMPTY_QUOTATION_FORM: QuotationForm = {
  rfqNumber:        '',
  customerName:     '',
  customerEmail:    '',
  customerPhone:    '',
  customerCompany:  '',
  productName:      '',
  productType:      'existing',
  referenceUrl:     '',
  quantity:         1,
  unitPrice:        '',
  discountPct:      '0',
  taxPct:           '18',
  shippingCharge:   '0',
  deliveryLocation: '',
  expectedDelivery: '',
  availableQty:     0,
  reservedQty:      0,
  incomingQty:      0,
  eta:              '',
  validUntil:       '',
  termsNotes:
    '1. Prices are inclusive of applicable duties.\n' +
    '2. Payment terms: 50% advance, balance before dispatch.\n' +
    '3. Lead time subject to stock availability.\n' +
    '4. Validity subject to final confirmation from procurement team.',
};

/** Build a pre-filled form from an AdminRFQRow */
export function rfqToQuotationForm(rfq: AdminRFQRow): QuotationForm {
  // Default validity: 14 days from today
  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + 14);
  const validUntil = validUntilDate.toISOString().split('T')[0];

  return {
    ...EMPTY_QUOTATION_FORM,
    rfqNumber:        rfq.rfqNumber,
    customerName:     rfq.customer.name,
    customerEmail:    rfq.customer.email,
    customerPhone:    rfq.customer.phone,
    customerCompany:  rfq.customer.company ?? '',
    productName:      rfq.productName,
    productType:      rfq.productType,
    referenceUrl:     rfq.referenceUrl ?? '',
    quantity:         rfq.quantity,
    deliveryLocation: rfq.deliveryLocation,
    expectedDelivery: rfq.requiredByDate,
    availableQty:     rfq.inventory?.available ?? 0,
    reservedQty:      rfq.inventory?.reserved  ?? 0,
    incomingQty:      rfq.inventory?.incoming  ?? 0,
    eta:              rfq.inventory?.eta        ?? '',
    validUntil,
  };
}

// ─── Live totals calculation ──────────────────────────────────────────────────

interface Totals {
  subtotal:   number;
  discount:   number;
  taxable:    number;
  tax:        number;
  shipping:   number;
  grandTotal: number;
}

function calcTotals(form: QuotationForm): Totals {
  const qty      = form.quantity || 0;
  const unit     = parseFloat(form.unitPrice)     || 0;
  const discPct  = parseFloat(form.discountPct)   || 0;
  const taxPct   = parseFloat(form.taxPct)        || 0;
  const shipping = parseFloat(form.shippingCharge) || 0;

  const subtotal   = qty * unit;
  const discount   = subtotal * (discPct / 100);
  const taxable    = subtotal - discount;
  const tax        = taxable * (taxPct / 100);
  const grandTotal = taxable + tax + shipping;

  return { subtotal, discount, taxable, tax, shipping, grandTotal };
}

function fmtINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Reusable input primitives (stay within existing design tokens) ────────────

interface FieldProps {
  label:        string;
  required?:    boolean;
  hint?:        string;
  children:     React.ReactNode;
}

function Field({ label, required, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
        {label}{required && <span className="text-[var(--danger)] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-[var(--text-subtle)]">{hint}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  readOnly,
  min,
  step,
  id,
}: {
  value:        string;
  onChange?:    (v: string) => void;
  placeholder?: string;
  type?:        string;
  readOnly?:    boolean;
  min?:         string;
  step?:        string;
  id?:          string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      readOnly={readOnly}
      min={min}
      step={step}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn(
        'h-9 w-full rounded-lg border px-3 text-sm outline-none transition-all',
        'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]',
        'placeholder:text-[var(--text-subtle)]',
        'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
        readOnly && 'opacity-60 cursor-not-allowed bg-[var(--background-alt)]',
      )}
    />
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  min = '0',
  step = '1',
  id,
}: {
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  prefix?:      string;
  suffix?:      string;
  min?:         string;
  step?:        string;
  id?:          string;
}) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-sm text-[var(--text-subtle)] pointer-events-none select-none">
          {prefix}
        </span>
      )}
      <input
        id={id}
        type="number"
        value={value}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-9 w-full rounded-lg border text-sm outline-none transition-all',
          'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]',
          'placeholder:text-[var(--text-subtle)]',
          'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
          prefix && 'pl-7',
          suffix && 'pr-9',
          'px-3',
        )}
      />
      {suffix && (
        <span className="absolute right-3 text-sm text-[var(--text-subtle)] pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

function TextareaInput({
  value,
  onChange,
  placeholder,
  rows = 3,
  id,
}: {
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  rows?:        number;
  id?:          string;
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all resize-none',
        'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]',
        'placeholder:text-[var(--text-subtle)]',
        'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
      )}
    />
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

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
    <div className={cn('rounded-xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden', className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--background-alt)]">
        <Icon size={14} className="text-[var(--primary)]" />
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Totals panel ─────────────────────────────────────────────────────────────

function TotalsPanel({ totals, form }: { totals: Totals; form: QuotationForm }) {
  const rows: { label: string; value: string; highlight?: boolean; dim?: boolean }[] = [
    { label: `Subtotal (${form.quantity} × ${form.unitPrice ? fmtINR(parseFloat(form.unitPrice)) : '—'})`, value: fmtINR(totals.subtotal) },
    { label: `Discount (${form.discountPct}%)`, value: `-${fmtINR(totals.discount)}`, dim: totals.discount === 0 },
    { label: `GST / Tax (${form.taxPct}%)`, value: fmtINR(totals.tax) },
    { label: 'Shipping', value: fmtINR(totals.shipping) },
  ];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--background-alt)]">
        <Receipt size={14} className="text-[var(--primary)]" />
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Live Totals</h3>
        <span className="ml-auto text-[10px] text-[var(--text-subtle)] italic">Updates as you type</span>
      </div>
      <div className="p-4 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <span className={cn('text-sm', row.dim ? 'text-[var(--text-subtle)]' : 'text-[var(--text-muted)]')}>
              {row.label}
            </span>
            <span className={cn('text-sm font-medium tabular-nums', row.dim ? 'text-[var(--text-subtle)]' : 'text-[var(--text)]')}>
              {row.value}
            </span>
          </div>
        ))}
        <div className="border-t border-[var(--border)] pt-2 mt-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-[var(--text)]">Grand Total</span>
            <motion.span
              key={totals.grandTotal}
              initial={{ opacity: 0.4, scale: 0.96 }}
              animate={{ opacity: 1,   scale: 1 }}
              className="text-lg font-bold text-[var(--primary)] tabular-nums"
            >
              {fmtINR(totals.grandTotal)}
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({
  open,
  onClose,
  form,
  totals,
  quotNumber,
  status,
}: {
  open:       boolean;
  onClose:    () => void;
  form:       QuotationForm;
  totals:     Totals;
  quotNumber: string;
  status:     QuotationStatus;
}) {
  const statusCfg  = QUOT_STATUS_CONFIG[status];
  const StatusIcon = statusCfg.icon;

  return (
    <Modal open={open} onClose={onClose} size="xl" scroll="inside" title="Quotation Preview">
      <div className="space-y-5 text-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">ElectroHub</span>
              <span className="text-[var(--text-subtle)]">·</span>
              <span className="text-xs text-[var(--text-subtle)]">Official Quotation</span>
            </div>
            <h2 className="text-xl font-bold font-display text-[var(--text)] font-mono">{quotNumber}</h2>
            <p className="text-xs text-[var(--text-subtle)] mt-0.5">In reference to RFQ: {form.rfqNumber}</p>
          </div>
          <div className="text-right shrink-0">
            <Badge variant={statusCfg.variant} size="sm" icon={<StatusIcon size={11} />}>
              {statusCfg.label}
            </Badge>
            <p className="text-xs text-[var(--text-subtle)] mt-1.5">Valid until: {fmtDate(form.validUntil)}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)] mb-1.5">From</p>
            <p className="font-semibold text-[var(--text)]">ElectroHub Pvt. Ltd.</p>
            <p className="text-[var(--text-muted)]">123 Electronics Hub, Koramangala</p>
            <p className="text-[var(--text-muted)]">Bengaluru, Karnataka 560034</p>
            <p className="text-[var(--text-muted)]">GST: 29ABCDE1234F1Z5</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)] mb-1.5">To</p>
            <p className="font-semibold text-[var(--text)]">{form.customerName}</p>
            {form.customerCompany && <p className="text-[var(--text-muted)]">{form.customerCompany}</p>}
            <p className="text-[var(--text-muted)]">{form.customerEmail}</p>
            <p className="text-[var(--text-muted)]">{form.customerPhone}</p>
          </div>
        </div>

        {/* Item table */}
        <div className="rounded-xl overflow-hidden border border-[var(--border)]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[var(--background-alt)] border-b border-[var(--border)]">
                <th className="px-4 py-2.5 text-left font-semibold text-[var(--text-muted)] text-xs">#</th>
                <th className="px-4 py-2.5 text-left font-semibold text-[var(--text-muted)] text-xs">Description</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">Qty</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">Unit Price</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[var(--text-muted)] text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--border)]">
                <td className="px-4 py-3 text-[var(--text-muted)]">1</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--text)]">{form.productName}</p>
                  {form.referenceUrl && (
                    <a
                      href={form.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--primary)] hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <Link2 size={10} />
                      Reference
                      <ExternalLink size={9} />
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-[var(--text)]">{form.quantity.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right text-[var(--text)] font-medium">
                  {form.unitPrice ? fmtINR(parseFloat(form.unitPrice)) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[var(--text)]">{fmtINR(totals.subtotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-1.5">
            {[
              { label: 'Subtotal',                        value: fmtINR(totals.subtotal) },
              { label: `Discount (${form.discountPct}%)`, value: `-${fmtINR(totals.discount)}` },
              { label: `Tax / GST (${form.taxPct}%)`,     value: fmtINR(totals.tax) },
              { label: 'Shipping & Handling',             value: fmtINR(totals.shipping) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-[var(--text-muted)]">{label}</span>
                <span className="text-[var(--text)] tabular-nums">{value}</span>
              </div>
            ))}
            <div className="border-t border-[var(--border)] pt-1.5 flex justify-between">
              <span className="font-bold text-[var(--text)]">Grand Total</span>
              <span className="font-bold text-[var(--primary)] text-base tabular-nums">{fmtINR(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Delivery & validity */}
        <div className="grid grid-cols-2 gap-4 text-xs text-[var(--text-muted)]">
          <div>
            <p className="font-semibold text-[var(--text)] mb-1">Delivery Details</p>
            <p>Location: {form.deliveryLocation || '—'}</p>
            <p>Expected By: {fmtDate(form.expectedDelivery)}</p>
          </div>
          <div>
            <p className="font-semibold text-[var(--text)] mb-1">Inventory Status (Mock)</p>
            <p>Available: {form.availableQty} · Reserved: {form.reservedQty}</p>
            <p>Incoming: {form.incomingQty} · ETA: {fmtDate(form.eta)}</p>
          </div>
        </div>

        {/* Terms */}
        {form.termsNotes && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background-alt)] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)] mb-1.5">
              Terms & Conditions
            </p>
            <p className="text-xs text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed">
              {form.termsNotes}
            </p>
          </div>
        )}

        <p className="text-[10px] text-[var(--text-subtle)] text-center italic">
          This is a system-generated quotation preview. Values shown are illustrative/mock data.
        </p>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main AdminQuotationBuilder Component
// ═══════════════════════════════════════════════════════════════════════════════

interface AdminQuotationBuilderProps {
  rfq:    AdminRFQRow;
  onBack: () => void;
}

export function AdminQuotationBuilder({ rfq, onBack }: AdminQuotationBuilderProps) {
  const [form, setForm]             = React.useState<QuotationForm>(() => rfqToQuotationForm(rfq));
  const [status, setStatus]         = React.useState<QuotationStatus>('draft');
  const [previewOpen, setPreview]   = React.useState(false);
  const [isSaving, setSaving]       = React.useState(false);
  const [isSending, setSending]     = React.useState(false);
  // Tracks the persisted DB quotation so Save Draft → Send reuses the same record
  const [savedQuotId, setSavedQuotId] = React.useState<number | null>(null);
  const [realQuotNumber, setRealQuotNumber] = React.useState<string>('');

  // Fallback display number before the quotation is saved
  const quotNumber = realQuotNumber || `QT-${rfq.rfqNumber.replace('RFQ-', '')}`;

  const totals = React.useMemo(() => calcTotals(form), [form]);

  const update = <K extends keyof QuotationForm>(key: K, value: QuotationForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Actions ──────────────────────────────────────────────────────────────────

  // Builds the payload accepted by QuotationCreateSerializer
  const buildPayload = () => ({
    rfq:               parseInt(rfq.id, 10),
    product_name:      form.productName,
    product_type:      form.productType,
    quantity:          form.quantity,
    unit_price:        form.unitPrice        || '0',
    discount_pct:      form.discountPct      || '0',
    tax_pct:           form.taxPct           || '0',
    shipping_charge:   form.shippingCharge   || '0',
    delivery_location: form.deliveryLocation,
    expected_delivery: form.expectedDelivery || undefined,
    valid_until:       form.validUntil       || undefined,
    available_qty:     form.availableQty,
    reserved_qty:      form.reservedQty,
    incoming_qty:      form.incomingQty,
    eta:               form.eta              || undefined,
    terms_notes:       form.termsNotes,
  });

  // Creates or updates the quotation record and returns its DB id
  const persistQuotation = async (): Promise<number> => {
    const payload = buildPayload();
    if (savedQuotId) {
      // Already saved — patch only (don't re-create to avoid unique RFQ constraint error)
      const updated = await adminQuotationApi.updateQuotation(savedQuotId, payload);
      return updated.id;
    }
    const created = await adminQuotationApi.createQuotation(payload);
    setSavedQuotId(created.id);
    setRealQuotNumber(created.quotation_number);
    // Add the single line item for the header-level product
    try {
      await adminQuotationApi.addItem(created.id, {
        product_name:     form.productName,
        quantity:         form.quantity,
        unit_price:       form.unitPrice    || '0',
        discount_pct:     form.discountPct  || '0',
        tax_pct:          form.taxPct       || '0',
        availability_qty: form.availableQty,
      });
    } catch {
      // Item creation failing is non-critical — quotation header is already saved
    }
    return created.id;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const quotId = await persistQuotation();
      setStatus('draft');
      toast.success(`Quotation ${realQuotNumber || quotNumber} saved as draft (id: ${quotId})`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save draft quotation');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!form.unitPrice || parseFloat(form.unitPrice) <= 0) {
      toast.error('Please enter a valid unit price before sending.');
      return;
    }
    if (!form.validUntil) {
      toast.error('Please set a validity date before sending.');
      return;
    }
    setSending(true);
    try {
      const quotId = await persistQuotation();
      await adminQuotationApi.sendQuotation(quotId);
      setStatus('sent');
      toast.success(`Quotation ${realQuotNumber || quotNumber} sent to ${form.customerEmail}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send quotation');
    } finally {
      setSending(false);
    }
  };

  const statusCfg  = QUOT_STATUS_CONFIG[status];
  const StatusIcon = statusCfg.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
        className="space-y-5"
      >
        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            id="admin-quot-back"
          >
            <ArrowLeft size={15} />
            Back to RFQ
          </button>
          <div className="h-4 w-px bg-[var(--border)]" />
          <span className="font-mono font-semibold text-[var(--text)]">{quotNumber}</span>
          <Badge
            variant={statusCfg.variant}
            size="sm"
            icon={<StatusIcon size={11} />}
          >
            {statusCfg.label}
          </Badge>
          <span className="text-xs text-[var(--text-subtle)] border border-[var(--border)] rounded-full px-2 py-0.5 bg-[var(--surface)]">
            For {rfq.rfqNumber}
          </span>

          {/* Action buttons */}
          <div className="ml-auto flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Eye size={14} />}
              onClick={() => setPreview(true)}
              id="admin-quot-preview"
            >
              Preview
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Save size={14} />}
              onClick={handleSaveDraft}
              isLoading={isSaving}
              loadingText="Saving…"
              id="admin-quot-save-draft"
            >
              Save Draft
            </Button>
            <Button
              variant="gradient"
              size="sm"
              leftIcon={<Send size={14} />}
              onClick={handleSend}
              isLoading={isSending}
              loadingText="Sending…"
              disabled={status === 'sent' || status === 'viewed'}
              id="admin-quot-send"
            >
              {status === 'sent' ? 'Sent ✓' : status === 'viewed' ? 'Viewed ✓' : 'Send Quotation'}
            </Button>
          </div>
        </div>

        {/* ── Main grid: form + sidebar ── */}
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">

          {/* ─ Left: form ─────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Customer (read-only from RFQ) */}
            <SectionCard icon={User} title="Customer Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Customer Name">
                  <TextInput value={form.customerName} readOnly />
                </Field>
                <Field label="Company">
                  <TextInput value={form.customerCompany} readOnly />
                </Field>
                <Field label="Email">
                  <TextInput value={form.customerEmail} readOnly />
                </Field>
                <Field label="Phone">
                  <TextInput value={form.customerPhone} readOnly />
                </Field>
              </div>
            </SectionCard>

            {/* Product */}
            <SectionCard
              icon={form.productType === 'existing' ? Package : Sparkles}
              title="Product / Requirement"
            >
              <div className="space-y-3">
                <Field label="Product / Requirement Name">
                  <TextInput
                    value={form.productName}
                    onChange={(v) => update('productName', v)}
                    placeholder="Product or requirement description"
                    id="quot-product-name"
                  />
                </Field>
                {form.referenceUrl && (
                  <Field label="Reference Product URL (from RFQ)">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <TextInput value={form.referenceUrl} readOnly />
                      </div>
                      <Button
                        variant="secondary"
                        size="xs"
                        leftIcon={<ExternalLink size={12} />}
                        onClick={() => window.open(form.referenceUrl, '_blank')}
                        id="quot-open-ref"
                      >
                        Open
                      </Button>
                    </div>
                    <p className="text-[10px] text-[var(--text-subtle)] mt-1 flex items-center gap-1">
                      <Link2 size={10} />
                      Provided by customer for reference only
                    </p>
                  </Field>
                )}
              </div>
            </SectionCard>

            {/* Pricing */}
            <SectionCard icon={DollarSign} title="Pricing">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="Quantity" required>
                  <NumberInput
                    id="quot-qty"
                    value={String(form.quantity)}
                    onChange={(v) => update('quantity', Math.max(1, parseInt(v) || 1))}
                    min="1"
                    step="1"
                  />
                </Field>
                <Field label="Unit Price (₹)" required>
                  <NumberInput
                    id="quot-unit-price"
                    value={form.unitPrice}
                    onChange={(v) => update('unitPrice', v)}
                    prefix="₹"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </Field>
                <Field label="Discount (%)" hint="Applied on subtotal">
                  <NumberInput
                    id="quot-discount"
                    value={form.discountPct}
                    onChange={(v) => update('discountPct', v)}
                    suffix="%"
                    min="0"
                    step="0.5"
                  />
                </Field>
                <Field label="Tax / GST (%)" hint="Applied after discount">
                  <NumberInput
                    id="quot-tax"
                    value={form.taxPct}
                    onChange={(v) => update('taxPct', v)}
                    suffix="%"
                    min="0"
                    step="0.5"
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Shipping Charge (₹)" hint="Flat shipping fee">
                  <div className="w-48">
                    <NumberInput
                      id="quot-shipping"
                      value={form.shippingCharge}
                      onChange={(v) => update('shippingCharge', v)}
                      prefix="₹"
                      placeholder="0.00"
                      min="0"
                      step="1"
                    />
                  </div>
                </Field>
              </div>
            </SectionCard>

            {/* Delivery */}
            <SectionCard icon={Truck} title="Delivery">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Delivery Location" required>
                  <TextInput
                    id="quot-delivery-loc"
                    value={form.deliveryLocation}
                    onChange={(v) => update('deliveryLocation', v)}
                    placeholder="City, State, PIN"
                  />
                </Field>
                <Field label="Expected Delivery" required hint="Committed delivery date">
                  <TextInput
                    id="quot-delivery-date"
                    type="date"
                    value={form.expectedDelivery}
                    onChange={(v) => update('expectedDelivery', v)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </Field>
              </div>
            </SectionCard>

            {/* Validity & Terms */}
            <SectionCard icon={NotebookText} title="Validity & Terms">
              <div className="space-y-3">
                <Field label="Quotation Valid Until" required hint="Customer must respond before this date">
                  <div className="w-48">
                    <TextInput
                      id="quot-valid-until"
                      type="date"
                      value={form.validUntil}
                      onChange={(v) => update('validUntil', v)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </Field>
                <Field label="Terms & Notes">
                  <TextareaInput
                    id="quot-terms"
                    value={form.termsNotes}
                    onChange={(v) => update('termsNotes', v)}
                    placeholder="Payment terms, lead time, conditions…"
                    rows={5}
                  />
                </Field>
              </div>
            </SectionCard>

          </div>

          {/* ─ Right sidebar ──────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Live totals */}
            <TotalsPanel totals={totals} form={form} />

            {/* Inventory */}
            <SectionCard icon={Warehouse} title="Inventory (Mock)">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: 'Available', value: form.availableQty, tone: 'border-[var(--border)] bg-[var(--background-alt)]' },
                  { label: 'Reserved',  value: form.reservedQty,  tone: 'border-amber-500/20 bg-amber-500/5' },
                  { label: 'Incoming',  value: form.incomingQty,  tone: 'border-blue-500/20 bg-blue-500/5' },
                ].map(({ label, value, tone }) => (
                  <div key={label} className={cn('flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border', tone)}>
                    <span className="text-base font-bold text-[var(--text)]">{value}</span>
                    <span className="text-[10px] font-medium text-[var(--text-subtle)] uppercase tracking-wide">{label}</span>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <span className="text-xs font-semibold text-emerald-600">
                    {form.eta ? fmtDate(form.eta) : '—'}
                  </span>
                  <span className="text-[10px] font-medium text-[var(--text-subtle)] uppercase tracking-wide">ETA</span>
                </div>
              </div>

              {/* Editable inventory overrides */}
              <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3">
                <Field label="Available">
                  <NumberInput
                    id="quot-inv-avail"
                    value={String(form.availableQty)}
                    onChange={(v) => update('availableQty', parseInt(v) || 0)}
                    min="0"
                  />
                </Field>
                <Field label="Reserved">
                  <NumberInput
                    id="quot-inv-reserved"
                    value={String(form.reservedQty)}
                    onChange={(v) => update('reservedQty', parseInt(v) || 0)}
                    min="0"
                  />
                </Field>
                <Field label="Incoming">
                  <NumberInput
                    id="quot-inv-incoming"
                    value={String(form.incomingQty)}
                    onChange={(v) => update('incomingQty', parseInt(v) || 0)}
                    min="0"
                  />
                </Field>
              </div>
              <div className="mt-2">
                <Field label="ETA Date">
                  <TextInput
                    id="quot-inv-eta"
                    type="date"
                    value={form.eta}
                    onChange={(v) => update('eta', v)}
                  />
                </Field>
              </div>
              <p className="text-[10px] text-[var(--text-subtle)] mt-2 italic">
                * Mock values. Override as needed for quotation.
              </p>
            </SectionCard>

            {/* RFQ summary */}
            <SectionCard icon={FileText} title="Linked RFQ">
              {[
                { label: 'RFQ Number', value: rfq.rfqNumber },
                { label: 'Customer Budget', value: rfq.budget ? `₹${Number(rfq.budget).toLocaleString('en-IN')}` : 'Not specified' },
                { label: 'Required By', value: fmtDate(rfq.requiredByDate) },
                { label: 'Quantity Req.', value: `${rfq.quantity.toLocaleString('en-IN')} units` },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3 py-1.5 border-b border-[var(--border)] last:border-0">
                  <span className="text-xs text-[var(--text-subtle)] w-28 shrink-0">{label}</span>
                  <span className="text-xs font-medium text-[var(--text)] flex-1">{value}</span>
                </div>
              ))}
            </SectionCard>

            {/* Quotation status chip */}
            <div className={cn(
              'rounded-xl border px-4 py-3 flex items-center gap-3',
              status === 'draft'  && 'border-[var(--border)] bg-[var(--background-alt)]',
              status === 'sent'   && 'border-blue-500/30 bg-blue-500/5',
              status === 'viewed' && 'border-emerald-500/30 bg-emerald-500/5',
            )}>
              <StatusIcon size={16} className={cn(
                status === 'draft'  && 'text-[var(--text-subtle)]',
                status === 'sent'   && 'text-blue-500',
                status === 'viewed' && 'text-emerald-500',
              )} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--text)]">Status: {statusCfg.label}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {status === 'draft'  && 'Not yet sent. Save or send when ready.'}
                  {status === 'sent'   && `Sent to ${form.customerEmail}.`}
                  {status === 'viewed' && 'Customer has viewed this quotation.'}
                </p>
              </div>
              {status === 'sent' && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => { setStatus('viewed'); toast.info('Marked as Viewed'); }}
                  id="admin-quot-mark-viewed"
                >
                  Mark Viewed
                </Button>
              )}
            </div>

          </div>
        </div>
      </motion.div>

      {/* Preview modal */}
      <PreviewModal
        open={previewOpen}
        onClose={() => setPreview(false)}
        form={form}
        totals={totals}
        quotNumber={quotNumber}
        status={status}
      />
    </>
  );
}
