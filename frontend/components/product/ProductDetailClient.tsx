'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProductGallery }     from '@/components/product/ProductGallery';
import { ProductInfo }        from '@/components/product/ProductInfo';
import { PurchaseSection, StickyMobilePurchaseBar } from '@/components/product/PurchaseSection';
import { ProductHighlights }  from '@/components/product/ProductHighlights';
import { ProductTabs }        from '@/components/product/ProductTabs';
import { RelatedProducts }    from '@/components/product/RelatedProducts';
import { RecentlyViewed }     from '@/components/product/RecentlyViewed';
import {
  MOCK_REVIEWS,
  MOCK_RATING_SUMMARY,
  DEFAULT_DELIVERY_INFO,
  getRelatedProducts,
} from '@/lib/data/productDetail';
import type { Product } from '@/types';

// ─── Section reveal animation ─────────────────────────────────────────────────
const sectionVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProductDetailClientProps {
  product: Product;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const relatedProducts = getRelatedProducts(product.relatedProducts ?? []);

  const breadcrumbItems = [
    { label: 'Home',            href: '/'               },
    { label: product.category,  href: `/shop?category=${product.categoryId}` },
    { label: product.name,      current: true            },
  ];

  return (
    <>
      <div className="container-fluid py-6">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Breadcrumb items={breadcrumbItems} showHome />
        </motion.div>

        {/* ── Hero: Gallery + Info ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 mb-12">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          >
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
          </motion.div>

          {/* Info + Purchase */}
          <div className="flex flex-col gap-6">
            <ProductInfo
              product={product}
              delivery={DEFAULT_DELIVERY_INFO}
            />
            <PurchaseSection product={product} />
          </div>
        </div>

        {/* ── Highlights (mobile accordions) ─────────────────────────────── */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="mb-12"
          aria-label="Product highlights"
        >
          <h2 className="text-xl font-bold font-display text-[var(--text)] mb-5">
            Product Details
          </h2>
          <ProductHighlights product={product} />
        </motion.section>

        {/* ── Divider ────────────────────────────────────────────────────── */}
        <div className="section-divider mb-12" />

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="mb-16"
        >
          <ProductTabs
            product={product}
            reviews={MOCK_REVIEWS}
            ratingSummary={MOCK_RATING_SUMMARY}
          />
        </motion.section>

        {/* ── Related Products ────────────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4 }}
            className={cn('mb-16 pb-20 md:pb-0')}
          >
            <div className="section-divider mb-12" />
            <RelatedProducts products={relatedProducts} />
          </motion.div>
        )}

        {/* ── Recently Viewed ─────────────────────────────────────────────── */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="pb-24 md:pb-8"
        >
          <RecentlyViewed
            currentProductId={product.id}
            currentProduct={product}
          />
        </motion.div>
      </div>

      {/* Sticky mobile bar — rendered outside container */}
      <StickyMobilePurchaseBar product={product} />
    </>
  );
}
