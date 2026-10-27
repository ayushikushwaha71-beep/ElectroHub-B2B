'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  Package,
  Zap,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Breadcrumb }  from '@/components/ui/Breadcrumb';
import { Button }      from '@/components/ui/Button';
import { Badge }       from '@/components/ui/Badge';
import { EmptyState }  from '@/components/ui/EmptyState';
import { toast }       from '@/components/ui/Toast';
import { useCart }     from '@/lib/providers/CartProvider';
import { formatINR, calculateDiscount } from '@/utils/format';
import type { CartItem } from '@/lib/providers/CartProvider';

// ─── Trust Badges ─────────────────────────────────────────────────────────────
const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'Secure Checkout', sub: 'SSL encrypted' },
  { icon: Truck,       label: 'Free Delivery',   sub: 'On orders above ₹499' },
  { icon: RotateCcw,   label: 'Easy Returns',    sub: '7-day return policy' },
];

// ─── Qty Button ───────────────────────────────────────────────────────────────
function QtyButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md',
        'border border-[var(--border)] bg-[var(--surface)]',
        'text-[var(--text)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]',
        'transition-all duration-150',
        'disabled:opacity-40 disabled:pointer-events-none',
      )}
    >
      {children}
    </button>
  );
}

// ─── Cart Item Row ─────────────────────────────────────────────────────────────
function CartItemRow({ item }: { item: CartItem }) {
  const { removeItem, updateQty } = useCart();
  const { product, quantity } = item;
  const img = product.images[0];
  const discount = calculateDiscount(product.originalPrice, product.sellingPrice);
  const lineTotal = product.sellingPrice * quantity;

  const handleIncrease = () => {
    if (quantity >= Math.min(product.stock, 10)) {
      toast.warning(`Maximum ${Math.min(product.stock, 10)} units allowed`);
      return;
    }
    updateQty(product.id, quantity + 1);
  };

  const handleDecrease = () => updateQty(product.id, quantity - 1);

  const handleRemove = () => {
    removeItem(product.id);
    toast.info(`Removed ${product.name} from cart`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.22 } }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'group flex gap-4 p-4 rounded-2xl',
        'bg-[var(--background-card)] border border-[var(--border)]',
        'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hov)]',
        'transition-shadow duration-200',
      )}
    >
      {/* ── Product image ─────────────────────────────────────────────────── */}
      <a href={`/product/${product.id}`} className="shrink-0">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[var(--background-alt)]">
          <img
            src={img?.url ?? '/placeholder.png'}
            alt={img?.alt ?? product.name}
            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {discount > 0 && (
            <span className="absolute top-1 left-1">
              <Badge variant="sale" size="xs">{discount}% off</Badge>
            </span>
          )}
        </div>
      </a>

      {/* ── Info + controls ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        {/* Brand + name */}
        <div>
          <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
            {product.brand}
          </p>
          <a href={`/product/${product.id}`}>
            <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-2 leading-snug hover:text-[var(--primary)] transition-colors">
              {product.name}
            </h3>
          </a>
          <p className="text-[10px] font-mono text-[var(--text-subtle)] mt-0.5">{product.sku}</p>
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-[var(--text)]">
            {formatINR(product.sellingPrice)}
          </span>
          {product.originalPrice > product.sellingPrice && (
            <span className="text-sm text-[var(--text-subtle)] line-through">
              {formatINR(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Qty controls + remove */}
        <div className="flex items-center justify-between flex-wrap gap-3 mt-auto">
          {/* Qty stepper */}
          <div className="flex items-center gap-2">
            <QtyButton onClick={handleDecrease} disabled={quantity <= 1}>
              <Minus size={12} />
            </QtyButton>
            <span className="min-w-[2rem] text-center text-sm font-semibold text-[var(--text)]">
              {quantity}
            </span>
            <QtyButton onClick={handleIncrease} disabled={quantity >= Math.min(product.stock, 10)}>
              <Plus size={12} />
            </QtyButton>
            <span className="text-xs text-[var(--text-muted)] ml-1">
              × {formatINR(product.sellingPrice)}
            </span>
          </div>

          {/* Line total + remove */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[var(--text)]">
              = {formatINR(lineTotal)}
            </span>
            <button
              onClick={handleRemove}
              className={cn(
                'flex items-center gap-1 text-xs text-[var(--text-muted)]',
                'hover:text-[var(--danger)] transition-colors',
                'p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20',
              )}
              aria-label={`Remove ${product.name}`}
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Remove</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Order Summary ─────────────────────────────────────────────────────────────
function OrderSummary() {
  const { subtotal, shipping, total, totalItems, items } = useCart();
  const savings = items.reduce((sum, i) => {
    const saved = (i.product.originalPrice - i.product.sellingPrice) * i.quantity;
    return sum + Math.max(saved, 0);
  }, 0);
  const freeShippingLeft = Math.max(499 - subtotal, 0);

  return (
    <div className={cn(
      'rounded-2xl border border-[var(--border)]',
      'bg-[var(--background-card)] shadow-[var(--shadow-card)]',
      'overflow-hidden sticky top-24',
    )}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
        <h2 className="text-base font-bold text-[var(--text)]">Order Summary</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
      </div>

      <div className="p-5 space-y-3">
        {/* Free shipping progress */}
        {freeShippingLeft > 0 && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-2">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5">
              <Truck size={13} /> Add {formatINR(freeShippingLeft)} more for <strong>FREE delivery</strong>
            </p>
            <div className="w-full h-1.5 rounded-full bg-amber-200 dark:bg-amber-900/40 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((subtotal / 499) * 100, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
        {freeShippingLeft === 0 && subtotal > 0 && (
          <div className="rounded-xl bg-[var(--success-bg)] border border-[var(--success)]/20 p-3">
            <p className="text-xs text-[var(--success)] font-medium flex items-center gap-1.5">
              <Truck size={13} /> 🎉 You qualify for <strong>FREE delivery</strong>!
            </p>
          </div>
        )}

        {/* Line items */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">Subtotal</span>
            <span className="font-medium text-[var(--text)]">{formatINR(subtotal)}</span>
          </div>

          {savings > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--success)] flex items-center gap-1">
                <Tag size={12} /> You save
              </span>
              <span className="font-semibold text-[var(--success)]">−{formatINR(savings)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">Shipping</span>
            <span className={cn('font-medium', shipping === 0 ? 'text-[var(--success)]' : 'text-[var(--text)]')}>
              {shipping === 0 ? 'FREE' : formatINR(shipping)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">GST &amp; Taxes</span>
            <span className="text-[var(--text-muted)] text-xs">Included</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border)] pt-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--text)]">Total</span>
            <span className="text-xl font-bold font-display text-[var(--text)]">{formatINR(total)}</span>
          </div>
        </div>

        {/* CTA */}
        <Button
          variant="gradient"
          size="lg"
          fullWidth
          rightIcon={<ArrowRight size={16} />}
          onClick={() => { window.location.href = '/checkout'; }}
          className="mt-2"
          id="proceed-to-checkout"
        >
          Proceed to Checkout
        </Button>

        <Button
          variant="outline"
          size="md"
          fullWidth
          onClick={() => { window.location.href = '/shop'; }}
        >
          Continue Shopping
        </Button>
      </div>

      {/* Trust badges */}
      <div className="px-5 pb-5 space-y-2.5">
        {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
            <Icon size={14} className="shrink-0 text-[var(--primary)]" />
            <span><span className="font-medium text-[var(--text)]">{label}</span> — {sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Cart Page ────────────────────────────────────────────────────────────
export function CartPage() {
  const { items, clearCart, totalItems } = useCart();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Cart', current: true },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} showHome className="mb-6" />

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
              <ShoppingCart size={22} className="text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)]">
                Shopping Cart
              </h1>
              {totalItems > 0 && (
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
                </p>
              )}
            </div>
            {totalItems > 0 && (
              <Badge variant="primary" size="md" className="ml-1 self-start mt-1">
                {totalItems}
              </Badge>
            )}
          </div>

          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { clearCart(); toast.info('Cart cleared'); }}
              leftIcon={<Trash2 size={14} />}
              className="text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Clear Cart
            </Button>
          )}
        </div>

        {/* ── Content ─────────────────────────────────────────────────── */}
        {items.length === 0 ? (
          <EmptyState
            preset="empty-cart"
            title="Your Cart is Empty"
            description="Looks like you haven't added anything yet. Explore our electronics collection to find what you need."
            actions={[
              { label: 'Continue Shopping', onClick: () => { window.location.href = '/shop'; }, variant: 'primary' },
              { label: 'View Wishlist', onClick: () => { window.location.href = '/wishlist'; }, variant: 'outline' },
            ]}
            size="lg"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 xl:gap-8">

            {/* ── Left: Cart items ────────────────────────────────────── */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <React.Fragment key={item.product.id}>
                    {(index === 0 || items[index - 1].vendorName !== item.vendorName) && (
                      <div className="pt-2 text-sm font-semibold text-[var(--text)]">{item.vendorName ?? 'ElectroHub seller'}</div>
                    )}
                    <CartItemRow item={item} />
                  </React.Fragment>
                ))}
              </AnimatePresence>

              {/* Promo notice */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-2xl',
                  'bg-gradient-to-r from-[var(--primary)]/5 to-violet-500/5',
                  'border border-[var(--border)]',
                )}
              >
                <Zap size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-muted)]">
                  <span className="font-semibold text-[var(--text)]">ElectroHub Promise —</span>{' '}
                  Genuine products, warranty included, expert support 7 days a week.
                </p>
              </motion.div>

              {/* Recently viewed / suggestions placeholder */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-2xl',
                  'bg-[var(--background-card)] border border-[var(--border)]',
                )}
              >
                <Package size={16} className="text-[var(--text-muted)] shrink-0" />
                <p className="text-xs text-[var(--text-muted)] flex-1">
                  Need accessories? Browse our{' '}
                  <a href="/shop" className="text-[var(--primary)] hover:underline font-medium">
                    full catalog
                  </a>{' '}
                  to find compatible products.
                </p>
              </motion.div>
            </div>

            {/* ── Right: Order summary ─────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <OrderSummary />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
