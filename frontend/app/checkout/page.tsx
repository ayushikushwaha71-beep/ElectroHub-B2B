import type { Metadata } from 'next';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { CheckoutPage } from '@/components/checkout/CheckoutPage';

// ─── Page Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Checkout — ElectroHub | Secure Payment',
  description:
    'Complete your purchase securely at ElectroHub. Fast delivery, easy returns, and multiple payment options.',
  keywords: ['checkout', 'secure payment', 'electronics', 'ElectroHub'],
  openGraph: {
    title: 'Checkout — ElectroHub',
    description: 'Complete your electronics purchase securely.',
    type: 'website',
  },
  robots: { index: false, follow: false }, // don't index checkout
};

// ─── Checkout Route ────────────────────────────────────────────────────────────
export default function CheckoutRoute() {
  return (
    <GlobalLayout>
      <CheckoutPage />
    </GlobalLayout>
  );
}
