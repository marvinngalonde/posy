import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// FDMS Configuration Types
export interface FDMSConfig {
  id: number
  taxpayerTIN: string
  vatRegistrationNo?: string
  businessName: string
  businessType: string
  branchName: string
  branchAddress: {
    street: string
    city: string
    province: string
    country: string
  }
  status: 'pending' | 'approved' | 'active' | 'suspended'
  isFDMSEnabled: boolean
  testEnvironment: boolean
  hasActiveFiscalDevice: boolean
  fiscalDevice?: {
    deviceId: string
    deviceSerialNo: string
    status: string
    globalReceiptCounter: string
    dailyReceiptCounter: number
  }
}

export interface FDMSConfigRequest {
  taxpayerTIN: string
  vatRegistrationNo?: string
  businessName: string
  businessType: string
  branchName: string
  branchAddress: {
    street: string
    city: string
    province: string
    country: string
  }
  testEnvironment?: boolean
  isFDMSEnabled?: boolean
}

export interface FDMSInvoiceRequest {
  invoiceNo: string
  total: number
  currency?: string
  customer?: {
    tin?: string
    name?: string
  }
  items: {
    name: string
    quantity: number
    price: number
    taxRate?: number
    taxId?: number
    hsCode?: string
  }[]
  saleId?: number
}

export interface FDMSInvoiceResponse {
  receiptGlobalNo: string
  qrCode: {
    data: any
    qrString: string
    qrCodeUrl: string
  }
  verificationUrl?: string
  status: string
  fdmsMode: boolean
  message?: string
}

export interface FiscalTransaction {
  id: string
  receipt_global_no: string
  receipt_type: string
  invoice_no: string
  receipt_total: number
  tax_amount: number
  receipt_date: string
  zimra_status: string
  buyer_name?: string
  device_id: string
  error_message?: string
  retry_count: number
}

export interface FDMSStatus {
  configured: boolean
  fdmsEnabled: boolean
  status: 'not_configured' | 'configured' | 'active' | 'warning' | 'offline' | 'error'
  message: string
  config?: {
    taxpayerTIN: string
    businessName: string
    businessType: string
    testEnvironment: boolean
    configStatus: string
  }
  device?: {
    deviceId: string
    deviceSerialNo: string
    status: string
    operatingMode: string
    globalReceiptCounter: string
    dailyReceiptCounter: number
    fiscalDayOpened?: string
  }
  statistics: {
    totalTransactions: number
    todayTransactions: number
    pendingTransactions: number
    failedTransactions: number
    offlineQueueSize: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export const fdmsApi = createApi({
  reducerPath: 'fdmsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v2/fdms' }),
  tagTypes: ['FDMSConfig', 'FDMSStatus', 'FiscalTransactions'],
  endpoints: (builder) => ({
    // Configuration endpoints
    getFDMSConfig: builder.query<ApiResponse<FDMSConfig>, void>({
      query: () => '/config',
      providesTags: ['FDMSConfig'],
    }),

    createFDMSConfig: builder.mutation<ApiResponse<FDMSConfig>, FDMSConfigRequest>({
      query: (config) => ({
        url: '/config',
        method: 'POST',
        body: config,
      }),
      invalidatesTags: ['FDMSConfig', 'FDMSStatus'],
    }),

    toggleFDMSMode: builder.mutation<ApiResponse<FDMSConfig>, { isFDMSEnabled: boolean }>({
      query: (params) => ({
        url: '/config',
        method: 'PATCH',
        body: params,
      }),
      invalidatesTags: ['FDMSConfig', 'FDMSStatus'],
    }),

    // Status endpoints
    getFDMSStatus: builder.query<ApiResponse<FDMSStatus>, void>({
      query: () => '/status',
      providesTags: ['FDMSStatus'],
    }),

    performFDMSAction: builder.mutation<ApiResponse<{ message: string }>, { action: string }>({
      query: (params) => ({
        url: '/status',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['FDMSStatus', 'FiscalTransactions'],
    }),

    // Invoice endpoints
    submitFiscalInvoice: builder.mutation<ApiResponse<FDMSInvoiceResponse>, FDMSInvoiceRequest>({
      query: (invoice) => ({
        url: '/invoice',
        method: 'POST',
        body: invoice,
      }),
      invalidatesTags: ['FiscalTransactions', 'FDMSStatus'],
    }),

    getFiscalTransactions: builder.query<ApiResponse<{
      transactions: FiscalTransaction[]
      summary: {
        totalTransactions: number
        fdmsEnabled: boolean
        configStatus: string
      }
    }>, { limit?: number; status?: string }>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.limit) searchParams.append('limit', params.limit.toString())
        if (params.status) searchParams.append('status', params.status)
        return `/invoice?${searchParams.toString()}`
      },
      providesTags: ['FiscalTransactions'],
    }),
  }),
})

export const {
  useGetFDMSConfigQuery,
  useCreateFDMSConfigMutation,
  useToggleFDMSModeMutation,
  useGetFDMSStatusQuery,
  usePerformFDMSActionMutation,
  useSubmitFiscalInvoiceMutation,
  useGetFiscalTransactionsQuery,
} = fdmsApi