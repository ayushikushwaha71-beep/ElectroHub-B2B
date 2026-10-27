'use client';

/**
 * ElectroHub Toast System
 * Wraps Sonner's toast with pre-configured ElectroHub branded helpers.
 */

import { toast as sonnerToast, type ExternalToast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ShoppingCart,
  Heart,
  Package,
  Loader2,
} from 'lucide-react';

type ToastOptions = ExternalToast & { duration?: number };

// ─── Branded toast helpers ─────────────────────────────────────────────────────

export const toast = {
  // Base passthrough
  ...sonnerToast,

  /** ✅ Success */
  success(message: string, options?: ToastOptions) {
    return sonnerToast.success(message, {
      duration: 4000,
      ...options,
    });
  },

  /** ❌ Error */
  error(message: string, options?: ToastOptions) {
    return sonnerToast.error(message, {
      duration: 5000,
      ...options,
    });
  },

  /** ⚠️ Warning */
  warning(message: string, options?: ToastOptions) {
    return sonnerToast.warning(message, {
      duration: 4500,
      ...options,
    });
  },

  /** ℹ️ Info */
  info(message: string, options?: ToastOptions) {
    return sonnerToast.info(message, {
      duration: 4000,
      ...options,
    });
  },

  /** 🛒 Add to cart */
  addedToCart(productName: string) {
    return sonnerToast.success(`Added to cart`, {
      description: productName,
      duration: 3000,
    });
  },

  /** ❤️ Wishlist */
  addedToWishlist(productName: string) {
    return sonnerToast.success(`Saved to wishlist`, {
      description: productName,
      duration: 3000,
    });
  },

  removedFromWishlist(productName: string) {
    return sonnerToast.info(`Removed from wishlist`, {
      description: productName,
      duration: 3000,
    });
  },

  /** 📦 Order */
  orderPlaced(orderNumber: string) {
    return sonnerToast.success(`Order placed successfully!`, {
      description: `Order #${orderNumber} is confirmed`,
      duration: 6000,
    });
  },

  /** 🔄 Loading */
  loading(message: string, options?: ToastOptions) {
    return sonnerToast.loading(message, {
      duration: Infinity,
      ...options,
    });
  },

  /** 🔔 Generic notification */
  notify(title: string, description?: string, options?: ToastOptions) {
    return sonnerToast(title, {
      description,
      duration: 4000,
      ...options,
    });
  },

  /** Dismiss */
  dismiss: sonnerToast.dismiss,
};

// ─── Re-export Sonner's Toaster for provider use ───────────────────────────────
export { Toaster } from 'sonner';
