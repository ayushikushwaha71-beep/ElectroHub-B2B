import type { Metadata } from 'next';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { CartPage } from '@/components/cart/CartPage';

// ─── Page Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Shopping Cart — ElectroHub | Checkout',
  description:
    'Review your cart and checkout securely at ElectroHub. Buy Arduino, Raspberry Pi, ESP32, sensors, and more electronics with fast delivery and easy returns.',
  keywords: [
    'shopping cart',
    'checkout',
    'electronics cart',
    'ElectroHub cart',
  ],
  openGraph: {
    title: 'Shopping Cart — ElectroHub',
    description: 'Review and checkout your electronics at ElectroHub.',
    type: 'website',
  },
};

// ─── Cart Route ────────────────────────────────────────────────────────────────
export default function CartRoute() {
  return (
    <GlobalLayout>
      <CartPage />
    </GlobalLayout>
  );
}
