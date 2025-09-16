import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput,
  PaginatedResponse,
  ExpenseSearchParams
} from '@/lib/types/prisma';

export const expensesApi = createApi({
  reducerPath: 'expensesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v2/expenses' }),
  tagTypes: ['Expense'],
  endpoints: (builder) => ({
    getExpenses: builder.query<PaginatedResponse<Expense>, ExpenseSearchParams>({
        query: (params) => {
          const searchParams = new URLSearchParams()
          if (params.page) searchParams.append('page', params.page.toString())
          if (params.limit) searchParams.append('limit', params.limit.toString())
          if (params.search) searchParams.append('search', params.search)
          if (params.category_id) searchParams.append('category_id', params.category_id.toString())
          if (params.status) searchParams.append('status', params.status)
          if (params.date_from) searchParams.append('date_from', params.date_from)
          if (params.date_to) searchParams.append('date_to', params.date_to)
          if (params.sortBy) searchParams.append('sortBy', params.sortBy)
          if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder)
          return `?${searchParams.toString()}`
        },
        providesTags: (result) =>
            result
                ? [
                    ...result.data.map(({ id }) => ({ type: 'Expense' as const, id })),
                    { type: 'Expense', id: 'LIST' },
                ]
                : [{ type: 'Expense', id: 'LIST' }],
    }),
    getExpenseById: builder.query<Expense, number | string>({
      query: (id) => `?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Expense', id }],
    }),
    createExpense: builder.mutation<Expense, CreateExpenseInput>({
      query: (expenseData) => ({
        url: '',
        method: 'POST',
        body: expenseData,
      }),
      invalidatesTags: [{ type: 'Expense', id: 'LIST' }],
    }),
    updateExpense: builder.mutation<Expense, { id: number | string; data: UpdateExpenseInput }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Expense', id }, { type: 'Expense', id: 'LIST' }],
    }),
    updateExpensePartial: builder.mutation<Expense, { id: number | string; data: Partial<UpdateExpenseInput> }>({
      query: ({ id, data }) => ({
        url: `?id=${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Expense', id }, { type: 'Expense', id: 'LIST' }],
    }),
    deleteExpense: builder.mutation<{ success: boolean; message: string }, number | string>({
      query: (id) => ({
        url: `?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Expense', id }, { type: 'Expense', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseByIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useUpdateExpensePartialMutation,
  useDeleteExpenseMutation,
} = expensesApi;