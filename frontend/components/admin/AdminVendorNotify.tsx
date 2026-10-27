'use client';

/**
 * ElectroHub — Admin Vendor Notification
 * Rendered inside AdminDashboard when the "Vendor Notify" nav item is active.
 *
 * Shows quotations that are po_ready and lets admin:
 *  1. Select one or more vendors (checklist)
 *  2. Preview the auto-generated notification message
 *  3. Send the notification (mock dispatch with loading → confirmation toast)
 *  4. View a dispatch log timeline for already-notified items
 *
 * Patterns mirror AdminRFQs.tsx / AdminApprovals.tsx exactly:
 *  - DetailSection / DetailRow (same local pattern)
 *  - Animated table rows (AnimatePresence / motion.tr)
 *  - Modal for confirmation
 *  - toast feedback
 *  - motion entrance animations
 *
 * All state is local/mock. No backend. No new routes.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  BellRing,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  Send,
  Sparkles,
  Star,
  Truck,
  Users,
  XCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge }  from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';
import { Modal }  from '@/components/ui/Modal';
import { toast }  from '@/components/ui/Toast';
import type { ApprovableQuotation } from './AdminApprovals';

// ─── Vendor types ─────────────────────────────────────────────────────────────

export interface Vendor {
  id:          string;
  name:        string;
  company:     string;
  email:       string;
  phone:       string;
  category:    string;
  rating:      number;   // 1–5
  verified:    boolean;
  location:    string;
}

export interface DispatchEntry {
  id:          string;
  vendorId:    string;
  vendorName:  string;
  vendorEmail: string;
  sentAt:      string;
  messageSubject: string;
}

// ─── Seed vendors ─────────────────────────────────────────────────────────────

const VENDORS: Vendor[] = [
  { id: 'v-001', name: 'Rajesh Kumar',    company: 'Microchip Supplies Pvt. Ltd.',  email: 'rajesh@microchipsupplies.in',  phone: '9876543210', category: 'Semiconductors',        rating: 4.8, verified: true,  location: 'Bengaluru, KA' },
  { id: 'v-002', name: 'Sunita Rao',      company: 'TechParts India',               email: 'sunita@techparts.in',           phone: '9812345678', category: 'Electronic Components', rating: 4.5, verified: true,  location: 'Pune, MH'      },
  { id: 'v-003', name: 'Amir Hassan',     company: 'Precision Electronics Co.',     email: 'amir@precisionelec.in',         phone: '9823456789', category: 'Semiconductors',        rating: 4.2, verified: false, location: 'Delhi NCR'     },
  { id: 'v-004', name: 'Divya Sharma',    company: 'Allied Components Ltd.',        email: 'divya@alliedcomp.in',           phone: '9701234567', category: 'PCB & Fabrication',     rating: 4.7, verified: true,  location: 'Chennai, TN'   },
  { id: 'v-005', name: 'Sanjay Mehta',    company: 'Global IoT Distributors',       email: 'sanjay@globiot.in',             phone: '9654321098', category: 'IoT Modules',           rating: 4.6, verified: true,  location: 'Mumbai, MH'    },
  { id: 'v-006', name: 'Preethi Nair',    company: 'SouthTech Electronics',         email: 'preethi@southtech.in',          phone: '9543210987', category: 'Sensors & Actuators',   rating: 4.3, verified: true,  location: 'Kochi, KL'     },
];

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

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-1">
      <Star size={11} className="text-amber-400 fill-amber-400" />
      <span className="text-xs font-semibold tabular-nums">{value.toFixed(1)}</span>
    </span>
  );
}

// ─── Vendor card (selection checklist) ───────────────────────────────────────

function VendorCard({
  vendor,
  selected,
  onToggle,
}: {
  vendor:   Vendor;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      id={`vendor-select-${vendor.id}`}
      className={cn(
        'flex items-start gap-3 w-full text-left px-4 py-3 rounded-xl border transition-all duration-200',
        selected
          ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]/20'
          : 'border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--border-strong)]',
      )}
    >
      {/* Checkbox */}
      <div className={cn(
        'mt-0.5 w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 border transition-colors',
        selected
          ? 'bg-[var(--primary)] border-[var(--primary)]'
          : 'border-[var(--border)] bg-[var(--background)]',
      )} style={{ width: 18, height: 18 }}>
        {selected && <CheckCircle2 size={12} className="text-white" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[var(--text)]">{vendor.name}</p>
          {vendor.verified && (
            <Badge variant="success" size="xs">Verified</Badge>
          )}
          <StarRating value={vendor.rating} />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{vendor.company}</p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-[var(--text-subtle)]">
            <Mail size={10} />{vendor.email}
          </span>
          <span className="flex items-center gap-1 text-xs text-[var(--text-subtle)]">
            <MapPin size={10} />{vendor.location}
          </span>
        </div>
      </div>

      {/* Category */}
      <Badge variant="info" size="xs" className="shrink-0 mt-0.5">{vendor.category}</Badge>
    </button>
  );
}

