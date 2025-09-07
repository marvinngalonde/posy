interface SaleItem {
  product_id: string
  name: string
  quantity: number
  unit_price: number
  discount: number
  tax: number
  subtotal: number
}

interface Sale {
  id: string
  reference: string
  customer_id?: string | null // Make optional and allow null
  warehouse_id?: string | null // Make optional and allow null
  date: string
  items: SaleItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount: number
  shipping: number
  total: number
  paid: number
  due: number
  status: string
  payment_status: string
  notes?: string | null // Make optional and allow null
  created_by?: string | null // Make optional and allow null
  created_at: string
  updated_at: string
}

interface PaginatedSalesResponse {
  data: Sale[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export type {
  SaleItem,
  Sale,
  PaginatedSalesResponse
}
