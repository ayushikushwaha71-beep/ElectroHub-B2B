import type { Metadata } from 'next';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { WishlistPage } from '@/components/wishlist/WishlistPage';

// ─── Page Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'My Wishlist — ElectroHub | Saved Products',
  description:
    'View and manage your saved electronics products on ElectroHub. Add wishlist items to cart or continue browsing Arduino, Raspberry Pi, sensors, and more.',
  keywords: [
    'wishlist',
    'saved products',
    'electronics wishlist',
    'ElectroHub wishlist',
  ],
  openGraph: {
    title: 'My Wishlist — ElectroHub',
    description: 'Your saved electronics products at ElectroHub.',
    type: 'website',
  },
};

// ─── Wishlist Route ────────────────────────────────────────────────────────────
export default function WishlistRoute() {
  return (
    <GlobalLayout>
      <WishlistPage />
    </GlobalLayout>
  );
}
