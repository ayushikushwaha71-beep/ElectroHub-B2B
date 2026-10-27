/**
 * ElectroHub — Format Utilities
 * Currency, number, date, and text formatting helpers.
 */

// ─── Currency ──────────────────────────────────────────────────────────────────
export function formatCurrency(
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatINR(amount: number): string {
  return formatCurrency(amount, 'INR', 'en-IN');
}

export function formatUSD(amount: number): string {
  return formatCurrency(amount, 'USD', 'en-US');
}

// ─── Numbers ───────────────────────────────────────────────────────────────────
export function formatNumber(n: number, locale: string = 'en-IN'): string {
  return new Intl.NumberFormat(locale).format(n);
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatPercent(n: number, decimals: number = 0): string {
  return `${n.toFixed(decimals)}%`;
}

// ─── Discount ──────────────────────────────────────────────────────────────────
export function calculateDiscount(original: number, selling: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - selling) / original) * 100);
}

export function formatDiscount(original: number, selling: number): string {
  return `${calculateDiscount(original, selling)}% off`;
}

export function formatSavings(original: number, selling: number): string {
  return `Save ${formatINR(original - selling)}`;
}

// ─── Dates ─────────────────────────────────────────────────────────────────────
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
  locale: string = 'en-IN'
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const d   = new Date(date);
  const diffMs  = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffMo  = Math.floor(diffDay / 30);
  const diffYr  = Math.floor(diffMo / 12);

  if (diffSec < 60)   return 'just now';
  if (diffMin < 60)   return `${diffMin}m ago`;
  if (diffHr  < 24)   return `${diffHr}h ago`;
  if (diffDay < 30)   return `${diffDay}d ago`;
  if (diffMo  < 12)   return `${diffMo}mo ago`;
  return `${diffYr}y ago`;
}

export function formatOrderDate(date: Date | string | number): string {
  return formatDate(date, { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Strings ───────────────────────────────────────────────────────────────────
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  return str.split(' ').map(capitalize).join(' ');
}

export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatSKU(sku: string): string {
  return sku.toUpperCase();
}

// ─── Ratings ───────────────────────────────────────────────────────────────────
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatReviewCount(count: number): string {
  if (count === 0) return 'No reviews';
  if (count === 1) return '1 review';
  return `${formatCompact(count)} reviews`;
}

// ─── Stock ─────────────────────────────────────────────────────────────────────
export function getStockStatus(stock: number): {
  label: string;
  variant: 'success' | 'warning' | 'danger';
} {
  if (stock <= 0)   return { label: 'Out of Stock',   variant: 'danger'  };
  if (stock <= 5)   return { label: `Only ${stock} left`,  variant: 'warning' };
  if (stock <= 20)  return { label: 'Limited Stock',  variant: 'warning' };
  return                   { label: 'In Stock',        variant: 'success' };
}

export function formatStock(stock: number): string {
  return getStockStatus(stock).label;
}

// ─── File sizes ────────────────────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
