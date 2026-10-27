'use client';

import * as React from 'react';
import type { Product } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  product:     Product;
  quantity:    number;
  vendorId?:   string;
  vendorName?: string;
}

interface CartContextValue {
  items:       CartItem[];
  totalItems:  number;
  subtotal:    number;
  shipping:    number;
  total:       number;
  addItem:     (product: Product, qty?: number) => void;
  removeItem:  (productId: string) => void;
  updateQty:   (productId: string, qty: number) => void;
  clearCart:   () => void;
  isInCart:    (productId: string) => boolean;
  getQty:      (productId: string) => number;
}

// ─── Context ───────────────────────────────────────────────────────────────────
const CartContext = React.createContext<CartContextValue | null>(null);

const STORAGE_KEY            = 'electrohub_cart';
const FREE_SHIPPING_THRESHOLD = 499;
const FLAT_SHIPPING           = 49;

function loadFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validate shape — filter out malformed entries
    return parsed.filter(
      (item: unknown) =>
        typeof item === 'object' &&
        item !== null &&
        'product' in item &&
        'quantity' in item &&
        typeof (item as CartItem).quantity === 'number',
    ) as CartItem[];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items,    setItems]    = React.useState<CartItem[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate from localStorage on mount — no mock seed
  React.useEffect(() => {
    setItems(loadFromStorage());
    setHydrated(true);
  }, []);

  // Persist to localStorage on change (skip first render)
  React.useEffect(() => {
    if (hydrated) saveToStorage(items);
  }, [items, hydrated]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const addItem = React.useCallback((product: Product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, product.stock, 10);
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: newQty } : i,
        );
      }
      // Use vendor info from the product object (from real API)
      return [...prev, {
        product,
        quantity:   Math.min(qty, product.stock, 10),
        vendorId:   product.vendorId,
        vendorName: product.vendorName,
      }];
    });
  }, []);

  const removeItem = React.useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQty = React.useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i;
        const capped = Math.min(qty, i.product.stock, 10);
        return { ...i, quantity: capped };
      }),
    );
  }, []);

  const clearCart = React.useCallback(() => setItems([]), []);

  const isInCart = React.useCallback(
    (productId: string) => items.some((i) => i.product.id === productId),
    [items],
  );

  const getQty = React.useCallback(
    (productId: string) =>
      items.find((i) => i.product.id === productId)?.quantity ?? 0,
    [items],
  );

  // ── Derived totals ───────────────────────────────────────────────────────────
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal   = items.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);
  const shipping   = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const total      = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        shipping,
        total,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        isInCart,
        getQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
