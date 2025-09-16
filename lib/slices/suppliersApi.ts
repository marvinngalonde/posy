import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  PaginatedResponse,
  SupplierSearchParams
} from '@/lib/types/prisma';

export const suppliersApi = createApi({
  reducerPath: 'suppliersApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v2/suppliers' }),
  tagTypes: ['Supplier'],
  endpoints: (builder) => ({
    getSuppliers: builder.query<PaginatedResponse<Supplier>, SupplierSearchParams>({
        query: (params) => {
          const searchParams = new URLSearchParams()
          if (params.page) searchParams.append('page', params.page.toString())
          if (params.limit) searchParams.append('limit', params.limit.toString())
          if (params.search) searchParams.append('search', params.search)
          if (params.name) searchParams.append('name', params.name)
          if (params.email) searchParams.append('email', params.email)
          if (params.phone) searchParams.append('phone', params.phone)
          if (params.sortBy) searchParams.append('sortBy', params.sortBy)
          if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder)
          return `?${searchParams.toString()}`
        },
        providesTags: (result) =>
            result
                ? [
                    ...result.data.map(({ id }) => ({ type: 'Supplier' as const, id })),
                    { type: 'Supplier', id: 'LIST' },
                ]
                : [{ type: 'Supplier', id: 'LIST' }],
    }),
    getSupplierById: builder.query<Supplier, number | string>({
      query: (id) => `?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Supplier', id }],
    }),
    createSupplier: builder.mutation<Supplier, CreateSupplierInput>({
      query: (supplierData) => ({
        url: '',
        method: 'POST',
        body: supplierData,
      }),
      invalidatesTags: [{ type: 'Supplier', id: 'LIST' }],
    }),
    updateSupplier: builder.mutation<Supplier, { id: number | string; data: UpdateSupplierInput }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Supplier', id }, { type: 'Supplier', id: 'LIST' }],
    }),
    updateSupplierPartial: builder.mutation<Supplier, { id: number | string; data: Partial<UpdateSupplierInput> }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Supplier', id }, { type: 'Supplier', id: 'LIST' }],
    }),
    deleteSupplier: builder.mutation<{ success: boolean; message: string }, number | string>({
      query: (id) => ({
        url: `?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Supplier', id }, { type: 'Supplier', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useUpdateSupplierPartialMutation,
  useDeleteSupplierMutation,
} = suppliersApi;