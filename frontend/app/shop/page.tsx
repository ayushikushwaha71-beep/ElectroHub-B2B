import type { Metadata } from 'next';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { ShopPage } from '@/components/shop/ShopPage';

// ─── Page Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Shop All Products — ElectroHub | Arduino, Raspberry Pi, ESP32 & More',
  description:
    'Browse 2,500+ premium electronics at ElectroHub. Filter by category, brand, price, and rating. Arduino, Raspberry Pi, ESP32, Sensors, Motors, Displays, and Robotics Kits shipped across India.',
  keywords: [
    'electronics shop india',
    'buy arduino online',
    'raspberry pi price india',
    'esp32 module buy',
    'sensors components',
    'robotics kits india',
    'electronics components',
    'maker components india',
  ],
  openGraph: {
    title: 'Shop All Products — ElectroHub',
    description:
      'Browse 2,500+ premium electronics — filter, sort, and find exactly what you need.',
    type: 'website',
  },
};

// ─── Shop Page ─────────────────────────────────────────────────────────────────
export default function ShopRoute() {
  return (
    <GlobalLayout>
      <ShopPage />
    </GlobalLayout>
  );
}
