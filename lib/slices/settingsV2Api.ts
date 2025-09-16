import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Brand,
  Category,
  Currency,
  Unit,
  Warehouse,
  CreateBrandInput,
  CreateCategoryInput,
  CreateCurrencyInput,
  CreateUnitInput,
  CreateWarehouseInput,
  UpdateBrandInput,
  UpdateCategoryInput,
  UpdateCurrencyInput,
  UpdateUnitInput,
  UpdateWarehouseInput,
  PaginatedResponse,
  ApiResponse,
  SearchParams
} from '@/lib/types/prisma';

/**
 * Settings API slice for managing all settings entities
 * Consolidated API for brands, categories, currencies, units, and warehouses
 */
export const settingsV2Api = createApi({
  reducerPath: 'settingsV2Api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v2/settings' }),
  tagTypes: ['Brand', 'Category', 'Currency', 'Unit', 'Warehouse'],
  endpoints: (builder) => ({
    // Brands endpoints
    getBrands: builder.query<PaginatedResponse<Brand>, SearchParams>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.page) searchParams.append('page', params.page.toString())
        if (params.limit) searchParams.append('limit', params.limit.toString())
        if (params.search) searchParams.append('search', params.search)
        return `/brands?${searchParams.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Brand' as const, id })),
              { type: 'Brand', id: 'LIST' },
            ]
          : [{ type: 'Brand', id: 'LIST' }],
    }),
    getBrandById: builder.query<Brand, number | string>({
      query: (id) => `/brands?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Brand', id }],
    }),
    createBrand: builder.mutation<Brand, CreateBrandInput>({
      query: (brandData) => ({
        url: '/brands',
        method: 'POST',
        body: brandData,
      }),
      invalidatesTags: [{ type: 'Brand', id: 'LIST' }],
    }),
    updateBrand: builder.mutation<Brand, { id: number | string; data: UpdateBrandInput }>({
      query: ({ id, data }) => ({
        url: `/brands?id=${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Brand', id }, { type: 'Brand', id: 'LIST' }],
    }),
    updateBrandPartial: builder.mutation<Brand, { id: number | string; data: Partial<UpdateBrandInput> }>({
      query: ({ id, data }) => ({
        url: `/brands?id=${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Brand', id }, { type: 'Brand', id: 'LIST' }],
    }),
    deleteBrand: builder.mutation<ApiResponse, number | string>({
      query: (id) => ({
        url: `/brands?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Brand', id }, { type: 'Brand', id: 'LIST' }],
    }),

    // Categories endpoints
    getCategories: builder.query<PaginatedResponse<Category>, SearchParams>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.page) searchParams.append('page', params.page.toString())
        if (params.limit) searchParams.append('limit', params.limit.toString())
        if (params.search) searchParams.append('search', params.search)
        return `/categories?${searchParams.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Category' as const, id })),
              { type: 'Category', id: 'LIST' },
            ]
          : [{ type: 'Category', id: 'LIST' }],
    }),
    getCategoryById: builder.query<Category, number | string>({
      query: (id) => `/categories?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Category', id }],
    }),
    createCategory: builder.mutation<Category, CreateCategoryInput>({
      query: (categoryData) => ({
        url: '/categories',
        method: 'POST',
        body: categoryData,
      }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    updateCategory: builder.mutation<Category, { id: number | string; data: UpdateCategoryInput }>({
      query: ({ id, data }) => ({
        url: `/categories?id=${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Category', id }, { type: 'Category', id: 'LIST' }],
    }),
    updateCategoryPartial: builder.mutation<Category, { id: number | string; data: Partial<UpdateCategoryInput> }>({
      query: ({ id, data }) => ({
        url: `/categories?id=${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Category', id }, { type: 'Category', id: 'LIST' }],
    }),
    deleteCategory: builder.mutation<ApiResponse, number | string>({
      query: (id) => ({
        url: `/categories?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Category', id }, { type: 'Category', id: 'LIST' }],
    }),

    // Currencies endpoints
    getCurrencies: builder.query<PaginatedResponse<Currency>, SearchParams>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.page) searchParams.append('page', params.page.toString())
        if (params.limit) searchParams.append('limit', params.limit.toString())
        if (params.search) searchParams.append('search', params.search)
        return `/currencies?${searchParams.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Currency' as const, id })),
              { type: 'Currency', id: 'LIST' },
            ]
          : [{ type: 'Currency', id: 'LIST' }],
    }),
    getCurrencyById: builder.query<Currency, number | string>({
      query: (id) => `/currencies?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Currency', id }],
    }),
    createCurrency: builder.mutation<Currency, CreateCurrencyInput>({
      query: (currencyData) => ({
        url: '/currencies',
        method: 'POST',
        body: currencyData,
      }),
      invalidatesTags: [{ type: 'Currency', id: 'LIST' }],
    }),
    updateCurrency: builder.mutation<Currency, { id: number | string; data: UpdateCurrencyInput }>({
      query: ({ id, data }) => ({
        url: `/currencies?id=${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Currency', id }, { type: 'Currency', id: 'LIST' }],
    }),
    updateCurrencyPartial: builder.mutation<Currency, { id: number | string; data: Partial<UpdateCurrencyInput> }>({
      query: ({ id, data }) => ({
        url: `/currencies?id=${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Currency', id }, { type: 'Currency', id: 'LIST' }],
    }),
    deleteCurrency: builder.mutation<ApiResponse, number | string>({
      query: (id) => ({
        url: `/currencies?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Currency', id }, { type: 'Currency', id: 'LIST' }],
    }),

    // Units endpoints
    getUnits: builder.query<PaginatedResponse<Unit>, SearchParams>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.page) searchParams.append('page', params.page.toString())
        if (params.limit) searchParams.append('limit', params.limit.toString())
        if (params.search) searchParams.append('search', params.search)
        return `/units?${searchParams.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Unit' as const, id })),
              { type: 'Unit', id: 'LIST' },
            ]
          : [{ type: 'Unit', id: 'LIST' }],
    }),
    getUnitById: builder.query<Unit, number | string>({
      query: (id) => `/units?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Unit', id }],
    }),
    createUnit: builder.mutation<Unit, CreateUnitInput>({
      query: (unitData) => ({
        url: '/units',
        method: 'POST',
        body: unitData,
      }),
      invalidatesTags: [{ type: 'Unit', id: 'LIST' }],
    }),
    updateUnit: builder.mutation<Unit, { id: number | string; data: UpdateUnitInput }>({
      query: ({ id, data }) => ({
        url: `/units?id=${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Unit', id }, { type: 'Unit', id: 'LIST' }],
    }),
    updateUnitPartial: builder.mutation<Unit, { id: number | string; data: Partial<UpdateUnitInput> }>({
      query: ({ id, data }) => ({
        url: `/units?id=${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Unit', id }, { type: 'Unit', id: 'LIST' }],
    }),
    deleteUnit: builder.mutation<ApiResponse, number | string>({
      query: (id) => ({
        url: `/units?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Unit', id }, { type: 'Unit', id: 'LIST' }],
    }),

    // Warehouses endpoints
    getWarehouses: builder.query<PaginatedResponse<Warehouse>, SearchParams>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.page) searchParams.append('page', params.page.toString())
        if (params.limit) searchParams.append('limit', params.limit.toString())
        if (params.search) searchParams.append('search', params.search)
        return `/warehouses?${searchParams.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Warehouse' as const, id })),
              { type: 'Warehouse', id: 'LIST' },
            ]
          : [{ type: 'Warehouse', id: 'LIST' }],
    }),
    getWarehouseById: builder.query<Warehouse, number | string>({
      query: (id) => `/warehouses?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Warehouse', id }],
    }),
    createWarehouse: builder.mutation<Warehouse, CreateWarehouseInput>({
      query: (warehouseData) => ({
        url: '/warehouses',
        method: 'POST',
        body: warehouseData,
      }),
      invalidatesTags: [{ type: 'Warehouse', id: 'LIST' }],
    }),
    updateWarehouse: builder.mutation<Warehouse, { id: number | string; data: UpdateWarehouseInput }>({
      query: ({ id, data }) => ({
        url: `/warehouses?id=${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Warehouse', id }, { type: 'Warehouse', id: 'LIST' }],
    }),
    updateWarehousePartial: builder.mutation<Warehouse, { id: number | string; data: Partial<UpdateWarehouseInput> }>({
      query: ({ id, data }) => ({
        url: `/warehouses?id=${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Warehouse', id }, { type: 'Warehouse', id: 'LIST' }],
    }),
    deleteWarehouse: builder.mutation<ApiResponse, number | string>({
      query: (id) => ({
        url: `/warehouses?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Warehouse', id }, { type: 'Warehouse', id: 'LIST' }],
    }),
  }),
});

export const {
  // Brands hooks
  useGetBrandsQuery,
  useGetBrandByIdQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useUpdateBrandPartialMutation,
  useDeleteBrandMutation,

  // Categories hooks
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useUpdateCategoryPartialMutation,
  useDeleteCategoryMutation,

  // Currencies hooks
  useGetCurrenciesQuery,
  useGetCurrencyByIdQuery,
  useCreateCurrencyMutation,
  useUpdateCurrencyMutation,
  useUpdateCurrencyPartialMutation,
  useDeleteCurrencyMutation,

  // Units hooks
  useGetUnitsQuery,
  useGetUnitByIdQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useUpdateUnitPartialMutation,
  useDeleteUnitMutation,

  // Warehouses hooks
  useGetWarehousesQuery,
  useGetWarehouseByIdQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useUpdateWarehousePartialMutation,
  useDeleteWarehouseMutation,
} = settingsV2Api;