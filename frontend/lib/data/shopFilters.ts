/**
 * ElectroHub — Shop Filter & Sort Data
 * Derived from existing product data. Isolated for easy API replacement.
 */

import { PRODUCTS } from './products';

// ─── Sort Options ──────────────────────────────────────────────────────────────
export const SHOP_SORT_OPTIONS = [
  { value: 'featured',    label: 'Featured'           },
  { value: 'newest',      label: 'Newest First'       },
  { value: 'price-asc',   label: 'Price: Low to High' },
  { value: 'price-desc',  label: 'Price: High to Low' },
  { value: 'rating',      label: 'Top Rated'          },
  { value: 'bestseller',  label: 'Best Selling'       },
] as const;

export type ShopSortValue = typeof SHOP_SORT_OPTIONS[number]['value'];

// ─── Price Range ───────────────────────────────────────────────────────────────
export const PRICE_RANGE_MIN = 0;
export const PRICE_RANGE_MAX = 10000;

// ─── Derived filter options from product data ──────────────────────────────────
/** Unique categories derived from products */
export const SHOP_CATEGORIES = Array.from(
  new Set(PRODUCTS.map((p) => p.category))
).sort();

/** Unique brands derived from products */
export const SHOP_BRANDS = Array.from(
  new Set(PRODUCTS.map((p) => p.brand))
).sort();

/** Rating filter options */
export const RATING_OPTIONS = [4, 3, 2, 1] as const;

// ─── Filter State Type ─────────────────────────────────────────────────────────
export interface ShopFilters {
  categories:   string[];
  brands:       string[];
  priceMin:     number;
  priceMax:     number;
  minRating:    number;
  inStockOnly:  boolean;
  onSaleOnly:   boolean;
  featuredOnly: boolean;
}

export const DEFAULT_FILTERS: ShopFilters = {
  categories:   [],
  brands:       [],
  priceMin:     PRICE_RANGE_MIN,
  priceMax:     PRICE_RANGE_MAX,
  minRating:    0,
  inStockOnly:  false,
  onSaleOnly:   false,
  featuredOnly: false,
};

// ─── Count active filters ──────────────────────────────────────────────────────
export function countActiveFilters(filters: ShopFilters): number {
  let count = 0;
  if (filters.categories.length > 0)      count += filters.categories.length;
  if (filters.brands.length > 0)          count += filters.brands.length;
  if (filters.priceMin > PRICE_RANGE_MIN)  count++;
  if (filters.priceMax < PRICE_RANGE_MAX)  count++;
  if (filters.minRating > 0)               count++;
  if (filters.inStockOnly)                 count++;
  if (filters.onSaleOnly)                  count++;
  if (filters.featuredOnly)                count++;
  return count;
}
