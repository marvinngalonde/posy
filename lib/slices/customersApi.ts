import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  PaginatedResponse,
  CustomerSearchParams
} from '@/lib/types/prisma';

export const customersApi = createApi({
  reducerPath: 'customersApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v2/customers' }),
  tagTypes: ['Customer'],
  endpoints: (builder) => ({
    getCustomers: builder.query<PaginatedResponse<Customer>, CustomerSearchParams>({
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
                    ...result.data.map(({ id }) => ({ type: 'Customer' as const, id })),
                    { type: 'Customer', id: 'LIST' },
                ]
                : [{ type: 'Customer', id: 'LIST' }],
    }),
    getCustomerById: builder.query<Customer, number | string>({
      query: (id) => `?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: builder.mutation<Customer, CreateCustomerInput>({
      query: (customerData) => ({
        url: '',
        method: 'POST',
        body: customerData,
      }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),
    updateCustomer: builder.mutation<Customer, { id: number | string; data: UpdateCustomerInput }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Customer', id }, { type: 'Customer', id: 'LIST' }],
    }),
    updateCustomerPartial: builder.mutation<Customer, { id: number | string; data: Partial<UpdateCustomerInput> }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Customer', id }, { type: 'Customer', id: 'LIST' }],
    }),
    deleteCustomer: builder.mutation<{ success: boolean; message: string }, number | string>({
      query: (id) => ({
        url: `?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Customer', id }, { type: 'Customer', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useUpdateCustomerPartialMutation,
  useDeleteCustomerMutation,
} = customersApi;