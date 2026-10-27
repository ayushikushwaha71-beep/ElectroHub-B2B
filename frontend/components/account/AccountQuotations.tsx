'use client';

/**
 * ElectroHub — "My Quotations" account section
 * Lists all quotations received by the customer and allows viewing details.
 *
 * Uses ONLY existing ElectroHub design tokens and components.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  ChevronRight,
  Clock,
  Package,
  Sparkles,
  Filter,
  Receipt,
  CheckCircle2,
  XCircle,
  MessageSquare,
  RotateCcw,
  Truck,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/lib/providers/AuthProvider';
import { Badge }  from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';
import { QuotationDetail, QUOT_STATUS_CONFIG } from '@/components/quotations/QuotationDetail';
import type { AccountSection } from '@/components/account/AccountDashboard';
import { customerQuotationApi, Quotation, QuotationStatus } from '@/lib/quotation-api';

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTER_TABS: { label: string; value: QuotationStatus | 'all' }[] = [
  { label: 'All',               value: 'all'               },
  { label: 'New',               value: 'sent'              },
  { label: 'Negotiating',       value: 'negotiating'       },
  { label: 'Revised',           value: 'revised'           },
  { label: 'Accepted',          value: 'accepted'          },
  { label: 'Invoice Sent',      value: 'invoice_sent'      },
  { label: 'Payment Confirmed', value: 'payment_confirmed' },
  { label: 'Rejected',          value: 'rejected'          },
];

// ─── Quotation card ───────────────────────────────────────────────────────────

function QuotationCard({
  quotation,
  index,
  onClick,
}: {
  quotation: Quotation;
  index:     number;
  onClick:   () => void;
}) {
  const statusCfg  = QUOT_STATUS_CONFIG[quotation.status];
  const StatusIcon = statusCfg.icon;

  const sentAt = quotation.sent_at || quotation.created_at;
  const sentDate = sentAt ? new Date(sentAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) : '—';
  
  const validDate = quotation.valid_until
    ? new Date(quotation.valid_until).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

  const isNew        = quotation.status === 'sent';
  const daysLeft     = quotation.valid_until
    ? Math.ceil((new Date(quotation.valid_until).getTime() - Date.now()) / 86400000)
    : null;
  const isExpiring   = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
  const isExpired    = daysLeft !== null && daysLeft < 0;

  function fmtINR(n: number) {
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        'rounded-2xl border bg-[var(--background-card)] overflow-hidden hover:shadow-[var(--shadow-card-hov)] transition-shadow cursor-pointer group',
        isNew ? 'border-[var(--primary)]/40' : 'border-[var(--border)]',
      )}
      onClick={onClick}
    >
      {/* Card header */}
      <div className={cn(
        'flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]',
        isNew ? 'bg-[var(--primary)]/5' : 'bg-[var(--background-alt)]',
      )}>
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          {isNew && (
            <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse shrink-0" />
          )}
          <span className="font-mono font-semibold text-sm text-[var(--text)] shrink-0">
            {quotation.quotation_number}
          </span>
          <Badge variant={statusCfg.variant} size="xs" icon={<StatusIcon size={10} />}>
            {statusCfg.label}
          </Badge>
          {isExpiring && !isExpired && (
            <Badge variant="warning" size="xs" icon={<Clock size={9} />}>
              Expiring
            </Badge>
          )}
          {isExpired && (
            <Badge variant="danger" size="xs">Expired</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs text-[var(--text-muted)] hidden sm:block">{sentDate}</span>
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
          quotation.product_type === 'existing' ? 'bg-blue-500/10' : 'bg-violet-500/10',
        )}>
          {quotation.product_type === 'existing'
            ? <Package size={20} className="text-blue-500" />
            : <Sparkles size={20} className="text-violet-500" />
          }
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-[var(--text)] line-clamp-1 mb-1.5">
            {quotation.product_name}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <Package size={11} />
              Qty: <strong className="text-[var(--text)]">{quotation.quantity.toLocaleString('en-IN')}</strong>
            </span>
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <Receipt size={11} />
              Total: <strong className="text-[var(--text)]">{fmtINR(quotation.grand_total || 0)}</strong>
            </span>
            {quotation.valid_until && !isExpired && (
              <span className={cn(
                'text-xs flex items-center gap-1',
                isExpiring ? 'text-amber-500' : 'text-[var(--text-muted)]',
              )}>
                <Clock size={11} />
                Valid until: <strong>{validDate}</strong>
              </span>
            )}
            {quotation.negotiations && quotation.negotiations.length > 0 && (
              <span className="text-xs text-[var(--primary)] flex items-center gap-1">
                <MessageSquare size={11} />
                {quotation.negotiations.length} negotiation{quotation.negotiations.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div className="px-5 pb-3.5 flex items-center gap-2">
        <Clock size={11} className="text-[var(--text-subtle)]" />
        <span className="text-xs text-[var(--text-subtle)]">
          Received {sentDate}
        </span>
        <span className="ml-auto text-xs font-medium text-[var(--primary)] group-hover:underline">
          View Details →
        </span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main AccountQuotations Component
// ═══════════════════════════════════════════════════════════════════════════════

export function AccountQuotations({
  onSectionChange,
}: {
  onSectionChange?: (section: AccountSection) => void;
}) {
  const { user } = useAuth();
  const [quotations, setQuotations]     = React.useState<Quotation[]>([]);
  const [selected, setSelected]         = React.useState<Quotation | null>(null);
  const [search, setSearch]             = React.useState('');
  const [activeFilter, setFilter]       = React.useState<QuotationStatus | 'all'>('all');

  const loadQuotations = React.useCallback(() => {
    if (!user?.id) return;
    customerQuotationApi.listQuotations()
      .then((records: any) => {
        const items = Array.isArray(records) ? records : (records.results ?? []);
        setQuotations(items);
      })
      .catch(() => {
        setQuotations([]);
      });
  }, [user?.id]);

  // Load from real API
  React.useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  // Re-sync selected quotation when quotations array changes
  React.useEffect(() => {
    if (selected) {
      const fresh = quotations.find((q) => q.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotations]);

  const handleStatusChange = async (status: QuotationStatus) => {
    if (!user?.id || !selected) return;
    try {
      if (status === 'accepted') {
        await customerQuotationApi.acceptQuotation(Number(selected.id));
      } else if (status === 'rejected') {
        await customerQuotationApi.rejectQuotation(Number(selected.id));
      } else if (status === 'viewed') {
        // Just update locally if backend doesn't track viewed
        setQuotations((prev) => prev.map((q) => q.id === selected.id ? { ...q, status: 'viewed' } : q));
        return;
      }
      loadQuotations();
    } catch (e) {
      console.error('Status change error', e);
    }
  };

  const handleAddNegotiation = async (proposedPrice: number, message: string) => {
    if (!user?.id || !selected) return;
    try {
      await customerQuotationApi.negotiateQuotation(Number(selected.id), proposedPrice, message);
      loadQuotations();
    } catch (e) {
      console.error('Negotiation error', e);
    }
  };

  const handlePaymentSubmit = async (amount: number, utr: string) => {
    if (!user?.id || !selected) return;
    try {
      await customerQuotationApi.submitPayment(Number(selected.id), {
        amount,
        payment_method: 'bank_transfer',
        utr_reference: utr,
        payment_date: new Date().toISOString().split('T')[0],
      });
      loadQuotations();
    } catch (e) {
      console.error('Payment submit error', e);
    }
  };

  // Filtering
  const filtered = quotations.filter((q) => {
    const matchSearch =
      (q.quotation_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.rfq_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.product_name || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'all' || q.status === activeFilter;
    return matchSearch && matchFilter;
  });

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <QuotationDetail
        quotation={selected}
        onBack={() => setSelected(null)}
        onStatusChange={handleStatusChange}
        onAddNegotiation={handleAddNegotiation}
        onPaymentSubmit={handlePaymentSubmit}
        onNavigateToOrders={onSectionChange ? () => onSectionChange('orders') : undefined}
      />
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  const newCount = quotations.filter((q) => q.status === 'sent').length;

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
          <h2 className="text-xl font-bold font-display text-[var(--text)] flex items-center gap-2">
            My Quotations
            {newCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[11px] font-bold text-white">
                {newCount}
              </span>
            )}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {quotations.length} quotation{quotations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search quotation # or product…"
            leftIcon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            clearable
            onClear={() => setSearch('')}
            id="quotations-search"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter size={13} className="text-[var(--text-subtle)] shrink-0" />
        {FILTER_TABS.map((tab) => {
          const count = tab.value === 'all'
            ? quotations.length
            : quotations.filter((q) => q.status === tab.value).length;
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
              id={`quot-filter-${tab.value}`}
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

      {/* Quotation list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] py-16 text-center">
          <Receipt size={36} className="mx-auto text-[var(--text-subtle)] mb-3" />
          <h3 className="font-semibold text-[var(--text)]">
            {search || activeFilter !== 'all' ? 'No matching quotations' : 'No quotations yet'}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {search || activeFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Quotations received from ElectroHub will appear here after you submit an RFQ.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((q, i) => (
              <QuotationCard
                key={q.id}
                quotation={q}
                index={i}
                onClick={() => setSelected(q)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
