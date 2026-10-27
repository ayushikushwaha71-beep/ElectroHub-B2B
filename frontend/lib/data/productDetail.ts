/**
 * ElectroHub — Product Detail Mock Data
 * Extended data for the /product/[slug] page.
 * Isolated from PRODUCTS array for easy API replacement.
 */

import type { Review, RatingSummary } from '@/types';
import { PRODUCTS } from './products';

// ─── Slug → Product Map ────────────────────────────────────────────────────────
export function getProductBySlug(slug: string) {
  // Slug format: {id} or slugified name. Try ID match first, then name match.
  const byId = PRODUCTS.find((p) => p.id === slug);
  if (byId) return byId;

  // Try slug match by converting product name to slug
  return PRODUCTS.find(
    (p) => p.id.replace(/-/g, '') === slug.replace(/-/g, '') ||
      p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === slug
  ) ?? null;
}

// ─── All slugs for generateStaticParams ───────────────────────────────────────
export function getAllProductSlugs(): string[] {
  return PRODUCTS.map((p) => p.id);
}

// ─── Mock Reviews ──────────────────────────────────────────────────────────────
export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-001',
    productId: 'ard-001',
    userId: 'usr-001',
    userName: 'Arjun Sharma',
    rating: 5,
    title: 'Absolute beast of a board!',
    content:
      'The Arduino UNO R4 WiFi is a massive upgrade from the older R3. The built-in WiFi via ESP32-S3 works flawlessly and the LED matrix is just great for quick visual feedback. Setup was smooth and the community support is excellent.',
    pros: ['Built-in WiFi is a game changer', 'USB-C finally!', 'LED matrix is fun'],
    cons: ['Slightly pricier than R3'],
    verified: true,
    helpful: 47,
    createdAt: '2024-06-15T08:30:00Z',
  },
  {
    id: 'rev-002',
    productId: 'ard-001',
    userId: 'usr-002',
    userName: 'Priya Nair',
    rating: 5,
    title: 'Perfect for IoT projects',
    content:
      'Been using this for a home automation project and the WiFi connectivity is rock solid. The Cortex-M4 is way faster than the classic ATmega328P. Documentation from Arduino is excellent.',
    pros: ['Fast processor', 'Stable WiFi', 'Good documentation'],
    cons: ['Limited library support for some peripherals initially'],
    verified: true,
    helpful: 32,
    createdAt: '2024-07-02T14:20:00Z',
  },
  {
    id: 'rev-003',
    productId: 'ard-001',
    userId: 'usr-003',
    userName: 'Rohit Mehta',
    rating: 4,
    title: 'Great board, minor quirks',
    content:
      'Overall impressed with the R4 WiFi. The LED matrix takes some getting used to programming, but the examples help a lot. WiFi is easy to configure. Deducting one star because the board gets a little warm under load.',
    pros: ['LED matrix is unique', 'Easy WiFi setup'],
    cons: ['Runs warm under load', 'LED matrix library is basic'],
    verified: false,
    helpful: 18,
    createdAt: '2024-05-28T10:00:00Z',
  },
  {
    id: 'rev-004',
    productId: 'ard-001',
    userId: 'usr-004',
    userName: 'Sneha Kulkarni',
    rating: 5,
    title: "Best Arduino board I've owned",
    content:
      'The R4 WiFi is simply the best Arduino UNO form factor board ever released. Real-time clock, USB-C, WiFi, Bluetooth — everything I need for modern IoT projects without extra shields. Highly recommend!',
    pros: ['All-in-one features', 'No extra shields needed', 'USB-C charging'],
    cons: [],
    verified: true,
    helpful: 61,
    createdAt: '2024-04-10T09:15:00Z',
  },
  {
    id: 'rev-005',
    productId: 'ard-001',
    userId: 'usr-005',
    userName: 'Vivek Iyer',
    rating: 4,
    title: 'Solid upgrade for IoT makers',
    content:
      'Migrated my old UNO R3 project to the R4 WiFi. Most libraries are compatible, and the WiFi saved me from adding a separate module. Performance improvement is noticeable for signal processing tasks.',
    verified: false,
    helpful: 24,
    createdAt: '2024-03-20T16:45:00Z',
  },
  {
    id: 'rev-006',
    productId: 'ard-001',
    userId: 'usr-006',
    userName: 'Kavya Reddy',
    rating: 3,
    title: 'Good but has a learning curve',
    content:
      'The R4 WiFi is powerful but requires more time to set up than I expected. The RA4M1 MCU is different from ATmega and some older tutorials don\'t apply. Once you get the hang of it, it\'s quite capable though.',
    pros: ['Powerful MCU', 'WiFi built in'],
    cons: ['Steeper learning curve', 'Older tutorials not always applicable'],
    verified: true,
    helpful: 11,
    createdAt: '2024-02-05T12:00:00Z',
  },
];

// ─── Rating Summary (per product) ─────────────────────────────────────────────
export const MOCK_RATING_SUMMARY: RatingSummary = {
  average: 4.8,
  total: 342,
  distribution: {
    5: 248,
    4: 71,
    3: 17,
    2: 4,
    1: 2,
  },
};

// ─── Delivery Info ─────────────────────────────────────────────────────────────
export interface DeliveryInfo {
  standard: string;
  express: string;
  freeAbove: number;
  expressCharge: number;
  codAvailable: boolean;
  returnDays: number;
  warranty: string;
}

export const DEFAULT_DELIVERY_INFO: DeliveryInfo = {
  standard:      '3–5 business days',
  express:       '1–2 business days',
  freeAbove:     499,
  expressCharge: 99,
  codAvailable:  true,
  returnDays:    7,
  warranty:      '1 Year Manufacturer Warranty',
};

// ─── Related Products helper ───────────────────────────────────────────────────
export function getRelatedProducts(relatedIds: string[]) {
  return PRODUCTS.filter((p) => relatedIds.includes(p.id));
}

// ─── Recently Viewed (localStorage key) ───────────────────────────────────────
export const RECENTLY_VIEWED_KEY = 'eh_recently_viewed';
export const MAX_RECENTLY_VIEWED  = 8;

export function getRecentlyViewedProducts(currentProductId: string) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids
      .filter((id) => id !== currentProductId)
      .slice(0, MAX_RECENTLY_VIEWED)
      .map((id) => PRODUCTS.find((p) => p.id === id))
      .filter(Boolean) as typeof PRODUCTS;
  } catch {
    return [];
  }
}

export function trackRecentlyViewed(productId: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const updated = [productId, ...ids.filter((id) => id !== productId)].slice(
      0,
      MAX_RECENTLY_VIEWED
    );
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
