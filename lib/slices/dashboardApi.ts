import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface DashboardStats {
  total_customers: number
  total_suppliers: number
  total_employees: number
  total_products: number
  total_sales: number
  total_purchases: number
  total_expenses: number
  todays_sales: number
  todays_purchases: number
  todays_expenses: number
}

export interface TopProduct {
  id: number
  name: string
  code: string
  units_sold: number
  revenue: number
}

export interface LowStockProduct {
  id: number
  name: string
  code: string
  current_stock: number
  min_stock: number
  warehouse_name: string
}

export interface RecentTransaction {
  id: number
  type: 'sale' | 'purchase' | 'expense'
  reference: string
  amount: number
  date: string
  status: string
  description?: string
}

export interface SalesChart {
  date: string
  sales: number
  purchases: number
}

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/dashboard' }),
  tagTypes: ['DashboardStats', 'TopProducts', 'LowStock', 'RecentTransactions', 'SalesChart'],
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/stats',
      providesTags: ['DashboardStats'],
    }),
    getTopProducts: builder.query<TopProduct[], { period?: string; limit?: number }>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.period) searchParams.append('period', params.period)
        if (params.limit) searchParams.append('limit', params.limit.toString())
        return `/top-products?${searchParams.toString()}`
      },
      providesTags: ['TopProducts'],
    }),
    getLowStockProducts: builder.query<LowStockProduct[], { limit?: number }>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.limit) searchParams.append('limit', params.limit.toString())
        return `/low-stock?${searchParams.toString()}`
      },
      providesTags: ['LowStock'],
    }),
    getRecentTransactions: builder.query<RecentTransaction[], { limit?: number }>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.limit) searchParams.append('limit', params.limit.toString())
        return `/recent-transactions?${searchParams.toString()}`
      },
      providesTags: ['RecentTransactions'],
    }),
    getSalesChart: builder.query<SalesChart[], { days?: number }>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.days) searchParams.append('days', params.days.toString())
        return `/sales-chart?${searchParams.toString()}`
      },
      providesTags: ['SalesChart'],
    }),
  }),
})

export const {
  useGetDashboardStatsQuery,
  useGetTopProductsQuery,
  useGetLowStockProductsQuery,
  useGetRecentTransactionsQuery,
  useGetSalesChartQuery,
} = dashboardApi