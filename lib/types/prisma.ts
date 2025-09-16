/**
 * Generated Prisma types for the POS system
 * This file contains type definitions that match the Prisma schema
 */

import { Prisma } from '@prisma/client'

// Base enums from Prisma
export type Status = 'active' | 'inactive'
export type AdjustmentType = 'addition' | 'subtraction'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day'
export type ExpenseStatus = 'pending' | 'approved' | 'rejected'
export type PurchaseStatus = 'pending' | 'received' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'
export type SaleStatus = 'pending' | 'completed' | 'cancelled'
export type QuotationStatus = 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type TransferStatus = 'pending' | 'completed' | 'cancelled'
export type UserRole = 'admin' | 'manager' | 'user'

// Organization types
export type Organization = Prisma.organizationGetPayload<object>

export type CreateOrganizationInput = Prisma.organizationCreateInput
export type UpdateOrganizationInput = Prisma.organizationUpdateInput

// Organization with PDF-specific fields
export interface OrganizationPDF {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  fax?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postal_code?: string | null
  tax_number?: string | null
  registration_number?: string | null
  website?: string | null
  logo?: string | null
  bank_name?: string | null
  bank_account?: string | null
  bank_branch?: string | null
  swift_code?: string | null
  iban?: string | null
  invoice_prefix?: string | null
  quotation_prefix?: string | null
  invoice_footer?: string | null
  quotation_footer?: string | null
  terms_conditions?: string | null
  payment_terms?: string | null
  currency?: string | null
  currency_symbol?: string | null
  date_format?: string | null
  timezone?: string | null
  language?: string | null
}

// Quotation types with relations
export type Quotation = Prisma.quotationsGetPayload<{
  include: {
    customer: { select: { name: true } }
    warehouse: { select: { name: true } }
    items: true
  }
}>

export type QuotationWithCustomer = Prisma.quotationsGetPayload<{
  include: {
    customer: true
    warehouse: true
  }
}>

export type QuotationItem = Prisma.quotation_itemsGetPayload<{
  include: {
    product: { select: { name: true, code: true } }
  }
}>

export type CreateQuotationInput = {
  reference: string
  customer_id: number
  warehouse_id: number
  valid_until?: Date
  notes?: string
  subtotal?: number
  tax_amount?: number
  total: number
  items: CreateQuotationItemInput[]
}

export type CreateQuotationItemInput = {
  product_id: number
  quantity: number
  unit_price: number
  subtotal: number
  discount?: number
  tax?: number
}

export type UpdateQuotationInput = Partial<CreateQuotationInput>

// Invoice types with relations
export type Invoice = Prisma.invoicesGetPayload<{
  include: {
    customer: { select: { name: true } }
    warehouse: { select: { name: true } }
    sale: { select: { reference: true } }
    quotation: { select: { reference: true } }
    items: true
  }
}>

export type InvoiceWithCustomer = Prisma.invoicesGetPayload<{
  include: {
    customer: true
    warehouse: true
    sale: true
    quotation: true
  }
}>

export type InvoiceItem = Prisma.invoice_itemsGetPayload<{
  include: {
    product: { select: { name: true, code: true } }
  }
}>

export type CreateInvoiceInput = {
  reference: string
  customer_id: number
  warehouse_id: number
  sale_id?: number
  quotation_id?: number
  date: string
  due_date?: string
  subtotal?: number
  tax_rate?: number
  tax_amount?: number
  discount?: number
  shipping?: number
  total: number
  paid?: number
  due?: number
  status?: InvoiceStatus
  payment_status?: PaymentStatus
  notes?: string
  created_by?: number
  items: {
    product_id: number
    quantity: number
    unit_price: number
    discount?: number
    tax?: number
    subtotal: number
  }[]
}

export type UpdateInvoiceInput = Partial<CreateInvoiceInput>

// Customer types
export type Customer = Prisma.customersGetPayload<object>
export type CreateCustomerInput = Prisma.customersCreateInput
export type UpdateCustomerInput = Prisma.customersUpdateInput

// Product types
export type Product = Prisma.productsGetPayload<{
  include: {
    category: { select: { name: true } }
    brand: { select: { name: true } }
    unit: { select: { name: true, short_name: true } }
    warehouse: { select: { name: true } }
  }
}>

export type ProductBasic = Prisma.productsGetPayload<object>
export type CreateProductInput = Prisma.productsCreateInput
export type UpdateProductInput = Prisma.productsUpdateInput

// Sale types
export type Sale = Prisma.salesGetPayload<{
  include: {
    customer: { select: { name: true } }
    warehouse: { select: { name: true } }
    items: {
      include: {
        product: { select: { name: true, code: true } }
      }
    }
  }
}>

export type SaleItem = Prisma.sale_itemsGetPayload<{
  include: {
    product: { select: { name: true, code: true } }
  }
}>

export type CreateSaleInput = {
  reference: string
  customer_id?: number
  warehouse_id: number
  notes?: string
  subtotal?: number
  tax_amount?: number
  total: number
  payment_status: PaymentStatus
  status: SaleStatus
  items: CreateSaleItemInput[]
}

export type CreateSaleItemInput = {
  product_id: number
  quantity: number
  unit_price: number
  subtotal: number
  discount?: number
  tax?: number
}

export type UpdateSaleInput = Partial<CreateSaleInput>

