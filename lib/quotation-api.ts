/**
 * ElectroHub — Quotation Maker API client
 * Centralised helper functions wrapping the backend /api/quotations/ endpoints.
 * Used by both customer-facing (AccountRFQs, AccountQuotations, B2BPayment)
 * and admin-facing (AdminRFQs, AdminQuotationBuilder, AdminApprovals, etc.) components.
 */

import { api } from '@/lib/api';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('electrohub_access_token') ?? '';
}

export type RFQStatus =
  | 'submitted' | 'under_review' | 'quoted' | 'accepted'
  | 'rejected' | 'payment_pending' | 'order_placed';

export type QuotationStatus =
  | 'draft' | 'sent' | 'viewed' | 'negotiating' | 'revised'
  | 'accepted' | 'rejected' | 'invoice_sent' | 'partially_paid' | 'payment_confirmed';

export type ApprovalStatus =
  | 'hod_review' | 'director_review' | 'accountant_review' | 'po_ready' | 'rejected';

export interface NegotiationEntry {
  id:             number;
  by:             'customer' | 'admin';
  proposed_price: string;
  message:        string;
  timestamp:      string;
}

export interface QuotationItem {
  id:                  number;
  quotation:           number;
  product?:            number;
  product_name:        string;
  product_display?:    { id: number; name: string; sku: string } | null;
  vendor?:             number;
  vendor_name?:        string | null;
  vendor_quote_ref:    string;
  quantity:            number;
  unit_price:          string;
  discount_pct:        string;
  tax_pct:             string;
  availability_qty:    number;
  available_from?:     string | null;
  hsn_code:            string;
  notes:               string;
  line_total:          number;
  line_total_with_tax: number;
  created_at:          string;
  updated_at:          string;
}

export interface QuotationItemCreate {
  quotation:         number;
  product?:          number;
  product_name:      string;
  vendor?:           number;
  vendor_quote_ref?: string;
  quantity:          number;
  unit_price:        string | number;
  discount_pct?:     string | number;
  tax_pct?:          string | number;
  availability_qty?: number;
  available_from?:   string;
  hsn_code?:         string;
  notes?:            string;
}

export interface AvailabilityResult {
  product_id:    number;
  product_name:  string;
  available_qty: number;
  requested_qty: number;
  can_fulfill:   boolean;
  shortfall:     number;
  available:     boolean;
}

export interface RFQ {
  id:                   number;
  rfq_number:           string;
  customer:             number;
  customer_name:        string;
  customer_email:       string;
  customer_phone?:      string;
  product_type:         'existing' | 'custom';
  product?:             number;
  custom_product_name:  string;
  reference_url:        string;
  product_name:         string;
  quantity:             number;
  required_by_date:     string;
  delivery_location:    string;
  budget?:              string;
  technical_specs:      string;
  additional_notes:     string;
  status:               RFQStatus;
  submitted_at:         string;
  updated_at:           string;
  has_quotation:        boolean;
}

export interface RFQCreatePayload {
  product_type:         'existing' | 'custom';
  product?:             number;
  custom_product_name?: string;
  reference_url?:       string;
  quantity:             number;
  required_by_date:     string;
  delivery_location:    string;
  budget?:              string;
  technical_specs?:     string;
  additional_notes?:    string;
}

export interface Quotation {
  id:                number;
  quotation_number:  string;
  rfq:               number;
  rfq_number:        string;
  customer_name:     string;
  customer_email:    string;
  customer_phone?:   string;
  product_name:      string;
  product_type:      'existing' | 'custom';
  quantity:          number;
  unit_price:        string;
  discount_pct:      string;
  tax_pct:           string;
  shipping_charge:   string;
  delivery_location: string;
  expected_delivery?: string;
  valid_until?:      string;
  available_qty:     number;
  reserved_qty:      number;
  incoming_qty:      number;
  eta?:              string;
  terms_notes:       string;
  status:            QuotationStatus;
  grand_total:       number;
  paid_amount:       number;
  pending_amount:    number;
  items:             QuotationItem[];
  negotiations:      NegotiationEntry[];
  approval?:         QuotationApproval;
  invoice?:          Invoice;
  sent_at?:          string;
  created_at:        string;
  updated_at:        string;
}

