import * as React from 'react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { SearchResultsClient } from '@/components/search/SearchResultsClient';
import { SkeletonPage } from '@/components/ui/Skeleton';

// ─── Dynamic Metadata ─────────────────────────────────────────────────────────
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query  = (q ?? '').trim();

  if (!query) {
    return {
      title:       'Search Products | ElectroHub',
      description: 'Search across 2,500+ electronics at ElectroHub — Arduino, Raspberry Pi, ESP32, sensors, motors, displays, and more.',
    };
  }

  return {
    title:       `"${query}" — Search Results | ElectroHub`,
    description: `Find "${query}" at ElectroHub. Browse electronics, compare prices, and filter by category, brand, price, and rating.`,
    robots:      { index: false }, // Don't index dynamic search pages
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function SearchPage() {
  return (
    <GlobalLayout>
      {/*
        Suspense is required because SearchResultsClient uses useSearchParams().
        Fallback renders a skeleton page while the client hydrates.
      */}
      <Suspense fallback={<SkeletonPage />}>
        <SearchResultsClient />
      </Suspense>
    </GlobalLayout>
  );
}
