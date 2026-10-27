/**
 * ElectroHub — Application Constants
 */

// App Meta
export const APP_NAME       = 'ElectroHub';
export const APP_TAGLINE    = 'Your Electronics Destination';
export const APP_DESCRIPTION= 'Premium electronics, modules, sensors, and robotics kits for makers and engineers.';
export const APP_URL        = 'https://electrohub.in';

// Navigation
export const NAV_LINKS = [
  { label: 'Home',       href: '/'           },
  { label: 'Categories', href: '/categories' },
  { label: 'Products',   href: '/products'   },
  { label: 'Brands',     href: '/brands'     },
  { label: 'Deals',      href: '/deals'      },
] as const;

// Pagination
export const DEFAULT_PAGE_SIZE  = 24;
export const PAGE_SIZE_OPTIONS  = [12, 24, 48, 96];

// Price
export const FREE_DELIVERY_THRESHOLD = 499;
export const DELIVERY_CHARGE        = 49;
export const CURRENCY                = 'INR';
export const CURRENCY_SYMBOL         = '₹';

// Ratings
export const MAX_RATING  = 5;
export const STAR_LABELS = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

// Cart
export const MAX_CART_QUANTITY = 50;
export const CART_KEY          = 'electrohub_cart';
export const WISHLIST_KEY      = 'electrohub_wishlist';

// Compare
export const MAX_COMPARE_PRODUCTS = 4;

// Toast
export const TOAST_DURATION = 4000;

// Search
export const MIN_SEARCH_LENGTH    = 2;
export const SEARCH_DEBOUNCE_MS   = 300;
export const MAX_SEARCH_SUGGESTIONS = 8;

// Product Images placeholder (using picsum)
export const PLACEHOLDER_PRODUCT_IMG = 'https://placehold.co/600x600/1e293b/60a5fa?text=ElectroHub';
export const PLACEHOLDER_CATEGORY_IMG= 'https://placehold.co/400x300/1e293b/60a5fa?text=Category';
export const PLACEHOLDER_BRAND_IMG   = 'https://placehold.co/200x100/1e293b/60a5fa?text=Brand';

// Categories (used for seeding/navigation)
export const PRODUCT_CATEGORIES = [
  'Arduino',
  'Raspberry Pi',
  'ESP32 / ESP8266',
  'Sensors',
  'Motors',
  'Displays',
  'Power Modules',
  'Tools & Accessories',
  'Robotics Kits',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// Order statuses with display labels and colors
export const ORDER_STATUS_CONFIG = {
  pending:           { label: 'Pending',           color: 'warning' },
  confirmed:         { label: 'Confirmed',          color: 'info'    },
  processing:        { label: 'Processing',         color: 'info'    },
  shipped:           { label: 'Shipped',            color: 'primary' },
  out_for_delivery:  { label: 'Out for Delivery',   color: 'primary' },
  delivered:         { label: 'Delivered',          color: 'success' },
  cancelled:         { label: 'Cancelled',          color: 'danger'  },
  returned:          { label: 'Returned',           color: 'danger'  },
  refunded:          { label: 'Refunded',           color: 'warning' },
} as const;

// Payment methods
export const PAYMENT_METHODS = [
  { id: 'upi',        label: 'UPI',              icon: 'smartphone' },
  { id: 'card',       label: 'Credit/Debit Card', icon: 'credit-card' },
  { id: 'netbanking', label: 'Net Banking',       icon: 'landmark'   },
  { id: 'wallet',     label: 'Wallet',            icon: 'wallet'      },
  { id: 'cod',        label: 'Cash on Delivery',  icon: 'banknote'   },
] as const;

// Indian states for address form
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
] as const;

// Sort options
export const SORT_OPTIONS = [
  { value: 'relevance',  label: 'Relevance'          },
  { value: 'price-asc',  label: 'Price: Low to High'  },
  { value: 'price-desc', label: 'Price: High to Low'  },
  { value: 'rating',     label: 'Customer Rating'     },
  { value: 'newest',     label: 'Newest First'        },
  { value: 'bestseller', label: 'Bestsellers'         },
  { value: 'discount',   label: 'Best Discount'       },
] as const;

// Admin sidebar
export const ADMIN_NAV = [
  { label: 'Dashboard',    href: '/admin',               icon: 'layout-dashboard' },
  { label: 'Products',     href: '/admin/products',       icon: 'package'          },
  { label: 'Categories',   href: '/admin/categories',     icon: 'folder-open'      },
  { label: 'Brands',       href: '/admin/brands',         icon: 'building-2'       },
  { label: 'Orders',       href: '/admin/orders',         icon: 'shopping-bag'     },
  { label: 'Customers',    href: '/admin/customers',      icon: 'users'            },
  { label: 'Inventory',    href: '/admin/inventory',      icon: 'box'              },
  { label: 'Analytics',    href: '/admin/analytics',      icon: 'bar-chart-2'      },
  { label: 'Reviews',      href: '/admin/reviews',        icon: 'star'             },
  { label: 'Settings',     href: '/admin/settings',       icon: 'settings'         },
] as const;
