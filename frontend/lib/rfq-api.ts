/**
 * ElectroHub — RFQ API Client
 * Handles real backend communication for RFQ submission.
 * Uses the existing /api/quotations/rfq/ Django endpoint.
 */

import { api } from '@/lib/api';
import type { RFQFormData, RFQProductOption, RFQSubmission } from '@/types';
import type { RFQ, RFQCreatePayload } from '@/lib/quotation-api';

// ─── Product search against backend ──────────────────────────────────────────

interface BrandSlim {
  id: number;
  name: string;
  slug?: string;
}

interface CategorySlim {
  id: number;
  name: string;
  slug?: string;
}

interface BackendProductOption {
  id: number;
  name: string;
  slug: string;
  sku: string;
  brand: BrandSlim | null;
  category: CategorySlim | null;
  price?: number | string;
  discount_price?: number | string;
  final_price?: number | string;
}

interface ProductListResponse {
  results?: BackendProductOption[];
  count?: number;
}

/**
 * Search products from the real backend for the RFQ product picker.
 * Falls back to an empty array on error.
 */
export async function searchProductsForRFQ(query: string): Promise<RFQProductOption[]> {
  try {
    const qs = query.trim() ? `?search=${encodeURIComponent(query.trim())}&page_size=15` : '?page_size=30&is_active=true';
    const response = await api.get<ProductListResponse | BackendProductOption[]>(`/products/${qs}`);
    const items: BackendProductOption[] = Array.isArray(response)
      ? response
      : (response.results ?? []);

    return items.map((p) => ({
      id:           p.slug || String(p.id),
      numericId:    p.id,
      name:         p.name,
      sku:          p.sku ?? '',
      brand:        p.brand?.name ?? '',
      category:     p.category?.name ?? '',
      sellingPrice: Number(p.discount_price ?? p.final_price ?? p.price ?? 0),
    }));
  } catch {
    return [];
  }
}

// ─── Submit RFQ to Django backend ────────────────────────────────────────────

/**
 * Maps the frontend RFQFormData to the backend RFQCreatePayload format
 * and submits it via POST /api/quotations/rfq/.
 */
export async function submitRFQToAPI(formData: RFQFormData): Promise<RFQSubmission> {
  const payload: RFQCreatePayload = {
    product_type:         formData.productType,
    quantity:             formData.quantity,
    required_by_date:     formData.requiredByDate,
    delivery_location:    formData.deliveryLocation,
    technical_specs:      formData.technicalSpecs,
    additional_notes:     formData.additionalNotes,
  };

  // Product linkage
  if (formData.productType === 'existing') {
    // Prefer the numeric Django ID; fall back to parsing the string id
    const numId = formData.existingProductNumericId
      || (formData.existingProductId ? parseInt(formData.existingProductId, 10) : undefined);
    if (numId && !isNaN(numId)) {
      payload.product = numId;
    }
  } else {
    payload.custom_product_name = formData.customProductName.trim();
    if (formData.referenceUrl?.trim()) {
      payload.reference_url = formData.referenceUrl.trim();
    }
  }

  // Optional budget
  if (formData.budget?.trim()) {
    payload.budget = formData.budget.trim();
  }

  // Send to backend — auth token is read from localStorage automatically by api.ts
  const rfq: RFQ = await api.post<RFQ>('/quotations/rfq/', payload);

  // Map backend RFQ response to RFQSubmission for the success screen
  return {
    rfqNumber:   rfq.rfq_number,
    status:      rfq.status,
    submittedAt: rfq.submitted_at,
    formData,
  };
}
