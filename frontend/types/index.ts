/**
 * ElectroHub — Global TypeScript Types
 * All shared types for the electronics e-commerce platform.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Primitive / Utility Types
// ═══════════════════════════════════════════════════════════════════════════════

export type ID = string;

export type Timestamp = string; // ISO 8601

export type Status = 'active' | 'inactive' | 'archived';

export type SortOrder = 'asc' | 'desc';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Product Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProductImage {
  id:    ID;
  url:   string;
  alt:   string;
  isPrimary: boolean;
}

export interface ProductSpec {
  label: string;
  value: string;
  unit?: string;
}

export interface ProductSpecGroup {
  groupName: string;
  specs: ProductSpec[];
}

export interface Product {
  id:               ID;               // slug — used for routing
  numericId?:       number;           // Django DB primary key — used for order creation API
  name:             string;
  brand:            string;
  brandId:          ID;
  category:         string;
  categoryId:       ID;
  subcategory?:     string;
  sku:              string;
  sellingPrice:     number;
  originalPrice:    number;
  discount:         number;        // Percentage
  stock:            number;
  rating:           number;        // 0–5
  reviewCount:      number;
  shortDescription: string;
  fullDescription:  string;
  specifications:   ProductSpecGroup[];
  features:         string[];
  applications:     string[];
  packageIncludes:  string[];
  images:           ProductImage[];
  relatedProducts:  ID[];
  tags:             string[];
  isFeatured:       boolean;
  isNew:            boolean;
  isBestseller:     boolean;
  status:           Status;
  createdAt:        Timestamp;
  updatedAt:        Timestamp;
  weight?:          number;        // grams
  dimensions?:      { l: number; w: number; h: number }; // mm
  vendorId?:        string;
  vendorName?:      string;
  vendorRating?:    number;
  vendorVerified?:  boolean;
}

export type ProductSortKey =
  | 'relevance'
  | 'price-asc'
  | 'price-desc'
  | 'rating'
  | 'newest'
  | 'bestseller'
  | 'discount';

export interface ProductFilter {
  categories?:  ID[];
  brands?:      ID[];
  priceMin?:    number;
  priceMax?:    number;
  rating?:      number;
  inStock?:     boolean;
  tags?:        string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Category Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface Category {
  id:              ID;
  name:            string;
  slug:            string;
  description?:    string;
  imageUrl:        string;
  iconName?:       string;         // Lucide icon name
  parentId?:       ID;
  children?:       Category[];
  productCount:    number;
  status:          Status;
  sortOrder:       number;
  featuredColor?:  string;         // Brand color for the category card
}

// ═══════════════════════════════════════════════════════════════════════════════
// Brand Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface Brand {
  id:           ID;
  name:         string;
  slug:         string;
  logoUrl:      string;
  coverUrl?:    string;
  description?: string;
  website?:     string;
  productCount: number;
  isFeatured:   boolean;
  status:       Status;
  country?:     string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Review Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface ReviewMedia {
  type: 'image' | 'video';
  url:  string;
}

export interface Review {
  id:          ID;
  productId:   ID;
  userId:      ID;
  userName:    string;
  userAvatar?: string;
  rating:      number;           // 1–5
  title:       string;
  content:     string;
  pros?:       string[];
  cons?:       string[];
  media?:      ReviewMedia[];
  verified:    boolean;          // Verified purchase
  helpful:     number;           // Helpful votes count
  createdAt:   Timestamp;
}

export interface RatingSummary {
  average:     number;
  total:       number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// User Types
// ═══════════════════════════════════════════════════════════════════════════════

export type UserRole = 'customer' | 'admin' | 'manager';

export interface User {
  id:          ID;
  firstName:   string;
  lastName:    string;
  email:       string;
  phone?:      string;
  avatarUrl?:  string;
  role:        UserRole;
  isVerified:  boolean;
  createdAt:   Timestamp;
  updatedAt:   Timestamp;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Address Types
// ═══════════════════════════════════════════════════════════════════════════════

export type AddressType = 'home' | 'work' | 'other';

export interface Address {
  id:         ID;
  userId:     ID;
  type:       AddressType;
  label?:     string;
  firstName:  string;
  lastName:   string;
  phone:      string;
  line1:      string;
  line2?:     string;
  city:       string;
  state:      string;
  pincode:    string;
  country:    string;
  isDefault:  boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Cart Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface CartItem {
  id:        ID;
  productId: ID;
  product:   Product;
  quantity:  number;
  addedAt:   Timestamp;
}

export interface Cart {
  items:          CartItem[];
  subtotal:       number;
  discount:       number;
  deliveryCharge: number;
  total:          number;
  couponCode?:    string;
  couponDiscount?:number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Order Types
// ═══════════════════════════════════════════════════════════════════════════════

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type PaymentMethod = 'cod' | 'upi' | 'card' | 'netbanking' | 'wallet';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id:           ID;
  productId:    ID;
  productName:  string;
  productImage: string;
  sku:          string;
  quantity:     number;
  sellingPrice: number;
  originalPrice:number;
  discount:     number;
}

export interface Order {
  id:             ID;
  orderNumber:    string;
  userId:         ID;
  items:          OrderItem[];
  shippingAddress:Address;
  subtotal:       number;
  discount:       number;
  deliveryCharge: number;
  total:          number;
  couponCode?:    string;
  couponDiscount?:number;
  status:         OrderStatus;
  paymentMethod:  PaymentMethod;
  paymentStatus:  PaymentStatus;
  trackingNumber?:string;
  estimatedDelivery?: Timestamp;
  createdAt:      Timestamp;
  updatedAt:      Timestamp;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Wishlist Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface WishlistItem {
  id:        ID;
  userId:    ID;
  productId: ID;
  product:   Product;
  addedAt:   Timestamp;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Notification Types
// ═══════════════════════════════════════════════════════════════════════════════

export type NotificationType = 'order' | 'promotion' | 'account' | 'system' | 'restock';

export interface Notification {
  id:        ID;
  userId:    ID;
  type:      NotificationType;
  title:     string;
  message:   string;
  isRead:    boolean;
  link?:     string;
  imageUrl?: string;
  createdAt: Timestamp;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Search Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface SearchSuggestion {
  type:  'product' | 'category' | 'brand' | 'query';
  id?:   ID;
  label: string;
  imageUrl?: string;
}

export interface SearchResult {
  products:   Product[];
  categories: Category[];
  brands:     Brand[];
  total:      number;
  query:      string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component Prop Types
// ═══════════════════════════════════════════════════════════════════════════════

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'gradient'
  | 'accent';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'
  | 'premium'
  | 'new'
  | 'sale'
  | 'bestseller';

export type InputVariant = 'default' | 'filled' | 'ghost';

export type CardVariant = 'default' | 'elevated' | 'bordered' | 'glass' | 'gradient';

// ═══════════════════════════════════════════════════════════════════════════════
// Analytics Types (Admin)
// ═══════════════════════════════════════════════════════════════════════════════

export interface AnalyticsStat {
  label:   string;
  value:   number | string;
  change:  number;           // Percentage change
  trend:   'up' | 'down' | 'neutral';
  period:  string;
}

export interface RevenueDataPoint {
  date:    string;
  revenue: number;
  orders:  number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RFQ Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Shape of the customer-facing RFQ submission form */
export interface RFQFormData {
  productType:          'existing' | 'custom';
  existingProductId?:   string;     // slug / string ID for local reference
  existingProductNumericId?: number; // Django DB pk used in API payload
  existingProductName?: string;
  customProductName:    string;
  referenceUrl?:        string;
  quantity:             number;
  requiredByDate:       string;
  deliveryLocation:     string;
  budget:               string;
  technicalSpecs:       string;
  additionalNotes:      string;
  hasAttachment?:       boolean;
}

export interface RFQProductOption {
  id: string;             // slug or string id
  numericId?: number;     // Django DB pk
  name: string;
  category?: string;
  description?: string;
  sku: string;
  brand: string;
  sellingPrice: number;
}

export interface RFQSubmission {
  id?: string;
  rfqNumber?: string;
  status?: string;
  createdAt?: string;
  submittedAt?: string;
  formData: RFQFormData;
}
