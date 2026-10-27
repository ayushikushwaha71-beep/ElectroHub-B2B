/**
 * ElectroHub — Search Data & Logic
 * Isolated for future Django/API replacement.
 * No backend/API — pure in-memory filtering over PRODUCTS mock data.
 */

import { PRODUCTS } from './products';
import {
  ShopFilters,
  ShopSortValue,
  DEFAULT_FILTERS,
  PRICE_RANGE_MIN,
  PRICE_RANGE_MAX,
} from './shopFilters';
import type { Product } from '@/types';

// ─── Trending searches ─────────────────────────────────────────────────────────
export const TRENDING_SEARCHES: string[] = [
  'Arduino UNO R4',
  'Raspberry Pi 5',
  'ESP32',
  'Servo Motor',
  'Ultrasonic Sensor',
  'OLED Display',
  'Stepper Motor Driver',
  'DHT22 Temperature Sensor',
  'Li-Po Battery',
  '16x2 LCD',
];

// ─── Recent searches (static demo — production would use localStorage) ─────────
export const DEMO_RECENT_SEARCHES: string[] = [
  'Arduino starter kit',
  'ESP32 S3',
  'Raspberry Pi accessories',
];

// ─── Popular categories for empty-query state ──────────────────────────────────
export const POPULAR_SEARCH_CATEGORIES = [
  { label: 'Arduino',        href: '/shop?category=Arduino',        color: '#00979d', emoji: '🔵' },
  { label: 'Raspberry Pi',   href: '/shop?category=Raspberry Pi',   color: '#c51a4a', emoji: '🔴' },
  { label: 'ESP32',          href: '/shop?category=ESP32',          color: '#e74c3c', emoji: '📡' },
  { label: 'Sensors',        href: '/shop?category=Sensors',        color: '#3498db', emoji: '📟' },
  { label: 'Motors',         href: '/shop?category=Motors',         color: '#9b59b6', emoji: '⚙️' },
  { label: 'Displays',       href: '/shop?category=Displays',       color: '#27ae60', emoji: '🖥️' },
  { label: 'Power Modules',  href: '/shop?category=Power Modules',  color: '#f39c12', emoji: '⚡' },
  { label: 'Robotics Kits',  href: '/shop?category=Robotics Kits', color: '#1abc9c', emoji: '🤖' },
];

// ─── Text search — pure in-memory ─────────────────────────────────────────────
/**
 * Returns products that match the query string.
 * Matches: name, brand, category, shortDescription, tags, SKU (case-insensitive).
 * Returns relevance-sorted results (most matching tokens first).
 */
export function searchProducts(query: string): Product[] {
  const raw = query.trim().toLowerCase();
  if (!raw) return [];

  const tokens = raw.split(/\s+/).filter(Boolean);

  const scored = PRODUCTS.map((p) => {
    const haystack = [
      p.name,
      p.brand,
      p.category,
      p.shortDescription,
      p.sku,
      ...(p.tags ?? []),
    ]
      .join(' ')
      .toLowerCase();

    // Count how many query tokens appear in the haystack
    const matchCount = tokens.filter((t) => haystack.includes(t)).length;
    // Boost exact name matches
    const exactBoost = p.name.toLowerCase().includes(raw) ? 3 : 0;
    // Boost brand matches
    const brandBoost = p.brand.toLowerCase().includes(raw) ? 2 : 0;
    const score = matchCount + exactBoost + brandBoost;

    return { product: p, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);
}

// ─── Apply filters on top of search results ───────────────────────────────────
export function applySearchFilters(
  products: Product[],
  filters: ShopFilters
): Product[] {
  return products.filter((p) => {
    if (filters.categories.length > 0 && !filters.categories.includes(p.category)) return false;
    if (filters.brands.length > 0     && !filters.brands.includes(p.brand))        return false;
    if (p.sellingPrice < filters.priceMin || p.sellingPrice > filters.priceMax)     return false;
    if (filters.minRating > 0          && p.rating < filters.minRating)             return false;
    if (filters.inStockOnly            && p.stock <= 0)                              return false;
    if (filters.onSaleOnly             && p.sellingPrice >= p.originalPrice)         return false;
    if (filters.featuredOnly           && !p.isFeatured)                             return false;
    return true;
  });
}

// ─── Apply sort ────────────────────────────────────────────────────────────────
export function applySearchSort(
  products: Product[],
  sort: ShopSortValue
): Product[] {
  const arr = [...products];
  switch (sort) {
    case 'featured':   return arr.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    case 'newest':     return arr.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    case 'price-asc':  return arr.sort((a, b) => a.sellingPrice - b.sellingPrice);
    case 'price-desc': return arr.sort((a, b) => b.sellingPrice - a.sellingPrice);
    case 'rating':     return arr.sort((a, b) => b.rating - a.rating);
    case 'bestseller': return arr.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
    default:           return arr; // relevance — keep original search score order
  }
}

// ─── Category counts (filtered results) ───────────────────────────────────────
export function buildSearchCategoryCounts(
  products: Product[]
): Record<string, number> {
  return products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
}

// ─── Re-export defaults for convenience ───────────────────────────────────────
export { DEFAULT_FILTERS, PRICE_RANGE_MIN, PRICE_RANGE_MAX };
export type { ShopFilters, ShopSortValue };
