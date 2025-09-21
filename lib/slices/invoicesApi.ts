import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Invoice, PaginatedInvoicesResponse, InvoiceItem } from '@/lib/types/invoice';

export const invoicesApi = createApi({
  reducerPath: 'invoicesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v2/invoices' }),
  tagTypes: ['Invoice', 'InvoiceItem'],
  endpoints: (builder) => ({
    getInvoices: builder.query<PaginatedInvoicesResponse, { page: number; limit: number; search: string }>({
      query: ({ page, limit, search }) => `?page=${page}&limit=${limit}&search=${search}`,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Invoice' as const, id })),
              { type: 'Invoice', id: 'LIST' },
            ]
          : [{ type: 'Invoice', id: 'LIST' }],
    }),
    getInvoiceById: builder.query<Invoice, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),
    getInvoiceItems: builder.query<InvoiceItem[], string>({
      query: (invoiceId) => `/items?invoice_id=${invoiceId}`,
      transformResponse: (response: { success: boolean; data: InvoiceItem[] }) => response.data || [],
      providesTags: (result, error, invoiceId) => [{
        type: 'InvoiceItem',
        id: invoiceId
      }],
    }),
    createInvoice: builder.mutation<Invoice, 
      Omit<Partial<Invoice>, 'id' | 'created_at' | 'updated_at'> & {
      items: InvoiceItem[];
      customer_id: string | null;
      warehouse_id: string | null;
      notes: string | null;
      created_by: string | null;
    }
    >({
      query: (newInvoice) => ({
        url: '',
        method: 'POST',
        body: newInvoice,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Invoice', id: 'LIST' },
        ...(result?.id ? [{ type: 'Invoice' as const, id: result.id }, { type: 'InvoiceItem' as const, id: result.id }] : [])
      ],
    }),
    updateInvoice: builder.mutation<Invoice, { id: string; data: Partial<Invoice> }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Invoice', id }, { type: 'Invoice', id: 'LIST' }],
    }),
    deleteInvoice: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Invoice', id }, { type: 'Invoice', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useGetInvoiceItemsQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} = invoicesApi;
