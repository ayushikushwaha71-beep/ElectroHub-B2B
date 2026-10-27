import type { Metadata } from 'next';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import {
  FeaturedProducts,
  BestSellers,
  NewArrivals,
  TrendingProducts,
} from '@/components/home/ProductSections';
import { ShopByBrand } from '@/components/home/ShopByBrand';
import { PromotionalBanner } from '@/components/home/PromotionalBanner';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { Testimonials } from '@/components/home/Testimonials';
import { Newsletter } from '@/components/home/Newsletter';

// ─── Page Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'ElectroHub — Your Electronics Destination | Arduino, Raspberry Pi, ESP32',
  description:
    'Shop premium electronics: Arduino, Raspberry Pi, ESP32, sensors, motors, displays, and robotics kits. Fast delivery across India. 100% genuine products.',
  keywords: [
    'electronics store india', 'arduino buy online', 'raspberry pi india',
    'esp32 modules', 'sensors india', 'robotics kits', 'iot components',
  ],
  openGraph: {
    title: 'ElectroHub — Your Electronics Destination',
    description: 'Premium electronics for makers and engineers across India.',
    type: 'website',
  },
};

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <GlobalLayout>
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Featured Categories */}
      <FeaturedCategories />

      {/* 3. Featured Products */}
      <FeaturedProducts />

      {/* 4. Promotional Banner */}
      <PromotionalBanner />

      {/* 5. Best Sellers */}
      <BestSellers />

      {/* 6. Shop by Brand */}
      <ShopByBrand />

      {/* 7. New Arrivals */}
      <NewArrivals />

      {/* 8. Trending Products */}
      <TrendingProducts />

      {/* 9. Why Choose ElectroHub */}
      <WhyChooseUs />

      {/* 10. Customer Testimonials */}
      <Testimonials />

      {/* 11. Newsletter */}
      <Newsletter />
    </GlobalLayout>
  );
}
