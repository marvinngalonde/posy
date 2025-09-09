interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  name: string;
  code: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  subtotal: number;
}

interface Invoice {
  id: string;
  reference: string;
  date: string;
  customer_id: string;
  customer_name?: string;
  warehouse_id: string;
  warehouse_name?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  shipping: number;
  total: number;
  paid: number;
  due: number;
  status: string; // e.g., 'paid', 'unpaid', 'partial'
  payment_status: string;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

interface PaginatedInvoicesResponse {
  data: Invoice[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export type {
  InvoiceItem,
  Invoice,
  PaginatedInvoicesResponse
}
