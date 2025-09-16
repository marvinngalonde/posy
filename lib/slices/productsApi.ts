import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  PaginatedResponse,
  ProductSearchParams
} from '@/lib/types/prisma';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v2/products' }),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedResponse<Product>, ProductSearchParams>({
        query: (params) => {
          const searchParams = new URLSearchParams()
          if (params.page) searchParams.append('page', params.page.toString())
          if (params.limit) searchParams.append('limit', params.limit.toString())
          if (params.search) searchParams.append('search', params.search)
          if (params.category_id) searchParams.append('category_id', params.category_id.toString())
          if (params.brand_id) searchParams.append('brand_id', params.brand_id.toString())
          if (params.warehouse_id) searchParams.append('warehouse_id', params.warehouse_id.toString())
          if (params.status) searchParams.append('status', params.status)
          if (params.low_stock !== undefined) searchParams.append('low_stock', params.low_stock.toString())
          if (params.sortBy) searchParams.append('sortBy', params.sortBy)
          if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder)
          return `?${searchParams.toString()}`
        },
        providesTags: (result) =>
            result
                ? [
                    ...result.data.map(({ id }) => ({ type: 'Product' as const, id })),
                    { type: 'Product', id: 'LIST' },
                ]
                : [{ type: 'Product', id: 'LIST' }],
    }),
    getProductById: builder.query<Product, number | string>({
      query: (id) => `?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation<Product, CreateProductInput>({
      query: (productData) => ({
        url: '',
        method: 'POST',
        body: productData,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    updateProduct: builder.mutation<Product, { id: number | string; data: UpdateProductInput }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }],
    }),
    updateProductPartial: builder.mutation<Product, { id: number | string; data: Partial<UpdateProductInput> }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }],
    }),
    deleteProduct: builder.mutation<{ success: boolean; message: string }, number | string>({
      query: (id) => ({
        url: `?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductPartialMutation,
  useDeleteProductMutation,
} = productsApi;