export interface ApprovalEntry {
  id:            number;
  approver_role: 'HOD' | 'Director' | 'Accountant';
  action:        'approved' | 'rejected';
  remarks:       string;
  actor_name:    string;
  timestamp:     string;
}

export interface QuotationApproval {
  id:              number;
  quotation:       number;
  approval_status: ApprovalStatus;
  entries:         ApprovalEntry[];
  created_at:      string;
  updated_at:      string;
}

export interface PurchaseOrder {
  id:             number;
  po_number:      string;
  quotation:      number;
  quotation_data: Quotation;
  status:         'pending' | 'issued' | 'acknowledged' | 'accepted' | 'rejected' | 'processing';
  issued_at?:     string;
  log:            Array<{ id: number; action: string; actor_name: string; notes: string; timestamp: string }>;
  created_at:     string;
}

export interface InvoiceLogEntry {
  id:         number;
  action:     string;
  actor_name: string;
  notes:      string;
  timestamp:  string;
}

export interface Invoice {
  id:              number;
  invoice_number:  string;
  quotation:       number;
  quotation_data:  Quotation;
  purchase_order?: number;
  status:          'draft' | 'sent' | 'payment_confirmed';
  due_date?:       string;
  gstin_buyer:     string;
  hsn_code:        string;
  paid_at?:        string;
  utr_number:      string;
  grand_total:     number;
  log:             InvoiceLogEntry[];
  created_at:      string;
  updated_at:      string;
}

export interface VendorNotifyLog {
  id:              number;
  quotation:       number;
  vendor:          number;
  vendor_name:     string;
  vendor_email:    string;
  message_subject: string;
  message_body:    string;
  sent_at:         string;
  sent_by_name:    string;
}

export interface DashboardStats {
  total_rfqs:         number;
  pending_rfqs:       number;
  under_review_rfqs:  number;
  quoted_rfqs:        number;
  total_quotations:   number;
  pending_approval:   number;
  po_ready:           number;
  invoices_sent:      number;
  payments_confirmed: number;
  total_orders:       number;
  pending_orders:     number;
}

export const customerQuotationApi = {
  listRFQs:  () => api.get<RFQ[]>('/quotations/rfq/', { token: getToken() }),
  getRFQ:    (id: number) => api.get<RFQ>(`/quotations/rfq/${id}/`, { token: getToken() }),
  submitRFQ: (data: RFQCreatePayload) => api.post<RFQ>('/quotations/rfq/', data, { token: getToken() }),
  updateRFQ: (id: number, data: Partial<RFQCreatePayload>) => api.patch<RFQ>(`/quotations/rfq/${id}/`, data, { token: getToken() }),
  checkAvailability: (productId: number, quantity: number) => api.get<AvailabilityResult>(`/quotations/availability/?product_id=${productId}&quantity=${quantity}`, { token: getToken() }),
  listQuotations: () => api.get<Quotation[]>('/quotations/', { token: getToken() }),
  getQuotation:   (id: number) => api.get<Quotation>(`/quotations/${id}/`, { token: getToken() }),
  acceptQuotation:  (id: number) => api.patch<Quotation>(`/quotations/${id}/accept/`, {}, { token: getToken() }),
  rejectQuotation:  (id: number) => api.patch<Quotation>(`/quotations/${id}/reject/`, {}, { token: getToken() }),
  negotiateQuotation: (id: number, proposedPrice: number, message: string) => api.post<Quotation>(`/quotations/${id}/negotiate/`, { proposed_price: proposedPrice, message }, { token: getToken() }),
  recordPayment: (id: number, utrNumber: string) => api.post<Quotation>(`/quotations/${id}/payment/`, { utr_number: utrNumber }, { token: getToken() }),
  listItems: (quotationId: number) => api.get<QuotationItem[]>(`/quotations/${quotationId}/items/`, { token: getToken() }),
  submitPayment: (quotationId: number, payload: { amount: number; payment_method: string; utr_reference: string; payment_date: string; notes?: string }) => api.post(`/quotations/${quotationId}/submit-payment/`, payload, { token: getToken() }),
};

