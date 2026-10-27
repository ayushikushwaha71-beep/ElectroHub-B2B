'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  GitCompare,
  X,
  ShoppingCart,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Breadcrumb }  from '@/components/ui/Breadcrumb';
import { Button }      from '@/components/ui/Button';
import { Badge }       from '@/components/ui/Badge';
import { EmptyState }  from '@/components/ui/EmptyState';
import { StarRating }  from '@/components/ui/ProductCard';
import { toast }       from '@/components/ui/Toast';
import { PRODUCTS }    from '@/lib/data/products';
import { formatINR, calculateDiscount, getStockStatus } from '@/utils/format';
import type { Product } from '@/types';

// ─── Mock Compare Data ────────────────────────────────────────────────────────
// Start with 3 diverse products for comparison demonstration
const MOCK_COMPARE_IDS = ['ard-001', 'esp-001', 'rpi-001'];

function getInitialCompare(): Product[] {
  const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
  return MOCK_COMPARE_IDS
    .map((id) => byId.get(id))
    .filter(Boolean) as Product[];
}

// ─── Row label config ─────────────────────────────────────────────────────────
interface RowConfig {
  label: string;
  render: (p: Product) => React.ReactNode;
  highlight?: boolean; // Highlight this row
}

function buildRows(products: Product[]): RowConfig[] {
  return [
    {
      label: 'Price',
      highlight: true,
      render: (p) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-bold font-display text-[var(--text)]">
            {formatINR(p.sellingPrice)}
          </span>
          {p.originalPrice > p.sellingPrice && (
            <span className="text-xs text-[var(--text-subtle)] line-through">
              {formatINR(p.originalPrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      label: 'Discount',
      render: (p) => {
        const d = calculateDiscount(p.originalPrice, p.sellingPrice);
        return d > 0
          ? <Badge variant="sale" size="sm">{d}% off</Badge>
          : <span className="text-[var(--text-subtle)] text-sm">—</span>;
      },
    },
    {
      label: 'Rating',
      highlight: true,
      render: (p) => (
        <div className="flex flex-col gap-1">
          <StarRating rating={p.rating} count={p.reviewCount} size={13} />
          <span className="text-xs text-[var(--text-muted)]">
            {p.rating.toFixed(1)} / 5.0
          </span>
        </div>
      ),
    },
    {
      label: 'Availability',
      render: (p) => {
        const s = getStockStatus(p.stock);
        return (
          <div className="flex items-center gap-1.5">
            {s.variant === 'success'
              ? <CheckCircle size={14} className="text-[var(--success)] shrink-0" />
              : <XCircle size={14} className="text-[var(--danger)] shrink-0" />}
            <span className={cn(
              'text-sm font-medium',
              s.variant === 'success' ? 'text-[var(--success)]' :
              s.variant === 'warning' ? 'text-[var(--warning)]' : 'text-[var(--danger)]',
            )}>
              {s.label}
            </span>
          </div>
        );
      },
    },
    {
      label: 'Brand',
      render: (p) => (
        <span className="font-semibold text-[var(--primary)] text-sm">{p.brand}</span>
      ),
    },
    {
      label: 'Category',
      render: (p) => (
        <Badge variant="default" size="sm">{p.category}</Badge>
      ),
    },
    {
      label: 'SKU',
      render: (p) => (
        <span className="font-mono text-xs text-[var(--text-muted)] bg-[var(--surface)] px-2 py-0.5 rounded">
          {p.sku}
        </span>
      ),
    },
    {
      label: 'Key Specs',
      highlight: true,
      render: (p) => {
        const group = p.specifications?.[0];
        if (!group) return <span className="text-[var(--text-subtle)] text-sm">—</span>;
        return (
          <ul className="flex flex-col gap-1">
            {group.specs.slice(0, 4).map((spec) => (
              <li key={spec.label} className="flex flex-col text-xs">
                <span className="text-[var(--text-muted)] font-medium">{spec.label}</span>
                <span className="text-[var(--text)]">{spec.value}{spec.unit ? ` ${spec.unit}` : ''}</span>
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      label: 'Key Features',
      render: (p) => (
        <ul className="flex flex-col gap-1">
          {p.features.slice(0, 3).map((f) => (
            <li key={f} className="flex items-start gap-1.5 text-xs text-[var(--text-muted)]">
              <CheckCircle size={11} className="text-[var(--success)] mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      ),
    },
    {
      label: 'Badges',
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.isNew        && <Badge variant="new"        size="xs">New</Badge>}
          {p.isBestseller && <Badge variant="bestseller" size="xs">Bestseller</Badge>}
          {p.isFeatured   && <Badge variant="premium"    size="xs">Featured</Badge>}
          {!p.isNew && !p.isBestseller && !p.isFeatured && (
            <span className="text-[var(--text-subtle)] text-xs">—</span>
          )}
        </div>
      ),
    },
  ];
}

// ─── Product Column Header ────────────────────────────────────────────────────
function ProductColumnHeader({
  product,
  onRemove,
  onAddToCart,
}: {
  product: Product;
  onRemove: (id: string) => void;
  onAddToCart: (p: Product) => void;
}) {
  const [cartAdded, setCartAdded] = React.useState(false);
  const img = product.images[0];

  const handleCart = () => {
    setCartAdded(true);
    onAddToCart(product);
    setTimeout(() => setCartAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Remove */}
      <button
        onClick={() => onRemove(product.id)}
        className={cn(
          'self-end flex h-7 w-7 items-center justify-center rounded-lg',
          'text-[var(--text-muted)] hover:text-[var(--danger)]',
          'hover:bg-red-50 dark:hover:bg-red-950/20',
          'border border-[var(--border)] hover:border-red-200 dark:hover:border-red-800',
          'transition-all duration-200',
        )}
        aria-label={`Remove ${product.name} from comparison`}
      >
        <X size={14} />
      </button>

      {/* Image */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[var(--background-alt)] flex items-center justify-center">
        <img
          src={img?.url ?? '/placeholder.png'}
          alt={img?.alt ?? product.name}
          className="w-4/5 h-4/5 object-contain"
          loading="lazy"
        />
        {calculateDiscount(product.originalPrice, product.sellingPrice) > 0 && (
          <span className="absolute top-2 left-2">
            <Badge variant="sale" size="xs">
              {calculateDiscount(product.originalPrice, product.sellingPrice)}% off
            </Badge>
          </span>
        )}
      </div>

      {/* Name + Brand */}
      <div>
        <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide mb-0.5">
          {product.brand}
        </p>
        <h3 className="text-sm font-semibold text-[var(--text)] leading-snug line-clamp-3">
          {product.name}
        </h3>
      </div>

      {/* CTA */}
      <Button
        variant={cartAdded ? 'secondary' : 'primary'}
        size="sm"
        fullWidth
        onClick={handleCart}
        disabled={product.stock <= 0}
        leftIcon={<ShoppingCart size={13} />}
      >
        {cartAdded ? '✓ Added' : 'Add to Cart'}
      </Button>
    </div>
  );
}

// ─── Cart Cell (isolates useState per column in bottom CTA row) ───────────────
function CartCell({
  product,
  colIdx,
  totalCols,
  onAddToCart,
  onRemove,
}: {
  product: Product;
  colIdx: number;
  totalCols: number;
  onAddToCart: (p: Product) => void;
  onRemove: (id: string) => void;
}) {
  const [cartAdded, setCartAdded] = React.useState(false);

  return (
    <div
      className={cn(
        'p-4 flex flex-col gap-2',
        colIdx < totalCols - 1 && 'border-r border-[var(--border)]',
      )}
    >
      <Button
        variant={cartAdded ? 'secondary' : 'primary'}
        size="sm"
        fullWidth
        onClick={() => {
          setCartAdded(true);
          onAddToCart(product);
          setTimeout(() => setCartAdded(false), 2000);
        }}
        disabled={product.stock <= 0}
        leftIcon={<ShoppingCart size={13} />}
      >
        {cartAdded ? '✓ Added' : 'Add to Cart'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        fullWidth
        onClick={() => onRemove(product.id)}
        leftIcon={<X size={13} />}
        className="text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-950/20 text-xs"
        aria-label={`Remove ${product.name}`}
      >
        Remove
      </Button>
    </div>
  );
}

// ─── Main Compare Page ────────────────────────────────────────────────────────
export function ComparePage() {
  const [items, setItems] = React.useState<Product[]>(getInitialCompare);
  const [removingIds, setRemovingIds] = React.useState<Set<string>>(new Set());

  const handleRemove = (id: string) => {
    const product = items.find((p) => p.id === id);
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setItems((prev) => prev.filter((p) => p.id !== id));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (product) toast.info(`Removed ${product.name} from comparison`);
    }, 300);
  };

  const handleClearAll = () => {
    setItems([]);
    toast.info('Compare list cleared');
  };

  const handleAddToCart = (product: Product) => {
    toast.addedToCart(product.name);
  };

  const rows = buildRows(items);

  const showAddSlot = items.length < 4;
  const gridCols = showAddSlot
    ? `160px repeat(${items.length}, 1fr) 180px`
    : `160px repeat(${items.length}, 1fr)`;

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Compare Products', current: true },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} showHome className="mb-6" />

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
              <GitCompare size={22} className="text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)]">
                Compare Products
              </h1>
              {items.length > 0 && (
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  Comparing {items.length} {items.length === 1 ? 'product' : 'products'}
                </p>
              )}
            </div>
            {items.length > 0 && (
              <Badge variant="primary" size="md" className="ml-1 self-start mt-1">
                {items.length}
              </Badge>
            )}
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                leftIcon={<Trash2 size={14} />}
                className="text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-950/20"
                aria-label="Clear all compared products"
              >
                Clear All
              </Button>
              <a
                href="/shop"
                className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-md border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200"
              >
                Browse More <ArrowRight size={14} />
              </a>
            </div>
          )}
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {items.length === 0 ? (
          <EmptyState
            preset="custom"
            icon={GitCompare}
            title="No Products to Compare"
            description="Add products to your comparison list by clicking the compare icon on any product card."
            actions={[
              { label: 'Continue Shopping', onClick: () => { window.location.href = '/shop'; }, variant: 'primary' },
              { label: 'Browse Categories', onClick: () => { window.location.href = '/categories'; }, variant: 'outline' },
            ]}
            size="lg"
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* ── Compare table wrapper — horizontally scrollable on small screens ── */}
            <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4">
              <div
                className={cn(
                  'rounded-2xl border border-[var(--border)]',
                  'bg-[var(--background-card)] shadow-[var(--shadow-card)]',
                  'overflow-hidden',
                )}
                style={{ minWidth: `${Math.max(640, items.length * 240 + (showAddSlot ? 340 : 160))}px` }}
              >
                {/* ── Product headers ────────────────────────────────────────── */}
                <div
                  className="grid border-b border-[var(--border)] bg-[var(--surface)]"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  {/* Label column header */}
                  <div className="p-4 flex items-end border-r border-[var(--border)]">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Attribute
                    </span>
                  </div>

                  {/* Product column headers — direct grid children (no AnimatePresence wrapper) */}
                  {items.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{
                        opacity: removingIds.has(product.id) ? 0 : 1,
                        scale: removingIds.has(product.id) ? 0.95 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="border-l border-[var(--border)]"
                    >
                      <ProductColumnHeader
                        product={product}
                        onRemove={handleRemove}
                        onAddToCart={handleAddToCart}
                      />
                    </motion.div>
                  ))}

                  {/* Add product slot (max 4) */}
                  {showAddSlot && (
                    <div className="border-l border-[var(--border)] p-4 flex flex-col items-center justify-center gap-3 bg-[var(--surface)]">
                      <div className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl',
                        'border-2 border-dashed border-[var(--border-strong)]',
                        'text-[var(--text-subtle)]',
                      )}>
                        <Plus size={20} />
                      </div>
                      <p className="text-xs text-[var(--text-muted)] text-center leading-snug">
                        Add another product to compare
                      </p>
                      <a
                        href="/shop"
                        className="inline-flex items-center h-8 px-3 text-sm font-medium rounded-md text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all duration-200"
                      >
                        Browse
                      </a>
                    </div>
                  )}
                </div>

                {/* ── Comparison rows ──────────────────────────────────────── */}
                {rows.map((row, rowIdx) => (
                  <div
                    key={row.label}
                    className={cn(
                      'grid border-b border-[var(--border)] last:border-b-0',
                      row.highlight
                        ? 'bg-[var(--primary)]/[0.03] dark:bg-[var(--primary)]/[0.06]'
                        : rowIdx % 2 === 0
                          ? 'bg-[var(--background-card)]'
                          : 'bg-[var(--background-alt)]/50',
                    )}
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    {/* Row label */}
                    <div className={cn(
                      'p-4 flex items-start',
                      'border-r border-[var(--border)]',
                      row.highlight && 'bg-[var(--primary)]/5',
                    )}>
                      <span className={cn(
                        'text-xs font-semibold',
                        row.highlight
                          ? 'text-[var(--primary)]'
                          : 'text-[var(--text-muted)]',
                      )}>
                        {row.label}
                      </span>
                    </div>

                    {/* Product cells */}
                    {items.map((product, colIdx) => (
                      <motion.div
                        key={product.id}
                        animate={{ opacity: removingIds.has(product.id) ? 0 : 1 }}
                        transition={{ duration: 0.25 }}
                        className={cn(
                          'p-4',
                          colIdx < items.length - 1 && 'border-r border-[var(--border)]',
                        )}
                      >
                        {row.render(product)}
                      </motion.div>
                    ))}

                    {/* Empty "add" slot matching header */}
                    {showAddSlot && (
                      <div className="p-4 border-l border-[var(--border)] bg-[var(--surface)]/30" />
                    )}
                  </div>
                ))}

                {/* ── Bottom CTA row ───────────────────────────────────────── */}
                <div
                  className="grid bg-[var(--surface)] border-t-2 border-[var(--border)]"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <div className="p-4 border-r border-[var(--border)] flex items-center">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Actions
                    </span>
                  </div>
                  {items.map((product, colIdx) => (
                    <CartCell
                      key={product.id}
                      product={product}
                      colIdx={colIdx}
                      totalCols={items.length}
                      onAddToCart={handleAddToCart}
                      onRemove={handleRemove}
                    />
                  ))}
                  {showAddSlot && <div className="p-4 border-l border-[var(--border)]" />}
                </div>
              </div>
            </div>

            {/* ── Scroll hint (mobile) ──────────────────────────────────── */}
            <p className="mt-3 text-center text-xs text-[var(--text-subtle)] lg:hidden">
              ← Scroll horizontally to see all columns →
            </p>

            {/* ── Compare summary tip banner ────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              className={cn(
                'mt-6 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4',
                'bg-gradient-to-r from-[var(--primary)]/5 to-violet-500/5',
                'border border-[var(--border)]',
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                <GitCompare size={18} className="text-[var(--primary)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--text)]">
                  Compare up to 4 products side-by-side
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Add products from any product card using the compare icon. Remove products by clicking the × button above each column.
                </p>
              </div>
              <a
                href="/shop"
                className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-all duration-200 shrink-0"
              >
                Add Products <ArrowRight size={14} />
              </a>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
