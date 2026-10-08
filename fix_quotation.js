const fs = require('fs');

const mappings = [
  [/MockQuotationStatus/g, 'QuotationStatus'],
  [/MockQuotation/g, 'Quotation'],
  [/quotationNumber/g, 'quotation_number'],
  [/rfqNumber/g, 'rfq_number'],
  [/productName/g, 'product_name'],
  [/productType/g, 'product_type'],
  [/unitPrice/g, 'unit_price'],
  [/discountPct/g, 'discount_pct'],
  [/taxPct/g, 'tax_pct'],
  [/shippingCharge/g, 'shipping_charge'],
  [/deliveryLocation/g, 'delivery_location'],
  [/expectedDelivery/g, 'expected_delivery'],
  [/validUntil/g, 'valid_until'],
  [/availableQty/g, 'available_qty'],
  [/reservedQty/g, 'reserved_qty'],
  [/incomingQty/g, 'incoming_qty'],
  [/termsNotes/g, 'terms_notes'],
  [/sentAt/g, 'sent_at'],
  [/updatedAt/g, 'updated_at'],
  [/grandTotal/g, 'grand_total'],
  [/referenceUrl/g, 'reference_url'],
  [/proposedPrice/g, 'proposed_price']
];

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (file.includes('QuotationDetail.tsx')) {
    content = content.replace(/import \{\n  type MockQuotation,\n  type MockQuotationStatus,\n  type QuotationTotals,\n  calcQuotationTotals,\n\} from '\.\/mockQuotations';/g, 
`import { Quotation, QuotationStatus } from '@/lib/quotation-api';

interface QuotationTotals {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  shipping: number;
  grandTotal: number;
}

export function calcQuotationTotals(q: Quotation): QuotationTotals {
  const qty = q.quantity || 0;
  const unit = Number(q.unit_price) || 0;
  const discPct = Number(q.discount_pct) || 0;
  const taxPct = Number(q.tax_pct) || 0;
  const shipping = Number(q.shipping_charge) || 0;

  const subtotal = qty * unit;
  const discount = subtotal * (discPct / 100);
  const taxable = subtotal - discount;
  const tax = taxable * (taxPct / 100);
  const grandTotal = taxable + tax + shipping;

  return { subtotal, discount, taxable, tax, shipping, grandTotal };
}`);
  }

  if (file.includes('B2BPayment.tsx')) {
    content = content.replace(/import \{\n  type MockQuotation,\n  calcQuotationTotals,\n\} from '\.\/mockQuotations';/g, 
`import { Quotation } from '@/lib/quotation-api';

export function calcQuotationTotals(q: Quotation) {
  const qty = q.quantity || 0;
  const unit = Number(q.unit_price) || 0;
  const discPct = Number(q.discount_pct) || 0;
  const taxPct = Number(q.tax_pct) || 0;
  const shipping = Number(q.shipping_charge) || 0;

  const subtotal = qty * unit;
  const discount = subtotal * (discPct / 100);
  const taxable = subtotal - discount;
  const tax = taxable * (taxPct / 100);
  const grandTotal = taxable + tax + shipping;

  return { subtotal, discount, taxable, tax, shipping, grandTotal };
}`);
    content = content.replace(/import \{ type MockQuotation, calcQuotationTotals \} from '\.\/mockQuotations';/g, 
`import { Quotation } from '@/lib/quotation-api';

export function calcQuotationTotals(q: Quotation) {
  const qty = q.quantity || 0;
  const unit = Number(q.unit_price) || 0;
  const discPct = Number(q.discount_pct) || 0;
  const taxPct = Number(q.tax_pct) || 0;
  const shipping = Number(q.shipping_charge) || 0;

  const subtotal = qty * unit;
  const discount = subtotal * (discPct / 100);
  const taxable = subtotal - discount;
  const tax = taxable * (taxPct / 100);
  const grandTotal = taxable + tax + shipping;

  return { subtotal, discount, taxable, tax, shipping, grandTotal };
}`);
  }

  for (const [regex, replacement] of mappings) {
    content = content.replace(regex, replacement);
  }
  
  // Custom fix for unit_price type (might be string in API)
  content = content.replace(/fmtINR\(quotation\.unit_price\)/g, "fmtINR(Number(quotation.unit_price))");
  content = content.replace(/fmtINR\(entry\.proposed_price\)/g, "fmtINR(Number(entry.proposed_price))");
  content = content.replace(/quotation\.unit_price - parseFloat\(price\)/g, "Number(quotation.unit_price) - parseFloat(price)");
  content = content.replace(/quotation\.unit_price \* 100/g, "Number(quotation.unit_price) * 100");
  content = content.replace(/parseFloat\(price\) < quotation\.unit_price/g, "parseFloat(price) < Number(quotation.unit_price)");
  content = content.replace(/parseFloat\(price\) !== quotation\.unit_price/g, "parseFloat(price) !== Number(quotation.unit_price)");
  content = content.replace(/setPrice\(String\(quotation\.unit_price\)\)/g, "setPrice(String(quotation.unit_price))");

  fs.writeFileSync(file, content, 'utf8');
}

['QuotationDetail.tsx', 'B2BPayment.tsx'].forEach(processFile);
console.log('Done');
