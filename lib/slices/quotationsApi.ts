import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Quotation,
  CreateQuotationInput,
  UpdateQuotationInput,
  PaginatedResponse,
  QuotationSearchParams
} from '@/lib/types/prisma';

export const quotationsApi = createApi({
  reducerPath: 'quotationsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v2/quotations' }),
  tagTypes: ['Quotation'],
  endpoints: (builder) => ({
    getQuotations: builder.query<PaginatedResponse<Quotation>, QuotationSearchParams>({
        query: (params) => {
          const searchParams = new URLSearchParams()
          if (params.page) searchParams.append('page', params.page.toString())
          if (params.limit) searchParams.append('limit', params.limit.toString())
          if (params.search) searchParams.append('search', params.search)
          if (params.customer_id) searchParams.append('customer_id', params.customer_id.toString())
          if (params.warehouse_id) searchParams.append('warehouse_id', params.warehouse_id.toString())
          if (params.status) searchParams.append('status', params.status)
          if (params.date_from) searchParams.append('date_from', params.date_from)
          if (params.date_to) searchParams.append('date_to', params.date_to)
          return `?${searchParams.toString()}`
        },
        providesTags: (result) =>
            result
                ? [
                    ...result.data.map(({ id }) => ({ type: 'Quotation' as const, id })),
                    { type: 'Quotation', id: 'LIST' },
                ]
                : [{ type: 'Quotation', id: 'LIST' }],
    }),
    getQuotationById: builder.query<Quotation, number | string>({
      query: (id) => `?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Quotation', id }],
    }),
    createQuotation: builder.mutation<Quotation, CreateQuotationInput>({
      query: (quotationData) => ({
        url: '',
        method: 'POST',
        body: quotationData,
      }),
      invalidatesTags: [{ type: 'Quotation', id: 'LIST' }],
    }),
    updateQuotation: builder.mutation<Quotation, { id: number | string; data: UpdateQuotationInput }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Quotation', id }, { type: 'Quotation', id: 'LIST' }],
    }),
    updateQuotationPartial: builder.mutation<Quotation, { id: number | string; data: Partial<UpdateQuotationInput> }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Quotation', id }, { type: 'Quotation', id: 'LIST' }],
    }),
    deleteQuotation: builder.mutation<{ success: boolean; message: string }, number | string>({
      query: (id) => ({
        url: `?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Quotation', id }, { type: 'Quotation', id: 'LIST' }],
    }),
    getQuotationItems: builder.query<any[], number | string>({
      query: (quotationId) => `/items?quotation_id=${quotationId}`,
      transformResponse: (response: any) => response?.data || [],
      providesTags: (result, error, quotationId) => [{ type: 'Quotation', id: quotationId }],
    }),
  }),
});

export const {
  useGetQuotationsQuery,
  useGetQuotationByIdQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useUpdateQuotationPartialMutation,
  useDeleteQuotationMutation,
  useGetQuotationItemsQuery,
} = quotationsApi;