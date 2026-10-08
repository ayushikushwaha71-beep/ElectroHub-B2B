'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Package,
  ChevronRight,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  MapPin,
  CreditCard,
  Search,
  FileText,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/lib/providers/AuthProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatINR, formatDate } from '@/utils/format';
// Local type that matches the Django OrderSerializer → mapped to this shape
interface RealOrder {
  id:             string;
  orderNumber:    string;
  userId:         string;
  items:          Array<{
    id:           string;
    productId:    string;
    productName:  string;
    productImage: string;
    sku:          string;
    quantity:     number;
    sellingPrice: number;
    originalPrice:number;
    discount:     number;
  }>;
  subtotal:       number;
  discount:       number;
  deliveryCharge: number;
  total:          number;
  status:         OrderStatus;
  paymentMethod:  string;
  paymentStatus:  string;
  trackingNumber?:string;
  estimatedDelivery?: string;
  createdAt:      string;
  updatedAt:      string;
  // B2B quotation linkage (optional)
  quotationRef?:     string;
  quotationNumber?:  string;
  shippingAddress: {
    firstName: string;
    lastName:  string;
    phone:     string;
    line1:     string;
    city:      string;
    state:     string;
    pincode:   string;
    country:   string;
  };
}
import { api } from '@/lib/api';
import type { OrderStatus } from '@/types';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: 'success' | 'warning' | 'info' | 'danger' | 'default'; icon: React.ElementType }
> = {
  pending:          { label: 'Pending',          variant: 'warning', icon: Clock        },
  confirmed:        { label: 'Confirmed',         variant: 'info',    icon: CheckCircle2 },
  processing:       { label: 'Processing',        variant: 'info',    icon: RefreshCw    },
  shipped:          { label: 'Shipped',           variant: 'info',    icon: Truck        },
  out_for_delivery: { label: 'Out for Delivery',  variant: 'warning', icon: Truck        },
  delivered:        { label: 'Delivered',         variant: 'success', icon: CheckCircle2 },
  completed:        { label: 'Completed',         variant: 'success', icon: CheckCircle2 },
  cancelled:        { label: 'Cancelled',         variant: 'danger',  icon: XCircle      },
  returned:         { label: 'Returned',          variant: 'default', icon: ArrowLeft    },
  refunded:         { label: 'Refunded',          variant: 'default', icon: RefreshCw    },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod:        'Cash on Delivery',
  upi:        'UPI',
  card:       'Credit / Debit Card',
  netbanking: 'Net Banking',
  wallet:     'Wallet',
};

// Timeline steps for order tracking
const TRACKING_STEPS: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

function getTrackingProgress(status: OrderStatus): number {
  if (status === 'pending')  return 0;
  if (status === 'cancelled' || status === 'returned' || status === 'refunded') return -1;
  if (status === 'completed') return TRACKING_STEPS.length; // fully done
  const idx = TRACKING_STEPS.indexOf(status);
  return idx >= 0 ? idx + 1 : 0;
}

