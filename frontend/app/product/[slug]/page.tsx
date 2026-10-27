import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { getProductBySlug, getAllProductSlugs } from '@/lib/data/productDetail';
import { getMarketplaceProduct } from '@/lib/products-api';

// ─── Static params for pre-rendering ─────────────────────────────────────────
export function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

// ─── Dynamic metadata ─────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product  = await getMarketplaceProduct(slug).catch(() => getProductBySlug(slug));

  if (!product) {
    return {
      title: 'Product Not Found | ElectroHub',
    };
  }

  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];

  return {
    title:       `${product.name} — ${product.brand} | ElectroHub`,
    description: product.shortDescription,
    keywords:    [...product.tags, product.brand, product.category, 'buy online india'],
    openGraph: {
      title:       `${product.name} — ${product.brand}`,
      description: product.shortDescription,
      type:        'website',
      images:      primaryImage ? [{ url: primaryImage.url, alt: primaryImage.alt }] : [],
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${product.name} — ${product.brand}`,
      description: product.shortDescription,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product  = await getMarketplaceProduct(slug).catch(() => getProductBySlug(slug));

  if (!product) notFound();

  return (
    <GlobalLayout>
      <ProductDetailClient product={product} />
    </GlobalLayout>
  );
}
