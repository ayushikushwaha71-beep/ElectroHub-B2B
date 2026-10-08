'use client';

/**
 * ElectroHub — "My RFQs" account section
 * Lists all submitted RFQs for the logged-in user in card/table form,
 * and shows a detail view on click.
 *
 * Uses ONLY existing ElectroHub UI tokens and components.
 * No backend calls — localStorage mock state only.
 */

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  ChevronRight,
  Clock,
  Package,
  Sparkles,
  Link2,
  CalendarDays,
  Filter,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/lib/providers/AuthProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RFQDetail, RFQ_STATUS_CONFIG } from './RFQDetail';
import { customerQuotationApi, type RFQ, type RFQStatus } from '@/lib/quotation-api';
import type { AccountSection } from '@/components/account/AccountDashboard';
import { RFQFormModal } from './RFQFormModal';

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTER_TABS: { label: string; value: RFQStatus | 'all' }[] = [
  { label: 'All',              value: 'all'            },
  { label: 'Under Review',     value: 'under_review'   },
  { label: 'Quotation Ready',  value: 'quoted'         },
  { label: 'Accepted',         value: 'accepted'       },
  { label: 'Order Placed',     value: 'order_placed'   },
  { label: 'Rejected',         value: 'rejected'       },
];

// ─── RFQ card ─────────────────────────────────────────────────────────────────

function RFQCard({
  rfq,
  index,
  onClick,
}: {
  rfq:    RFQ;
  index:  number;
  onClick: () => void;
}) {
  const statusCfg  = RFQ_STATUS_CONFIG[rfq.status] || RFQ_STATUS_CONFIG.submitted;
  const StatusIcon = statusCfg.icon;

  const submittedDate = new Date(rfq.submitted_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const requiredDate = rfq.required_by_date
    ? new Date(rfq.required_by_date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden hover:shadow-[var(--shadow-card-hov)] transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--background-alt)]">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <span className="font-mono font-semibold text-sm text-[var(--text)] shrink-0">
            {rfq.rfq_number}
          </span>
          <Badge variant={statusCfg.variant} size="xs" icon={<StatusIcon size={10} />}>
            {statusCfg.label}
          </Badge>
          {rfq.product_type === 'custom' && (
            <Badge variant="info" size="xs" icon={<Sparkles size={9} />}>
              Custom
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs text-[var(--text-muted)] hidden sm:block">{submittedDate}</span>
          <ChevronRight
            size={14}
            className="text-[var(--text-subtle)] group-hover:text-[var(--primary)] transition-colors"
          />
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          rfq.product_type === 'existing'
            ? 'bg-blue-500/10'
            : 'bg-violet-500/10',
        )}>
          {rfq.product_type === 'existing'
            ? <Package size={20} className="text-blue-500" />
            : <Sparkles size={20} className="text-violet-500" />
          }
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-[var(--text)] line-clamp-1">
            {rfq.product_name || rfq.custom_product_name || 'Unknown Product'}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <Package size={11} />
              Qty: <strong className="text-[var(--text)]">{rfq.quantity.toLocaleString('en-IN')}</strong>
            </span>
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <CalendarDays size={11} />
              Required by: <strong className="text-[var(--text)]">{requiredDate}</strong>
            </span>
            {rfq.reference_url && (
              <span className="text-xs text-[var(--primary)] flex items-center gap-1">
                <Link2 size={11} />
                Reference URL
              </span>
            )}
          </div>
        </div>

        {/* Right: submission date (mobile) */}
        <div className="shrink-0 text-right sm:hidden">
          <p className="text-xs text-[var(--text-muted)]">{submittedDate}</p>
        </div>
      </div>

      {/* Footer strip */}
      <div className="px-5 pb-3.5 flex items-center gap-2">
        <Clock size={11} className="text-[var(--text-subtle)]" />
        <span className="text-xs text-[var(--text-subtle)]">
          Submitted {submittedDate}
        </span>
        <span className="ml-auto text-xs font-medium text-[var(--primary)] group-hover:underline">
          View Details →
        </span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main AccountRFQs Component
// ═══════════════════════════════════════════════════════════════════════════════

export function AccountRFQs({ onSectionChange }: { onSectionChange?: (section: AccountSection) => void }) {
  const { user } = useAuth();
  const [rfqs, setRFQs]              = React.useState<RFQ[]>([]);
  const [selectedRFQ, setSelected]   = React.useState<RFQ | null>(null);
  const [search, setSearch]          = React.useState('');
  const [activeFilter, setFilter]    = React.useState<RFQStatus | 'all'>('all');
  const [loading, setLoading]        = React.useState(true);
  const [isModalOpen, setModalOpen]  = React.useState(false);

  // Load from real API
  React.useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    customerQuotationApi.listRFQs()
      .then((data: any) => {
        let items: RFQ[] = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (data && Array.isArray(data.results)) {
          items = data.results;
        } else if (data && Array.isArray(data.data)) {
          items = data.data;
        }
        setRFQs(items);
      })
      .catch(() => setRFQs([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Filtering
  const filtered = rfqs.filter((r) => {
    const productName = r.product_name || r.custom_product_name || 'Unknown Product';
    const matchSearch =
      r.rfq_number.toLowerCase().includes(search.toLowerCase()) ||
      productName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'all' || r.status === activeFilter;
    return matchSearch && matchFilter;
  });

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selectedRFQ) {
    return (
      <RFQDetail
        rfq={selectedRFQ}
        onBack={() => setSelected(null)}
        onGoToQuotations={
          onSectionChange ? () => onSectionChange('quotations') : undefined
        }
      />
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-[var(--text)]">My RFQs</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {rfqs.length} request{rfqs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search by RFQ # or product…"
              leftIcon={<Search size={15} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              clearable
              onClear={() => setSearch('')}
              id="rfqs-search"
            />
          </div>
          <Button onClick={() => setModalOpen(true)} variant="primary" size="sm" leftIcon={<FileText size={14} />} id="rfqs-new-request">
            New RFQ
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter size={13} className="text-[var(--text-subtle)] shrink-0" />
        {FILTER_TABS.map((tab) => {
          const count = tab.value === 'all'
            ? rfqs.length
            : rfqs.filter((r) => r.status === tab.value).length;
          if (count === 0 && tab.value !== 'all') return null;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                activeFilter === tab.value
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)]',
              )}
              id={`rfq-filter-${tab.value}`}
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

      {/* RFQ list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] py-16 text-center">
          <FileText
            size={36}
            className="mx-auto text-[var(--text-subtle)] mb-3"
          />
          <h3 className="font-semibold text-[var(--text)]">
            {search || activeFilter !== 'all' ? 'No matching RFQs' : 'No RFQs yet'}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1 mb-5">
            {search || activeFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Submit a Request For Quotation to get bulk pricing from our team.'}
          </p>
          {!search && activeFilter === 'all' && (
            <Button onClick={() => setModalOpen(true)} variant="primary" size="sm" leftIcon={<FileText size={14} />}>
              Submit Your First RFQ
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((rfq, i) => (
              <RFQCard
                key={rfq.id}
                rfq={rfq}
                index={i}
                onClick={() => setSelected(rfq)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
      
      <RFQFormModal
        open={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          // Refresh list on close just in case a new one was submitted
          setLoading(true);
          customerQuotationApi.listRFQs().then(setRFQs).catch(() => setRFQs([])).finally(() => setLoading(false));
        }}
      />
    </motion.div>
  );
}
