/**
 * ElectroHub — RFQ Static Data & Helpers
 * Provides static product list (from local mock data) for the RFQ form picker
 * and an empty form state.
 *
 * NOTE: Actual API submission is handled by lib/rfq-api.ts using the real
 * Django backend. This file is kept for the local static product data only.
 */

import { PRODUCTS } from '@/lib/data/products';
import type { RFQProductOption, RFQFormData } from '@/types';

// ─── Product Options for RFQ Picker (from local static data) ─────────────────
// These will be shown as fallback / initial data; live products are fetched from
// the backend API in RFQFormModal via lib/rfq-api.ts
export const RFQ_PRODUCT_OPTIONS: RFQProductOption[] = PRODUCTS
  .filter((p) => p.status === 'active')
  .map((p) => ({
    id:           p.id,
    numericId:    p.numericId,
    name:         p.name,
    sku:          p.sku,
    sellingPrice: p.sellingPrice,
    brand:        p.brand,
    category:     p.category,
  }));

// ─── Default empty form ───────────────────────────────────────────────────────
export const EMPTY_RFQ_FORM: RFQFormData = {
  productType:               'existing',
  existingProductId:         '',
  existingProductNumericId:  undefined,
  existingProductName:       '',
  customProductName:         '',
  referenceUrl:              '',
  quantity:                  1,
  requiredByDate:            '',
  deliveryLocation:          '',
  budget:                    '',
  technicalSpecs:            '',
  additionalNotes:           '',
  hasAttachment:             false,
};
