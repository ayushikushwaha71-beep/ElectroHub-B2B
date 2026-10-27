'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Package,
  Truck,
  ShieldCheck,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Tag,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { formatINR, calculateDiscount, getStockStatus } from '@/utils/format';
import type { Product } from '@/types';
import type { DeliveryInfo } from '@/lib/data/productDetail';
import { getProductVendor } from '@/lib/data/mockVendors';

// ─── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({
  rating,
  count,
  size = 16,
}: {
  rating: number;
  count?: number;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-2">
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
      <span className="font-semibold text-[var(--text)]">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <a
          href="#reviews"
          className="text-sm text-[var(--primary)] hover:underline underline-offset-2"
        >
          ({count.toLocaleString('en-IN')} reviews)
        </a>
      )}
    </div>
  );
}

// ─── Stock Badge ───────────────────────────────────────────────────────────────
function StockBadge({ stock }: { stock: number }) {
  const status = getStockStatus(stock);
  const icon =
    status.variant === 'success' ? (
      <CheckCircle size={14} />
    ) : status.variant === 'warning' ? (
      <AlertTriangle size={14} />
    ) : (
      <XCircle size={14} />
    );

  const colorMap = {
    success: 'text-[var(--success)] bg-[var(--success-bg)] border-[var(--success)]/20',
    warning: 'text-[var(--warning)] bg-[var(--warning-bg)] border-[var(--warning)]/20',
    danger:  'text-[var(--danger)]  bg-[var(--danger-bg)]  border-[var(--danger)]/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium',
        colorMap[status.variant]
      )}
    >
      {icon}
      {status.label}
    </span>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProductInfoProps {
  product:      Product;
  delivery?:    DeliveryInfo;
  className?:   string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProductInfo({ product, delivery, className }: ProductInfoProps) {
  const discount = calculateDiscount(product.originalPrice, product.sellingPrice);
  const savings  = product.originalPrice - product.sellingPrice;
  const mappedVendor = getProductVendor(product.id);
  const vendor = { vendorId: product.vendorId ?? mappedVendor.vendorId, vendorName: product.vendorName ?? mappedVendor.vendorName, vendorRating: product.vendorRating ?? mappedVendor.vendorRating, vendorVerified: product.vendorVerified ?? mappedVendor.vendorVerified };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      className={cn('flex flex-col gap-5', className)}
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold uppercase tracking-widest text-[var(--primary)]">
          {product.brand}
        </span>
        {product.isFeatured  && <Badge variant="premium"    size="sm">⭐ Featured</Badge>}
        {product.isNew       && <Badge variant="new"        size="sm">New</Badge>}
        {product.isBestseller && <Badge variant="bestseller" size="sm">🔥 Bestseller</Badge>}
      </div>

      {/* Name */}
      <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)] leading-tight">
        {product.name}
      </h1>

      {/* SKU */}
      <p className="text-xs text-[var(--text-subtle)] font-mono flex items-center gap-1.5">
        <Tag size={11} />
        SKU: <span className="font-semibold">{product.sku}</span>
      </p>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background-alt)] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-subtle)]">Sold by</p>
          <a href={`/vendor/store/${vendor.vendorId}`} className="block truncate text-sm font-semibold text-[var(--text)] hover:text-[var(--primary)]">{vendor.vendorName}</a>
        </div>
        <div className="shrink-0 text-right text-xs">
          <p className="text-[var(--success)]">✓ Verified Vendor</p>
          <p className="text-amber-500">★ {vendor.vendorRating} Rating</p>
        </div>
      </div>

      {/* Rating */}
      <StarRating rating={product.rating} count={product.reviewCount} />

      {/* Divider */}
      <div className="section-divider" />

      {/* Short description */}
      <p className="text-[var(--text-muted)] leading-relaxed text-sm">
        {product.shortDescription}
      </p>

      {/* Price block */}
      <div className="flex flex-wrap items-end gap-3">
        <span className="text-4xl font-bold font-display text-[var(--text)]">
          {formatINR(product.sellingPrice)}
        </span>
        {product.originalPrice > product.sellingPrice && (
          <>
            <span className="text-xl text-[var(--text-subtle)] line-through">
              {formatINR(product.originalPrice)}
            </span>
            <div className="flex flex-col gap-1">
              <Badge variant="sale" size="sm">{discount}% OFF</Badge>
              <span className="text-xs text-[var(--success)] font-medium">
                You save {formatINR(savings)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Stock */}
      <div className="flex items-center gap-3 flex-wrap">
        <StockBadge stock={product.stock} />
        {product.stock > 0 && product.stock <= 20 && (
          <span className="text-xs text-[var(--warning)]">
            Hurry — only {product.stock} left!
          </span>
        )}
      </div>

      {/* Delivery info */}
      {delivery && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-alt)] p-4 flex flex-col gap-2.5">
          <div className="flex items-start gap-3">
            <Truck size={16} className="text-[var(--primary)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--text)]">
                Free delivery on orders above {formatINR(delivery.freeAbove)}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Standard: {delivery.standard} &nbsp;·&nbsp; Express ({formatINR(delivery.expressCharge)}): {delivery.express}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Package size={16} className="text-[var(--success)] mt-0.5 shrink-0" />
            <p className="text-sm text-[var(--text-muted)]">
              {delivery.codAvailable ? 'Cash on Delivery available' : 'Prepaid only'} &nbsp;·&nbsp;
              {delivery.returnDays}-day easy returns
            </p>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck size={16} className="text-[var(--primary)] mt-0.5 shrink-0" />
            <p className="text-sm text-[var(--text-muted)]">{delivery.warranty}</p>
          </div>
          {product.stock <= 5 && product.stock > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
              <RotateCcw size={14} className="text-[var(--warning)]" />
              <p className="text-xs text-[var(--warning)] font-medium">
                High demand — restocking soon if sold out
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
