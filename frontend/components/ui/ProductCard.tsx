'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  Star,
  Zap,
  Eye,
  GitCompare,
  Package,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from './Badge';
import { Button } from './Button';
import type { Product } from '@/types';
import { formatINR, calculateDiscount, getStockStatus } from '@/utils/format';
import { getProductVendor } from '@/lib/data/mockVendors';
import { useCart } from '@/lib/providers/CartProvider';

// ─── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ rating, count, size = 14 }: { rating: number; count?: number; size?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={cn(
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-[var(--border-strong)] text-[var(--border-strong)]'
            )}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-[var(--text-muted)]">({count.toLocaleString('en-IN')})</span>
      )}
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ProductCardProps {
  product:          Product;
  variant?:         'default' | 'compact' | 'horizontal' | 'featured';
  isWishlisted?:    boolean;
  onAddToCart?:     (product: Product) => void;
  onBuyNow?:        (product: Product) => void;
  onWishlist?:      (product: Product) => void;
  onQuickView?:     (product: Product) => void;
  onCompare?:       (product: Product) => void;
  className?:       string;
  isLoading?:       boolean;
  showCompare?:     boolean;
  showQuickView?:   boolean;
  priority?:        boolean;  // Image loading priority
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProductCard({
  product,
  variant       = 'default',
  isWishlisted  = false,
  onAddToCart,
  onBuyNow,
  onWishlist,
  onQuickView,
  onCompare,
  className,
  isLoading     = false,
  showCompare   = true,
  showQuickView = true,
  priority      = false,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [wishlisted,    setWishlisted]    = React.useState(isWishlisted);
  const [cartAdded,     setCartAdded]     = React.useState(false);
  const [isHovered,     setIsHovered]     = React.useState(false);
  const [currentImage,  setCurrentImage]  = React.useState(0);

  const discount = calculateDiscount(product.originalPrice, product.sellingPrice);
  const stockStatus = getStockStatus(product.stock);
  const primaryImage = product.images[currentImage] ?? product.images[0];
  const mappedVendor = getProductVendor(product.id);
  const vendor = { vendorName: product.vendorName ?? mappedVendor.vendorName, vendorRating: product.vendorRating ?? mappedVendor.vendorRating, vendorVerified: product.vendorVerified ?? mappedVendor.vendorVerified };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
    onWishlist?.(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCartAdded(true);
    onAddToCart?.(product);
    if (!onAddToCart) addItem(product);
    setTimeout(() => setCartAdded(false), 2000);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBuyNow?.(product);
  };

  // ── Compact variant ──────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <motion.article
        whileHover={{ y: -2 }}
        className={cn(
          'group relative flex flex-col',
          'bg-[var(--background-card)] border border-[var(--border)] rounded-xl',
          'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hov)]',
          'transition-shadow duration-200 overflow-hidden cursor-pointer',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-[var(--background-alt)]">
          <img
            src={primaryImage?.url ?? '/placeholder.png'}
            alt={primaryImage?.alt ?? product.name}
            className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            loading={priority ? 'eager' : 'lazy'}
          />
          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className={cn(
              'absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg',
              'bg-[var(--background-card)]/80 backdrop-blur-sm border border-[var(--border)]',
              'transition-all',
              wishlisted ? 'text-red-500' : 'text-[var(--text-muted)] hover:text-red-500',
            )}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={14} className={wishlisted ? 'fill-current' : ''} />
          </button>
          {/* Badges */}
          {(discount > 0 || product.isNew || product.isBestseller) && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {discount > 0  && <Badge variant="sale"       size="xs">{discount}% off</Badge>}
              {product.isNew && <Badge variant="new"        size="xs">New</Badge>}
              {product.isBestseller && <Badge variant="bestseller" size="xs">🔥</Badge>}
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-3 flex flex-col gap-1.5">
          <p className="text-xs text-[var(--primary)] font-medium">{product.brand}</p>
          <h3 className="text-sm font-medium text-[var(--text)] line-clamp-2 leading-snug">
            {product.name}
          </h3>
          <StarRating rating={product.rating} size={12} />
          <p className="truncate text-[10px] text-[var(--text-muted)]">Sold by {vendor.vendorName} · <span className="text-[var(--success)]">✓ Verified</span></p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-bold text-[var(--text)]">{formatINR(product.sellingPrice)}</span>
            {product.originalPrice > product.sellingPrice && (
              <span className="text-xs text-[var(--text-subtle)] line-through">
                {formatINR(product.originalPrice)}
              </span>
            )}
          </div>
          <Button
            variant={cartAdded ? 'secondary' : 'primary'}
            size="sm"
            fullWidth
            onClick={handleAddToCart}
            leftIcon={<ShoppingCart size={13} />}
            className="mt-1"
          >
            {cartAdded ? 'Added!' : 'Add to Cart'}
          </Button>
        </div>
      </motion.article>
    );
  }

  // ── Horizontal variant ───────────────────────────────────────────────────────
  if (variant === 'horizontal') {
    return (
      <motion.article
        whileHover={{ y: -1 }}
        className={cn(
          'group relative flex gap-4',
          'bg-[var(--background-card)] border border-[var(--border)] rounded-xl',
          'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hov)]',
          'p-4 transition-shadow duration-200 overflow-hidden cursor-pointer',
          className
        )}
      >
        {/* Image */}
        <div className="relative w-28 h-28 shrink-0 rounded-lg overflow-hidden bg-[var(--background-alt)]">
          <img
            src={primaryImage?.url ?? '/placeholder.png'}
            alt={primaryImage?.alt ?? product.name}
            className="w-full h-full object-contain p-2"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          <p className="text-xs text-[var(--primary)] font-medium">{product.brand}</p>
          <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-2">{product.name}</h3>
          <StarRating rating={product.rating} count={product.reviewCount} size={12} />
          <div className="flex items-center gap-2 mt-auto">
            <span className="font-bold text-[var(--text)]">{formatINR(product.sellingPrice)}</span>
            {product.originalPrice > product.sellingPrice && (
              <>
                <span className="text-sm text-[var(--text-subtle)] line-through">{formatINR(product.originalPrice)}</span>
                <Badge variant="sale" size="xs">{discount}% off</Badge>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          <button onClick={handleWishlist} className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'border border-[var(--border)] hover:border-red-300',
            'transition-colors',
            wishlisted ? 'text-red-500' : 'text-[var(--text-muted)]',
          )}>
            <Heart size={15} className={wishlisted ? 'fill-current' : ''} />
          </button>
          <Button variant="primary" size="sm" onClick={handleAddToCart} className="whitespace-nowrap">
            {cartAdded ? '✓ Added' : 'Add to Cart'}
          </Button>
        </div>
      </motion.article>
    );
  }

  // ── Default variant ───────────────────────────────────────────────────────────
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        'group relative flex flex-col',
        'bg-[var(--background-card)] border border-[var(--border)] rounded-2xl',
        'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hov)]',
        'transition-shadow duration-200 overflow-hidden cursor-pointer',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Image section ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[var(--background-alt)] rounded-t-2xl">
        <div className="aspect-square p-4">
          <img
            src={primaryImage?.url ?? '/placeholder.png'}
            alt={primaryImage?.alt ?? product.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-108"
            loading={priority ? 'eager' : 'lazy'}
            style={{ transform: isHovered ? 'scale(1.06)' : 'scale(1)' }}
          />
        </div>

        {/* Overlay actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-3 left-3 right-3 flex gap-2"
        >
          {showQuickView && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView?.(product); }}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 h-8',
                'bg-[var(--background-card)]/90 backdrop-blur-sm',
                'border border-[var(--border)] rounded-lg',
                'text-xs font-medium text-[var(--text)]',
                'hover:bg-[var(--primary)] hover:text-white hover:border-transparent',
                'transition-all',
              )}
            >
              <Eye size={13} /> Quick View
            </button>
          )}
          {showCompare && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCompare?.(product); }}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                'bg-[var(--background-card)]/90 backdrop-blur-sm',
                'border border-[var(--border)]',
                'text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]',
                'transition-all',
              )}
              aria-label="Compare"
            >
              <GitCompare size={13} />
            </button>
          )}
        </motion.div>

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0     && <Badge variant="sale"       size="sm">{discount}% off</Badge>}
          {product.isNew    && <Badge variant="new"        size="sm">New</Badge>}
          {product.isBestseller && <Badge variant="bestseller" size="sm">🔥 Bestseller</Badge>}
          {product.isFeatured   && <Badge variant="premium"    size="sm">⭐ Featured</Badge>}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={cn(
            'absolute top-3 right-3',
            'flex h-8 w-8 items-center justify-center rounded-xl',
            'bg-[var(--background-card)]/80 backdrop-blur-sm',
            'border border-[var(--border)]',
            'transition-all duration-200',
            wishlisted
              ? 'text-red-500 border-red-200 bg-red-50 dark:bg-red-950/30'
              : 'text-[var(--text-muted)] hover:text-red-500 hover:border-red-200',
          )}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
        >
          <motion.div
            animate={wishlisted ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Heart size={15} className={wishlisted ? 'fill-current' : ''} />
          </motion.div>
        </button>

        {/* Image thumbnails (multiple images) */}
        {product.images.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1">
            {product.images.slice(0, 4).map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentImage(idx); }}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  idx === currentImage
                    ? 'bg-[var(--primary)] scale-125'
                    : 'bg-[var(--border-strong)] hover:bg-[var(--text-muted)]'
                )}
                aria-label={`Image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Info section ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 gap-2.5 p-4">
        {/* Brand + SKU */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
            {product.brand}
          </span>
          <span className="text-[10px] text-[var(--text-subtle)] font-mono">
            {product.sku}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Short description */}
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
          {product.shortDescription}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <StarRating rating={product.rating} size={13} />
          <span className="text-xs text-[var(--text-muted)]">
            ({product.reviewCount.toLocaleString('en-IN')})
          </span>
        </div>

        <p className="flex items-center gap-1 truncate text-xs text-[var(--text-muted)]">
          <span>Sold by {vendor.vendorName}</span>
          {vendor.vendorVerified && <span className="text-[var(--success)]">✓ Verified</span>}
          <span className="text-amber-500">★ {vendor.vendorRating}</span>
        </p>

        {/* Price */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xl font-bold font-display text-[var(--text)]">
            {formatINR(product.sellingPrice)}
          </span>
          {product.originalPrice > product.sellingPrice && (
            <>
              <span className="text-sm text-[var(--text-subtle)] line-through">
                {formatINR(product.originalPrice)}
              </span>
              <Badge variant="success" size="sm">
                Save {formatINR(product.originalPrice - product.sellingPrice)}
              </Badge>
            </>
          )}
        </div>

        {/* Stock */}
        <div className="flex items-center gap-1.5">
          <Package
            size={12}
            className={cn(
              stockStatus.variant === 'success' ? 'text-[var(--success)]' :
              stockStatus.variant === 'warning' ? 'text-[var(--warning)]' :
              'text-[var(--danger)]'
            )}
          />
          <span className={cn(
            'text-xs font-medium',
            stockStatus.variant === 'success' ? 'text-[var(--success)]' :
            stockStatus.variant === 'warning' ? 'text-[var(--warning)]' :
            'text-[var(--danger)]'
          )}>
            {stockStatus.label}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <Button
            variant={cartAdded ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            leftIcon={<ShoppingCart size={14} />}
            className="flex-1"
          >
            {cartAdded ? '✓ Added' : 'Cart'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleBuyNow}
            disabled={product.stock <= 0}
            leftIcon={<Zap size={14} />}
            className="flex-1"
          >
            Buy Now
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Export StarRating too ─────────────────────────────────────────────────────
export { StarRating };
