'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Heart,
  GitCompare,
  Share2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types';
import { useCart } from '@/lib/providers/CartProvider';

// ─── Quantity Selector ────────────────────────────────────────────────────────
function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
}: {
  value:    number;
  onChange: (val: number) => void;
  min?:     number;
  max?:     number;
  disabled?: boolean;
}) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.target.value, 10);
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl border border-[var(--border)]',
        'bg-[var(--background-card)] overflow-hidden',
        disabled && 'opacity-50 pointer-events-none'
      )}
      role="group"
      aria-label="Quantity selector"
    >
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        className={cn(
          'flex h-11 w-11 items-center justify-center shrink-0',
          'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
          'transition-colors border-r border-[var(--border)]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>

      <input
        type="number"
        value={value}
        onChange={handleInput}
        min={min}
        max={max}
        disabled={disabled}
        className={cn(
          'w-14 h-11 text-center text-base font-semibold text-[var(--text)]',
          'bg-transparent border-none outline-none',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none',
          '[&::-webkit-inner-spin-button]:appearance-none',
        )}
        aria-label="Quantity"
      />

      <button
        type="button"
        onClick={increment}
        disabled={disabled || value >= max}
        className={cn(
          'flex h-11 w-11 items-center justify-center shrink-0',
          'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
          'transition-colors border-l border-[var(--border)]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PurchaseSectionProps {
  product:     Product;
  className?:  string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PurchaseSection({ product, className }: PurchaseSectionProps) {
  const { addItem } = useCart();
  const [quantity,   setQuantity]   = React.useState(1);
  const [wishlisted, setWishlisted] = React.useState(false);
  const [compared,   setCompared]   = React.useState(false);
  const [cartState,  setCartState]  = React.useState<'idle' | 'adding' | 'added'>('idle');
  const [shared,     setShared]     = React.useState(false);

  const outOfStock = product.stock <= 0;
  const maxQty     = Math.min(product.stock, 10);

  const handleAddToCart = () => {
    if (outOfStock || cartState !== 'idle') return;
    setCartState('adding');
    addItem(product, quantity);
    setTimeout(() => {
      setCartState('added');
      setTimeout(() => setCartState('idle'), 2500);
    }, 600);
  };

  const handleBuyNow = () => {
    // UI only — no checkout
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: product.name, url: window.location.href });
    } catch {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0, 0, 0.2, 1] }}
      className={cn(
        'flex flex-col gap-5 p-5 rounded-2xl',
        'border border-[var(--border)] bg-[var(--background-card)]',
        'shadow-[var(--shadow-card)]',
        className
      )}
    >
      {/* Quantity */}
      <div className="flex items-center gap-4 flex-wrap">
        <label className="text-sm font-medium text-[var(--text)] shrink-0">Quantity:</label>
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={outOfStock ? 0 : maxQty}
          disabled={outOfStock}
        />
        {!outOfStock && maxQty < 10 && (
          <span className="text-xs text-[var(--warning)]">Max {maxQty} per order</span>
        )}
      </div>

      {/* Primary actions */}
      <div className="flex flex-col gap-3">
        {/* Add to Cart */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            id="add-to-cart-btn"
            variant={cartState === 'added' ? 'secondary' : 'outline'}
            size="lg"
            fullWidth
            disabled={outOfStock}
            onClick={handleAddToCart}
            isLoading={cartState === 'adding'}
            loadingText="Adding…"
            leftIcon={cartState === 'added' ? undefined : <ShoppingCart size={18} />}
            aria-label="Add to cart"
          >
            <AnimatePresence mode="wait">
              {cartState === 'added' ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="flex items-center gap-2"
                >
                  ✓ Added to Cart
                </motion.span>
              ) : cartState !== 'adding' ? (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  Add to Cart
                </motion.span>
              ) : null}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Buy Now */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            id="buy-now-btn"
            variant="gradient"
            size="lg"
            fullWidth
            disabled={outOfStock}
            onClick={handleBuyNow}
            leftIcon={<Zap size={18} />}
            aria-label="Buy now"
          >
            Buy Now
          </Button>
        </motion.div>
      </div>

      {/* Secondary actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
        <button
          onClick={() => setWishlisted((w) => !w)}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium',
            'border border-[var(--border)] transition-all duration-200',
            wishlisted
              ? 'text-red-500 border-red-200 bg-red-50 dark:bg-red-950/30'
              : 'text-[var(--text-muted)] hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20'
          )}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={wishlisted}
        >
          <Heart size={15} className={wishlisted ? 'fill-current' : ''} />
          {wishlisted ? 'Wishlisted' : 'Wishlist'}
        </button>

        <button
          onClick={() => setCompared((c) => !c)}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium',
            'border border-[var(--border)] transition-all duration-200',
            compared
              ? 'text-[var(--primary)] border-[var(--primary)] bg-blue-50 dark:bg-blue-950/30'
              : 'text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]',
          )}
          aria-label={compared ? 'Remove from compare' : 'Add to compare'}
          aria-pressed={compared}
        >
          <GitCompare size={15} />
          {compared ? 'Comparing' : 'Compare'}
        </button>

        <button
          onClick={handleShare}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            'border border-[var(--border)] transition-all duration-200',
            shared
              ? 'text-[var(--success)] border-[var(--success)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)]',
          )}
          aria-label="Share product"
        >
          <Share2 size={15} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Sticky Mobile Bar ────────────────────────────────────────────────────────
export function StickyMobilePurchaseBar({ product }: { product: Product }) {
  const [cartState, setCartState] = React.useState<'idle' | 'adding' | 'added'>('idle');
  const outOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (outOfStock || cartState !== 'idle') return;
    setCartState('adding');
    setTimeout(() => {
      setCartState('added');
      setTimeout(() => setCartState('idle'), 2000);
    }, 500);
  };

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden',
        'bg-[var(--background-card)]/95 backdrop-blur-md',
        'border-t border-[var(--border)] px-4 py-3',
        'safe-area-pb',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--text-muted)] truncate">{product.name}</p>
          <p className="text-lg font-bold text-[var(--text)]">
            ₹{product.sellingPrice.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant={cartState === 'added' ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleAddToCart}
            disabled={outOfStock}
            isLoading={cartState === 'adding'}
            leftIcon={<ShoppingCart size={14} />}
          >
            {cartState === 'added' ? '✓ Added' : 'Cart'}
          </Button>
          <Button
            variant="gradient"
            size="sm"
            disabled={outOfStock}
            leftIcon={<Zap size={14} />}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
