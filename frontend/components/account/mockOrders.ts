'use client';

/**
 * Mock Order storage — persists to localStorage so orders survive refresh.
 * Seeded with a few sample orders per user on first load.
 */

import type { OrderStatus } from '@/types';

export interface MockOrderItem {
  id:           string;
  productId:    string;
  productName:  string;
  productImage: string;
  sku:          string;
  quantity:     number;
  sellingPrice: number;
  originalPrice:number;
  discount:     number;
}

export interface MockOrder {
  id:             string;
  orderNumber:    string;
  userId:         string;
  items:          MockOrderItem[];
  subtotal:       number;
  discount:       number;
  deliveryCharge: number;
  total:          number;
  status:         OrderStatus;
  paymentMethod:  string;
  paymentStatus:  string;
  // B2B quotation linkage (optional — only set for RFQ-sourced orders)
  quotationRef?:     string;  // quotation id
  quotationNumber?:  string;  // human-readable quotation number e.g. QT-2026-000501
  trackingNumber?:string;
  estimatedDelivery?: string;
  createdAt:      string;
  updatedAt:      string;
  shippingAddress: {
    firstName: string;
    lastName:  string;
    phone:     string;
    line1:     string;
    city:      string;
    state:     string;
    pincode:   string;
    country:   string;
  };
}

const ORDERS_KEY = 'electrohub_orders';

const SEED_ORDERS: MockOrder[] = [
  {
    id:             'ord-001',
    orderNumber:    'EH-20250812-0001',
    userId:         '__seed__',
    items: [
      {
        id:           'oi-001',
        productId:    'ard-001',
        productName:  'Arduino Uno R3 Microcontroller Board',
        productImage: 'https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?w=120&h=120&fit=crop',
        sku:          'ARD-UNO-R3',
        quantity:     2,
        sellingPrice: 549,
        originalPrice:699,
        discount:     21,
      },
      {
        id:           'oi-002',
        productId:    'sen-001',
        productName:  'DHT22 Temperature & Humidity Sensor',
        productImage: 'https://images.unsplash.com/photo-1591370874773-6702e8f12fd8?w=120&h=120&fit=crop',
        sku:          'SEN-DHT22',
        quantity:     3,
        sellingPrice: 149,
        originalPrice:199,
        discount:     25,
      },
    ],
    subtotal:       1545,
    discount:       153,
    deliveryCharge: 0,
    total:          1545,
    status:         'delivered',
    paymentMethod:  'upi',
    paymentStatus:  'paid',
    trackingNumber: 'TRK123456789IN',
    estimatedDelivery: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt:      new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt:      new Date(Date.now() - 3  * 86400000).toISOString(),
    shippingAddress: {
      firstName: 'Alex',
      lastName:  'Johnson',
      phone:     '9876543210',
      line1:     '42 Circuit Street, Koramangala',
      city:      'Bengaluru',
      state:     'Karnataka',
      pincode:   '560034',
      country:   'India',
    },
  },
  {
    id:             'ord-002',
    orderNumber:    'EH-20250814-0002',
    userId:         '__seed__',
    items: [
      {
        id:           'oi-003',
        productId:    'esp-001',
        productName:  'ESP32 Development Board (38-pin)',
        productImage: 'https://images.unsplash.com/photo-1557318041-1ce374d55ebf?w=120&h=120&fit=crop',
        sku:          'ESP32-DEV-38',
        quantity:     1,
        sellingPrice: 399,
        originalPrice:549,
        discount:     27,
      },
    ],
    subtotal:       399,
    discount:       150,
    deliveryCharge: 49,
    total:          448,
    status:         'shipped',
    paymentMethod:  'card',
    paymentStatus:  'paid',
    trackingNumber: 'TRK987654321IN',
    estimatedDelivery: new Date(Date.now() + 2 * 86400000).toISOString(),
    createdAt:      new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt:      new Date(Date.now() - 1 * 86400000).toISOString(),
    shippingAddress: {
      firstName: 'Alex',
      lastName:  'Johnson',
      phone:     '9876543210',
      line1:     '42 Circuit Street, Koramangala',
      city:      'Bengaluru',
      state:     'Karnataka',
      pincode:   '560034',
      country:   'India',
    },
  },
  {
    id:             'ord-003',
    orderNumber:    'EH-20250815-0003',
    userId:         '__seed__',
    items: [
      {
        id:           'oi-004',
        productId:    'rpi-001',
        productName:  'Raspberry Pi 4 Model B (4GB RAM)',
        productImage: 'https://images.unsplash.com/photo-1587588354456-ae376af71a25?w=120&h=120&fit=crop',
        sku:          'RPI-4B-4G',
        quantity:     1,
        sellingPrice: 4299,
        originalPrice:4999,
        discount:     14,
      },
    ],
    subtotal:       4299,
    discount:       700,
    deliveryCharge: 0,
    total:          4299,
    status:         'processing',
    paymentMethod:  'netbanking',
    paymentStatus:  'paid',
    createdAt:      new Date(Date.now() - 4 * 3600000).toISOString(),
    updatedAt:      new Date(Date.now() - 2 * 3600000).toISOString(),
    shippingAddress: {
      firstName: 'Alex',
      lastName:  'Johnson',
      phone:     '9876543210',
      line1:     '42 Circuit Street, Koramangala',
      city:      'Bengaluru',
      state:     'Karnataka',
      pincode:   '560034',
      country:   'India',
    },
  },
];

