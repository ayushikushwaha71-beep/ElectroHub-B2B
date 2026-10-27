import { api } from '@/lib/api';
import type { Product } from '@/types';

export interface BackendProduct {
  id: number;
  name: string;
  slug: string;
  category: number | null;
  category_name: string;
  brand: number | null;
  brand_name: string | null;
  sku: string;
  short_description: string;
  description: string;
  price: string;
  discount_price: string | null;
  final_price: string;
  stock: number;
  in_stock: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_active: boolean;
  status: string;
  images: Array<{ id: number; image: string; alt_text: string; is_primary: boolean; sort_order: number }>;
  vendor_id: number | null;
  vendor_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendProduct[];
}

export function mapBackendProduct(item: BackendProduct): Product {
  const sellingPrice  = Number(item.final_price);
  const originalPrice = Number(item.price);

  return {
    // Use slug as the public-facing id (for routing) but store numericId for order API
    id:               item.slug,
    numericId:        item.id,          // ← numeric DB primary key for /api/orders/ POST
    name:             item.name,
    brand:            item.brand_name ?? 'Electronics',
    brandId:          String(item.brand ?? item.id),
    category:         item.category_name || 'Electronics',
    categoryId:       item.category_name || 'electronics',
    sku:              item.sku,
    sellingPrice,
    originalPrice,
    discount:         originalPrice > 0 ? Math.round((1 - sellingPrice / originalPrice) * 100) : 0,
    stock:            item.stock,
    rating:           4.8,
    reviewCount:      0,
    shortDescription: item.short_description,
    fullDescription:  item.description,
    specifications:   [],
    features:         [],
    applications:     [],
    packageIncludes:  [],
    images:           item.images.map((img) => ({
      id:        String(img.id),
      url:       img.image,
      alt:       img.alt_text,
      isPrimary: img.is_primary,
    })),
    vendorId:       item.vendor_id != null ? String(item.vendor_id) : undefined,
    vendorName:     item.vendor_name ?? undefined,
    vendorRating:   4.8,
    vendorVerified: true,
    relatedProducts: [],
    tags:           [],
    isFeatured:     item.is_featured,
    isNew:          false,
    isBestseller:   false,
    status:         item.status === 'active' ? 'active' : 'inactive',
    createdAt:      item.created_at,
    updatedAt:      item.updated_at,
  };
}

export async function getMarketplaceProducts(): Promise<Product[]> {
  const response = await api.get<ProductListResponse>('/products/');
  return response.results.map(mapBackendProduct);
}

export async function getMarketplaceProduct(slug: string): Promise<Product> {
  const response = await api.get<BackendProduct>(`/products/${encodeURIComponent(slug)}/`);
  return mapBackendProduct(response);
}