export function AccountOrders() {
  const { user } = useAuth();
  const [orders, setOrders]          = React.useState<RealOrder[]>([]);
  const [selectedOrder, setSelected] = React.useState<RealOrder | null>(null);
  const [search, setSearch]          = React.useState('');

  const fetchOrders = () => {
    if (!user?.id) return;

    // ── Load real orders from Django backend ───────────────────────────────
    const accessToken = localStorage.getItem('electrohub_access_token') ?? '';
    interface ApiOrderItem { id: number; product: number; product_name: string; quantity: number; unit_price: string; total_price: string; }
    interface ApiOrder { id: number; order_number: string; total_amount: string; status: string; payment_method: string; created_at: string; updated_at: string; full_name: string; phone: string; address: string; city: string; state: string; pincode: string; items: ApiOrderItem[]; }
    api.get<{ results?: ApiOrder[] } | ApiOrder[]>('/orders/', { token: accessToken })
      .then((response) => {
        const records: ApiOrder[] = Array.isArray(response) ? response : (response.results ?? []);
        // Map Django order status → front-end OrderStatus
        const mapStatus = (s: string): OrderStatus => {
          const valid: OrderStatus[] = ['pending','confirmed','processing','shipped','out_for_delivery','delivered','completed','cancelled','returned','refunded'];
          return valid.includes(s as OrderStatus) ? (s as OrderStatus) : 'pending';
        };
        const apiOrders: RealOrder[] = records.map((order) => ({
          id:          String(order.id),
          orderNumber: order.order_number,
          userId:      user.id,
          items:       order.items.map((item) => ({
            id:           String(item.id),
            productId:    String(item.product),
            productName:  item.product_name,
            productImage: '',
            sku:          '',
            quantity:     item.quantity,
            sellingPrice: Number(item.unit_price),
            originalPrice:Number(item.unit_price),
            discount:     0,
          })),
          subtotal:       Number(order.total_amount),
          discount:       0,
          deliveryCharge: 0,
          total:          Number(order.total_amount),
          status:         mapStatus(order.status),
          paymentMethod:  order.payment_method,
          paymentStatus:  order.payment_method === 'cod' ? 'pending' : 'paid',
          createdAt:      order.created_at,
          updatedAt:      order.updated_at,
          quotationRef:   undefined,
          quotationNumber:undefined,
          shippingAddress: {
            firstName: order.full_name.split(' ')[0] ?? '',
            lastName:  order.full_name.split(' ').slice(1).join(' '),
            phone:     order.phone,
            line1:     order.address,
            city:      order.city,
            state:     order.state,
            pincode:   order.pincode,
            country:   'India',
          },
        }));
        setOrders(apiOrders);
      })
      .catch(() => {
        setOrders([]);
      });
  };

  React.useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  const filtered = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.items.some((i) => i.productName.toLowerCase().includes(search.toLowerCase())),
  );

  // ── Order Detail View ──────────────────────────────────────────────────────────
  if (selectedOrder) {
    return <OrderDetail order={selectedOrder} onBack={() => setSelected(null)} refreshOrders={fetchOrders} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-[var(--text)]">Orders</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search orders…"
            leftIcon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            clearable
            onClear={() => setSearch('')}
            id="orders-search"
          />
        </div>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] py-16 text-center">
          <ShoppingBag size={36} className="mx-auto text-[var(--text-subtle)] mb-3" />
          <h3 className="font-semibold text-[var(--text)]">
            {search ? 'No matching orders' : 'No orders yet'}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1 mb-5">
            {search ? 'Try a different search term.' : 'Start shopping to see your orders here.'}
          </p>
          {!search && (
            <Link
              href="/shop"
              className="inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
            >
              Browse Products
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((order, i) => {
              const statusCfg = STATUS_CONFIG[order.status];
              const StatusIcon = statusCfg.icon;
              const preview = order.items[0];

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden hover:shadow-[var(--shadow-card-hov)] transition-shadow cursor-pointer group"
                  onClick={() => setSelected(order)}
                >
                  {/* Order header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--background-alt)]">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-semibold text-sm text-[var(--text)]">{order.orderNumber}</span>
                      <Badge variant={statusCfg.variant} size="xs" icon={<StatusIcon size={10} />}>
                        {statusCfg.label}
                      </Badge>
                      {order.quotationNumber && (
                        <Badge variant="default" size="xs" icon={<FileText size={9} />}>
                          {order.quotationNumber}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span>{formatDate(order.createdAt)}</span>
                      <ChevronRight size={14} className="text-[var(--text-subtle)] group-hover:text-[var(--primary)] transition-colors" />
                    </div>
                  </div>

                  {/* Order body */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Product preview image */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--background-alt)] shrink-0">
                      {preview?.productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview.productImage} alt={preview.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={20} className="text-[var(--text-subtle)]" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[var(--text)] line-clamp-1">{preview?.productName}</p>
                      {order.items.length > 1 && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">+{order.items.length - 1} more item{order.items.length > 2 ? 's' : ''}</p>
                      )}
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} items · {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-[var(--text)]">{formatINR(order.total)}</p>
                      {order.deliveryCharge === 0 && (
                        <p className="text-xs text-[var(--success)] mt-0.5">Free delivery</p>
                      )}
                    </div>
                  </div>

                  {/* Delivery info */}
                  {order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="px-5 pb-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <Truck size={12} />
                      <span>
                        {order.status === 'shipped' ? 'Expected by' : 'Estimated delivery'}
                        {' '}<strong className="text-[var(--text)]">{formatDate(order.estimatedDelivery, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ── Order Detail ───────────────────────────────────────────────────────────────

function OrderDetail({ order, onBack, refreshOrders }: { order: RealOrder; onBack: () => void; refreshOrders: () => void; }) {
  const statusCfg = STATUS_CONFIG[order.status];
  const StatusIcon = statusCfg.icon;
  const progress = getTrackingProgress(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'returned' || order.status === 'refunded';
  const [completing, setCompleting] = React.useState(false);

  const handleComplete = async () => {
    try {
      setCompleting(true);
      const accessToken = localStorage.getItem('electrohub_access_token');
      await api.post(`/orders/${order.id}/complete/`, {}, { token: accessToken || '' });
      refreshOrders();
      onBack();
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
      className="space-y-5"
    >
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={15} />} onClick={onBack} id="order-detail-back">
          Back
        </Button>
        <div className="h-5 w-px bg-[var(--border)]" />
        <div>
          <h2 className="font-bold font-display text-[var(--text)] text-lg leading-none">{order.orderNumber}</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Placed on {formatDate(order.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          {order.quotationNumber && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
              <FileText size={11} className="text-[var(--primary)]" />
              B2B Order · Quotation <span className="font-mono text-[var(--primary)]">{order.quotationNumber}</span>
            </p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={statusCfg.variant} size="sm" icon={<StatusIcon size={11} />}>
            {statusCfg.label}
          </Badge>
          {order.status === 'delivered' && (
            <Button size="sm" variant="primary" onClick={handleComplete} isLoading={completing} id="mark-completed">
              Mark as Completed
            </Button>
          )}
        </div>
      </div>

      {/* Tracking timeline */}
      {!isCancelled && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold text-sm text-[var(--text)] mb-5 flex items-center gap-2">
            <Truck size={16} className="text-[var(--primary)]" />
            Order Tracking
          </h3>
          <div className="relative">
            {/* Progress bar */}
            <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-[var(--border)]" />
            <div
              className="absolute left-4 top-5 w-0.5 bg-[var(--primary)] transition-all duration-700"
              style={{ height: `${Math.max(0, (progress - 1) / (TRACKING_STEPS.length - 1)) * 100}%` }}
            />

            <div className="space-y-5">
              {TRACKING_STEPS.map((step, idx) => {
                const isCompleted = progress > idx;
                const isActive    = progress === idx + 1;
                const cfg = STATUS_CONFIG[step];
                const StepIcon = cfg.icon;
                return (
                  <div key={step} className="flex items-start gap-4 pl-0 relative">
                    <div className={cn(
                      'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all',
                      isCompleted || isActive
                        ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                        : 'bg-[var(--background-card)] border-[var(--border)] text-[var(--text-subtle)]',
                    )}>
                      <StepIcon size={14} />
                    </div>
                    <div className="pt-1">
                      <p className={cn(
                        'text-sm font-medium',
                        isCompleted || isActive ? 'text-[var(--text)]' : 'text-[var(--text-muted)]',
                      )}>
                        {cfg.label}
                      </p>
                      {isActive && order.estimatedDelivery && step !== 'delivered' && (
                        <p className="text-xs text-[var(--primary)] mt-0.5">
                          Expected: {formatDate(order.estimatedDelivery, { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                      )}
                      {isActive && step === 'shipped' && order.trackingNumber && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">Tracking: {order.trackingNumber}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden shadow-[var(--shadow-card)]">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
          <Package size={16} className="text-[var(--primary)]" />
          <h3 className="font-semibold text-sm text-[var(--text)]">
            {order.items.length} Item{order.items.length !== 1 ? 's' : ''}
          </h3>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--background-alt)] shrink-0">
                {item.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={20} className="text-[var(--text-subtle)]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[var(--text)] line-clamp-2">{item.productName}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">{item.sku}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Qty: {item.quantity}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm text-[var(--text)]">{formatINR(item.sellingPrice * item.quantity)}</p>
                {item.discount > 0 && (
                  <p className="text-xs text-[var(--text-muted)] line-through">{formatINR(item.originalPrice * item.quantity)}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Price breakdown */}
        <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--background-alt)] space-y-2">
          <PriceLine label="Subtotal"       value={formatINR(order.subtotal)} />
          {order.discount > 0 && <PriceLine label="Discount" value={`-${formatINR(order.discount)}`} valueClass="text-[var(--success)]" />}
          <PriceLine label="Delivery" value={order.deliveryCharge === 0 ? 'FREE' : formatINR(order.deliveryCharge)} valueClass={order.deliveryCharge === 0 ? 'text-[var(--success)]' : undefined} />
          <div className="border-t border-[var(--border)] pt-2">
            <PriceLine label="Total" value={formatINR(order.total)} labelClass="font-bold text-[var(--text)]" valueClass="font-bold text-[var(--text)] text-base" />
          </div>
        </div>
      </div>

      {/* Shipping + Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={15} className="text-[var(--primary)]" />
            <h4 className="font-semibold text-sm text-[var(--text)]">Shipping Address</h4>
          </div>
          <div className="text-sm text-[var(--text-muted)] space-y-0.5">
            <p className="font-medium text-[var(--text)]">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
            <p>{order.shippingAddress.line1}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
            <p>{order.shippingAddress.country}</p>
            <p className="pt-1">{order.shippingAddress.phone}</p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={15} className="text-[var(--primary)]" />
            <h4 className="font-semibold text-sm text-[var(--text)]">Payment Info</h4>
          </div>
          <div className="text-sm text-[var(--text-muted)] space-y-1.5">
            <div className="flex justify-between">
              <span>Method</span>
              <span className="text-[var(--text)] font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <Badge
                variant={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'failed' ? 'danger' : 'warning'}
                size="xs"
              >
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PriceLine({
  label,
  value,
  labelClass,
  valueClass,
}: {
  label:       string;
  value:       string;
  labelClass?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-sm text-[var(--text-muted)]', labelClass)}>{label}</span>
      <span className={cn('text-sm text-[var(--text)]', valueClass)}>{value}</span>
    </div>
  );
}
