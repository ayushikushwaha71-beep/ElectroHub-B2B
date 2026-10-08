/**
 * ElectroHub — Mock Quotation storage (customer-side)
 * Persists quotations received from ElectroHub to localStorage.
 * Also stores the negotiation revision history per quotation.
 * Pattern mirrors mockOrders.ts / mockRFQs.ts.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type MockQuotationStatus =
  | 'draft'
  | 'sent'              // admin sent, not yet viewed
  | 'viewed'            // customer opened it
  | 'negotiating'       // customer submitted a counter-offer
  | 'revised'           // admin sent a revised quotation
  | 'accepted'          // customer accepted
  | 'rejected'          // customer rejected
  | 'invoice_sent'      // admin issued GST invoice, awaiting payment
  | 'partially_paid'
  | 'payment_confirmed'; // customer confirmed payment / admin marked as paid

export interface MockNegotiationEntry {
  id:           string;
  by:           'customer' | 'admin';
  proposedPrice: number;   // per-unit price
  message:      string;
  timestamp:    string;    // ISO
}

export interface MockQuotation {
  id:             string;
  quotationNumber: string;
  rfqNumber:      string;
  rfqId:          string;
  userId:         string;

  // Product
  productName:    string;
  productType:    'existing' | 'custom';
  referenceUrl?:  string;

  // Pricing
  quantity:       number;
  unitPrice:      number;
  discountPct:    number;
  taxPct:         number;
  shippingCharge: number;

  // Delivery
  deliveryLocation: string;
  expectedDelivery: string;  // YYYY-MM-DD

  // Inventory (mock)
  availableQty:   number;
  reservedQty:    number;
  incomingQty:    number;
  eta:            string;    // YYYY-MM-DD

  // Meta
  validUntil:     string;    // YYYY-MM-DD
  termsNotes:     string;
  status:         MockQuotationStatus;
  sentAt:         string;    // ISO
  updatedAt:      string;    // ISO

  // Real backend fields for payment
  grandTotal?:    number;
  paidAmount?:    number;
  pendingAmount?: number;
  invoiceNumber?: string;
  dueDate?:       string;

  // Negotiation
  negotiations:   MockNegotiationEntry[];
}

// ─── Derived totals ───────────────────────────────────────────────────────────

export interface QuotationTotals {
  subtotal:   number;
  discount:   number;
  taxable:    number;
  tax:        number;
  shipping:   number;
  grandTotal: number;
}

export function calcQuotationTotals(q: MockQuotation): QuotationTotals {
  const subtotal   = q.quantity * q.unitPrice;
  const discount   = subtotal * (q.discountPct / 100);
  const taxable    = subtotal - discount;
  const tax        = taxable * (q.taxPct / 100);
  const grandTotal = taxable + tax + q.shippingCharge;
  return { subtotal, discount, taxable, tax, shipping: q.shippingCharge, grandTotal };
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const QUOT_KEY = 'electrohub_quotations';

function getKey(userId: string) {
  return `${QUOT_KEY}_${userId}`;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_QUOTATIONS: MockQuotation[] = [
  {
    id:              'quot-seed-001',
    quotationNumber: 'QT-2026-000312',
    rfqNumber:       'RFQ-2026-000312',
    rfqId:           'rfq-seed-001',
    userId:          '__seed__',
    productName:     'STM32F407VGT6 ARM Cortex-M4 Microcontroller',
    productType:     'existing',
    quantity:        50,
    unitPrice:       1380,
    discountPct:     5,
    taxPct:          18,
    shippingCharge:  850,
    deliveryLocation: 'Bengaluru, Karnataka 560034',
    expectedDelivery: '2026-09-12',
    availableQty:    120,
    reservedQty:     20,
    incomingQty:     300,
    eta:             '2026-09-02',
    validUntil:      new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    termsNotes:
      '1. Prices are inclusive of applicable duties.\n' +
      '2. Payment terms: 50% advance, balance before dispatch.\n' +
      '3. Lead time 10–12 business days from order confirmation.\n' +
      '4. Certificate of conformance provided with shipment.',
    status:          'viewed',
    sentAt:          new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt:       new Date(Date.now() - 1 * 86400000).toISOString(),
    negotiations:    [],
  },
  {
    id:              'quot-seed-002',
    quotationNumber: 'QT-2026-000253',
    rfqNumber:       'RFQ-2026-000253',
    rfqId:           'rfq-seed-003',
    userId:          '__seed__',
    productName:     'Custom 2-layer PCB Fabrication (100 × 80 mm)',
    productType:     'custom',
    quantity:        200,
    unitPrice:       65,
    discountPct:     10,
    taxPct:          18,
    shippingCharge:  500,
    deliveryLocation: 'Hyderabad, Telangana 500032',
    expectedDelivery: '2026-08-28',
    availableQty:    0,
    reservedQty:     0,
    incomingQty:     500,
    eta:             '2026-08-22',
    validUntil:      new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    termsNotes:
      '1. Gerber files required before production start.\n' +
      '2. 100% advance payment for custom fabrication.\n' +
      '3. No returns on custom-manufactured PCBs.',
    status:          'negotiating',
    sentAt:          new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt:       new Date(Date.now() - 1 * 86400000).toISOString(),
    negotiations: [
      {
        id:            'neg-001',
        by:            'customer',
        proposedPrice: 55,
        message:       'We have competing quotes at ₹55/unit. Can you match this for a long-term partnership?',
        timestamp:     new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ],
  },
  {
    id:              'quot-seed-003',
    quotationNumber: 'QT-2026-000198',
    rfqNumber:       'RFQ-2026-000198',
    rfqId:           'rfq-seed-004',
    userId:          '__seed__',
    productName:     'Raspberry Pi 4 Model B (4 GB RAM)',
    productType:     'existing',
    quantity:        25,
    unitPrice:       5200,
    discountPct:     8,
    taxPct:          18,
    shippingCharge:  0,
    deliveryLocation: 'Chennai, Tamil Nadu 600001',
    expectedDelivery: '2026-07-18',
    availableQty:    43,
    reservedQty:     25,
    incomingQty:     0,
    eta:             '',
    validUntil:      '2026-07-30',
    termsNotes:
      '1. GST invoice provided.\n' +
      '2. Free shipping for orders above ₹1,00,000.\n' +
      '3. Payment: full advance for B2B first order.',
    status:          'accepted',
    sentAt:          new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt:       new Date(Date.now() - 16 * 86400000).toISOString(),
    negotiations:    [],
  },
  // ── Additional seeds to cover all status states ──────────────────────────
  {
    id:              'quot-seed-004',
    quotationNumber: 'QT-2026-000421',
    rfqNumber:       'RFQ-2026-000421',
    rfqId:           'rfq-seed-005',
    userId:          '__seed__',
    productName:     'ESP32-WROOM-32E Wi-Fi + BT Module (Qty 500)',
    productType:     'existing',
    referenceUrl:    'https://www.espressif.com/en/products/modules/esp32',
    quantity:        500,
    unitPrice:       185,
    discountPct:     12,
    taxPct:          18,
    shippingCharge:  0,
    deliveryLocation: 'Pune, Maharashtra 411001',
    expectedDelivery: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
    availableQty:    850,
    reservedQty:     0,
    incomingQty:     2000,
    eta:             new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    validUntil:      new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    termsNotes:
      '1. Bulk pricing applies for 500+ units.\n' +
      '2. Free shipping on orders above ₹50,000.\n' +
      '3. 50% advance required; balance before dispatch.\n' +
      '4. Manufacturer warranty: 12 months.',
    // status 'sent' — customer has not opened this quotation yet
    status:          'sent',
    sentAt:          new Date(Date.now() - 3 * 3600000).toISOString(),
    updatedAt:       new Date(Date.now() - 3 * 3600000).toISOString(),
    negotiations:    [],
  },
  {
    id:              'quot-seed-005',
    quotationNumber: 'QT-2026-000287',
    rfqNumber:       'RFQ-2026-000287',
    rfqId:           'rfq-seed-006',
    userId:          '__seed__',
    productName:     'Industrial BLDC Motor Controller (48V / 30A)',
    productType:     'existing',
    quantity:        10,
    unitPrice:       8500,
    discountPct:     5,
    taxPct:          18,
    shippingCharge:  600,
    deliveryLocation: 'Delhi NCR 110001',
    expectedDelivery: new Date(Date.now() + 22 * 86400000).toISOString().split('T')[0],
    availableQty:    18,
    reservedQty:     5,
    incomingQty:     50,
    eta:             new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    validUntil:      new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
    termsNotes:
      '1. Technical datasheet provided on request.\n' +
      '2. 30-day warranty on manufacturing defects.\n' +
      '3. Payment: 100% advance for quantities below 20 units.',
    // status 'revised' — customer negotiated, admin sent a revised quote
    status:          'revised',
    sentAt:          new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt:       new Date(Date.now() - 1 * 86400000).toISOString(),
    negotiations: [
      {
        id:            'neg-seed-002',
        by:            'customer',
        proposedPrice: 7800,
        message:       'We found similar controllers at ₹7,800 from another vendor. Can you match or beat this price for our long-term requirement of 10 units per quarter?',
        timestamp:     new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id:            'neg-seed-003',
        by:            'admin',
        proposedPrice: 8100,
        message:       'Thank you for your interest. We have revised our quote to ₹8,100/unit, which includes extended 60-day warranty and free technical support. This is our best offer for this product at your quantity.',
        timestamp:     new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ],
  },
  {
    id:              'quot-seed-006',
    quotationNumber: 'QT-2026-000174',
    rfqNumber:       'RFQ-2026-000174',
    rfqId:           'rfq-seed-007',
    userId:          '__seed__',
    productName:     'Custom Aluminium Enclosure (200 × 150 × 80 mm)',
    productType:     'custom',
    quantity:        100,
    unitPrice:       420,
    discountPct:     0,
    taxPct:          18,
    shippingCharge:  1200,
    deliveryLocation: 'Mumbai, Maharashtra 400001',
    expectedDelivery: '2026-07-05',
    availableQty:    0,
    reservedQty:     0,
    incomingQty:     0,
    eta:             '',
    validUntil:      '2026-07-10',
    termsNotes:
      '1. DXF/STEP files required before fabrication.\n' +
      '2. 100% advance for custom enclosures.\n' +
      '3. Lead time: 15–20 business days.',
    // status 'rejected' — customer rejected this quotation
    status:          'rejected',
    sentAt:          new Date(Date.now() - 35 * 86400000).toISOString(),
    updatedAt:       new Date(Date.now() - 30 * 86400000).toISOString(),
    negotiations:    [],
  },
  // ── Invoice / Payment seeds ──────────────────────────────────────────────
  {
    id:              'quot-seed-007',
    quotationNumber: 'QT-2026-000501',
    rfqNumber:       'RFQ-2026-000501',
    rfqId:           'rfq-seed-008',
    userId:          '__seed__',
    productName:     'Arduino UNO R4 WiFi (Qty 30)',
    productType:     'existing',
    quantity:        30,
    unitPrice:       2499,
    discountPct:     5,
    taxPct:          18,
    shippingCharge:  0,
    deliveryLocation: 'Bengaluru, Karnataka 560034',
    expectedDelivery: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    availableQty:    80,
    reservedQty:     30,
    incomingQty:     0,
    eta:             '',
    validUntil:      new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    termsNotes:
      '1. GST invoice issued post acceptance.\n' +
      '2. Payment via NEFT/RTGS within 7 days of invoice.\n' +
      '3. Goods dispatched after payment confirmation.',
    // status 'invoice_sent' — GST invoice raised, awaiting customer payment
    status:          'invoice_sent',
    sentAt:          new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt:       new Date(Date.now() - 1 * 86400000).toISOString(),
    negotiations:    [],
  },
  {
    id:              'quot-seed-008',
    quotationNumber: 'QT-2026-000448',
    rfqNumber:       'RFQ-2026-000448',
    rfqId:           'rfq-seed-009',
    userId:          '__seed__',
    productName:     'Raspberry Pi 5 8GB (Qty 10)',
    productType:     'existing',
    quantity:        10,
    unitPrice:       7999,
    discountPct:     0,
    taxPct:          18,
    shippingCharge:  0,
    deliveryLocation: 'Pune, Maharashtra 411001',
    expectedDelivery: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    availableQty:    15,
    reservedQty:     10,
    incomingQty:     0,
    eta:             '',
    validUntil:      new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    termsNotes:
      '1. GST invoice issued; GSTIN: 27XYZAB1234C1Z0.\n' +
      '2. Full payment received via NEFT.\n' +
      '3. Goods ready for dispatch.',
    // status 'payment_confirmed' — payment received
    status:          'payment_confirmed',
    sentAt:          new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt:       new Date(Date.now() - 2 * 86400000).toISOString(),
    negotiations:    [],
  },
];

// ─── CRUD helpers ─────────────────────────────────────────────────────────────

export function getStoredQuotations(userId: string): MockQuotation[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(getKey(userId));
    if (raw) return JSON.parse(raw) as MockQuotation[];

    // Seed on first access
    const seeded = SEED_QUOTATIONS.map((q) => ({ ...q, userId }));
    localStorage.setItem(getKey(userId), JSON.stringify(seeded));
    return seeded;
  } catch {
    return [];
  }
}

export function saveQuotations(userId: string, quotations: MockQuotation[]) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(getKey(userId), JSON.stringify(quotations));
  } catch {
    // ignore
  }
}

export function getQuotationByRFQ(userId: string, rfqId: string): MockQuotation | null {
  return getStoredQuotations(userId).find((q) => q.rfqId === rfqId) ?? null;
}

export function updateQuotation(
  userId: string,
  quotId: string,
  patch: Partial<MockQuotation>,
) {
  const all = getStoredQuotations(userId);
  const next = all.map((q) =>
    q.id === quotId ? { ...q, ...patch, updatedAt: new Date().toISOString() } : q,
  );
  saveQuotations(userId, next);
  return next;
}

export function addNegotiationEntry(
  userId: string,
  quotId: string,
  entry: Omit<MockNegotiationEntry, 'id' | 'timestamp'>,
): MockQuotation[] {
  const all = getStoredQuotations(userId);
  const next = all.map((q) => {
    if (q.id !== quotId) return q;
    const newEntry: MockNegotiationEntry = {
      ...entry,
      id:        `neg-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    return {
      ...q,
      negotiations: [...q.negotiations, newEntry],
      status:       'negotiating' as MockQuotationStatus,
      updatedAt:    new Date().toISOString(),
    };
  });
  saveQuotations(userId, next);
  return next;
}
