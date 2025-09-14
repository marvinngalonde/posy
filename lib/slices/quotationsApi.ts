import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Quotation, QuotationItem, PaginatedQuotationsResponse } from '@/lib/types/quotation';
import { API_URL } from '../api-url';

export const quotationsApi = createApi({
  reducerPath: 'quotationsApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL + '/quotations' }),
  tagTypes: ['Quotation'],
  endpoints: (builder) => ({
    getQuotations: builder.query<PaginatedQuotationsResponse, { page: number; limit: number; search: string }>({
        query: ({ page, limit, search }) => `?page=${page}&limit=${limit}&search=${search}`,
        providesTags: (result) =>
            result
                ? [
                    ...result.data.map(({ id }) => ({ type: 'Quotation' as const, id })),
                    { type: 'Quotation', id: 'LIST' },
                ]
                : [{ type: 'Quotation', id: 'LIST' }],
    }),
    getQuotationById: builder.query<Quotation, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Quotation', id }],
    }),
    createQuotation: builder.mutation<{ success: boolean; quotation_id: string; reference: string }, any>({
      query: (quotationData) => ({
        url: '',
        method: 'POST',
        body: quotationData,
      }),
      invalidatesTags: [{ type: 'Quotation', id: 'LIST' }],
    }),
    updateQuotation: builder.mutation<{ success: boolean }, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Quotation', id }, { type: 'Quotation', id: 'LIST' }],
    }),
    deleteQuotation: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Quotation', id }, { type: 'Quotation', id: 'LIST' }],
    }),
    getQuotationItems: builder.query<QuotationItem[], string>({
      query: (quotationId) => `/items?id=${quotationId}`,
      providesTags: (result, error, quotationId) => [{ type: 'Quotation', id: quotationId }],
    }),
  }),
});

export const {
  useGetQuotationsQuery,
  useGetQuotationByIdQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useGetQuotationItemsQuery,
} = quotationsApi;