export const adminQuotationApi = {
  getDashboardStats: () => api.get<DashboardStats>('/admin/dashboard/stats/', { token: getToken() }),
  listRFQs: (params?: Record<string, string>) => { const qs = params ? '?' + new URLSearchParams(params).toString() : ''; return api.get<RFQ[]>(`/admin/rfq/${qs}`, { token: getToken() }); },
  updateRFQStatus: (id: number, rfqStatus: string) => api.patch<RFQ>(`/admin/rfq/${id}/status/`, { status: rfqStatus }, { token: getToken() }),
  listQuotations: (params?: Record<string, string>) => { const qs = params ? '?' + new URLSearchParams(params).toString() : ''; return api.get<Quotation[]>(`/admin/quotations/${qs}`, { token: getToken() }); },
  createQuotation: (data: Partial<Quotation>) => api.post<Quotation>('/admin/quotations/', data, { token: getToken() }),
  updateQuotation: (id: number, data: Partial<Quotation>) => api.patch<Quotation>(`/admin/quotations/${id}/`, data, { token: getToken() }),
  sendQuotation: (id: number) => api.post<Quotation>(`/admin/quotations/${id}/send/`, {}, { token: getToken() }),
  counterNegotiate: (id: number, proposedPrice: number, message: string) => api.post<Quotation>(`/admin/quotations/${id}/negotiate/`, { proposed_price: proposedPrice, message }, { token: getToken() }),
  listItems: (quotationId: number) => api.get<QuotationItem[]>(`/admin/quotations/${quotationId}/items/`, { token: getToken() }),
  addItem: (quotationId: number, data: Omit<QuotationItemCreate, 'quotation'>) => api.post<QuotationItem>(`/admin/quotations/${quotationId}/items/`, data, { token: getToken() }),
  updateItem: (quotationId: number, itemId: number, data: Partial<QuotationItemCreate>) => api.patch<QuotationItem>(`/admin/quotations/${quotationId}/items/${itemId}/`, data, { token: getToken() }),
  removeItem: (quotationId: number, itemId: number) => api.delete<void>(`/admin/quotations/${quotationId}/items/${itemId}/`, { token: getToken() }),
  approveQuotation: (id: number, remarks: string) => api.post<QuotationApproval>(`/admin/quotations/${id}/approve/`, { remarks }, { token: getToken() }),
  rejectApproval: (id: number, remarks: string) => api.post<QuotationApproval>(`/admin/quotations/${id}/reject-approval/`, { remarks }, { token: getToken() }),
  listPOs: () => api.get<PurchaseOrder[]>('/admin/purchase-orders/', { token: getToken() }),
  issuePO: (id: number, notes?: string) => api.post<PurchaseOrder>(`/admin/quotations/${id}/po/issue/`, { notes: notes ?? '' }, { token: getToken() }),
  listInvoices:  () => api.get<Invoice[]>('/admin/invoices/', { token: getToken() }),
  createInvoice: (id: number, data: { due_date?: string; gstin_buyer?: string; hsn_code?: string }) => api.post<Invoice>(`/admin/quotations/${id}/invoice/create/`, data, { token: getToken() }),
  sendInvoice: (id: number) => api.post<Invoice>(`/admin/quotations/${id}/invoice/send/`, {}, { token: getToken() }),
  confirmPayment: (id: number, utr?: string) => api.post<Invoice>(`/admin/quotations/${id}/invoice/confirm-payment/`, { utr_number: utr ?? '' }, { token: getToken() }),
  notifyVendors: (quotationId: number, vendorIds: number[], messageSubject: string, messageBody?: string) => api.post<VendorNotifyLog[]>(`/admin/quotations/${quotationId}/vendor-notify/`, { vendor_ids: vendorIds, message_subject: messageSubject, message_body: messageBody ?? '' }, { token: getToken() }),
};