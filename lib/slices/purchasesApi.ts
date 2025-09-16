import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Purchase,
  CreatePurchaseInput,
  UpdatePurchaseInput,
  PaginatedResponse,
  PurchaseSearchParams
} from '@/lib/types/prisma';

export const purchasesApi = createApi({
  reducerPath: 'purchasesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v2/purchases' }),
  tagTypes: ['Purchase'],
  endpoints: (builder) => ({
    getPurchases: builder.query<PaginatedResponse<Purchase>, PurchaseSearchParams>({
        query: (params) => {
          const searchParams = new URLSearchParams()
          if (params.page) searchParams.append('page', params.page.toString())
          if (params.limit) searchParams.append('limit', params.limit.toString())
          if (params.search) searchParams.append('search', params.search)
          if (params.supplier_id) searchParams.append('supplier_id', params.supplier_id.toString())
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
                    ...result.data.map(({ id }) => ({ type: 'Purchase' as const, id })),
                    { type: 'Purchase', id: 'LIST' },
                ]
                : [{ type: 'Purchase', id: 'LIST' }],
    }),
    getPurchaseById: builder.query<Purchase, number | string>({
      query: (id) => `?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Purchase', id }],
    }),
    createPurchase: builder.mutation<Purchase, CreatePurchaseInput>({
      query: (purchaseData) => ({
        url: '',
        method: 'POST',
        body: purchaseData,
      }),
      invalidatesTags: [{ type: 'Purchase', id: 'LIST' }],
    }),
    updatePurchase: builder.mutation<Purchase, { id: number | string; data: UpdatePurchaseInput }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Purchase', id }, { type: 'Purchase', id: 'LIST' }],
    }),
    updatePurchasePartial: builder.mutation<Purchase, { id: number | string; data: Partial<UpdatePurchaseInput> }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Purchase', id }, { type: 'Purchase', id: 'LIST' }],
    }),
    deletePurchase: builder.mutation<{ success: boolean; message: string }, number | string>({
      query: (id) => ({
        url: `?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Purchase', id }, { type: 'Purchase', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetPurchasesQuery,
  useGetPurchaseByIdQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useUpdatePurchasePartialMutation,
  useDeletePurchaseMutation,
} = purchasesApi;