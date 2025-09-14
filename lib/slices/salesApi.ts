import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Sale, PaginatedSalesResponse } from '@/lib/types/sales';
import { API_URL } from '../api-url';

export const salesApi = createApi({
  reducerPath: 'salesApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL}),
  tagTypes: ['Sale'],
  endpoints: (builder) => ({
    getSales: builder.query<PaginatedSalesResponse, { page: number; limit: number; search: string }>({
        query: ({ page, limit, search }) => `?page=${page}&limit=${limit}&search=${search}`,
        providesTags: (result) =>
            result
                ? [
                    ...result.data.map(({ id }) => ({ type: 'Sale' as const, id })),
                    { type: 'Sale', id: 'LIST' },
                ]
                : [{ type: 'Sale', id: 'LIST' }],
    }),
    getSaleById: builder.query<Sale, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Sale', id }],
    }),
    createSale: builder.mutation<Sale, {
      reference: string;
      customer_id: string | null;
      warehouse_id: string | null;
      date: string;
      subtotal: number;
      tax_rate: number;
      tax_amount: number;
      discount: number;
      shipping: number;
      total: number;
      paid: number;
      due: number;
      status: string;
      payment_status: string;
      notes: string | null;
      created_by: string | null;
      items: SaleItem[];
      payment: { payment_choice: string; payment_note: string | null };
    }>(
      {
        query: (newSale) => ({
          url: '',
          method: 'POST',
          body: newSale,
        }),
        invalidatesTags: [{ type: 'Sale', id: 'LIST' }],
      },
    ),
    updateSale: builder.mutation<Sale, { id: string; data: Partial<Sale> }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Sale', id }, { type: 'Sale', id: 'LIST' }],
    }),
    deleteSale: builder.mutation<{ success: boolean }, string>({
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
  useDeleteSaleMutation,
} = salesApi;