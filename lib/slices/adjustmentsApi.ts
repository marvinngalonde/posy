import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Adjustment,
  CreateAdjustmentInput,
  UpdateAdjustmentInput,
  PaginatedResponse,
  AdjustmentSearchParams
} from '@/lib/types/prisma';

export const adjustmentsApi = createApi({
  reducerPath: 'adjustmentsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v2/adjustments' }),
  tagTypes: ['Adjustment'],
  endpoints: (builder) => ({
    getAdjustments: builder.query<PaginatedResponse<Adjustment>, AdjustmentSearchParams>({
        query: (params) => {
          const searchParams = new URLSearchParams()
          if (params.page) searchParams.append('page', params.page.toString())
          if (params.limit) searchParams.append('limit', params.limit.toString())
          if (params.search) searchParams.append('search', params.search)
          if (params.warehouse_id) searchParams.append('warehouse_id', params.warehouse_id.toString())
          if (params.type) searchParams.append('type', params.type)
          if (params.date_from) searchParams.append('date_from', params.date_from)
          if (params.date_to) searchParams.append('date_to', params.date_to)
          if (params.sortBy) searchParams.append('sortBy', params.sortBy)
          if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder)
          return `?${searchParams.toString()}`
        },
        providesTags: (result) =>
            result
                ? [
                    ...result.data.map(({ id }) => ({ type: 'Adjustment' as const, id })),
                    { type: 'Adjustment', id: 'LIST' },
                ]
                : [{ type: 'Adjustment', id: 'LIST' }],
    }),
    getAdjustmentById: builder.query<Adjustment, number | string>({
      query: (id) => `?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Adjustment', id }],
    }),
    createAdjustment: builder.mutation<Adjustment, CreateAdjustmentInput>({
      query: (adjustmentData) => ({
        url: '',
        method: 'POST',
        body: adjustmentData,
      }),
      invalidatesTags: [{ type: 'Adjustment', id: 'LIST' }],
    }),
    updateAdjustment: builder.mutation<Adjustment, { id: number | string; data: UpdateAdjustmentInput }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Adjustment', id }, { type: 'Adjustment', id: 'LIST' }],
    }),
    updateAdjustmentPartial: builder.mutation<Adjustment, { id: number | string; data: Partial<UpdateAdjustmentInput> }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Adjustment', id }, { type: 'Adjustment', id: 'LIST' }],
    }),
    deleteAdjustment: builder.mutation<{ success: boolean; message: string }, number | string>({
      query: (id) => ({
        url: `?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Adjustment', id }, { type: 'Adjustment', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAdjustmentsQuery,
  useGetAdjustmentByIdQuery,
  useCreateAdjustmentMutation,
  useUpdateAdjustmentMutation,
  useUpdateAdjustmentPartialMutation,
  useDeleteAdjustmentMutation,
} = adjustmentsApi;