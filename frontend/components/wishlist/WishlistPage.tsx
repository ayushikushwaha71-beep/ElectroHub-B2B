'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  Trash2,
  LayoutGrid,
  List,
  Share2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Breadcrumb }   from '@/components/ui/Breadcrumb';
import { Button }       from '@/components/ui/Button';
import { Badge }        from '@/components/ui/Badge';
import { EmptyState }   from '@/components/ui/EmptyState';
import { ProductCard }  from '@/components/ui/ProductCard';
import { toast }        from '@/components/ui/Toast';
import { PRODUCTS }     from '@/lib/data/products';
import { formatINR, calculateDiscount, getStockStatus } from '@/utils/format';
import type { Product } from '@/types';

// ─── Mock Wishlist Data ───────────────────────────────────────────────────────
// Pre-populate with a diverse selection of products
const MOCK_WISHLIST_IDS = [
  'ard-001', 'rpi-001', 'esp-001', 'sen-001',
  'dsp-001', 'mot-001', 'rob-001', 'pwr-001',
];

function getInitialWishlist(): Product[] {
  const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
  return MOCK_WISHLIST_IDS
    .map((id) => byId.get(id))
    .filter(Boolean) as Product[];
}

// ─── Star Rating (small inline) ───────────────────────────────────────────────
function MiniStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width={11}
          height={11}
          viewBox="0 0 24 24"
          className={s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-[var(--border-strong)] text-[var(--border-strong)]'}
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
      <span className="text-[10px] text-[var(--text-muted)] ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Wishlist Item Row (list view) ────────────────────────────────────────────
function WishlistRow({
  product,
  onRemove,
  onAddToCart,
}: {
  product: Product;
  onRemove: (id: string) => void;
  onAddToCart: (product: Product) => void;
}) {
  const [cartAdded, setCartAdded] = React.useState(false);
  const discount = calculateDiscount(product.originalPrice, product.sellingPrice);
  const stock = getStockStatus(product.stock);
  const img = product.images[0];

  const handleCart = () => {
    setCartAdded(true);
    onAddToCart(product);
    setTimeout(() => setCartAdded(false), 2000);
  };

  return (
    <div className={cn(
      'group flex gap-4 p-4 rounded-2xl',
      'bg-[var(--background-card)] border border-[var(--border)]',
      'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hov)]',
      'transition-shadow duration-200',
    )}>
      {/* Image */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-[var(--background-alt)]">
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

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">{product.brand}</p>
        <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-2 leading-snug">{product.name}</h3>
        <MiniStars rating={product.rating} />
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className="text-base font-bold text-[var(--text)]">{formatINR(product.sellingPrice)}</span>
          {product.originalPrice > product.sellingPrice && (
            <span className="text-sm text-[var(--text-subtle)] line-through">{formatINR(product.originalPrice)}</span>
          )}
        </div>
        <span className={cn(
          'text-xs font-medium',
          stock.variant === 'success' ? 'text-[var(--success)]' :
          stock.variant === 'warning' ? 'text-[var(--warning)]' : 'text-[var(--danger)]',
        )}>
          {stock.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 shrink-0 justify-center">
        <Button
          variant={cartAdded ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleCart}
          disabled={product.stock <= 0}
          leftIcon={<ShoppingCart size={14} />}
          className="whitespace-nowrap"
          aria-label={`Add ${product.name} to cart`}
        >
          {cartAdded ? '✓ Added' : 'Add to Cart'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(product.id)}
          leftIcon={<Trash2 size={14} />}
          className="text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-950/20"
          aria-label={`Remove ${product.name} from wishlist`}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

// ─── Main Wishlist Page ────────────────────────────────────────────────────────
export function WishlistPage() {
  const [items, setItems] = React.useState<Product[]>(getInitialWishlist);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
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
      if (product) toast.removedFromWishlist(product.name);
    }, 300);
  };

  const handleAddToCart = (product: Product) => {
    toast.addedToCart(product.name);
  };

  const handleWishlistToggle = (product: Product) => {
    // If already in wishlist, remove it
    handleRemove(product.id);
  };

  const handleClearAll = () => {
    setItems([]);
    toast.info('Wishlist cleared');
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'My Wishlist', current: true },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Page container ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} showHome className="mb-6" />

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-500/10 border border-pink-500/20">
              <Heart size={22} className="text-pink-500 fill-pink-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)]">
                My Wishlist
              </h1>
              {items.length > 0 && (
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  {items.length} {items.length === 1 ? 'item' : 'items'} saved
                </p>
              )}
            </div>
            {items.length > 0 && (
              <Badge variant="primary" size="md" className="ml-1 self-start mt-1">
                {items.length}
              </Badge>
            )}
          </div>

          {/* Controls */}
          {items.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* View toggle */}
              <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5 gap-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md transition-all',
                    viewMode === 'grid'
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]',
                  )}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md transition-all',
                    viewMode === 'list'
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]',
                  )}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <List size={14} />
                </button>
              </div>

              {/* Clear all */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                leftIcon={<Trash2 size={14} />}
                className="text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-950/20"
                aria-label="Clear all wishlist items"
              >
                Clear All
              </Button>

              {/* Continue shopping */}
              <a
                href="/shop"
                className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-md border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200"
              >
                Shop More <ArrowRight size={14} />
              </a>
            </div>
          )}
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {items.length === 0 ? (
          /* Empty state */
          <EmptyState
            preset="empty-wishlist"
            title="Your Wishlist is Empty"
            description="Start exploring our electronics collection and save items you love by clicking the heart icon on any product."
            actions={[
              { label: 'Continue Shopping', onClick: () => { window.location.href = '/shop'; }, variant: 'primary' },
              { label: 'Browse Categories', onClick: () => { window.location.href = '/categories'; }, variant: 'outline' },
            ]}
            size="lg"
          />
        ) : viewMode === 'grid' ? (
          /* ── Grid view ─────────────────────────────────────────────────── */
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
            >
              {items.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: removingIds.has(product.id) ? 0 : 1, scale: removingIds.has(product.id) ? 0.88 : 1 }}
                  exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ProductCard
                    product={product}
                    variant="default"
                    isWishlisted={true}
                    onWishlist={handleWishlistToggle}
                    onAddToCart={handleAddToCart}
                    showCompare={false}
                    showQuickView={true}
                    onQuickView={(p) => toast.info(`Viewing ${p.name}`)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          /* ── List view ─────────────────────────────────────────────────── */
          <AnimatePresence mode="popLayout">
            <motion.div layout className="flex flex-col gap-3">
              {items.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: removingIds.has(product.id) ? 0 : 1, x: removingIds.has(product.id) ? 16 : 0 }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <WishlistRow
                    product={product}
                    onRemove={handleRemove}
                    onAddToCart={handleAddToCart}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Bottom CTA (when items exist) ───────────────────────────────── */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              'mt-10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4',
              'bg-gradient-to-r from-blue-500/5 to-violet-500/5',
              'border border-[var(--border)]',
            )}
          >
            <div>
              <p className="font-semibold text-[var(--text)]">
                Ready to buy? Move all items to cart
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {items.filter((p) => p.stock > 0).length} of {items.length} items in stock
              </p>
            </div>
            <Button
              variant="gradient"
              size="lg"
              leftIcon={<ShoppingCart size={18} />}
              onClick={() => {
                items.filter((p) => p.stock > 0).forEach((p) => handleAddToCart(p));
                toast.success(`${items.filter((p) => p.stock > 0).length} items added to cart!`);
              }}
            >
              Add All to Cart
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
