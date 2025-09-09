export interface Quotation {
  id: string;
  reference: string;
  customer_id: string | null; // Changed to string | null
  warehouse_id: string | null; // Changed to string | null
  date: Date;
  valid_until?: Date;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  shipping: number;
  total: number;
  status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id: string;
  name: string;
  code: string;
  product_name?: string; // Add product_name
  product_code?: string; // Add product_code
  price: number;
  quantity: number;
  discount: number;
  tax: number;
  subtotal: number;
  created_at: Date;
}

export interface PaginatedQuotationsResponse {
  data: Quotation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}