function getKey(userId: string) {
  return `${ORDERS_KEY}_${userId}`;
}

export function getStoredOrders(userId: string): MockOrder[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(getKey(userId));
    if (raw) return JSON.parse(raw) as MockOrder[];

    // Seed on first access
    const seeded = SEED_ORDERS.map((o) => ({ ...o, userId }));
    localStorage.setItem(getKey(userId), JSON.stringify(seeded));
    return seeded;
  } catch {
    return [];
  }
}

export function saveOrders(userId: string, orders: MockOrder[]) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(getKey(userId), JSON.stringify(orders));
  } catch {
    // ignore
  }
}

/**
 * Create a B2B order from a payment_confirmed quotation.
 * Idempotent: returns existing order if one already exists for this quotation.
 * Saves directly to localStorage.
 */
export function createOrderFromQuotation(params: {
  userId:          string;
  quotationId:     string;
  quotationNumber: string;
  productName:     string;
  quantity:        number;
  grandTotal:      number;
  deliveryLocation: string;
  expectedDelivery: string;
  unitPrice:       number;
  discountPct:     number;
  taxPct:          number;
  shippingCharge:  number;
}): MockOrder {
  const orders = getStoredOrders(params.userId);
  // Idempotency: return existing if already created
  const existing = orders.find((o) => o.quotationRef === params.quotationId);
  if (existing) return existing;

  const sub      = params.quantity * params.unitPrice;
  const disc     = sub * (params.discountPct / 100);
  const taxable  = sub - disc;
  const discAmt  = disc;

  // Parse delivery address from location string e.g. "Bengaluru, Karnataka 560034"
  const locationParts = params.deliveryLocation.split(',').map((s) => s.trim());
  const city          = locationParts[0] ?? params.deliveryLocation;
  const statePinPart  = locationParts[1] ?? '';
  const statePin      = statePinPart.trim().split(' ');
  const pincode       = statePin.pop() ?? '';
  const state         = statePin.join(' ') || 'India';

  const now     = new Date().toISOString();
  const orderId = `ord-b2b-${Date.now()}`;
  const seq     = (orders.filter((o) => o.quotationRef).length + 1).toString().padStart(4, '0');
  const orderNumber = `EH-B2B-${new Date().getFullYear()}-${seq}`;

  const newOrder: MockOrder = {
    id:             orderId,
    orderNumber,
    userId:         params.userId,
    items: [{
      id:           `oi-b2b-${Date.now()}`,
      productId:    `b2b-${params.quotationId}`,
      productName:  params.productName,
      productImage: '',
      sku:          `B2B-${params.quotationNumber.replace('QT-', '')}`,
      quantity:     params.quantity,
      sellingPrice: params.unitPrice,
      originalPrice:params.unitPrice,
      discount:     discAmt,
    }],
    subtotal:       taxable,
    discount:       discAmt,
    deliveryCharge: params.shippingCharge,
    total:          params.grandTotal,
    status:         'confirmed',
    paymentMethod:  'netbanking',
    paymentStatus:  'paid',
    trackingNumber: undefined,
    estimatedDelivery: params.expectedDelivery,
    createdAt:      now,
    updatedAt:      now,
    quotationRef:     params.quotationId,
    quotationNumber:  params.quotationNumber,
    shippingAddress: {
      firstName: 'B2B',
      lastName:  'Customer',
      phone:     '',
      line1:     params.deliveryLocation,
      city,
      state,
      pincode,
      country:   'India',
    },
  };

  saveOrders(params.userId, [...orders, newOrder]);
  return newOrder;
}
