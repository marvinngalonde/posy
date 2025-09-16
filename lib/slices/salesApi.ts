import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Sale,
  CreateSaleInput,
  UpdateSaleInput,
  PaginatedResponse,
  SaleSearchParams
} from '@/lib/types/prisma';

export const salesApi = createApi({
  reducerPath: 'salesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v2/pos/sales' }),
  tagTypes: ['Sale'],
  endpoints: (builder) => ({
    getSales: builder.query<PaginatedResponse<Sale>, SaleSearchParams>({
        query: (params) => {
          const searchParams = new URLSearchParams()
          if (params.page) searchParams.append('page', params.page.toString())
          if (params.limit) searchParams.append('limit', params.limit.toString())
          if (params.search) searchParams.append('search', params.search)
          if (params.customer_id) searchParams.append('customer_id', params.customer_id.toString())
          if (params.warehouse_id) searchParams.append('warehouse_id', params.warehouse_id.toString())
          if (params.status) searchParams.append('status', params.status)
          if (params.payment_status) searchParams.append('payment_status', params.payment_status)
          if (params.date_from) searchParams.append('date_from', params.date_from)
          if (params.date_to) searchParams.append('date_to', params.date_to)
          if (params.sortBy) searchParams.append('sortBy', params.sortBy)
          if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder)
          return `?${searchParams.toString()}`
        },
        providesTags: (result) =>
            result
                ? [
                    ...result.data.map(({ id }) => ({ type: 'Sale' as const, id })),
                    { type: 'Sale', id: 'LIST' },
                ]
                : [{ type: 'Sale', id: 'LIST' }],
    }),
    getSaleById: builder.query<Sale, number | string>({
      query: (id) => `?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Sale', id }],
    }),
    createSale: builder.mutation<Sale, CreateSaleInput>({
      query: (saleData) => ({
        url: '',
        method: 'POST',
        body: saleData,
      }),
      invalidatesTags: [{ type: 'Sale', id: 'LIST' }],
    }),
    updateSale: builder.mutation<Sale, { id: number | string; data: UpdateSaleInput }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Sale', id }, { type: 'Sale', id: 'LIST' }],
    }),
    updateSalePartial: builder.mutation<Sale, { id: number | string; data: Partial<UpdateSaleInput> }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Sale', id }, { type: 'Sale', id: 'LIST' }],
    }),
    deleteSale: builder.mutation<{ success: boolean; message: string }, number | string>({
      query: (id) => ({
        url: `?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Sale', id }, { type: 'Sale', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetSalesQuery,
  useGetSaleByIdQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useUpdateSalePartialMutation,
  useDeleteSaleMutation,
} = salesApi;