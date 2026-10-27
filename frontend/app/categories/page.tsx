import type { Metadata } from 'next';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { CategoriesHero } from '@/components/categories/CategoriesHero';
import { CategoryGrid } from '@/components/categories/CategoryGrid';
import { FeaturedCategoriesSection } from '@/components/categories/FeaturedCategoriesSection';
import { PopularCategories } from '@/components/categories/PopularCategories';
import { ShopByBrandSection } from '@/components/categories/ShopByBrandSection';
import { TrendingCategories } from '@/components/categories/TrendingCategories';
import { WhyShopWithUs } from '@/components/categories/WhyShopWithUs';
import { Newsletter } from '@/components/home/Newsletter';

// ─── Page Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'All Categories — ElectroHub | Arduino, Raspberry Pi, ESP32, Sensors & More',
  description:
    'Browse all 10 electronics categories at ElectroHub. Arduino, Raspberry Pi, ESP32, Sensors, Motors, Displays, Robotics, Power Modules, Tools & Accessories.',
  keywords: [
    'electronics categories india',
    'arduino category',
    'raspberry pi india',
    'esp32 category',
    'sensors electronics',
    'robotics kits india',
    'electronics tools',
  ],
  openGraph: {
    title: 'All Categories — ElectroHub',
    description: 'Browse all electronics categories — 2,500+ genuine products for makers.',
    type: 'website',
  },
};

// ─── Categories Page ──────────────────────────────────────────────────────────
export default function CategoriesPage() {
  return (
    <GlobalLayout>
      {/* 1. Hero with Breadcrumb + Title + Count */}
      <CategoriesHero />

      {/* 2. Full Category Grid (searchable) */}
      <CategoryGrid />

      {/* 3. Featured / Promotional Categories */}
      <FeaturedCategoriesSection />

      {/* 4. Popular Categories — horizontal responsive cards */}
      <PopularCategories />

      {/* 5. Shop by Brand — 8 brand logos */}
      <ShopByBrandSection />

      {/* 6. Trending Categories — horizontal carousel */}
      <TrendingCategories />

      {/* 7. Why Shop With Us — 5 feature cards */}
      <WhyShopWithUs />

      {/* 8. Newsletter CTA */}
      <Newsletter />
    </GlobalLayout>
  );
}