// Purchase types
export type Purchase = Prisma.purchasesGetPayload<{
  include: {
    supplier: { select: { name: true } }
    warehouse: { select: { name: true } }
    items: {
      include: {
        product: { select: { name: true, code: true } }
      }
    }
  }
}>

export type PurchaseItem = Prisma.purchase_itemsGetPayload<{
  include: {
    product: { select: { name: true, code: true } }
  }
}>

export type CreatePurchaseInput = {
  reference: string
  supplier_id: number
  warehouse_id: number
  notes?: string
  subtotal?: number
  tax_amount?: number
  total: number
  payment_status: PaymentStatus
  status: PurchaseStatus
  items: CreatePurchaseItemInput[]
}

export type CreatePurchaseItemInput = {
  product_id: number
  quantity: number
  unit_price: number
  subtotal: number
  discount?: number
  tax?: number
}

export type UpdatePurchaseInput = Partial<CreatePurchaseInput>

// Supplier types
export type Supplier = Prisma.suppliersGetPayload<{}>
export type CreateSupplierInput = Prisma.suppliersCreateInput
export type UpdateSupplierInput = Prisma.suppliersUpdateInput

// Settings types
export type Brand = Prisma.brandsGetPayload<object>
export type CreateBrandInput = Prisma.brandsCreateInput
export type UpdateBrandInput = Prisma.brandsUpdateInput

export type Category = Prisma.categoriesGetPayload<object>
export type CreateCategoryInput = Prisma.categoriesCreateInput
export type UpdateCategoryInput = Prisma.categoriesUpdateInput

export type Currency = Prisma.currenciesGetPayload<object>
export type CreateCurrencyInput = Prisma.currenciesCreateInput
export type UpdateCurrencyInput = Prisma.currenciesUpdateInput

export type Unit = Prisma.unitsGetPayload<object>
export type CreateUnitInput = Prisma.unitsCreateInput
export type UpdateUnitInput = Prisma.unitsUpdateInput

export type Warehouse = Prisma.warehousesGetPayload<object>
export type CreateWarehouseInput = Prisma.warehousesCreateInput
export type UpdateWarehouseInput = Prisma.warehousesUpdateInput

// User types
export type User = Prisma.usersGetPayload<object>

// Adjustment types
export type Adjustment = Prisma.adjustmentsGetPayload<{
  include: {
    warehouse: { select: { name: true } }
    items: {
      include: {
        product: { select: { name: true, code: true } }
      }
    }
  }
}>

export type AdjustmentItem = Prisma.adjustment_itemsGetPayload<{
  include: {
    product: { select: { name: true, code: true } }
  }
}>

export type CreateAdjustmentInput = {
  reference: string
  warehouse_id: number
  type: AdjustmentType
  notes?: string
  items: CreateAdjustmentItemInput[]
}

export type CreateAdjustmentItemInput = {
  product_id: number
  quantity: number
}

export type UpdateAdjustmentInput = Partial<CreateAdjustmentInput>

// Expense types
export type Expense = Prisma.expensesGetPayload<{
  include: {
    category: { select: { name: true } }
  }
}>

export type CreateExpenseInput = Prisma.expensesCreateInput
export type UpdateExpenseInput = Prisma.expensesUpdateInput

// Transfer types
export type Transfer = Prisma.transfersGetPayload<{
  include: {
    fromWarehouse: { select: { name: true } }
    toWarehouse: { select: { name: true } }
    items: {
      include: {
        product: { select: { name: true, code: true } }
      }
    }
  }
}>

// Pagination response type
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// API Response types
export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export type ApiError = {
  error: string
  message?: string
  statusCode?: number
}

// Search types
export interface SearchParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface QuotationSearchParams extends SearchParams {
  customer_id?: number
  warehouse_id?: number
  status?: QuotationStatus
  date_from?: string
  date_to?: string
}

export interface InvoiceSearchParams extends SearchParams {
  customer_id?: number
  warehouse_id?: number
  sale_id?: number
  quotation_id?: number
  status?: InvoiceStatus
  payment_status?: PaymentStatus
  date_from?: string
  date_to?: string
  due_date_from?: string
  due_date_to?: string
}

export interface ProductSearchParams extends SearchParams {
  category_id?: number
  brand_id?: number
  warehouse_id?: number
  status?: Status
  low_stock?: boolean
}

export interface SaleSearchParams extends SearchParams {
  customer_id?: number
  warehouse_id?: number
  status?: SaleStatus
  payment_status?: PaymentStatus
  date_from?: string
  date_to?: string
}

export interface PurchaseSearchParams extends SearchParams {
  supplier_id?: number
  warehouse_id?: number
  status?: PurchaseStatus
  payment_status?: PaymentStatus
  date_from?: string
  date_to?: string
}

export interface CustomerSearchParams extends SearchParams {
  name?: string
  email?: string
  phone?: string
}

export interface SupplierSearchParams extends SearchParams {
  name?: string
  email?: string
  phone?: string
}

export interface AdjustmentSearchParams extends SearchParams {
  warehouse_id?: number
  type?: AdjustmentType
  date_from?: string
  date_to?: string
}

export interface ExpenseSearchParams extends SearchParams {
  category_id?: number
  status?: ExpenseStatus
  date_from?: string
  date_to?: string
}