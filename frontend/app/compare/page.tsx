import type { Metadata } from 'next';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { ComparePage } from '@/components/compare/ComparePage';

// ─── Page Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Compare Products — ElectroHub | Side-by-Side Comparison',
  description:
    'Compare electronics products side-by-side at ElectroHub. View specs, prices, ratings, and features for Arduino, Raspberry Pi, sensors, and more.',
  keywords: [
    'compare electronics',
    'product comparison',
    'side by side electronics',
    'ElectroHub compare',
  ],
  openGraph: {
    title: 'Compare Products — ElectroHub',
    description: 'Side-by-side comparison of electronics products at ElectroHub.',
    type: 'website',
  },
};

// ─── Compare Route ─────────────────────────────────────────────────────────────
export default function CompareRoute() {
  return (
    <GlobalLayout>
      <ComparePage />
    </GlobalLayout>
  );
}
