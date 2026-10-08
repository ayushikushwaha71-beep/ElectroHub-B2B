'use client';

/**
 * ElectroHub — Admin RFQ Management Section
 * Self-contained panel rendered inside AdminDashboard when the
 * "RFQ Management" nav item is active.
 *
 * Design tokens and component patterns are identical to the existing
 * AdminDashboard, AdminOrders and AdminProducts sections.
 * No backend calls — all state is local/mock.
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
  ExternalLink,
  FileText,
  Filter,
  Link2,
  Mail,
  MapPin,
  Package,
  Paperclip,
  Search,
  Sparkles,
  User,
  Warehouse,
  Wrench,
  XCircle,
  ClipboardCheck,
  AlertCircle,
  NotebookText,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge }  from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';
import { Card }   from '@/components/ui/Card';
import { toast }  from '@/components/ui/Toast';
import { AdminQuotationBuilder } from './AdminQuotationBuilder';
import { adminQuotationApi } from '@/lib/quotation-api';
import type { RFQ as ApiRFQ } from '@/lib/quotation-api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminRFQStatus =
  | 'submitted'
  | 'under_review'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'payment_pending'
  | 'order_placed';

export interface AdminRFQCustomer {
  name:    string;
  email:   string;
  phone:   string;
  company?: string;
}

export interface AdminRFQInventory {
  available: number;
  reserved:  number;
  incoming:  number;
  eta?:      string; // e.g. "2026-09-10"
}

export interface AdminRFQRow {
  id:               string;
  rfqNumber:        string;
  customer:         AdminRFQCustomer;
  productType:      'existing' | 'custom';
  productName:      string;
  existingProductId?: string;
  referenceUrl?:    string;
  quantity:         number;
  requiredByDate:   string; // YYYY-MM-DD
  deliveryLocation: string;
  budget:           string;
  technicalSpecs:   string;
  additionalNotes:  string;
  status:           AdminRFQStatus;
  submittedAt:      string; // ISO timestamp
  updatedAt:        string;
  inventory?:       AdminRFQInventory;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AdminRFQStatus,
  { label: string; variant: 'default' | 'warning' | 'info' | 'success' | 'danger'; icon: React.ElementType }
> = {
  submitted:       { label: 'Submitted',       variant: 'info',    icon: FileText       },
  under_review:    { label: 'Under Review',     variant: 'warning', icon: Clock          },
  quoted:          { label: 'Quotation Ready',  variant: 'info',    icon: ClipboardCheck },
  accepted:        { label: 'Accepted',         variant: 'success', icon: CheckCircle2   },
  rejected:        { label: 'Rejected',         variant: 'danger',  icon: XCircle        },
  payment_pending: { label: 'Payment Pending',  variant: 'warning', icon: DollarSign     },
  order_placed:    { label: 'Order Placed',     variant: 'success', icon: Package        },
};

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTER_TABS: { label: string; value: AdminRFQStatus | 'all' }[] = [
  { label: 'All',             value: 'all'          },
  { label: 'New',             value: 'submitted'    },
  { label: 'Under Review',    value: 'under_review' },
  { label: 'Quoted',          value: 'quoted'       },
  { label: 'Accepted',        value: 'accepted'     },
  { label: 'Rejected',        value: 'rejected'     },
  { label: 'Order Placed',    value: 'order_placed' },
];

// ─── Helper functions ─────────────────────────────────────────────────────────

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...opts,
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60)  return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
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

function InventoryPill({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl border', tone)}>
      <span className="text-lg font-bold text-[var(--text)]">{value}</span>
      <span className="text-[10px] font-medium text-[var(--text-subtle)] uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ─── RFQ Detail Panel ─────────────────────────────────────────────────────────

function RFQDetailPanel({
  rfq,
  onBack,
  onStatusChange,
  onBuildQuotation,
}: {
  rfq:              AdminRFQRow;
  onBack:           () => void;
  onStatusChange:   (id: string, status: AdminRFQStatus) => void;
  onBuildQuotation: (rfq: AdminRFQRow) => void;
}) {
  const statusCfg  = STATUS_CONFIG[rfq.status];
  const StatusIcon = statusCfg.icon;

  const canMarkUnderReview = rfq.status === 'submitted';
  const canProceedToQuote  = rfq.status === 'under_review';
  const canReject          = rfq.status === 'submitted' || rfq.status === 'under_review';

  const handleMarkUnderReview = () => {
    onStatusChange(rfq.id, 'under_review');
    toast.info(`RFQ ${rfq.rfqNumber} marked as Under Review`);
  };
  const handleProceedToQuote = () => {
    onStatusChange(rfq.id, 'quoted');
    toast.success(`RFQ ${rfq.rfqNumber} moved to Quotation Ready`);
  };
  const handleBuildQuotation = () => {
    onBuildQuotation(rfq);
  };
  const handleReject = () => {
    onStatusChange(rfq.id, 'rejected');
    toast.info(`RFQ ${rfq.rfqNumber} has been rejected`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      className="space-y-5"
    >
      {/* ── Back bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          id="admin-rfq-back"
        >
          <ArrowLeft size={15} />
          Back to list
        </button>
        <div className="h-4 w-px bg-[var(--border)]" />
        <span className="font-mono font-semibold text-[var(--text)]">{rfq.rfqNumber}</span>
        <Badge variant={statusCfg.variant} size="sm" icon={<StatusIcon size={11} />}>
          {statusCfg.label}
        </Badge>
        <span className="ml-auto text-xs text-[var(--text-subtle)]">
          Submitted {fmtDateTime(rfq.submittedAt)}
        </span>
      </div>

      {/* ── Action bar ── */}
      {(canMarkUnderReview || canProceedToQuote || canReject || rfq.status === 'quoted') && (
        <div className={cn(
          'flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border',
          'bg-[var(--background-alt)] border-[var(--border)]',
        )}>
          <AlertCircle size={15} className="text-[var(--warning)] shrink-0" />
          <span className="text-sm text-[var(--text-muted)] flex-1">
            This RFQ requires your action.
          </span>
          <div className="flex gap-2 flex-wrap">
            {canMarkUnderReview && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Clock size={14} />}
                onClick={handleMarkUnderReview}
                id="admin-rfq-mark-review"
              >
                Mark Under Review
              </Button>
            )}
            {canProceedToQuote && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ClipboardCheck size={14} />}
                onClick={handleProceedToQuote}
                id="admin-rfq-proceed-quote"
              >
                Proceed to Quotation
              </Button>
            )}
            {rfq.status === 'quoted' && (
              <Button
                variant="gradient"
                size="sm"
                leftIcon={<ClipboardCheck size={14} />}
                onClick={handleBuildQuotation}
                id="admin-rfq-build-quotation"
              >
                Build Quotation
              </Button>
            )}
            {canReject && (
              <Button
                variant="destructive"
                size="sm"
                leftIcon={<XCircle size={14} />}
                onClick={handleReject}
                id="admin-rfq-reject"
              >
                Reject RFQ
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        {/* ── Left column ── */}
        <div className="space-y-4">
          {/* Customer info */}
          <DetailSection icon={User} title="Customer Information">
            <DetailRow label="Name">
              <span>{rfq.customer.name}</span>
            </DetailRow>
            {rfq.customer.company && (
              <DetailRow label="Company">
                <span className="text-[var(--text-muted)]">{rfq.customer.company}</span>
              </DetailRow>
            )}
            <DetailRow label="Email">
              <a
                href={`mailto:${rfq.customer.email}`}
                className="text-[var(--primary)] hover:underline inline-flex items-center gap-1"
              >
                <Mail size={12} />
                {rfq.customer.email}
              </a>
            </DetailRow>
            <DetailRow label="Phone">
              <span className="font-mono">{rfq.customer.phone}</span>
            </DetailRow>
          </DetailSection>

          {/* Product / Requirement */}
          <DetailSection
            icon={rfq.productType === 'existing' ? Package : Sparkles}
            title={rfq.productType === 'existing' ? 'Existing Product' : 'Custom Requirement'}
          >
            <DetailRow label="Product / Req.">
              <span className="leading-snug">{rfq.productName}</span>
            </DetailRow>
            <DetailRow label="Type">
              <Badge
                variant={rfq.productType === 'existing' ? 'primary' : 'info'}
                size="xs"
              >
                {rfq.productType === 'existing' ? 'ElectroHub Catalogue' : 'Custom / External'}
              </Badge>
            </DetailRow>
            {rfq.existingProductId && (
              <DetailRow label="Product ID">
                <span className="font-mono text-[var(--text-muted)]">{rfq.existingProductId}</span>
              </DetailRow>
            )}
            {rfq.referenceUrl && (
              <DetailRow label="Reference URL">
                <a
                  href={rfq.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:underline"
                >
                  <Link2 size={12} />
                  <span className="truncate max-w-[220px]">{rfq.referenceUrl}</span>
                  <ExternalLink size={11} />
                </a>
              </DetailRow>
            )}
            {rfq.referenceUrl && (
              <div className="pt-1">
                <Button
                  variant="secondary"
                  size="xs"
                  leftIcon={<ExternalLink size={12} />}
                  onClick={() => window.open(rfq.referenceUrl, '_blank')}
                  id="admin-rfq-open-ref"
                >
                  Open Reference
                </Button>
              </div>
            )}
          </DetailSection>

          {/* Technical specs */}
          <DetailSection icon={Wrench} title="Technical Specifications">
            <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
              {rfq.technicalSpecs || (
                <span className="text-[var(--text-subtle)] italic">None provided</span>
              )}
            </p>
          </DetailSection>

          {/* Additional requirements */}
          {rfq.additionalNotes && (
            <DetailSection icon={NotebookText} title="Additional Requirements / Notes">
              <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                {rfq.additionalNotes}
              </p>
            </DetailSection>
          )}

          {/* Attachment placeholder */}
          <DetailSection icon={Paperclip} title="Attachments">
            <div className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl',
              'border border-dashed border-[var(--border-strong)]',
              'bg-[var(--background-alt)] text-[var(--text-muted)]',
            )}>
              <Paperclip size={15} className="shrink-0 text-[var(--text-subtle)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-muted)]">No attachments uploaded</p>
                <p className="text-xs text-[var(--text-subtle)]">File upload feature coming in a future release.</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-subtle)]">
                Soon
              </span>
            </div>
          </DetailSection>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">
          {/* Requirements summary */}
          <DetailSection icon={Package} title="Order Requirements">
            <DetailRow label="Quantity">
              <span>{rfq.quantity.toLocaleString('en-IN')} units</span>
            </DetailRow>
            <DetailRow label="Budget">
              {rfq.budget
                ? <span>₹{Number(rfq.budget).toLocaleString('en-IN')}</span>
                : <span className="text-[var(--text-subtle)] italic font-normal">Not specified</span>
              }
            </DetailRow>
            <DetailRow label="Delivery To">
              <span className="flex items-start gap-1">
                <MapPin size={12} className="mt-0.5 shrink-0 text-[var(--text-subtle)]" />
                <span>{rfq.deliveryLocation}</span>
              </span>
            </DetailRow>
            <DetailRow label="Required By">
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-[var(--text-subtle)]" />
                {rfq.requiredByDate
                  ? fmtDate(rfq.requiredByDate)
                  : <span className="text-[var(--text-subtle)] italic font-normal">Not set</span>
                }
              </span>
            </DetailRow>
          </DetailSection>

          {/* RFQ Status */}
          <DetailSection icon={FileText} title="RFQ Status">
            <DetailRow label="Current">
              <Badge variant={statusCfg.variant} size="xs" icon={<StatusIcon size={10} />}>
                {statusCfg.label}
              </Badge>
            </DetailRow>
            <DetailRow label="Submitted">
              <span className="text-[var(--text-muted)] font-normal text-xs">
                {fmtDateTime(rfq.submittedAt)}
              </span>
            </DetailRow>
            <DetailRow label="Last Updated">
              <span className="text-[var(--text-muted)] font-normal text-xs">
                {fmtDateTime(rfq.updatedAt)}
              </span>
            </DetailRow>
          </DetailSection>

          {/* Inventory (mock) */}
          {rfq.inventory && (
            <DetailSection icon={Warehouse} title="Inventory (Mock)">
              <div className="grid grid-cols-2 gap-2">
                <InventoryPill
                  label="Available"
                  value={rfq.inventory.available}
                  tone="border-[var(--border)] bg-[var(--background-alt)]"
                />
                <InventoryPill
                  label="Reserved"
                  value={rfq.inventory.reserved}
                  tone="border-amber-500/20 bg-amber-500/5"
                />
                <InventoryPill
                  label="Incoming"
                  value={rfq.inventory.incoming}
                  tone="border-blue-500/20 bg-blue-500/5"
                />
                <div className={cn('flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl border', 'border-emerald-500/20 bg-emerald-500/5')}>
                  <span className="text-xs font-semibold text-emerald-600">
                    {rfq.inventory.eta ? fmtDate(rfq.inventory.eta, { day: 'numeric', month: 'short' }) : '—'}
                  </span>
                  <span className="text-[10px] font-medium text-[var(--text-subtle)] uppercase tracking-wide">ETA</span>
                </div>
              </div>
              <p className="text-[10px] text-[var(--text-subtle)] mt-1 italic">
                * Stock values are illustrative mock data.
              </p>
            </DetailSection>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main AdminRFQs Component
// ═══════════════════════════════════════════════════════════════════════════════

export function AdminRFQs() {
  const [rfqs, setRFQs]              = React.useState<AdminRFQRow[]>([]);
  const [isLoading, setIsLoading]    = React.useState(false);
  const [selectedId, setSelectedId]  = React.useState<string | null>(null);
  const [quotationRFQ, setQuotationRFQ] = React.useState<AdminRFQRow | null>(null);
  const [search, setSearch]          = React.useState('');
  const [activeFilter, setFilter]    = React.useState<AdminRFQStatus | 'all'>('all');

  // Map Django RFQ → AdminRFQRow
  function mapApiRFQ(r: ApiRFQ): AdminRFQRow {
    return {
      id:               String(r.id),
      rfqNumber:        r.rfq_number,
      customer:         { name: r.customer_name, email: r.customer_email, phone: r.customer_phone ?? '' },
      productType:      r.product_type,
      productName:      r.product_name,
      existingProductId:r.product ? String(r.product) : undefined,
      referenceUrl:     r.reference_url || undefined,
      quantity:         r.quantity,
      requiredByDate:   r.required_by_date,
      deliveryLocation: r.delivery_location,
      budget:           r.budget ?? '',
      technicalSpecs:   r.technical_specs,
      additionalNotes:  r.additional_notes,
      status:           r.status as AdminRFQStatus,
      submittedAt:      r.submitted_at,
      updatedAt:        r.updated_at,
    };
  }

  // Load from real API
  React.useEffect(() => {
    setIsLoading(true);
    adminQuotationApi.listRFQs()
      .then((res) => {
        const records = Array.isArray(res) ? res : ((res as { results?: ApiRFQ[] }).results ?? []);
        setRFQs(records.map(mapApiRFQ));
      })
      .catch(() => {
        toast.error('Failed to load RFQs. Check your connection.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selectedRFQ = rfqs.find((r) => r.id === selectedId) ?? null;

  const handleStatusChange = async (id: string, status: AdminRFQStatus) => {
    try {
      await adminQuotationApi.updateRFQStatus(Number(id), status);
      setRFQs((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status, updatedAt: new Date().toISOString() }
            : r,
        ),
      );
    } catch {
      toast.error('Failed to update RFQ status.');
    }
  };


  const handleBuildQuotation = (rfq: AdminRFQRow) => {
    setQuotationRFQ(rfq);
    setSelectedId(null);
  };

  // Counts for filter tabs
  const counts = React.useMemo(() => {
    const map: Record<string, number> = { all: rfqs.length };
    rfqs.forEach((r) => { map[r.status] = (map[r.status] ?? 0) + 1; });
    return map;
  }, [rfqs]);

  // Filtered list
  const filtered = rfqs.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.rfqNumber.toLowerCase().includes(q) ||
      r.customer.name.toLowerCase().includes(q) ||
      r.customer.email.toLowerCase().includes(q) ||
      r.productName.toLowerCase().includes(q) ||
      (r.customer.company?.toLowerCase().includes(q) ?? false);
    const matchFilter = activeFilter === 'all' || r.status === activeFilter;
    return matchSearch && matchFilter;
  });

  // ── Quotation Builder view ───────────────────────────────────────────────────
  if (quotationRFQ) {
    return (
      <AdminQuotationBuilder
        rfq={quotationRFQ}
        onBack={() => {
          setSelectedId(quotationRFQ.id);
          setQuotationRFQ(null);
        }}
      />
    );
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selectedRFQ) {
    return (
      <RFQDetailPanel
        rfq={selectedRFQ}
        onBack={() => setSelectedId(null)}
        onStatusChange={handleStatusChange}
        onBuildQuotation={handleBuildQuotation}
      />
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  const newCount = rfqs.filter((r) => r.status === 'submitted').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      className="space-y-5"
    >
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">
            RFQ Management
            {newCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1.5 text-[11px] font-bold text-white">
                {newCount}
              </span>
            )}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            {rfqs.length} request{rfqs.length !== 1 ? 's' : ''} · {newCount} new
          </p>
        </div>

        {/* Search */}
        <div className="w-full md:w-72">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
            />
            <Input
              id="admin-rfq-search"
              aria-label="Search RFQs"
              className="pl-9"
              placeholder="Search RFQ #, customer, product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter size={13} className="text-[var(--text-subtle)] shrink-0" />
        {FILTER_TABS.map((tab) => {
          const count = counts[tab.value] ?? 0;
          if (count === 0 && tab.value !== 'all') return null;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              id={`admin-rfq-filter-${tab.value}`}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                activeFilter === tab.value
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)]',
              )}
            >
              {tab.label}
              <span className={cn(
                'h-4 min-w-[16px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center',
                activeFilter === tab.value
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--background-alt)] text-[var(--text-subtle)]',
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table / List ── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] py-16 text-center">
          <FileText size={32} className="mx-auto text-[var(--text-subtle)] mb-3" />
          <p className="font-semibold text-[var(--text)]">
            {search || activeFilter !== 'all' ? 'No matching RFQs' : 'No RFQs yet'}
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {search || activeFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'RFQs submitted by customers will appear here.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background-alt)] text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">RFQ #</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Product / Requirement</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Qty</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Required By</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Created</th>
                  <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((rfq, idx) => {
                    const cfg        = STATUS_CONFIG[rfq.status];
                    const CfgIcon    = cfg.icon;
                    const isNew      = rfq.status === 'submitted';
                    return (
                      <motion.tr
                        key={rfq.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: idx * 0.04 } }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          'border-b border-[var(--border)] last:border-none',
                          'hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group',
                          isNew && 'bg-blue-500/[0.03]',
                        )}
                        onClick={() => setSelectedId(rfq.id)}
                      >
                        {/* RFQ Number */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isNew && (
                              <span className="h-2 w-2 rounded-full bg-[var(--primary)] shrink-0 animate-pulse" />
                            )}
                            <span className="font-mono font-semibold text-[var(--text)] whitespace-nowrap">
                              {rfq.rfqNumber}
                            </span>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--text)] whitespace-nowrap">{rfq.customer.name}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate max-w-[160px]">{rfq.customer.email}</p>
                        </td>

                        {/* Product */}
                        <td className="px-4 py-3 max-w-[220px]">
                          <div className="flex items-start gap-1.5">
                            {rfq.productType === 'custom'
                              ? <Sparkles size={13} className="text-violet-500 shrink-0 mt-0.5" />
                              : <Package   size={13} className="text-blue-500 shrink-0 mt-0.5" />
                            }
                            <span className="text-[var(--text)] line-clamp-2 leading-snug">
                              {rfq.productName}
                            </span>
                          </div>
                        </td>

                        {/* Qty */}
                        <td className="px-4 py-3 text-[var(--text)] font-medium whitespace-nowrap">
                          {rfq.quantity.toLocaleString('en-IN')}
                        </td>

                        {/* Required By */}
                        <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                          {rfq.requiredByDate ? fmtDate(rfq.requiredByDate) : '—'}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge variant={cfg.variant} size="sm" icon={<CfgIcon size={11} />}>
                            {cfg.label}
                          </Badge>
                        </td>

                        {/* Created */}
                        <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap text-xs">
                          <span title={fmtDateTime(rfq.submittedAt)}>
                            {timeAgo(rfq.submittedAt)}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Button
                              variant="secondary"
                              size="xs"
                              rightIcon={<ChevronRight size={12} />}
                              onClick={(e) => { e.stopPropagation(); setSelectedId(rfq.id); }}
                              id={`admin-rfq-view-${rfq.id}`}
                            >
                              View
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
