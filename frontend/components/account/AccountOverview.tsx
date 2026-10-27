'use client';

import * as React from 'react';
import Link from 'next/link';
import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  MapPin,
  User,
  Package,
  Clock,
  ChevronRight,
  TrendingUp,
  Star,
  Zap,
  Heart,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/lib/providers/AuthProvider';
import { formatINR, formatDate } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AccountSection } from './AccountDashboard';
import { getStoredOrders, type MockOrder } from './mockOrders';
import { getStoredAddresses } from './mockAddresses';

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const cardVariants: Variants = {
  hidden:   { opacity: 0, y: 16 },
  visible:  { opacity: 1, y: 0 },
};

interface AccountOverviewProps {
  onSectionChange: (section: AccountSection) => void;
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' | 'default' }> = {
  pending:          { label: 'Pending',          variant: 'warning' },
  confirmed:        { label: 'Confirmed',         variant: 'info'    },
  processing:       { label: 'Processing',        variant: 'info'    },
  shipped:          { label: 'Shipped',           variant: 'primary' as 'info', },
  out_for_delivery: { label: 'Out for Delivery',  variant: 'warning' },
  delivered:        { label: 'Delivered',         variant: 'success' },
  cancelled:        { label: 'Cancelled',         variant: 'danger'  },
  returned:         { label: 'Returned',          variant: 'default' },
  refunded:         { label: 'Refunded',          variant: 'default' },
};

export function AccountOverview({ onSectionChange }: AccountOverviewProps) {
  const { user } = useAuth();
  const orders    = getStoredOrders(user?.id ?? '');
  const addresses = getStoredAddresses(user?.id ?? '');

  const totalSpent = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const recentOrders = orders.slice(0, 3);

  const memberSince = user?.createdAt
    ? formatDate(user.createdAt, { month: 'long', year: 'numeric' })
    : '—';

  const stats = [
    { icon: ShoppingBag, label: 'Total Orders',    value: orders.length,         color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
    { icon: TrendingUp,  label: 'Total Spent',     value: formatINR(totalSpent), color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: MapPin,      label: 'Saved Addresses', value: addresses.length,       color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { icon: Star,        label: 'Member Since',    value: memberSince,            color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome banner */}
      <motion.div
        variants={cardVariants}
        className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-blue-600 via-violet-600 to-blue-800 p-6 text-white shadow-lg"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <Zap className="w-full h-full" />
        </div>
        <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-white/5 -mb-10 -mr-10" />
        <div className="absolute top-0 left-1/2 w-48 h-48 rounded-full bg-white/5 -mt-20" />

        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium mb-1">Welcome back,</p>
          <h1 className="text-2xl font-bold font-display">{user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-blue-200 text-sm mt-2">Manage your orders, addresses, and profile from here.</p>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={cardVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 hover:shadow-[var(--shadow-card-hov)] transition-shadow"
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', stat.bg)}>
                <Icon size={18} className={stat.color} />
              </div>
              <p className="text-[var(--text-subtle)] text-xs mb-0.5">{stat.label}</p>
              <p className="text-[var(--text)] font-bold text-base">{stat.value}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Recent orders */}
      <motion.div
        variants={cardVariants}
        className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden shadow-[var(--shadow-card)]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-[var(--primary)]" />
            <h2 className="font-semibold text-[var(--text)]">Recent Orders</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ChevronRight size={14} />}
            onClick={() => onSectionChange('orders')}
            className="text-[var(--primary)] hover:text-[var(--primary-hover)]"
            id="overview-view-all-orders"
          >
            View All
          </Button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingBag size={36} className="mx-auto text-[var(--text-subtle)] mb-3" />
            <p className="text-[var(--text-muted)] text-sm">No orders yet</p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center h-8 px-3 mt-4 text-sm font-medium rounded-md border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {recentOrders.map((order) => {
              const statusCfg = ORDER_STATUS_CONFIG[order.status] ?? { label: order.status, variant: 'default' as const };
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                  onClick={() => onSectionChange('orders')}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-[var(--background-alt)] flex items-center justify-center shrink-0">
                    <Package size={18} className="text-[var(--primary)]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-[var(--text)]">{order.orderNumber}</span>
                      <Badge variant={statusCfg.variant as 'success'} size="xs">
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-[var(--text)] text-sm">{formatINR(order.total)}</p>
                    <ChevronRight size={14} className="ml-auto text-[var(--text-subtle)] group-hover:text-[var(--primary)] transition-colors mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: User,      label: 'Edit Profile',    section: 'profile'   as AccountSection, color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
          { icon: MapPin,    label: 'Manage Addresses', section: 'addresses' as AccountSection, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { icon: Clock,     label: 'Order History',   section: 'orders'    as AccountSection, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => onSectionChange(action.section)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--background-card)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-card-hov)] transition-all duration-200 text-left group"
              id={`overview-quick-${action.section}`}
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110', action.bg)}>
                <Icon size={18} className={action.color} />
              </div>
              <span className="font-medium text-sm text-[var(--text)]">{action.label}</span>
              <ChevronRight size={14} className="ml-auto text-[var(--text-subtle)] group-hover:text-[var(--primary)] transition-colors" />
            </button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