// ─── Message preview ──────────────────────────────────────────────────────────

function MessagePreview({
  quotation,
  selectedVendors,
}: {
  quotation:       ApprovableQuotation;
  selectedVendors: Vendor[];
}) {
  const toList = selectedVendors.length === 0
    ? '[Select vendors above]'
    : selectedVendors.map((v) => `${v.name} <${v.email}>`).join(', ');

  const subject = `[ElectroHub] RFQ Vendor Notification \u2014 ${quotation.rfqNumber}`;
  const body = `Dear Vendor Partner,

We are reaching out regarding a Purchase Order opportunity for the following requirement:

  Purchase Order Reference : PO-${quotation.quotationNumber.replace('QT-', '')}
  Quotation Reference      : ${quotation.quotationNumber}
  RFQ Reference            : ${quotation.rfqNumber}
  Product / Requirement    : ${quotation.productName}
  Quantity Required        : ${quotation.quantity.toLocaleString('en-IN')} units
  Delivery Location        : ${quotation.deliveryLocation}
  Expected Delivery By     : ${fmtDate(quotation.expectedDelivery)}
  Approved Grand Total     : ${fmtINR(quotation.grandTotal)}

This requirement has been fully approved through our internal procurement process (HOD \u2192 Director \u2192 Accountant) and a Purchase Order is being raised.

Please confirm your availability and earliest dispatch date by replying to this email or contacting our procurement desk.

Regards,
ElectroHub Procurement Team
procurement@electrohub.in | +91-80-4000-0000`;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--background-alt)]">
        <Mail size={14} className="text-[var(--primary)]" />
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Message Preview</h3>
        <span className="ml-auto text-[10px] text-[var(--text-subtle)] italic">Auto-generated</span>
      </div>
      <div className="px-4 py-3 space-y-2 text-xs font-mono">
        <div className="flex gap-3">
          <span className="text-[var(--text-subtle)] w-16 shrink-0">To:</span>
          <span className={cn('text-[var(--text)] break-all', selectedVendors.length === 0 && 'text-[var(--text-subtle)] italic')}>
            {toList}
          </span>
        </div>
        <div className="flex gap-3">
          <span className="text-[var(--text-subtle)] w-16 shrink-0">Subject:</span>
          <span className="text-[var(--text)] font-semibold">{subject}</span>
        </div>
        <div className="border-t border-[var(--border)] pt-2 mt-2">
          <pre className="whitespace-pre-wrap text-[var(--text-muted)] leading-relaxed text-xs font-mono">
            {body}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── Send Confirmation Modal ──────────────────────────────────────────────────

function SendConfirmModal({
  open,
  onClose,
  quotation,
  vendors,
  onConfirm,
}: {
  open:      boolean;
  onClose:   () => void;
  quotation: ApprovableQuotation;
  vendors:   Vendor[];
  onConfirm: () => void;
}) {
  const [sending, setSending] = React.useState(false);

  const handleSend = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 900));
    setSending(false);
    onConfirm();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" title="Confirm Vendor Notification">
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5">
          <BellRing size={18} className="text-[var(--primary)] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">
              Send to {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{quotation.quotationNumber} \u00b7 {quotation.rfqNumber}</p>
          </div>
        </div>

        {/* Vendor list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Recipients</p>
          {vendors.map((v) => (
            <div key={v.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--background-alt)] border border-[var(--border)]">
              <Mail size={13} className="text-[var(--primary)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text)] truncate">{v.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{v.email}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" onClick={onClose} fullWidth id="vn-modal-cancel">Cancel</Button>
          <Button
            variant="gradient"
            size="md"
            leftIcon={<Send size={14} />}
            onClick={handleSend}
            isLoading={sending}
            loadingText="Sending\u2026"
            fullWidth
            id="vn-modal-confirm"
          >
            Send Notification
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Dispatch Log timeline ────────────────────────────────────────────────────

function DispatchLog({ log }: { log: DispatchEntry[] }) {
  if (log.length === 0) {
    return <p className="text-sm text-[var(--text-subtle)] italic py-2">No notifications dispatched yet.</p>;
  }

  return (
    <div className="space-y-3">
      {log.map((entry, idx) => {
        const isLast = idx === log.length - 1;
        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[var(--primary)]/10">
                <Send size={13} className="text-[var(--primary)]" />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-[var(--border)] mt-1" />}
            </div>
            <div className={cn('flex-1', isLast ? 'pb-0' : 'pb-3')}>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-sm font-semibold text-[var(--text)]">{entry.vendorName}</span>
                <Badge variant="success" size="xs">Notified</Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{entry.vendorEmail}</p>
              <p className="text-xs text-[var(--text-subtle)] mt-0.5">{fmtDateTime(entry.sentAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Detail / Notify panel ────────────────────────────────────────────────────

interface NotifyDetailProps {
  quotation:      ApprovableQuotation;
  onBack:         () => void;
  onNotifySent:   (quotId: string, entries: DispatchEntry[]) => void;
  existingLog:    DispatchEntry[];
}

function NotifyDetailPanel({ quotation, onBack, onNotifySent, existingLog }: NotifyDetailProps) {
  const [vendorSearch, setVendorSearch]   = React.useState('');
  const [selectedIds, setSelectedIds]     = React.useState<Set<string>>(new Set());
  const [showPreview, setShowPreview]     = React.useState(true);
  const [confirmOpen, setConfirmOpen]     = React.useState(false);

  const filteredVendors = VENDORS.filter((v) => {
    const s = vendorSearch.toLowerCase();
    return (
      v.name.toLowerCase().includes(s) ||
      v.company.toLowerCase().includes(s) ||
      v.email.toLowerCase().includes(s) ||
      v.category.toLowerCase().includes(s)
    );
  });

  const selectedVendors = VENDORS.filter((v) => selectedIds.has(v.id));

  const toggleVendor = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (selectedIds.size === filteredVendors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVendors.map((v) => v.id)));
    }
  };

  const handleConfirm = () => {
    const entries: DispatchEntry[] = selectedVendors.map((v) => ({
      id:             `dispatch-${Date.now()}-${v.id}`,
      vendorId:       v.id,
      vendorName:     v.name,
      vendorEmail:    v.email,
      sentAt:         new Date().toISOString(),
      messageSubject: `[ElectroHub] RFQ Vendor Notification \u2014 ${quotation.rfqNumber}`,
    }));
    onNotifySent(quotation.id, entries);
    setSelectedIds(new Set());
    toast.success(`Notification sent to ${selectedVendors.length} vendor${selectedVendors.length !== 1 ? 's' : ''}`);
  };

  const allLog = [...existingLog];

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
            id="vn-detail-back"
          >
            <ArrowLeft size={15} />
            Back to list
          </button>
          <div className="h-4 w-px bg-[var(--border)]" />
          <span className="font-mono font-semibold text-[var(--text)]">{quotation.quotationNumber}</span>
          <Badge variant="success" size="sm" icon={<CheckCircle2 size={11} />}>PO Ready</Badge>
          <div className="ml-auto">
            <Button
              variant="gradient"
              size="sm"
              leftIcon={<Send size={14} />}
              onClick={() => setConfirmOpen(true)}
              disabled={selectedIds.size === 0}
              id="vn-send-btn"
            >
              Send to {selectedIds.size > 0 ? `${selectedIds.size} vendor${selectedIds.size !== 1 ? 's' : ''}` : 'vendors'}
            </Button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">

          {/* Left: Vendor selection */}
          <div className="space-y-4">

            {/* Vendor search + select-all */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                <Input
                  id="vn-vendor-search"
                  aria-label="Search vendors"
                  className="pl-9"
                  placeholder="Search vendor name, category\u2026"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleAll}
                id="vn-select-all"
              >
                {selectedIds.size === filteredVendors.length && filteredVendors.length > 0 ? 'Deselect all' : 'Select all'}
              </Button>
            </div>

            {/* Vendor cards */}
            <DetailSection icon={Users} title={`Available Vendors (${filteredVendors.length})`}>
              <div className="space-y-2">
                {filteredVendors.length === 0 ? (
                  <p className="text-sm text-[var(--text-subtle)] italic py-2">No vendors match your search.</p>
                ) : (
                  filteredVendors.map((v) => (
                    <VendorCard
                      key={v.id}
                      vendor={v}
                      selected={selectedIds.has(v.id)}
                      onToggle={() => toggleVendor(v.id)}
                    />
                  ))
                )}
              </div>
            </DetailSection>

            {/* Message preview toggle */}
            <div>
              <button
                onClick={() => setShowPreview((p) => !p)}
                className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline mb-2"
                id="vn-preview-toggle"
              >
                <Eye size={14} />
                {showPreview ? 'Hide' : 'Show'} message preview
              </button>
              {showPreview && (
                <MessagePreview quotation={quotation} selectedVendors={selectedVendors} />
              )}
            </div>

          </div>

          {/* Right: PO summary + dispatch log */}
          <div className="space-y-4">

            {/* PO summary */}
            <DetailSection icon={FileText} title="PO / Quotation Summary">
              <DetailRow label="Quotation #"><span className="font-mono text-xs">{quotation.quotationNumber}</span></DetailRow>
              <DetailRow label="RFQ #"><span className="font-mono text-xs">{quotation.rfqNumber}</span></DetailRow>
              <DetailRow label="Product"><span className="leading-snug">{quotation.productName}</span></DetailRow>
              <DetailRow label="Quantity"><span>{quotation.quantity.toLocaleString('en-IN')} units</span></DetailRow>
              <DetailRow label="Grand Total"><span className="font-semibold text-[var(--primary)]">{fmtINR(quotation.grandTotal)}</span></DetailRow>
              <DetailRow label="Delivery">
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

            {/* Customer */}
            <DetailSection icon={Building2} title="Buyer">
              <DetailRow label="Name"><span>{quotation.customerName}</span></DetailRow>
              <DetailRow label="Company"><span className="text-[var(--text-muted)]">{quotation.customerCompany}</span></DetailRow>
              <DetailRow label="Email">
                <a href={`mailto:${quotation.customerEmail}`} className="text-[var(--primary)] hover:underline">{quotation.customerEmail}</a>
              </DetailRow>
            </DetailSection>

            {/* Dispatch log */}
            <DetailSection
              icon={Bell}
              title={`Dispatch Log (${allLog.length} sent)`}
            >
              <DispatchLog log={allLog} />
            </DetailSection>

          </div>
        </div>
      </motion.div>

      {/* Confirm modal */}
      <SendConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        quotation={quotation}
        vendors={selectedVendors}
        onConfirm={handleConfirm}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main AdminVendorNotify Component
// ═══════════════════════════════════════════════════════════════════════════════

// Accepts optional po_ready quotations passed from AdminDashboard (via shared state)
// or falls back to built-in seed data for standalone use.

const PO_READY_SEED: ApprovableQuotation[] = [
  {
    id: 'appr-005', quotationNumber: 'QT-2026-000287', rfqNumber: 'RFQ-2026-000287',
    customerName: 'Meera Nair', customerEmail: 'meera@industrialpulse.co', customerCompany: 'Industrial Pulse Solutions',
    productName: 'Industrial BLDC Motor Controller (48V / 30A)', productType: 'existing',
    quantity: 10, unitPrice: 8500, discountPct: 5, taxPct: 18, shippingCharge: 600,
    grandTotal: 95963, deliveryLocation: 'Delhi NCR 110001',
    expectedDelivery: new Date(Date.now() + 22 * 86400000).toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
    termsNotes: '1. Technical datasheet on request.\n2. 30-day warranty on manufacturing defects.',
    status: 'po_ready', sentAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    history: [
      { id: 'h-004', role: 'HOD', action: 'approved', remarks: 'Pricing fair.', timestamp: new Date(Date.now() - 15 * 86400000).toISOString() },
      { id: 'h-005', role: 'Director', action: 'approved', remarks: 'Approved.', timestamp: new Date(Date.now() - 10 * 86400000).toISOString() },
      { id: 'h-006', role: 'Accountant', action: 'approved', remarks: 'Budget available. PO can be raised.', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
    ],
  },
];

export function AdminVendorNotify({
  externalQuotations,
}: {
  externalQuotations?: ApprovableQuotation[];
}) {
  const baseList = externalQuotations ?? PO_READY_SEED;

  const [search, setSearch]           = React.useState('');
  const [selectedId, setSelectedId]   = React.useState<string | null>(null);
  // dispatch log: quotId → entries
  const [dispatchLogs, setDispatchLogs] = React.useState<Record<string, DispatchEntry[]>>({});

  const quotations = baseList.filter((q) => q.status === 'po_ready');

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

  const selectedQ = quotations.find((q) => q.id === selectedId) ?? null;

  const handleNotifySent = (quotId: string, entries: DispatchEntry[]) => {
    setDispatchLogs((prev) => ({
      ...prev,
      [quotId]: [...(prev[quotId] ?? []), ...entries],
    }));
  };

  const totalNotified = Object.values(dispatchLogs).reduce((s, l) => s + l.length, 0);

  if (selectedQ) {
    return (
      <NotifyDetailPanel
        quotation={selectedQ}
        onBack={() => setSelectedId(null)}
        onNotifySent={handleNotifySent}
        existingLog={dispatchLogs[selectedQ.id] ?? []}
      />
    );
  }

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
            Vendor Notification
            {quotations.length > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[11px] font-bold text-white">
                {quotations.length}
              </span>
            )}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            PO Ready quotations \u2014 select vendors and dispatch notifications
            {totalNotified > 0 && ` \u00b7 ${totalNotified} notification${totalNotified !== 1 ? 's' : ''} sent this session`}
          </p>
        </div>

        <div className="w-full md:w-72">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
            <Input
              id="vn-search"
              aria-label="Search PO ready quotations"
              className="pl-9"
              placeholder="Search quotation #, customer\u2026"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] py-16 text-center">
          <Bell size={32} className="mx-auto text-[var(--text-subtle)] mb-3" />
          <p className="font-semibold text-[var(--text)]">
            {search ? 'No matching quotations' : 'No PO-ready quotations'}
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {search
              ? 'Try adjusting your search.'
              : 'Quotations that complete the full approval chain will appear here.'}
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
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Notifications</th>
                  <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((q, idx) => {
                    const logCount = (dispatchLogs[q.id] ?? []).length;
                    return (
                      <motion.tr
                        key={q.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: idx * 0.04 } }}
                        exit={{ opacity: 0 }}
                        className="border-b border-[var(--border)] last:border-none hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                        onClick={() => setSelectedId(q.id)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-[var(--text)] whitespace-nowrap">{q.quotationNumber}</span>
                          <p className="text-xs text-[var(--text-subtle)] mt-0.5">{q.rfqNumber}</p>
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
                          {logCount > 0 ? (
                            <Badge variant="success" size="sm" icon={<Send size={10} />}>
                              {logCount} sent
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              Not sent
                            </Badge>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Button
                              variant={logCount > 0 ? 'secondary' : 'primary'}
                              size="xs"
                              leftIcon={logCount > 0 ? <Eye size={12} /> : <Send size={12} />}
                              onClick={(e) => { e.stopPropagation(); setSelectedId(q.id); }}
                              id={`vn-row-${q.id}`}
                            >
                              {logCount > 0 ? 'Manage' : 'Notify Vendors'}
                            </Button>
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
